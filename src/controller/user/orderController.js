import { getUserOrders,getOrderById ,requestReturn,cancelOrderService,getInvoiceData} from "../../services/user/orderService.js";
import User from "../../model/userSchema.js";
import Order from "../../model/orderSchema.js"
import PDFDocument from "pdfkit";

const getOrderlistPage = async(req,res)=>{
    try {
        const userId = req.session.userId;
        if(!userId){
            return res.redirect('/login');
        }
        const page = parseInt(req.query.page)||1;


        const{orders,totalPages,currentPage}= await getUserOrders(userId,page);
         const user = await User.findById(userId)

        return res.render("user/orderlist",{
            orders,
            user,
            totalPages,
            currentPage
        })
      
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server Error")
    }
}

const getOrderdetailPage = async(req,res)=>{
    try {
        const orderId = req.params.id;
        const userId = req.session.userId;

        const order =  await getOrderById(orderId,userId);
        console.log(JSON.stringify(order.items, null, 2));
        if(!order){
            return res.status(404).send("order is not found");
        }
        const user = await User.findById(userId);
        
        return res.render("user/orderDetailPage", {
        order,
        user,
        returnSuccess: req.query.returnSuccess
});
    } catch (error) {
        console.log(error);
        return res.status(500).send("server error");
    }
}

const returnOrder = async(req,res)=>{
    try {
        const orderId = req.params.id;
        const userId = req.session.userId;
        const { selectedItems, reason } = req.body;

        if (!selectedItems) {
            return res.redirect(`/profile/orders/${orderId}`);
        }

        const itemsArray = Array.isArray(selectedItems) ? selectedItems : [selectedItems];

        for (const itemId of itemsArray) {
            await requestReturn(orderId, itemId, reason);
        }

        return res.redirect(`/profile/orders/${orderId}?returnSuccess=true`);

    } catch (error) {
        console.log(error);
        return res.status(500).send("Server Error");
    }
}

const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    await cancelOrderService(orderId);

    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to cancel order'
    });
  }
};




const downloadInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await getInvoiceData(id);  

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order._id}.pdf`
    );

    doc.pipe(res);

   
    doc.fontSize(20).text("INVOICE", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Order ID: ${order._id}`);
    doc.text(`Date: ${order.createdAt.toDateString()}`);
    doc.moveDown();

    doc.text(`Customer: ${order.user.name}`);
    doc.text(`Email: ${order.user.email}`);
    doc.moveDown();

    doc.text("Products:", { underline: true });
    doc.moveDown();

    order.items.forEach((item) => {
      doc.text(
        `${item.product.name} | Qty: ${item.quantity} | Price: ₹${item.price}`
      );
    });

    doc.moveDown();
    doc.text(`Total: ₹${order.totalAmount}`, { align: "right" });

    doc.end();

  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};
export default{
    getOrderlistPage,
    getOrderdetailPage,
    returnOrder,
    cancelOrder,
    downloadInvoice,
    
}