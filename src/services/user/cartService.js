import cartSchema from "../../model/cartSchema.js";
import Cart from "../../model/cartSchema.js";
import Product from "../../model/productSchema.js";
import { getBestOfferForProduct } from "./shopProductService.js";

export const syncCartProducts = async(userId) => {
  const cart = await Cart.findOne({userId});
  if(!cart || cart.items.length === 0){
    return { stockChangedMessage: null, offerChangedMessage: null };
  }

  let stockChangedMessage = null;
  let offerChangedMessage = null;

  for(const item of cart.items){
    const product = await Product.findById(item.productId);
    if(!product) continue;

    const variant = product.variants.id(item.variantId);
    if(!variant) continue;

    // Stock check (existing logic)
    if(item.quantity > variant.stock){
      item.quantity = Math.max(1, variant.stock);
      stockChangedMessage = `Quantity reduced to ${item.quantity} due to stock changes.`;
    }

    // Offer check — compare stored offer price vs current offer
    const offerData = await getBestOfferForProduct(product, variant.price);
    const currentFinalPrice = offerData ? offerData.finalPrice : variant.price;

    // If item has a saved offerPrice and it no longer matches current
    if(item.offerPrice !== undefined && item.offerPrice !== null){
      if(!offerData || Math.round(currentFinalPrice) !== Math.round(item.offerPrice)){
        offerChangedMessage = `An offer on "${product.name}" has changed or expired. Price has been updated.`;
        item.offerPrice = offerData ? Math.round(offerData.finalPrice) : null;
      }
    }
  }

  await cart.save();
  return { stockChangedMessage, offerChangedMessage };
};

export const addToCart = async(userId, productId, qty, variantId) => {
  qty = Number(qty);

  const product = await Product.findById(productId);
  if(!product || product.isDeleted || !product.isActive){
    throw new Error("Product is Unavailable");
  }

  const variant = product.variants.id(variantId);

  if(!variant){
    throw new Error("Variant not found");
  }

  if(!variant.stock || variant.stock <= 0){
    throw new Error("Product is out of stock");
  }

  if(variant.stock < qty){
    throw new Error(`Only ${variant.stock} items available`);
  }

  if(qty > 5){
    throw new Error("Maximum 5 items allowed");
  }

  let cart = await Cart.findOne({userId});
  if(!cart){
    cart = new Cart({userId, items:[]});
  }

  const offerData = await getBestOfferForProduct(product, variant.price);
  const offerPrice = offerData ? Math.round(offerData.finalPrice) : null;

  const index = cart.items.findIndex(item =>
    item.productId.toString() === productId.toString() &&
    item.variantId.toString() === variantId.toString()
  );

  if(index > -1){
    const newQty = cart.items[index].quantity + qty;

    if(newQty > variant.stock){
       throw new Error(`Only ${variant.stock} items available`);
   }


    if(newQty > 5) {
      throw new Error("Maximum 5 items allowed");
    }
    
    cart.items[index].quantity = newQty;
    cart.items[index].offerPrice = offerPrice;
  } else {
    cart.items.push({productId, variantId, quantity: qty, offerPrice});
  }

  await cart.save();
};
export const removeFromCart = async(userId,productId,variantId)=>{
  const cart = await Cart.findOne({userId});
  if(!cart){
    throw new Error("Cart not found");
  }

  cart.items = cart.items.filter(item =>
    !(item.productId.toString() === productId.toString() &&
    item.variantId.toString() === variantId.toString())
  );
  await cart.save();
}


export const updateCartQty = async(userId,productId,variantId,quantity)=>{
  quantity = Number(quantity);

  await syncCartProducts(userId);

  const product = await Product.findById(productId);
  if(!product || product.isDeleted || !product.isActive){
    return {success:false,message:"Product is no longer active"};
  }

  const variant = product.variants.id(variantId);
  if(!variant){
    return {success:false,message:"Variant is no longer available"};
  }

  if(quantity > 5){
    return {success:false,stock:variant.stock,message:"Maximum 5 items allowed"}
  }

  if(variant.stock ===0){
    return {success:false,stock:variant.stock,message:"Out Of Stock"}
  }

  if(quantity > variant.stock){
    return {success:false,stock:variant.stock,message:`Only ${variant.stock} items available`};
  }

  const cart = await Cart.findOne({userId});
  if(!cart){
    return{success:false, message:"Cart not found"};
}

const item = cart.items.find(i=>
  i.productId.toString() === productId &&
  i.variantId.toString() === variantId
);

if(!item){
  return{success:false,message:"Item not found in cart"}
}

item.quantity = quantity;
await cart.save();

return {success:true,stock:variant.stock};
}


export const validateCheckout = async(userId) =>{
  await syncCartProducts(userId);

  const cart = await Cart.findOne({userId});
  if(!cart || cart.items.length === 0){
    throw new Error("Your cart is empty");
  }

  for(const item of cart.items){
    const product = await Product.findById(item.productId);

    if(!product || product.isDeleted||!product.isActive){
      throw new Error(`${product.name} is no longer available`)
    }

    const variant = product.variants.id(item.variantId);
    if(!variant){
      throw new Error("Some product variants are no longer available");
    }

    if(variant.stock === 0){
      throw new Error(`${product.name} is Out of stock`);
    }

    if(item.quantity > variant.stock){
      throw new Error(`Only ${variant.stock} items available for ${product.name}`)
    }
  }
  return true
};