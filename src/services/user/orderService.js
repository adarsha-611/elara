import Order from "../../model/orderSchema.js";
import Product from "../../model/productSchema.js";


export const getUserOrders = async (userId, page = 1, limit = 5) => {
  const skip = (page - 1) * limit;


  const orders = await Order.find({ user: userId })

    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
 

  if (!orders.length) {
    return {
      orders: [],
      totalPages: 0,
      currentPage: page
    };
  }


  let productIds = [];

  orders.forEach(order => {
    order.items.forEach(item => {
     productIds.push(item.product);
    });
  });


  productIds = [...new Set(productIds.map(id => id.toString()))];

  
  const products = await Product.find({
    _id: { $in: productIds }
  }).lean();

 
  const productMap = {};
  products.forEach(product => {
    productMap[product._id.toString()] = product;
  });


  orders.forEach(order => {
    order.items.forEach(item => {
      item.productDetails = productMap[item.product.toString()];
    });
  });

  const totalOrders = await Order.countDocuments({ user: userId });

  return {
    orders,
    totalPages: Math.ceil(totalOrders / limit),
    currentPage: page
  };
};

export const getOrderById = async (orderId, userId) => {
  const order = await Order.findOne({
    _id: orderId,
    user: userId
  })
  .populate("items.product")
  

  return order;
};


export const requestReturn = async (orderId, itemId, reason) => {
  await Order.updateOne(
    { _id: orderId, "items._id": itemId },
    {
      $set: {
        "items.$.returnRequest.requested": true,
        "items.$.returnRequest.status": "pending",
        "items.$.returnRequest.reason": reason,
        "items.$.returnRequest.requestedAt": new Date(),
      },
    }
  );
};

export const cancelOrderService = async (orderId, itemId) => {

  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  const item = order.items.id(itemId);

  if (!item) {
    throw new Error("Item not found");
  }

  if (item.itemStatus === "cancelled") {
    throw new Error("Item already cancelled");
  }

  if (item.itemStatus === "delivered") {
    throw new Error("Delivered item cannot be cancelled");
  }

  const product = await Product.findById(item.product);

  if (product) {
    const variant = product.variants.find(
      v => v.color === item.variantColor
    );

    if (variant) {
      variant.stock += item.quantity;
    }

    await product.save();
  }

  item.itemStatus = "cancelled";

  await order.save();

  return true;
};

export const getInvoiceData = async (orderId) => {
  const order = await Order.findById(orderId)
    .populate({
      path: "user",
      select: "name email"
    })
    .populate({
      path: "items.product",
      select: "name"
    });

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
};