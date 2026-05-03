import Coupon from "../../model/couponSchema.js";
import { getCouponData, addCouponService, updateCouponService, toggleCouponStatusService } from "../../services/admin/couponService.js";
import { validateCoupon } from "../../utils/validators/joi_coupon.js";
import mongoose from "mongoose";

const getCouponPage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const { coupons, totalPages, currentPage } = await getCouponData(page, 5);

        return res.render("admin/couponManagement", {
            coupons,
            currentMenu:"coupons",
            totalPages,
            sidebarPage: "coupons",
            success_msg: req.flash("success_msg"),
            error_msg: req.flash("error_msg")
        });
    } catch (error) {
        console.log(error);
        req.flash("error_msg", "Server error");
        return res.status(500).send("Server error");
    }
}

const addCoupon = async (req, res) => {
    try {
        const { error, value } = validateCoupon(req.body);

        if (error) {
            const errors = error.details.map(err => ({
                field: err.path[0],
                message: err.message
            }));

            return res.status(400).json({
                success: false,
                errors
            });
        }

        await addCouponService(value);

        return res.status(200).json({
            success: true,
            message: "Coupon added successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const updateCoupon = async (req, res) => {
    try {
        const { error, value } = validateCoupon(req.body);

        if (error) {
            const errors = error.details.map(err => ({
                field: err.path[0],
                message: err.message
            }));

            return res.status(400).json({ success: false, errors });
        }

        await updateCouponService(req.params.id, value);

        return res.json({
            success: true,
            message: "Coupon updated successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const toggleCouponStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedCoupon = await toggleCouponStatusService(id);
        return res.status(200).json({ 
            success: true, 
            message: "Coupon status updated successfully",
            coupon: updatedCoupon 
        });
    } catch (error) {
        console.log(error);
        return res.status(400).json({ 
            success: false, 
            message: error.message || "Failed to update coupon status"
        });
    }
}

const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid coupon ID" });
        }

        const deleted = await Coupon.findByIdAndDelete(id);
        
        if (!deleted) {
            return res.status(404).json({ 
                success: false, 
                message: "Coupon not found" 
            });
        }

        return res.status(200).json({ 
            success: true, 
            message: "Coupon deleted successfully" 
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ 
            success: false, 
            message: "Failed to delete coupon" 
        });
    }
};

export default {
    getCouponPage,
    addCoupon,
    updateCoupon,
    toggleCouponStatus,
    deleteCoupon
}