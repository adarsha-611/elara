import cartSchema from "../../model/cartSchema.js";
import Product from "../../model/productSchema.js";
import { addToCart,removeFromCart } from "../../services/user/cartService.js";

const getCartPage = async (req, res) => {
  try {
    const userId = req.session.userId;
    const cart = await cartSchema.findOne({ userId });

    let cartItems = [];
    const successMessage = req.session.successMessage || null;

        if (req.session.successMessage) {
            delete req.session.successMessage;
        }
    if (cart) {
      const productIds = cart.items.map(i => i.productId);

      const products = await Product.find({
        _id: { $in: productIds }
      });

      const productMap = {};
      products.forEach(p => {
        productMap[p._id.toString()] = p;
      });

     cartItems = cart.items.map(item => {
  const product = productMap[item.productId.toString()];

  return {
    productId: item.productId,
    quantity: item.quantity,
    price: item.price,
    stock: product?.variants?.[0]?.stock || 0,
    name: product?.name || "No Name",
    image: product?.variants?.[0]?.images?.[0] || "/images/default.png"
  };
});

    }

    return res.render("user/cart", { cartItems,successMessage });

  } catch (error) {
    console.log(error);
    return res.status(500).send("server error");
  }
};


const  addCartItem = async(req,res)=>{
    try {
        const userId = req.session.userId;
        const { productId, qty, variantId } = req.body;
        await addToCart(userId, productId, qty || 1, variantId);

        
        return res.json({
        success: true,
        message: "Product added to cart"
    });

    } catch (error) {
        return  res.status(400).json({
            success:false,
            message:error.message
        })
    }
}


const removeCartItem = async(req,res)=>{
  try {
    const userId = req.session.userId;
    const {productId} = req.params;

    await removeFromCart(userId, productId);
    req.session.successMessage = "Item removed from cart successfully!";

    return res.redirect("/cart");

  } catch (error) {
    return res.status(400).json({
      success:false,
      message:error.message
    })
  }
}

const updateQuantity = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);

    if(!product){
      return res.status(404).json({success:false});
    }
    const variant = product.variants[0];
    const availableStock = variant.stock;
    if(quantity<1){
      return res.status(400).json({
        success:false,
        message:"Minimum quantity is 1"
      });
    }

    if(quantity > availableStock){
      return res.status(400).json({
        success:false,
        message:`Only ${availableStock}items available`
      });
    }
    await cartSchema.updateOne(
      { userId, "items.productId": productId },
      { $set: { "items.$.quantity": Number(quantity) } }
    );

    return res.json({ success: true });

  } catch (error) {
    console.log("Update error:", error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
export default {
    getCartPage,
    addCartItem,
    removeCartItem,
    updateQuantity,
};