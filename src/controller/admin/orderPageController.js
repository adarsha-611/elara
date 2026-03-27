import { getOrderlist,changeItemStatus,getOrderDetail,rejectReturnReq,acceptReturnReq} from "../../services/admin/orderlistService.js";
import Order from '../../model/orderSchema.js';

const getOrderPage = async(req,res)=>{
    try {
        const page = parseInt(req.query.page)||1;
        const limit=5;
        const search = req.query.search || "";
        const status = req.query.status||"";
        const sort = req.query.sort||"desc";

        const { orders, totalPages, currentPage } = await getOrderlist({
        page,
        limit,
        search,
        status,
        sort
    });

        res.render('admin/orderManagement',{
        orders,
        totalPages,
        currentPage,
        search,
        status,
        sort,
        sidebarPage:"Orders list"
    })
    } catch (error) {
        console.log(error);
        res.status(500).send("Server Error");
    }
}


const updateItemStatus = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { status } = req.body;

    await changeItemStatus(orderId, itemId, status);

    res.json({
      success: true,
      message: "Item status updated"
    });

  } catch (error) {
    res.json({
      success: false,
      message: error.message
    });
  }
};


const getOrderdetailPage = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate({
        path: "user",
        select: "name email"
      })
     .populate({
        path: "items.product",
        select: "name images"
      });

    if (!order) return res.status(404).send("Order not found");

    console.log("POPULATED:", order.items);

    res.render("admin/orderDetail", { order });

  } catch (error) {
    console.log(error);
    return res.status(500).send("Server Error");
  }
};
const acceptReturn = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;


    await acceptReturnReq(orderId, itemId);

   
    return res.status(200).json({
      success: true,
      message: 'Return request accepted successfully'
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: 'Failed to accept return request'
    });
  }
}

const rejectReturn = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;

    await rejectReturnReq(orderId, itemId);

    return res.status(200).json({
      success: true,
      message: 'Return request rejected successfully'
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject return request'
    });
  }
}
const getReturnDetails = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;

        const order = await Order.findById(orderId).populate('items.product', 'name');

        if (!order) return res.status(404).json({ message: 'Order not found' });

        const item = order.items.id(itemId);

        if (!item || !item.returnRequest?.requested) {
            return res.status(404).json({ message: 'Return request not found' });
        }

        res.json({
            productName: item.product.name,
            price: item.price,
            reason: item.returnRequest.reason
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};


export default{
    getOrderPage,
    updateItemStatus,
    getOrderdetailPage,
    acceptReturn,
    rejectReturn,
    getReturnDetails,
   
}