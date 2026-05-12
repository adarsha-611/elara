import Order from "../../model/orderSchema.js";
import { placeOrderService } from "../../services/user/checkoutService.js";
import { createRazorpayOrder, verifyPayment } from "../../services/user/paymentService.js";

const createOrder = async (req, res) => {
    try {
        const { addressId } = req.body;
        const userId = req.session.userId;
        const appliedCoupon = req.session.appliedCoupon || null;

        const order = await placeOrderService(
            userId,
            addressId,
            "online",
            "pending",
            appliedCoupon
        );

        const razorpayOrder = await createRazorpayOrder(order.finalAmount);

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

const verifyPaymentController = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderId
        } = req.body;

        const isValid = verifyPayment({
            order_id: razorpay_order_id,
            payment_id: razorpay_payment_id,
            signature: razorpay_signature
        });

        if (!isValid) {
            await Order.findByIdAndUpdate(orderId, {
                paymentStatus: "failed",
                paymentId: razorpay_payment_id || null
            });

            return res.status(400).json({
                success: false,
                message: "Payment verification failed",
                orderId
            });
        }

        const order = await Order.findByIdAndUpdate(
            orderId,
            { paymentStatus: "paid", paymentId: razorpay_payment_id },
            { new: true }
        );

        delete req.session.appliedCoupon;

        return res.json({
            success: true,
            orderId: order._id
        });

    } catch (error) {
        console.error("Verify Payment Error:", error);
        return res.status(500).json({
            success: false,
            message: "Payment verification failed"
        });
    }
};

const paymentFailedPage = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId);
        if (!order) return res.redirect("/shop");

        return res.render("user/paymentFail", {
            orderId: order._id,
            order
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
            return res.json({ success: false, message: "Order not found" });
        }

        if (order.paymentStatus === "paid") {
            return res.json({ success: false, message: "Order already paid" });
        }

        const amountToPay = order.finalAmount || order.totalAmount;
        const razorpayOrder = await createRazorpayOrder(amountToPay);

        await Order.findByIdAndUpdate(orderId, { paymentStatus: "pending" });

        return res.json({
            success: true,
            razorpayOrder,
            orderId: order._id
        });

    } catch (error) {
        console.error("Retry Payment Error:", error);
        res.json({ success: false, message: "Retry failed" });
    }
};

export default {
    createOrder,
    verifyPaymentController,
    paymentFailedPage,
    retryPayment
};