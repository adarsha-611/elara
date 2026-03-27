    import Order from '../../model/orderSchema.js';
    import User from '../../model/userSchema.js';
    import Product from "../../model/productSchema.js";

    export const getOrderlist = async({
        page = 1,
        limit = 5,
        search ="",
        status ="",
        sort = "newest"
    })=>{
        const skip =(page-1)*limit; 

        let query = {};

        if(search){
            const users = await User.find({
                name:{$regex:search,$options:"i"}
            }).select("_id");

            const userIds = users.map(u=>u._id);

            query.$or = [
                {_id:search.match(/^[0-9a-fA-F]{24}$/)? search:null},
                {user:{$in:userIds}}
            ]
        }

        if(status){
            query.orderStatus = status;
        }

        let sortOption = {createdAt:-1};
        if(sort === "oldest"){
            sortOption = {createdAt:1};
        }
        

        const orders = await Order.aggregate([
        { $match: query },

        {
            $lookup: {
                from: "users",          
                localField: "user",     
                foreignField: "_id",    
                as: "user"
            }
        },

        { $unwind: "$user" },

        { $sort: sortOption },
        { $skip: skip },
        { $limit: limit }
    ]);
    const totalResult = await Order.aggregate([
        { $match: query },
        { $count: "total" }
    ]);

    const totalOrders = totalResult[0]?.total || 0;    const totalPages = Math.ceil(totalOrders/limit);

        return{
            orders,
            totalPages,
            currentPage:page
        }
    }

   export const changeItemStatus = async (orderId, itemId, newStatus) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  const item = order.items.id(itemId);
  if (!item) throw new Error("Item not found");

  item.itemStatus = newStatus;

  const statuses = order.items.map(i => i.itemStatus);

  if (statuses.every(s => s === "cancelled")) {
    order.orderStatus = "cancelled";
  } 
  else if (statuses.every(s => s === "delivered")) {
    order.orderStatus = "delivered";
  } 
  else if (statuses.some(s => s === "out for delivery")) {
    order.orderStatus = "out for delivery";
  } 
  else if (statuses.some(s => s === "shipped")) {
    order.orderStatus = "shipped";
  } 
  else {
    order.orderStatus = "pending";
  }

  await order.save();
};


 export const getOrderDetail = async (id) => {

  const order = await Order.findById(id)
    .populate({
      path: "items.product",
      model: "Product",
      select: "name"
    })
    .populate({
      path: "user",
      model: "User",
      select: "name email"
    });

  if (!order) {
    throw new Error("Order not found");
  }

  console.log("POPULATED ORDER:", JSON.stringify(order.items, null, 2));

  return order;
};


export const requestReturn = async(orderId, itemId, reason) => {
 await Order.updateOne(
    { _id: orderId, "items._id": itemId },
    {
      $set: {
        "items.$.returnRequest.requested": true,
        "items.$.returnRequest.status": "pending",
        "items.$.returnRequest.reason": reason,
        "items.$.returnRequest.requestedAt": new Date()
      }
    }
  );
}


export const acceptReturnReq = async (orderId, itemId) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  const item = order.items.id(itemId);
  if (!item) throw new Error("Item not found");

  if (item.returnRequest.status !== "pending") {
    throw new Error("Return already processed");
  }


  item.returnRequest.status = "accepted";
  item.returnRequest.processedAt = new Date();
  item.itemStatus = "returned";


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

  
  const allReturned = order.items.every(i => i.itemStatus === "returned");

if (allReturned) {
  order.orderStatus = "returned";
}

  await order.save();
};

export const rejectReturnReq = async(orderId, itemId) => {
  await Order.updateOne(
    { _id: orderId, "items._id": itemId },
    {
      $set: {
        "items.$.returnRequest.status": "rejected",
        "items.$.returnRequest.processedAt": new Date(),
        "items.$.itemStatus": "delivered"
      }
    }
  );
}

