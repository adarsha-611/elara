import { placeOrderService } from "../../services/user/checkoutService.js";
import { createRazorpayOrder,verifyPayment } from "../../services/user/paymentService.js";

const createOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    const razorpayOrder = await createRazorpayOrder(amount);

    res.json({
      success: true,
      razorpayOrder
    });

  } catch (error) {
    console.error("RAZORPAY ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Razorpay order creation failed"
    });
  }
};

const verifyPaymentController = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      addressId,
      paymentMethod
    } = req.body;

    const userId = req.session.userId;

    const isValid = verifyPayment({
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      signature: razorpay_signature
    });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed"
      });
    }

    // ✅ Pull coupon from session
    const appliedCoupon = req.session.appliedCoupon || null;
    console.log("verify-payment appliedCoupon:", appliedCoupon); // confirm it's there

    const order = await placeOrderService(
      userId,
      addressId,
      "online",
      "paid",
      appliedCoupon  // ✅ now passed correctly
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

    return res.render("user/paymentFail", {
      orderId
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