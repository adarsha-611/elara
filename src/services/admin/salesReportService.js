import mongoose, { startSession } from "mongoose";
import Order from "../../model/orderSchema.js";

export const getSalesReportData = async({startDate,endDate})=>{
    const matchStage ={
        orderStatus:{$in:["delivered","returned"]}
    };

    if(startDate && endDate){
        matchStage.createdAt = {
            $gte: new Date(startDate),
            $lte:new Date(endDate)
        };
    }

    const salesData = await Order.aggregate([
        {$match:matchStage},
        {
            $group:{
                _id:{
                    year:{$year:"$createdAt"},
                    month:{$month:"$createdAt"}
                },
                orders:{$sum:1},
                amount:{$sum:"$totalAmount"},
                discount:{$sum:"$discount"},
                coupon:{$sum:"$couponDiscount"}
            }
        },
        {
            $sort:{"_id.year":1,"_id.month":1}
        }
    ]);

    const totals = await Order.aggregate([
        {$match:matchStage},
        {
            $group:{
                _id:null,
                totalOrders:{$sum:1},
                totalSales:{$sum:"$totalAmount"},
                totalDiscount:{$sum:"$discount"},
                totalCoupon:{$sum:"$couponDiscount"}
            }
        }
    ]);

    return{
        chartData: salesData,
        totals:totals[0] || {
            totalOrders:0,
            totalSales:0,
            totalDiscount:0,
            totalCoupon:0
        }
    }

   
    
}