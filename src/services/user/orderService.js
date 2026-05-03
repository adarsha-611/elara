import Order from "../../model/orderSchema.js";
import Product from "../../model/productSchema.js";
import { cancelRefundToWallet } from "./walletService.js";
import Review from "../../model/reviewSchema.js";
import Offer from "../../model/offerSchema.js"


export const getUserOrders = async (userId, page = 1, limit = 7) => {
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
    const product = productMap[item.product.toString()];

    if (product) {
      item.productDetails = product;
    } else {
      item.productDetails = {
        images: ["default.png"]
      };
    }
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
  }).populate("items.product");

  if (!order) return null;

  const now = new Date();

  const offers = await Offer.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now }
  });

  order.items.forEach(item => {
    const product = item.product;
    if (!product) return;

    let bestDiscount = 0;
    let bestOffer = null;

    offers.forEach(offer => {
      const isProductOffer =
        offer.offerType === "product" &&
        offer.productId?.toString() === product._id.toString();

      const isCategoryOffer =
        offer.offerType === "category" &&
        offer.categoryId?.toString() === product.category?.toString();

      if (isProductOffer || isCategoryOffer) {
        const basePrice = item.price;
        const discount =
          offer.discountType === "percentage"
            ? (basePrice * offer.discountValue) / 100
            : offer.discountValue;

        if (discount > bestDiscount) {
          bestDiscount = discount;
          bestOffer = offer;
        }
      }
    });

    item._offerDiscount = bestDiscount;
    item._offer = bestOffer;
  });

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
export const cancelOrderService = async (orderId, itemId,reason) => {

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

item.cancelRequest = {
  requested: true,
  reason: reason,
  cancelledAt: new Date()
};

let refundDone = false;
let refundAmount = 0;



if (order.paymentMethod !== "cod" && !item.isRefunded) {
  const offerDiscount = item.offerDiscount || 0;           
  const effectivePrice = item.price - offerDiscount;       

  refundAmount = effectivePrice * item.quantity;

  if (order.discount && order.totalAmount) {               
    const discountRatio = order.discount / order.totalAmount;
    refundAmount = refundAmount - (refundAmount * discountRatio);
    refundAmount = Math.round(refundAmount * 100) / 100;
  }

  await cancelRefundToWallet(order.user, refundAmount, order._id);
  item.isRefunded = true;
  refundDone = true;
}


if (order.paymentMethod !== "cod" && !item.isRefunded) {
  refundAmount = item.price * item.quantity;  

  if (order.discount && order.totalAmount) {
    const discountRatio = order.discount / order.totalAmount;
    refundAmount = refundAmount - (refundAmount * discountRatio);
    refundAmount = Math.round(refundAmount * 100) / 100;
  }

  await cancelRefundToWallet(order.user, refundAmount, order._id);
  item.isRefunded = true;
  refundDone = true;
}


const cancelledCount = order.items.filter(
  i => i.itemStatus === "cancelled"
).length;


if (cancelledCount === order.items.length) {
  order.orderStatus = "cancelled";
} else  {
  order.orderStatus = "partially_cancelled"; 
}

await order.save();

  return {
    refundDone,
    refundAmount
  }
};

export const addReviewService = async(userId,productId,rating,comment)=>{
  if(!productId||!rating||!comment){
    return{success:false,message:"All fields required"};
  }

  const existing = await Review.findOne({userId,productId});

  if(existing){
      return{success:false,message:"Already reviewed"};
  }

  const review = await Review.create({
    userId,
    productId,
    rating,
    comment
  })
  return {success:true,review};
}

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