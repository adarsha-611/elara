import Order from "../../model/orderSchema.js"; 
import Cart from "../../model/cartSchema.js";
import Product from "../../model/productSchema.js";
import Mongoose from "mongoose";
import User from '../../model/userSchema.js';
import { validateAddress } from "../../utils/validators/joi_address.js";
import { getCheckoutData,placeOrderService } from "../../services/user/checkoutService.js";
import { addUserAddress,editUserAddress,deleteUserAddress,setDefaultAddressService} from "../../services/user/addressService.js";

 const getCheckOutPage = async (req, res) => {
  try {
    const userId = req.session.userId;

    const data = await getCheckoutData(userId);

    res.render("user/checkout", {
      ...data,
      successMessages: req.flash("success"),
      errorMessages: req.flash("error"),
      stockIssue: false,
      stockMessage: ""
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
      const message = error.details.map(err => err.message).join(", ");
      req.flash("error", message);
      return res.redirect("/checkout");
    }

   
    await addUserAddress(req.session.userId, value);

    req.flash("success", "Address added");
    res.redirect("/checkout");

  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/checkout");
  }
};

const checkeditAddress = async (req, res) => {
  try {
    const { error, value } = validateAddress(req.body);

    if (error) {
      const message = error.details.map(err => err.message).join(", ");
      req.flash("error", message);
      return res.redirect("/checkout");
    }

    await editUserAddress(
      req.session.userId,
      req.body.addressId,
      value
    );

    req.flash("success", "Address updated");
    res.redirect("/checkout");

  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/checkout");
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
       console.log("🔥 PLACE ORDER HIT");


    const userId = req.session.userId;
    const { addressId, paymentMethod } = req.body;

    console.log("Address ID:", addressId);
    console.log("Payment Method:", paymentMethod);

    const order = await placeOrderService(userId, addressId, paymentMethod);
    console.log("✅ ORDER CREATED:", order._id);
    req.flash("success", "Order placed successfully");
    return res.redirect(`/order-success/${order._id}`);

  } catch (err) {
    if (err.message.includes("stock")) {
      const data = await getCheckoutData(req.session.userId);

      return res.render("user/checkout", {
        ...data,
        stockIssue: true,
        stockMessage: err.message,
        successMessages: [],
        errorMessages: []
      });
    }

    req.flash("error", err.message);
    return res.redirect("/checkout");
  }
};

export default {
  getCheckOutPage,
  checkaddAddress,
  checkeditAddress,
  checkdeleteAddress,
  checksetDefaultAddress,
  orderSuccess,
  placeOrder
}