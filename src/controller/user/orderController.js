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

        const order = await getOrderById(orderId,userId);
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

    const result = await cancelOrderService(orderId, itemId, reason);

    return res.status(200).json({
      success: true,
      message: result.refundDone
        ? `Item cancelled & Rs.${result.refundAmount} refunded to wallet`
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
        ? `All items cancelled & Rs.${totalRefund} refunded to wallet`
        : "All items cancelled successfully"
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const addReviewController = async(req,res)=>{
    try {
        const userId = req.session.userId;
        const {productId,rating,comment} = req.body;

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
      bufferPages: true,  
      info: {
        Title: `Invoice - ${order.orderId || order._id}`,
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

    generateLuxuryInvoice(doc, order);

   
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);

      doc.moveTo(50, doc.page.height - 50)
         .lineTo(doc.page.width - 50, doc.page.height - 50)
         .lineWidth(0.5).strokeColor('#DDDDDD').stroke();

      doc.fontSize(7).fillColor('#999999')
         .text(
           `Generated on ${new Date().toLocaleString('en-IN')}`,
           50, doc.page.height - 38,
           { align: 'left' }
         )
         .text(
           `Page ${i + 1} of ${pageCount}`,
           50, doc.page.height - 38,
           { align: 'right', width: doc.page.width - 100 }
         );
    }

    doc.end();
  } catch (error) {
    console.error("Invoice generation error:", error);
    res.status(500).send("Error generating invoice");
  }
};


function generateLuxuryInvoice(doc, order) {

  doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
     .lineWidth(1.5).strokeColor('#A3866A').stroke();

 
  doc.rect(30, 30, doc.page.width - 60, 110).fill('#3F2A1D');

  doc.fontSize(26).font('Helvetica-Bold').fillColor('#F8F5F2')
     .text('ELARA', 65, 55);
  doc.fontSize(9).font('Helvetica').fillColor('#A3866A')
     .text('LUXURY JEWELRY', 67, 84);

  doc.fontSize(8).fillColor('#C9B49A')
     .text('elara202615@gmail.com', doc.page.width - 260, 60, { align: 'right', width: 200 })
     .text('+91 98765 43210', doc.page.width - 260, 75, { align: 'right', width: 200 })
     .text('Business Park, Kochi, Kerala - 682001', doc.page.width - 260, 90, { align: 'right', width: 200 });

 
  doc.fontSize(20).font('Helvetica-Bold').fillColor('#3F2A1D')
     .text('INVOICE', 50, 160);

  doc.moveTo(50, 185).lineTo(doc.page.width - 50, 185)
     .lineWidth(1).strokeColor('#A3866A').stroke();

 
  const boxTop = 200;

  
  doc.rect(50, boxTop, 230, 85).lineWidth(0.5).strokeColor('#DDD').stroke();
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#3F2A1D')
     .text('INVOICE DETAILS', 62, boxTop + 12);
  doc.fontSize(8).font('Helvetica').fillColor('#555')
     .text('Invoice No :', 62, boxTop + 28)
     .text(`ELR-${order._id.toString().slice(-8).toUpperCase()}`, 135, boxTop + 28)
     .text('Date       :', 62, boxTop + 43)
     .text(new Date(order.createdAt).toLocaleDateString('en-IN'), 135, boxTop + 43)
     .text('Order ID   :', 62, boxTop + 58)
     .text(order.orderId || order._id.toString().slice(-10), 135, boxTop + 58);

  
  doc.rect(300, boxTop, 230, 85).lineWidth(0.5).strokeColor('#DDD').stroke();
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#3F2A1D')
     .text('PAYMENT DETAILS', 312, boxTop + 12);
  doc.fontSize(8).font('Helvetica').fillColor('#555')
     .text('Method :', 312, boxTop + 28)
     .text((order.paymentMethod || 'COD').toUpperCase(), 370, boxTop + 28)
     .text('Status  :', 312, boxTop + 43)
     .text((order.paymentStatus || 'Pending').toUpperCase(), 370, boxTop + 43);


  const addrTop = boxTop + 105;

  doc.fontSize(8).font('Helvetica-Bold').fillColor('#3F2A1D')
     .text('BILL TO', 50, addrTop);
  doc.rect(50, addrTop + 8, 230, 65).lineWidth(0.5).strokeColor('#DDD').stroke();
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#333')
     .text(order.user?.name || 'Customer', 62, addrTop + 18);
  doc.fontSize(8).font('Helvetica').fillColor('#555')
     .text(order.user?.email || '', 62, addrTop + 33)
     .text(order.user?.phone || order.shippingAddress?.phoneNumber || '', 62, addrTop + 48);

  if (order.shippingAddress) {
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#3F2A1D')
       .text('SHIP TO', 300, addrTop);
    doc.rect(300, addrTop + 8, 230, 65).lineWidth(0.5).strokeColor('#DDD').stroke();
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#333')
       .text(order.shippingAddress.fullName || order.user?.name || '', 312, addrTop + 18);
    doc.fontSize(8).font('Helvetica').fillColor('#555')
       .text(order.shippingAddress.street || '', 312, addrTop + 33)
       .text(
         `${order.shippingAddress.city || ''}, ${order.shippingAddress.state || ''} - ${order.shippingAddress.pincode || ''}`,
         312, addrTop + 48
       );
  }


  const tTop  = addrTop + 95;
  const cSl   = 50;
  const cName = 90;
  const cColor= 240;
  const cQty  = 330;
  const cUnit = 380;
  const cOffer= 440;
  const cTotal= 510;

  
  doc.rect(50, tTop, doc.page.width - 100, 24).fill('#3F2A1D');

  doc.fontSize(8).font('Helvetica-Bold').fillColor('#F8F5F2')
     .text('#',      cSl,    tTop + 8, { width: 30,  align: 'center' })
     .text('Product',cName,  tTop + 8, { width: 145, align: 'left'   })
     .text('Color',  cColor, tTop + 8, { width: 80,  align: 'left'   })
     .text('Qty',    cQty,   tTop + 8, { width: 40,  align: 'center' })
     .text('Price',  cUnit,  tTop + 8, { width: 55,  align: 'right'  })
     .text('Offer',  cOffer, tTop + 8, { width: 60,  align: 'right'  })
     .text('Total',  cTotal, tTop + 8, { width: 45,  align: 'right'  });

  let y = tTop + 30;
  let itemsSubtotal = 0;       
  let totalOfferDiscount = 0;  

  for (let i = 0; i < order.items.length; i++) {
    const item = order.items[i];

    const originalPrice = item.price || 0;
    const offerDiscountPerUnit = item.offerDiscount || 0;  
    const effectivePrice = originalPrice - offerDiscountPerUnit;
    const lineTotal = effectivePrice * (item.quantity || 1);
    const lineOriginal = originalPrice * (item.quantity || 1);
    const lineOffer = offerDiscountPerUnit * (item.quantity || 1); 

    itemsSubtotal += lineOriginal;
    totalOfferDiscount += lineOffer;

    
    if (i % 2 === 0) {
      doc.rect(50, y - 4, doc.page.width - 100, 22).fill('#FAF9F7');
    }

    const productName = (item.product?.name || item.name || 'Jewelry Item');
    const truncName   = productName.length > 28 ? productName.slice(0, 25) + '...' : productName;

    doc.fontSize(8).font('Helvetica').fillColor('#333')
       .text((i + 1).toString(),             cSl,    y, { width: 30,  align: 'center' })
       .text(truncName,                       cName,  y, { width: 145, align: 'left'   })
       .text(item.variantColor || '—',        cColor, y, { width: 80,  align: 'left'   })
       .text((item.quantity || 1).toString(), cQty,   y, { width: 40,  align: 'center' });

    
   if (offerDiscountPerUnit > 0) {
  doc.fontSize(7).fillColor('#999')
     .text(`Rs.${originalPrice.toFixed(0)}`, cUnit, y, { width: 55, align: 'right' });
  
  const priceTextWidth = 38;
  doc.moveTo(cUnit + 55 - priceTextWidth, y + 4)
     .lineTo(cUnit + 55, y + 4)
     .lineWidth(0.5).strokeColor('#999').stroke();

  doc.fontSize(8).fillColor('#2e7d32')
     .text(`-Rs.${lineOffer.toFixed(0)}`, cOffer, y, { width: 60, align: 'right' });
} else {
      doc.fontSize(8).fillColor('#333')
         .text(`Rs.${originalPrice.toFixed(0)}`, cUnit,  y, { width: 55, align: 'right' })
         .text('—',                               cOffer, y, { width: 60, align: 'right' });
    }

    doc.fontSize(8).font('Helvetica-Bold').fillColor('#3F2A1D')
       .text(`Rs.${lineTotal.toFixed(0)}`, cTotal, y, { width: 45, align: 'right' });

    
    doc.moveTo(50, y + 18).lineTo(doc.page.width - 50, y + 18)
       .lineWidth(0.3).strokeColor('#EEE').stroke();

    y += 22;

   
    if (y > doc.page.height - 200) {
      doc.addPage();
      y = 50;
    }
  }

  
  const totTop  = y + 20;
  const boxLeft = doc.page.width - 220;
  const boxW    = 170;

 
  const couponDiscount = order.discount || 0;
  const finalAmount    = order.finalAmount || (itemsSubtotal - totalOfferDiscount - couponDiscount);

  let tY = totTop + 12;

  doc.rect(boxLeft, totTop, boxW, 
    10 + 18 + (totalOfferDiscount > 0 ? 18 : 0) + (couponDiscount > 0 ? 18 : 0) + 8 + 24
  ).lineWidth(0.5).strokeColor('#DDD').stroke();

  
  doc.fontSize(8).font('Helvetica').fillColor('#555')
     .text('Subtotal:', boxLeft + 10, tY, { width: 85, align: 'left' })
     .text(`Rs.${itemsSubtotal.toFixed(0)}`, boxLeft + 95, tY, { width: 65, align: 'right' });
  tY += 18;


  if (totalOfferDiscount > 0) {
    doc.fillColor('#2e7d32')
       .text('Offer Discount:', boxLeft + 10, tY, { width: 85, align: 'left' })
       .text(`-Rs.${totalOfferDiscount.toFixed(0)}`, boxLeft + 95, tY, { width: 65, align: 'right' });
    tY += 18;
  }

 
  if (couponDiscount > 0) {
    doc.fillColor('#1565c0')
       .text('Coupon Discount:', boxLeft + 10, tY, { width: 85, align: 'left' })
       .text(`-Rs.${couponDiscount.toFixed(0)}`, boxLeft + 95, tY, { width: 65, align: 'right' });
    tY += 18;
  }


  doc.moveTo(boxLeft + 8, tY).lineTo(boxLeft + boxW - 8, tY)
     .lineWidth(0.5).strokeColor('#A3866A').stroke();
  tY += 10;

 
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#3F2A1D')
     .text('TOTAL:', boxLeft + 10, tY, { width: 85, align: 'left' });
  doc.fontSize(12).fillColor('#A3866A')
     .text(`Rs.${finalAmount.toFixed(0)}`, boxLeft + 95, tY - 1, { width: 65, align: 'right' });

  
  const wordsY = totTop + 10;
  doc.fontSize(8).font('Helvetica').fillColor('#666')
     .text('Amount in words:', 50, wordsY);
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#333')
     .text(numberToWords(finalAmount), 50, wordsY + 14, { width: boxLeft - 70 });

 
  const tyY = Math.max(tY + 50, wordsY + 60);
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#A3866A')
     .text('Thank you for choosing ELARA Luxury Jewelry', 50, tyY, { align: 'center' });
  doc.fontSize(7).font('Helvetica').fillColor('#999')
     .text('This is a computer-generated invoice and does not require a physical signature.', 50, tyY + 18, { align: 'center' });
}
function numberToWords(num) {
  if (!num || num === 0) return 'Zero Rupees Only';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const numToWords = (n) => {
    if (n < 20)      return ones[n];
    if (n < 100)     return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000)    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + numToWords(n % 100) : '');
    if (n < 100000)  return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + numToWords(n % 1000) : '');
    if (n < 10000000)return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + numToWords(n % 100000) : '');
    return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + numToWords(n % 10000000) : '');
  };

  const rupees = Math.floor(num);
  const paise  = Math.round((num - rupees) * 100);

  let result = numToWords(rupees) + ' Rupees';
  if (paise > 0) result += ' and ' + numToWords(paise) + ' Paise';
  result += ' Only';
  return result;
}

export default {
    getOrderlistPage,
    getOrderdetailPage,
    returnOrder,
    cancelOrder,
    downloadInvoice,
    addReviewController,
    cancelAllItems
}