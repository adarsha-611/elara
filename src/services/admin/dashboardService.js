import Order from "../../model/orderSchema.js";
import User from "../../model/userSchema.js";
import Product from "../../model/productSchema.js";

export const getDashboardData = async () => {
  try {

    
    const [totalOrders, totalUsers, totalProducts] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments(),
      Product.countDocuments()
    ]);

    const totalRevenueData = await Order.aggregate([
      { $match: { orderStatus: "delivered" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" }
        }
      }
    ]);

    const totalRevenue = totalRevenueData[0]?.total || 0;

   
    const statusCounts = await Order.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 }
        }
      }
    ]);

    let delivered = 0, pending = 0, cancelled = 0, returned = 0;

    statusCounts.forEach(item => {
      if (item._id === "delivered") delivered = item.count;
      if (item._id === "pending") pending = item.count;
      if (item._id === "cancelled") cancelled = item.count;
      if (item._id === "returned") returned = item.count;
    });

    const currentYear = new Date().getFullYear();

    
    const monthlyData = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(currentYear, 0, 1),
            $lte: new Date()
          }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          orders: { $sum: 1 },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthlyOrders = Array(12).fill(0);
    const monthlyRevenue = Array(12).fill(0);

    monthlyData.forEach(item => {
      const index = item._id - 1;
      monthlyOrders[index] = item.orders;
      monthlyRevenue[index] = item.revenue;
    });

    
    const dailyData = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" },
          orders: { $sum: 1 },
          revenue: { $sum: "$totalAmount" }
        }
      }
    ]);

    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const dailyOrders = Array(7).fill(0);
    const dailyRevenue = Array(7).fill(0);

    dailyData.forEach(item => {
      const index = item._id - 1;
      dailyOrders[index] = item.orders;
      dailyRevenue[index] = item.revenue;
    });

  
    const weeklyData = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(currentYear, new Date().getMonth(), 1)
          }
        }
      },
      {
        $group: {
          _id: { $week: "$createdAt" },
          orders: { $sum: 1 },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const weeklyLabels = [];
    const weeklyOrders = [];
    const weeklyRevenue = [];

    weeklyData.forEach((item, i) => {
      weeklyLabels.push(`W${i + 1}`);
      weeklyOrders.push(item.orders);
      weeklyRevenue.push(item.revenue);
    });

   
    const yearlyData = await Order.aggregate([
      {
        $group: {
          _id: { $year: "$createdAt" },
          orders: { $sum: 1 },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const yearlyLabels = yearlyData.map(i => i._id.toString());
    const yearlyOrders = yearlyData.map(i => i.orders);
    const yearlyRevenue = yearlyData.map(i => i.revenue);

    
    const topProducts = await Order.aggregate([
      { $match: { orderStatus: "delivered" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalUnits: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] }
          }
        }
      },
      { $sort: { totalUnits: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" }
    ]);

    const formattedTopProducts = topProducts.map((p, i) => ({
      rank: i + 1,
      name: p.productDetails?.name || "Unknown",
      image: p.productDetails?.image?.[0] || null,
      units: p.totalUnits,
      revenue: p.totalRevenue
    }));

    
    const topCategories = await Order.aggregate([
      { $match: { orderStatus: "delivered" } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      { $unwind: "$productInfo" },
      {
        $group: {
          _id: "$productInfo.category",
          totalSales: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] }
          },
          totalUnits: { $sum: "$items.quantity" }
        }
      },
      { $sort: { totalSales: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryDetails"
        }
      },
      { $unwind: "$categoryDetails" }
    ]);

    const totalSalesAmount = topCategories.reduce((sum, c) => sum + c.totalSales, 0);

    const formattedTopCategories = topCategories.map(c => ({
      name: c.categoryDetails?.name || "Unknown",
      sales: c.totalSales,
      percentage: totalSalesAmount
        ? ((c.totalSales / totalSalesAmount) * 100).toFixed(1)
        : 0,
      units: c.totalUnits
    }));

    return {
      totalOrders,
      totalUsers,
      totalProducts,
      totalRevenue,
      delivered,
      pending,
      cancelled,
      returned,

      chartLabels: months,
      chartOrders: monthlyOrders,
      chartRevenue: monthlyRevenue,

      dailyLabels: days,
      dailyOrders,
      dailyRevenue,

      weeklyLabels,
      weeklyOrders,
      weeklyRevenue,

      yearlyLabels,
      yearlyOrders,
      yearlyRevenue,

      topProducts: formattedTopProducts,
      topCategories: formattedTopCategories
    };

  } catch (error) {
    console.log("Dashboard Service Error:", error);
    throw error;
  }
};