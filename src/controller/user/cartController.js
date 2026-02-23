import cartSchema from "../../model/cartSchema.js";
import Product from "../../model/productSchema.js";
import { addToCart,removeFromCart } from "../../services/user/cartService.js";

const getCartPage = async (req, res) => {
  try {
    const userId = req.session.userId;
    const cart = await cartSchema.findOne({ userId });

    let cartItems = [];

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
    name: product?.name || "No Name",
    image: product?.variants?.[0]?.images?.[0] || "/images/default.png"
  };
});

    }

    return res.render("user/cart", { cartItems });

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

    return res.redirect("/cart");

  } catch (error) {
    return res.status(400).json({
      success:false,
      message:error.message
    })
  }
}


export default {
    getCartPage,
    addCartItem,
    removeCartItem
};