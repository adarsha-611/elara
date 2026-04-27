import cartSchema from "../../model/cartSchema.js";
import Product from "../../model/productSchema.js";
import Cart from "../../model/cartSchema.js"
import { addToCart,removeFromCart, syncCartProducts, updateCartQty, validateCheckout } from "../../services/user/cartService.js";
import { getBestOfferForProduct } from "../../services/user/shopProductService.js";

  const getCartPage = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.redirect('/login');

    const { stockChangedMessage,offerChangedMessage } = await syncCartProducts(userId);

    const cart = await Cart.findOne({ userId });
    const cartItems = [];

  for (const item of cart?.items || []) {
  const product = await Product.findById(item.productId);
  if (!product) continue;

  const variant = product.variants.id(item.variantId);
  if (!variant) continue;

const offerData = await getBestOfferForProduct(product, variant.price);

  const finalPrice = offerData
    ? offerData.finalPrice
    : variant.price;

  const isBlocked = !!(product.isDeleted || !product.isActive);

  cartItems.push({
    productId: product._id,
    variantId: item.variantId,
    name: product.name,

    price: finalPrice,          // ✅ FIXED
    originalPrice: variant.price, // (optional for UI strike)

    stock: variant.stock,
    quantity: item.quantity,
    image: variant.images?.[0] || "/images/no-image.png",

    offerData,                 // ✅ send to UI

    isBlocked,
    isOutOfStock: variant.stock === 0
  });
}

    res.render("user/cart", {
      cartItems,
      successMessage: stockChangedMessage,offerChangedMessage
    });
  } catch (error) {
    console.error("Cart page error:", error);
    res.status(500).send("Server error");
  }
};


  const addCartItem = async(req,res)=>{
      try {
        const userId = req.session.userId;
        const {productId,variantId,quantity} = req.body;
        let cart =  await addToCart(userId,productId,quantity,variantId);

        res.json({
          success:true,
          message:"Product add to Cart",
          cartCount: cart ? cart.items.length : 0
        });
      } catch (error) {
        console.log(error);
        
        res.json({
          success:false,
          message:error.message
        })
      }
    };


const removeCartItem = async(req,res)=>{
  try {
    const userId = req.session.userId;
    const {productId,variantId} = req.params;

    await removeFromCart(userId,productId,variantId);

    res.redirect('/cart');
  } catch (error) {
    res.send(error.message);
  }
}

 const getCartCount = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.json({ count: 0 });
    }

    const cart = await Cart.findOne({ userId: req.session.userId });

    res.json({
      count: cart ? cart.items.length : 0
    });

  } catch (error) {
    res.json({ count: 0 });
  }
};

const updateQuantity = async(req,res)=>{
  try {
    const userId = req.session.userId;
    const {productId,variantId,quantity} = req.body;

   const result = await updateCartQty(userId,productId,variantId,quantity);
    res.json(result)

  } catch (error) {
    console.log(error);
    res.json({
      success:false,
      message:error.message
    })
  }
}


const validationCheckout = async(req,res)=>{
  try {
    const userId = req.session.userId;
    await validateCheckout(userId);
    res.json({
      success:true
    })
  } catch (error) {
    console.log(error);
    res.json({
      success:false,
      message:error.message
    })
  }
}

export default {
    getCartPage,
    addCartItem,
    getCartCount,
    removeCartItem,
    updateQuantity,
    validationCheckout,
};