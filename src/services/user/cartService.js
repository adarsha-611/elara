import cartSchema from "../../model/cartSchema.js";
import Cart from "../../model/cartSchema.js";
import Product from "../../model/productSchema.js";

export const addToCart = async (userId, productId, qty = 1) => {
  qty = Number(qty);

  const product = await Product.findById(productId);
  if (!product) {
    throw new Error("Product not found");
  }
  const variant = product.variants[0];
  if(!variant){
    throw new Error("Variant not available");
  }

  const availableStock = variant.stock;
  if(availableStock <=0){
    throw new Error ("Out of Stock");
  }

  if(qty>5){
    throw new Error("Maximum 5 quantity allowed");
  }

  if(qty>availableStock){
    throw new Error(`Only ${availableStock}items available`);
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

    const newQuantity = cart.items[itemIndex].quantity + qty;

    if(newQuantity >5){
      throw new Error("Maximum 5 Quantity allowed");
    }

    if(newQuantity > availableStock){
      throw new Error(`Only ${availableStock} items available`);
    }
    cart.items[itemIndex].quantity = newQuantity;
  } else {
    cart.items.push({
      productId,
      quantity: qty,
      price: variant.price
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