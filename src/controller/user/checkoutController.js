import Order from "../../model/orderSchema.js"; 
import Cart from "../../model/cartSchema.js";
import Product from "../../model/productSchema.js";
import Mongoose from "mongoose";
import User from '../../model/userSchema.js';
import Coupon from "../../model/couponSchema.js"
import { validateAddress } from "../../utils/validators/joi_address.js";
import { getCheckoutData,placeOrderService,applyCouponService } from "../../services/user/checkoutService.js";
import { addUserAddress,editUserAddress,deleteUserAddress,setDefaultAddressService} from "../../services/user/addressService.js";

 const getCheckOutPage = async (req, res) => {
  try {
    const now = new Date();

    const availableCoupons = await Coupon.find({
      isActive:true,
      startDate:{$lte:now},
      endDate:{$gte:now}
    })
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

    await editUserAddress(
      req.session.userId,
      req.body.addressId,
      value
    );

    return res.json({ success: true });

  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

const checkdeleteAddress = async (req, res) => {
  try {
    await deleteUserAddress(
      req.session.userId,
      req.params.addressId
    );

    req.flash("success", "Address deleted");
    res.redirect("/checkout");

  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/checkout");
  }
};

const checksetDefaultAddress = async (req, res) => {
  try {
    await setDefaultAddressService(
      req.session.userId,
      req.params.addressId
    );

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
     if (!order) { 
      return res.redirect("/shop"); 

     } 
     res.render("user/orderSuccess", {
       order, success: req.flash("success"),
        error: req.flash("error") });
       } catch (error) {
         console.error("Order Success Error:", error); 
         return res.redirect("/shop"); } 
  };

const placeOrder = async (req, res) => {
  try {
    const userId = req.session.userId;
   let { addressId, paymentMethod } = req.body;
      if (paymentMethod === "razorpay") {
          paymentMethod = "online";
    }

    const order = await placeOrderService(userId, addressId, paymentMethod);

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
    const razorpayKey = process.env.RAZORPAY_KEY_ID;


    if (err.message.toLowerCase().includes("stock")) {
      return res.render("user/checkout", {
        ...data,
        stockIssue: true,
        stockMessage: err.message,
        successMessages: [],
        errorMessages: [],
        availableCoupons,
        razorpayKey
      });
    }

    return res.render("user/checkout", {
      ...data,
      stockIssue: false,
      stockMessage: "",
      successMessages: [],
      errorMessages: [err.message],
      availableCoupons,
      razorpayKey   
    });
  }
};

const applyCoupon = async(req,res)=>{
  try {
    const {code} = req.body;
    const userId = req.session.userId;
         console.log('=== Apply Coupon Request ===');
        console.log('Received code:', code);
console.log("Session:", req.session);
    const result = await applyCouponService(code,userId,req.session);
    return res.json(result)
  } catch (error) {
    console.log(error);
    res.json({success:false,message:"Something went wrong"});
  }

}
export default {
  getCheckOutPage,
  checkaddAddress,
  checkeditAddress,
  checkdeleteAddress,
  checksetDefaultAddress,
  orderSuccess,
  placeOrder,
  applyCoupon
}