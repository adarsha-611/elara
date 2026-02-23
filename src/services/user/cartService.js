import cartSchema from "../../model/cartSchema.js";
import Cart from "../../model/cartSchema.js";
import Product from "../../model/productSchema.js";

export const addToCart = async (userId, productId, qty = 1) => {
  qty = Number(qty);

  const product = await Product.findById(productId);
  if (!product) {
    throw new Error("Product not found");
  }

  let cart = await Cart.findOne({ userId });

  if (!cart) {
    cart = new Cart({
      userId,
      items: []
    });
  }

  const itemIndex = cart.items.findIndex(
    item => item.productId.toString() === productId.toString()
  );

  if (itemIndex > -1) {
    cart.items[itemIndex].quantity += qty;
  } else {
    cart.items.push({
      productId,
      quantity: qty,
      price: product.variants[0]?.price || 0
    });
  }

  await cart.save();
  return cart;
};



export const removeFromCart = async(userId,productId)=>{
  const cart = await cartSchema.findOne({userId});

  if(!cart) throw Error("Cart not found");

  cart.items = cart.items.filter(
    item=> item.productId.toString() !== productId
  );

  await cart.save();
  return cart;
}