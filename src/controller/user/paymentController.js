import Order from "../../model/orderSchema.js";
import { placeOrderService } from "../../services/user/checkoutService.js";
import { createRazorpayOrder, verifyPayment } from "../../services/user/paymentService.js";

const createOrder = async (req, res) => {
  try {
    const { amount, addressId } = req.body;
    const userId = req.session.userId;

    const order = await placeOrderService(userId, addressId, "online", "pending");

    const razorpayOrder = await createRazorpayOrder(amount);

    return res.json({
      success: true,
      razorpayOrder,
      orderId: order._id  
    });

  } catch (error) {
    console.error("RAZORPAY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Razorpay order creation failed"
    });
  }
};

// paymentController.js

const verifyPaymentController = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId           // ← the MongoDB _id from createOrder response
    } = req.body;

    const isValid = verifyPayment({
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      signature: razorpay_signature
    });

    if (!isValid) {
      // Mark the existing order as failed
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: "failed",
        paymentId: razorpay_payment_id || null
      });

      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
        orderId  // send back so frontend can redirect
      });
    }

<<<<<<< HEAD
    // Update the existing order to paid — don't create a new one
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        paymentStatus: "paid",
        paymentId: razorpay_payment_id
      },
      { new: true }
=======
    // ✅ Pull coupon from session
    const appliedCoupon = req.session.appliedCoupon || null;
    console.log("verify-payment appliedCoupon:", appliedCoupon); // confirm it's there

    const order = await placeOrderService(
      userId,
      addressId,
      "online",
      "paid",
      appliedCoupon  // ✅ now passed correctly
>>>>>>> feature/refferal
    );

    // ✅ Clear coupon from session after order is placed
    delete req.session.appliedCoupon;

    return res.json({
      success: true,
      orderId: order._id
    });

  } catch (error) {
    console.error("VERIFY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Payment verification failed"
    });
  }
};

const paymentFailedPage = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId); // ← fetch order from DB

    if (!order) return res.redirect("/shop");

    return res.render("user/paymentFail", {
      orderId: order._id,
      order          // ← pass order to EJS
    });

  } catch (error) {
    console.log("Payment Failed Page Error:", error);
    res.redirect("/shop");
  }
};

const retryPayment = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.json({
        success: false,
        message: "Order not found"
      });
    }

    const razorpayOrder = await createRazorpayOrder(order.totalAmount);

    return res.json({
      success: true,
      razorpayOrder,
      orderId: order._id
    });

  } catch (error) {
    console.log("Retry Payment Error:", error);
    res.json({
      success: false,
      message: "Retry failed"
    });
  }
};

export default{
    createOrder,
    verifyPaymentController,
    paymentFailedPage,
    retryPayment
}