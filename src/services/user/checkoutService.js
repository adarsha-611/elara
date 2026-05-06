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

export const SHIPPING_FEE = 50;
export const getCheckoutData = async (userId) => {
    const user = await User.findById(userId);

    const cart = await Cart.findOne({ userId }).populate({
        path: "items.productId",
        select: "name variants category isDeleted isBlocked isActive"
    });

    if (!cart || cart.items.length === 0) {
        throw new Error("Cart empty");
    }

    const wallet = await Wallet.findOne({ userId });
    const walletBalance = wallet ? wallet.balance : 0;

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
        subtotal,
        shippingFee: SHIPPING_FEE,
        walletBalance  
    };
};

export const placeOrderService = async (
userId,
addressId,
paymentMethod,
paymentStatus,
appliedCoupon = null
) => {
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


const offerData = await getBestOfferForProduct(product, variant.price);
const offerDiscount = offerData ? Math.round(variant.price - offerData.finalPrice) : 0;
const effectivePrice = variant.price - offerDiscount;
const itemTotal = effectivePrice * cartItem.quantity;

orderItems.push({
  product: product._id,
  productName: product.name,
  productImage: variant.images?.[0] || "",
  variantColor: variant.color,
  quantity: cartItem.quantity,
  price: variant.price,        
  offerDiscount,               
  total: itemTotal             
});

totalAmount += itemTotal;      



}


const discount = appliedCoupon?.discount || 0;
const finalAmount = totalAmount - discount + SHIPPING_FEE;

if (paymentMethod === "wallet") {
await deductWalletBalance(userId, finalAmount);
}

const order = await Order.create({
user: userId,
items: orderItems,
totalAmount,
discount,
finalAmount,
couponApplied: appliedCoupon?.couponId || null,
shippingAddress: addressDoc,
paymentMethod,
paymentStatus: paymentMethod === "wallet" ? "paid" : paymentStatus || "pending",
orderStatus: "pending",
orderId: generateOrderId()
});

if (appliedCoupon?.couponId) {
await incrementCouponUsage(appliedCoupon.couponId);
}


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

export const applyCouponService = async (code, userId, session) => {
const now = new Date();

const coupon = await Coupon.findOne({ code: code.toUpperCase() });

if (!coupon) return { success: false, message: "Invalid coupon code" };
if (!coupon.isActive) return { success: false, message: "This coupon is no longer active" };

if (now < new Date(coupon.startDate)) {
return { success: false, message: "This coupon is not valid yet" };
}

if (now > new Date(coupon.endDate)) {
return { success: false, message: "This coupon has expired" };
}

if (coupon.usedCount >= coupon.usageLimit) {
return { success: false, message: "This coupon has reached its usage limit" };
}

const cart = await Cart.findOne({ userId }).populate("items.productId");

if (!cart || cart.items.length === 0) {
return { success: false, message: "Your cart is empty" };
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

if (coupon.minOrder > 0 && totalAmount < coupon.minOrder) {
return {
success: false,
message: `Minimum order ₹${coupon.minOrder}`
};
}

let discount = 0;

if (coupon.discountType === "percentage") {
discount = (totalAmount * coupon.discountValue) / 100;
if (coupon.maxDiscount > 0) {
discount = Math.min(discount, coupon.maxDiscount);
}
} else {
discount = Math.min(coupon.discountValue, totalAmount);
}

discount = Math.round(discount * 100) / 100;
const finalTotal = Math.round((totalAmount - discount + SHIPPING_FEE) * 100) / 100; 
session.appliedCoupon = {
couponId: coupon._id,
code: coupon.code,
discount,
finalTotal
};

return {
success: true,
message: `Coupon "${coupon.code}" applied successfully!`,
discountAmount: discount,
newTotal: finalTotal,
originalTotal: totalAmount
};
};

export const incrementCouponUsage = async (couponId) => {
await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } });
};

export const removeCouponService = async (session) => {
if (!session.appliedCoupon) {
return { success: false, message: "No coupon applied" };
}
delete session.appliedCoupon;
return { success: true, message: "Coupon removed successfully" };
};
