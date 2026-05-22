import mongoose, { startSession } from "mongoose";
import Order from "../../model/orderSchema.js";

export const getSalesReportData = async ({ startDate, endDate }) => {
    const matchStage = {
        orderStatus: { $in: ["delivered", "returned"] }
    };

    if (startDate && endDate) {
        matchStage.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
        };
    }

    const salesData = await Order.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" }
                },
                orders: { $sum: 1 },
                amount: { $sum: "$totalAmount" },       
                coupon: { $sum: "$discount" },          
                offerDiscount: {                       
                    $sum: {
                        $reduce: {
                            input: "$items",
                            initialValue: 0,
                            in: {
                                $add: [
                                    "$$value",
                                    { $multiply: [{ $ifNull: ["$$this.offerDiscount", 0] }, "$$this.quantity"] }
                                ]
                            }
                        }
                    }
                },
                revenue: { $sum: "$finalAmount" }       
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const totals = await Order.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalSales: { $sum: "$totalAmount" },
                totalDiscount: {                       
                    $sum: {
                        $reduce: {
                            input: "$items",
                            initialValue: 0,
                            in: {
                                $add: [
                                    "$$value",
                                    { $multiply: [{ $ifNull: ["$$this.offerDiscount", 0] }, "$$this.quantity"] }
                                ]
                            }
                        }
                    }
                },
                totalCoupon: { $sum: "$discount" },     
                totalRevenue: { $sum: "$finalAmount" }  
            }
        }
    ]);

    return {
        chartData: salesData,
        totals: totals[0] || {
            totalOrders: 0,
            totalSales: 0,
            totalDiscount: 0,
            totalCoupon: 0,
            totalRevenue: 0
        }
    };
};