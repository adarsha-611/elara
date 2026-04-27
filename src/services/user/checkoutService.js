import Cart from "../../model/cartSchema.js";
import User from "../../model/userSchema.js";
import Order from "../../model/orderSchema.js";
import Coupon from "../../model/couponSchema.js";
import Wallet from "../../model/walletSchema.js";
import { deductWalletBalance } from "./walletService.js";
import { getBestOfferForProduct } from "./shopProductService.js"; 


const generateOrderId = () => {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `ORD-${Date.now()}-${random}`;
};

// add this import

export const getCheckoutData = async (userId) => {
  const user = await User.findById(userId);

  const cart = await Cart.findOne({ userId }).populate({
    path: "items.productId",
    select: "name variants category isDeleted isBlocked isActive"
  });

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart empty");
  }

  let cartItems = [];
  let subtotal = 0;

  for (const item of cart.items) {
    const product = item.productId;

    const variant = product.variants.find(
      v => v._id.toString() === item.variantId.toString()
    );

    if (!variant) continue;

    const offerData = await getBestOfferForProduct(product, variant.price);
    const price = offerData ? Math.round(offerData.finalPrice) : variant.price;

    const image = variant.images?.[0] || "/images/placeholder.png";
    const itemTotal = price * item.quantity;
    subtotal += itemTotal;

    cartItems.push({
      name: product.name,
      image,
      price,
      originalPrice: variant.price,  
      offerData,                       
      quantity: item.quantity,
      itemTotal
    });
  }

  return {
    addresses: user.addresses,
    cartItems,
    subtotal
  };
};

export const placeOrderService = async (userId, addressId, paymentMethod,paymentStatus) => {
  const user = await User.findById(userId);
  const cart = await Cart.findOne({ userId }).populate("items.productId");

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart empty");
  }

  const addressDoc = user.addresses.id(addressId);
  if (!addressDoc) {
    throw new Error("Address not found");
  }

  let totalAmount = 0;
  const orderItems = [];

  for (const cartItem of cart.items) {
    const product = cartItem.productId;

    if (!product || product.isDeleted || product.isBlocked || product.isActive === false) {
      throw new Error(`${product?.name || "item"} unavailable`);
    }

    const variant = product.variants.find(
      v => v._id.toString() === String(cartItem.variantId)
    );

    if (!variant) {
      throw new Error(`${product.name} variant not found`);
    }

    if (variant.stock < cartItem.quantity) {
      throw new Error(`${product.name} stock not available`);
    }

    const itemTotal = variant.price * cartItem.quantity;

    orderItems.push({
      product: product._id,
      productName: product.name,
      productImage: variant.images?.[0] || "",
      variantColor: variant.color,
      quantity: cartItem.quantity,
      price: variant.price,
      total: itemTotal
    });

    totalAmount += itemTotal;
  }
if (paymentMethod === "wallet") {
    await deductWalletBalance(userId, totalAmount);
  }

 
  const order = await Order.create({
    user: userId,
    items: orderItems,
    totalAmount,
    shippingAddress: addressDoc,
    paymentMethod,
    paymentStatus:
    paymentMethod === "wallet"
    ? "paid"
    : paymentStatus || "pending",
     orderStatus: "pending",
    orderId: generateOrderId()
  });

  for (const cartItem of cart.items) {
    const product = cartItem.productId;

    const variant = product.variants.find(
      v => v._id.toString() === String(cartItem.variantId)
    );

    variant.stock -= cartItem.quantity;
    await product.save();
  }

  cart.items = [];
  await cart.save();

  return order;
};
export const applyCouponService = async(code,userId,session)=>{

  const coupon = await Coupon.findOne({code: code.toUpperCase()});

  if(!coupon){
    return {success:false,message:"Invalid coupon"};
  }

  if(!coupon.isActive){
    return {success:false,message:"Coupon expired"};
  }

  const cart = await Cart.findOne({ userId }).populate("items.productId");

  if(!cart || cart.items.length === 0){
    return {success:false,message:"Cart not found"};
  }

  let totalAmount = 0;

  for (const item of cart.items) {
    const product = item.productId;

    if (!product) continue;

    const variant = product.variants.find(
      v => v._id.toString() === item.variantId.toString()
    );

    if (!variant) continue;

    totalAmount += variant.price * item.quantity;
  }

  // ✅ FIX 3: correct comparison
  if(totalAmount < coupon.minOrder){
    return{
      success:false,
      message:`Minimum order ₹${coupon.minOrder}`
    };
  }

  let discount = 0;

  if(coupon.discountType === "percentage"){
    discount = (totalAmount * coupon.discountValue)/100;

    if (coupon.maxDiscount){
      discount = Math.min(discount,coupon.maxDiscount);
    }
  }else{
    discount = coupon.discountValue;
  }

  const finalTotal = totalAmount - discount;

  session.appliedCoupon = {
    couponId:coupon._id,
    discount,
    finalTotal
  }

  return {
    success: true,
    discountAmount: discount,
    newTotal: finalTotal
  };
}
