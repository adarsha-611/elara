import { getUserOrders,getOrderById ,requestReturn,cancelOrderService,getInvoiceData,addReviewService} from "../../services/user/orderService.js";
import User from "../../model/userSchema.js";
import Order from "../../model/orderSchema.js"
import PDFDocument from "pdfkit";

const getOrderlistPage = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.redirect('/login');
        }

        const page = parseInt(req.query.page) || 1;

        const { orders, totalPages, currentPage } = await getUserOrders(userId, page);
        const user = await User.findById(userId);

     
        const ordersWithStatus = orders.map(order => {
            let trackerStatus = "pending";

            if (order.items.some(item => item.itemStatus === "delivered")) {
                trackerStatus = "delivered";
            } else if (order.items.some(item => item.itemStatus === "out for delivery")) {
                trackerStatus = "out for delivery";
            } else if (order.items.some(item => item.itemStatus === "shipped")) {
                trackerStatus = "shipped";
            }

            return {
                ...order._doc,
                trackerStatus
            };
        });

        return res.render("user/orderlist", {
            orders: ordersWithStatus,
            user,
            totalPages,
            currentPage
        });

    } catch (error) {
        console.log(error);
        return res.status(500).send("Server Error");
    }
};

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

const returnOrder = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;
        const { reason, comments } = req.body;

        await requestReturn(orderId, itemId, reason, comments);

        return res.status(200).json({
            success: true,
            message: "Return request submitted"
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


const cancelOrder = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { reason } = req.body;

<<<<<<< HEAD
   const result = await cancelOrderService(orderId, itemId, reason);
=======
    // ✅ Capture result from service
    const result = await cancelOrderService(orderId, itemId, reason);
>>>>>>> feature/refferal

    return res.status(200).json({
      success: true,
      message: result.refundDone
        ? `Item cancelled & ₹${result.refundAmount} refunded to wallet`
        : "Item cancelled successfully"
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


const cancelAllItems = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const cancellableItems = order.items.filter(
      i => !["cancelled", "delivered"].includes(i.itemStatus)
    );

    if (!cancellableItems.length)
      return res.status(400).json({ success: false, message: "No items to cancel" });

    let totalRefund = 0;
    for (const item of cancellableItems) {
      const result = await cancelOrderService(orderId, item._id.toString(), reason);
      if (result.refundDone) totalRefund += result.refundAmount;
    }

    return res.status(200).json({
      success: true,
      message: totalRefund > 0
        ? `All items cancelled & ₹${totalRefund} refunded to wallet`
        : "All items cancelled successfully"
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


const addReviewController = async(req,res)=>{
    try {
        const userId = req.session.userId;
        const {productId,rating,comment} =req.body;

        const result = await addReviewService(userId,productId,rating,comment);

        if(!result.success){
            return res.json(result);
        }

        res.json({success:true});
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Server error"})
    }
}








const downloadInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await getInvoiceData(id);

    if (!order) {
      return res.status(404).send("Order not found");
    }

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: `Invoice - ${order._id}`,
        Author: "ELARA Luxury Jewelry",
        Subject: "Invoice for Jewelry Purchase",
      },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=ELARA-Invoice-${order._id}.pdf`
    );

    doc.pipe(res);

    // Generate the professional invoice
    await generateLuxuryInvoice(doc, order);

    doc.end();
  } catch (error) {
    console.error("Invoice generation error:", error);
    res.status(500).send("Error generating invoice");
  }
};

async function generateLuxuryInvoice(doc, order) {
  // Add background (optional subtle pattern or color)
  doc.rect(0, 0, doc.page.width, doc.page.height)
     .fill('#FFFFFF');

  // Add border
  doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
     .lineWidth(1.5)
     .strokeColor('#A3866A')
     .stroke();

  // Header Section with Gold Accent
  doc.rect(30, 30, doc.page.width - 60, 120)
     .fill('#F8F5F2');

  // Company Logo/Name
  doc.fontSize(28)
     .font('Helvetica-Bold')
     .fillColor('#3F2A1D')
     .text('ELARA', 70, 55);
  
  doc.fontSize(11)
     .font('Helvetica')
     .fillColor('#7A5C4D')
     .text('LUXURY JEWELRY', 72, 85);

  // Company Details
  doc.fontSize(9)
     .fillColor('#666666')
     .text('ELARA Luxury Jewelry', 400, 55, { align: 'right' })
     .text('Business Park, Kochi, Ernakulam', 400, 70, { align: 'right' })
     .text('Kerala, India - 682001', 400, 85, { align: 'right' })
     .text('Phone: +91 98765 43210', 400, 100, { align: 'right' })
     .text('Email: elara202615@gmail.com', 400, 115, { align: 'right' });

  // Divider
  doc.moveTo(50, 165)
     .lineTo(doc.page.width - 50, 165)
     .lineWidth(1)
     .strokeColor('#A3866A')
     .stroke();

  // INVOICE Title
  doc.fontSize(22)
     .font('Helvetica-Bold')
     .fillColor('#3F2A1D')
     .text('INVOICE', 50, 185);

  // Invoice Details Box
  doc.rect(50, 215, 250, 80)
     .lineWidth(0.5)
     .strokeColor('#DDD')
     .stroke();

  doc.rect(310, 215, 230, 80)
     .lineWidth(0.5)
     .strokeColor('#DDD')
     .stroke();

  // Left Box - Invoice Info
  doc.fontSize(9)
     .font('Helvetica-Bold')
     .fillColor('#3F2A1D')
     .text('INVOICE DETAILS', 60, 230);
  
  doc.fontSize(9)
     .font('Helvetica')
     .fillColor('#555555')
     .text('Invoice Number:', 60, 250)
     .text(`ELR-${order._id.toString().slice(-8).toUpperCase()}`, 180, 250)
     .text('Invoice Date:', 60, 265)
     .text(new Date(order.createdAt).toLocaleDateString('en-IN', {
       day: '2-digit',
       month: '2-digit',
       year: 'numeric'
     }), 180, 265)
     .text('Order ID:', 60, 280)
     .text(order._id.toString().slice(-12), 180, 280);

  // Right Box - Payment Info
  doc.fontSize(9)
     .font('Helvetica-Bold')
     .fillColor('#3F2A1D')
     .text('PAYMENT DETAILS', 320, 230);
  
  doc.fontSize(9)
     .font('Helvetica')
     .fillColor('#555555')
     .text('Payment Method:', 320, 250)
     .text(order.paymentMethod || 'COD', 420, 250)
     .text('Payment Status:', 320, 265)
     .text(order.paymentStatus || 'Pending', 420, 265)
     .text('Due Date:', 320, 280)
     .text('Upon Receipt', 420, 280);

  // Customer Section
  let currentY = doc.y + 30;
  
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor('#3F2A1D')
     .text('BILL TO', 50, currentY);

  doc.rect(50, currentY + 5, 250, 70)
     .lineWidth(0.5)
     .strokeColor('#DDD')
     .stroke();

  doc.fontSize(10)
     .font('Helvetica')
     .fillColor('#333333')
     .text(order.user?.name || 'Customer', 60, currentY + 20)
     .text(order.user?.email || '', 60, currentY + 37)
     .text(order.shippingAddress?.phoneNumber || order.user?.phone || '', 60, currentY + 54);

  // Shipping Address if available
  if (order.shippingAddress) {
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#3F2A1D')
       .text('SHIP TO', 320, currentY);

    doc.rect(310, currentY + 5, 230, 70)
       .lineWidth(0.5)
       .strokeColor('#DDD')
       .stroke();

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#333333')
       .text(order.shippingAddress.fullName || '', 320, currentY + 20)
       .text(order.shippingAddress.street || '', 320, currentY + 37)
       .text(`${order.shippingAddress.city || ''}, ${order.shippingAddress.state || ''} - ${order.shippingAddress.pincode || ''}`, 320, currentY + 54);
  }

  // Order Items Table
  const tableTop = currentY + 100;
  const colProduct = 50;
  const colDescription = 220;
  const colQty = 350;
  const colUnitPrice = 400;
  const colTotal = 480;

  // Table Header
  doc.rect(50, tableTop, doc.page.width - 100, 30)
     .fill('#F8F5F2');

  doc.fontSize(10)
     .font('Helvetica-Bold')
     .fillColor('#3F2A1D')
     .text('SL NO', colProduct, tableTop + 10, { width: 45, align: 'center' })
     .text('PRODUCT', colDescription, tableTop + 10, { width: 120 })
     .text('QTY', colQty, tableTop + 10, { width: 40, align: 'center' })
     .text('UNIT PRICE (₹)', colUnitPrice, tableTop + 10, { width: 80, align: 'right' })
     .text('TOTAL (₹)', colTotal, tableTop + 10, { width: 80, align: 'right' });

  // Table Header Border
  doc.moveTo(50, tableTop + 30)
     .lineTo(doc.page.width - 50, tableTop + 30)
     .lineWidth(1)
     .strokeColor('#A3866A')
     .stroke();

  let y = tableTop + 45;
  let subtotal = 0;
  let pageNumber = 1;

  // Table Rows
  for (let index = 0; index < order.items.length; index++) {
    const item = order.items[index];
    const itemTotal = (item.price || 0) * (item.quantity || 0);
    subtotal += itemTotal;

    // Check if we need a new page
    if (y > 650) {
      doc.addPage();
      pageNumber++;
      y = 50;
      
      // Re-add header on new page
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#3F2A1D')
         .text('SL NO', colProduct, y, { width: 45, align: 'center' })
         .text('PRODUCT', colDescription, y, { width: 120 })
         .text('QTY', colQty, y, { width: 40, align: 'center' })
         .text('UNIT PRICE (₹)', colUnitPrice, y, { width: 80, align: 'right' })
         .text('TOTAL (₹)', colTotal, y, { width: 80, align: 'right' });
      
      doc.moveTo(50, y + 20)
         .lineTo(doc.page.width - 50, y + 20)
         .lineWidth(1)
         .strokeColor('#A3866A')
         .stroke();
      
      y += 35;
    }

    // Product name (truncate if too long)
    const productName = item.product?.name || item.name || 'Jewelry Item';
    const truncatedName = productName.length > 35 ? productName.substring(0, 32) + '...' : productName;

    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#333333')
       .text((index + 1).toString(), colProduct, y, { width: 45, align: 'center' })
       .text(truncatedName, colDescription, y, { width: 120 })
       .text(item.quantity.toString(), colQty, y, { width: 40, align: 'center' })
       .text(`₹${(item.price || 0).toFixed(2)}`, colUnitPrice, y, { width: 80, align: 'right' })
       .text(`₹${itemTotal.toFixed(2)}`, colTotal, y, { width: 80, align: 'right' });

    y += 22;

    // Light border between items
    doc.moveTo(50, y - 5)
       .lineTo(doc.page.width - 50, y - 5)
       .lineWidth(0.3)
       .strokeColor('#EEEEEE')
       .stroke();
  }

  // Calculate totals
  const shipping = order.shippingCost || 0;
  const discount = order.discountAmount || 0;
  const tax = order.tax || (subtotal * 0.05); // 5% GST example
  const grandTotal = subtotal + shipping + tax - discount;

  // Totals Section
  const totalsY = Math.min(y + 40, doc.page.height - 200);
  
  // Draw totals box
  doc.rect(doc.page.width - 220, totalsY, 170, 110)
     .lineWidth(0.5)
     .strokeColor('#DDD')
     .stroke();

  let totalsCurrentY = totalsY + 15;

  doc.fontSize(9)
     .font('Helvetica')
     .fillColor('#555555');

  doc.text('Subtotal:', doc.page.width - 215, totalsCurrentY, { width: 100, align: 'left' });
  doc.text(`₹${subtotal.toFixed(2)}`, doc.page.width - 115, totalsCurrentY, { width: 70, align: 'right' });
  totalsCurrentY += 18;

  if (discount > 0) {
    doc.text('Discount:', doc.page.width - 215, totalsCurrentY, { width: 100, align: 'left' });
    doc.text(`-₹${discount.toFixed(2)}`, doc.page.width - 115, totalsCurrentY, { width: 70, align: 'right' });
    totalsCurrentY += 18;
  }

  if (shipping > 0) {
    doc.text('Shipping:', doc.page.width - 215, totalsCurrentY, { width: 100, align: 'left' });
    doc.text(`₹${shipping.toFixed(2)}`, doc.page.width - 115, totalsCurrentY, { width: 70, align: 'right' });
    totalsCurrentY += 18;
  }

  if (tax > 0) {
    doc.text('GST (5%):', doc.page.width - 215, totalsCurrentY, { width: 100, align: 'left' });
    doc.text(`₹${tax.toFixed(2)}`, doc.page.width - 115, totalsCurrentY, { width: 70, align: 'right' });
    totalsCurrentY += 18;
  }

  // Divider
  doc.moveTo(doc.page.width - 220, totalsCurrentY)
     .lineTo(doc.page.width - 50, totalsCurrentY)
     .lineWidth(0.5)
     .strokeColor('#A3866A')
     .stroke();
  totalsCurrentY += 12;

  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor('#3F2A1D')
     .text('GRAND TOTAL:', doc.page.width - 215, totalsCurrentY, { width: 100, align: 'left' });
  doc.fontSize(14)
     .fillColor('#A3866A')
     .text(`₹${grandTotal.toFixed(2)}`, doc.page.width - 115, totalsCurrentY - 1, { width: 70, align: 'right' });

  // Amount in words
  const amountInWordsY = Math.max(totalsY + 130, y + 80);
  
  if (amountInWordsY < doc.page.height - 100) {
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#666666')
       .text('Amount in words:', 50, amountInWordsY)
       .fontSize(9)
       .font('Helvetica-Bold')
       .fillColor('#333333')
       .text(numberToWords(grandTotal), 50, amountInWordsY + 15);
  }

  // Thank You Note
  const thankYouY = Math.min(amountInWordsY + 80, doc.page.height - 120);
  
  if (thankYouY < doc.page.height - 80) {
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor('#A3866A')
       .text('✨ Thank you for choosing ELARA Luxury Jewelry ✨', 50, thankYouY, { align: 'center' });

    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#999999')
       .text('This is a computer-generated invoice and does not require a physical signature.', 50, thankYouY + 25, { align: 'center' });
  }

  // Add footer on all pages (this must be done before calling end())
  const pages = doc.bufferedPageRange();
  
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    
    // Add footer line
    doc.moveTo(50, doc.page.height - 50)
       .lineTo(doc.page.width - 50, doc.page.height - 50)
       .lineWidth(0.5)
       .strokeColor('#DDDDDD')
       .stroke();
    
    // Add page number
    doc.fontSize(8)
       .fillColor('#999999')
       .text(
         `Page ${i + 1} of ${pages.count}`,
         50,
         doc.page.height - 35,
         { align: 'center', width: doc.page.width - 100 }
       );
    
    // Add generation date on footer
    doc.fontSize(7)
       .fillColor('#999999')
       .text(
         `Generated on ${new Date().toLocaleString('en-IN')}`,
         50,
         doc.page.height - 35,
         { align: 'left' }
       );
  }
}

// Helper function to convert numbers to words
function numberToWords(num) {
  if (num === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const numToWords = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + numToWords(n % 100) : '');
    if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + numToWords(n % 1000) : '');
    if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + numToWords(n % 100000) : '');
    return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + numToWords(n % 10000000) : '');
  };
  
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  
  let result = numToWords(rupees) + ' Rupees';
  if (paise > 0) {
    result += ' and ' + numToWords(paise) + ' Paise';
  }
  result += ' Only';
  
  return result;
}
export default{
    getOrderlistPage,
    getOrderdetailPage,
    returnOrder,
    cancelOrder,
    downloadInvoice,
    addReviewController,
    cancelAllItems
    
}