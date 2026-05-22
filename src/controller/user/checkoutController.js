import Order from "../../model/orderSchema.js";
import Cart from "../../model/cartSchema.js";
import Product from "../../model/productSchema.js";
import Mongoose from "mongoose";
import User from '../../model/userSchema.js';
import Coupon from "../../model/couponSchema.js";
import { validateAddress } from "../../utils/validators/joi_address.js";
import { getCheckoutData, placeOrderService, applyCouponService, removeCouponService } from "../../services/user/checkoutService.js";
import { addUserAddress, editUserAddress, deleteUserAddress, setDefaultAddressService } from "../../services/user/addressService.js";

const getCheckOutPage = async (req, res) => {
try {
delete req.session.appliedCoupon;

const now = new Date();

const availableCoupons = await Coupon.find({
  isActive: true,
  startDate: { $lte: now },
  endDate: { $gte: now }
});

const userId = req.session.userId;
const data = await getCheckoutData(userId);

res.render("user/checkout", {
  ...data,
  successMessages: req.flash("success"),
  errorMessages: req.flash("error"),
  stockIssue: false,
  stockMessage: "",
  availableCoupons,
  razorpayKey: process.env.RAZORPAY_KEY_ID
});


} catch (err) {
req.flash("error", err.message);
res.redirect("/cart");
}
};

const checkaddAddress = async (req, res) => {
try {
const addressData = {
fullName: req.body.fullName,
phoneNumber: req.body.phoneNumber,
street: req.body.street,
city: req.body.city,
state: req.body.state,
pincode: req.body.pincode,
addressType: req.body.addressType,
isDefault: req.body.isDefault === "on" || req.body.isDefault === true
};


const { error, value } = validateAddress(addressData);

if (error) {
  const errors = error.details.map(err => ({
    field: err.path[0],
    message: err.message
  }));
  return res.json({ success: false, errors });
}

await addUserAddress(req.session.userId, value);
return res.json({ success: true });


} catch (err) {
return res.json({ success: false, message: err.message });
}
};

const getAddressById = async (req, res) => {
try {
const userId = req.session.userId;
const { addressId } = req.params;


const user = await User.findById(userId);
if (!user) {
  return res.json({ success: false, message: "User not found" });
}

const address = user.addresses.id(addressId);
if (!address) {
  return res.json({ success: false, message: "Address not found" });
}

return res.json({ success: true, address });


} catch (error) {
console.log("Get Address Error:", error);
return res.json({ success: false, message: "Failed to load address" });
}
};

const checkeditAddress = async (req, res) => {
try {
const { error, value } = validateAddress(req.body);


if (error) {

  const errors = error.details.map(err => ({
    field: err.path[0],
    message: err.message
  }));
  return res.json({ success: false, errors });
}

await editUserAddress(req.session.userId, req.body.addressId, value);
return res.json({ success: true });


} catch (err) {
return res.json({ success: false, message: err.message });
}
};

const checkdeleteAddress = async (req, res) => {
try {
await deleteUserAddress(req.session.userId, req.params.addressId);
return res.json({ success: true });

} catch (err) {
return res.json({ success: false, message: err.message });
}
};

const checksetDefaultAddress = async (req, res) => {
try {
await setDefaultAddressService(req.session.userId, req.params.addressId);
req.flash("success", "Default address updated");
res.redirect("/checkout");

} catch (err) {
req.flash("error", err.message);
res.redirect("/checkout");
}
};

const orderSuccess = async (req, res) => {
try {
const { orderId } = req.params;
const order = await Order.findById(orderId);

if (!order) return res.redirect("/shop");

res.render("user/orderSuccess", {
  order,
  success: req.flash("success"),
  error: req.flash("error")
});


} catch (error) {
console.error("Order Success Error:", error);
return res.redirect("/shop");
}
};

const placeOrder = async (req, res) => {
try {
const userId = req.session.userId;
let { addressId, paymentMethod } = req.body;


if (paymentMethod === "razorpay") {
  paymentMethod = "online";
}
const COD_LIMIT = 5000;
        if (paymentMethod === "cod") {
            const data = await getCheckoutData(userId);
            const orderTotal = data.subtotal + SHIPPING_FEE;
            if (orderTotal > COD_LIMIT) {
                req.flash("error", `Cash on Delivery is not available for orders above ₹${COD_LIMIT.toLocaleString('en-IN')}`);
                return res.redirect("/checkout");
            }
        }
const appliedCoupon = req.session.appliedCoupon || null;

const order = await placeOrderService(
  userId,
  addressId,
  paymentMethod,
  undefined,
  appliedCoupon
);

delete req.session.appliedCoupon;

req.flash("success", "Order placed successfully");
return res.redirect(`/order-success/${order._id}`);


} catch (err) {
console.log("Place Order Error:", err.message);


const data = await getCheckoutData(req.session.userId);
const now = new Date();

const availableCoupons = await Coupon.find({
  isActive: true,
  startDate: { $lte: now },
  endDate: { $gte: now }
});

if (err.message.toLowerCase().includes("stock")) {
  return res.render("user/checkout", {
    ...data,
    shippingFee: SHIPPING_FEE,
    stockIssue: true,
    stockMessage: err.message,
    successMessages: [],
    errorMessages: [],
    availableCoupons,
    razorpayKey: process.env.RAZORPAY_KEY_ID
  });
}

return res.render("user/checkout", {
  ...data,
  stockIssue: false,
  stockMessage: "",
  successMessages: [],
  errorMessages: [err.message],
  availableCoupons,
  razorpayKey: process.env.RAZORPAY_KEY_ID
});


}
};

const applyCoupon = async (req, res) => {
try {
const { code } = req.body;
const userId = req.session.userId;


if (!code || !code.trim()) {
  return res.json({ success: false, message: "Please enter a coupon code" });
}

if (!userId) {
  return res.json({ success: false, message: "Please login to apply a coupon" });
}

const result = await applyCouponService(code.trim(), userId, req.session);
return res.json(result);


} catch (error) {
console.error("Apply coupon error:", error);
return res.json({ success: false, message: "Something went wrong" });
}
};

const removeCoupon = async (req, res) => {
try {
const result = await removeCouponService(req.session);
return res.json(result);

} catch (error) {
console.error("Remove coupon error:", error);
return res.json({ success: false, message: "Something went wrong" });
}
};

export default {
getCheckOutPage,
checkaddAddress,
checkeditAddress,
checkdeleteAddress,
checksetDefaultAddress,
orderSuccess,
placeOrder,
applyCoupon,
removeCoupon,
getAddressById
};
