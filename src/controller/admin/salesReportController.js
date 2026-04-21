import { getSalesReportData } from "../../services/admin/salesReportService.js";
import orderSchema from "../../model/orderSchema.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

const getSalesReport = async(req,res)=>{
    try {
        const {startDate,endDate} = req.query;

        const data = await getSalesReportData({startDate,endDate});

        res.render("admin/salesReport",{
            chartData:data.chartData,
            totals: data.totals,
            startDate,
            endDate,
            currentPage:"salesReport"
        })
    } catch (error) {
        console.log(error);
        res.status(500).send("server error")
    }

}

 const downloadSalesReportPDF = async (req, res) => {
  try {
const { startDate, endDate } = req.query;

let filter = {};

if (startDate && endDate) {
  filter.createdAt = {
    $gte: new Date(startDate),
    $lte: new Date(endDate)
  };
}

const orders = await Order.find(filter).sort({ createdAt: -1 });
    const doc = new PDFDocument({ margin: 30 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=sales-report.pdf");

    doc.pipe(res);

    // Title
    doc.fontSize(18).text("Sales Report", { align: "center" });
    doc.moveDown();

    // Table Header
    doc.fontSize(12).text("Order ID | Date | Amount | Status");
    doc.moveDown(0.5);

    // Data
    orders.forEach(order => {
      doc.text(
        `${order.orderId} | ${new Date(order.createdAt).toLocaleDateString()} | ₹${order.totalAmount} | ${order.orderStatus}`
      );
    });

    doc.end();

  } catch (error) {
    console.log("PDF Error:", error);
    res.status(500).send("Error generating PDF");
  }
};


const downloadSalesReportExcel = async (req, res) => {
  try {
const { startDate, endDate } = req.query;

let filter = {};

if (startDate && endDate) {
  filter.createdAt = {
    $gte: new Date(startDate),
    $lte: new Date(endDate)
  };
}

const orders = await Order.find(filter).sort({ createdAt: -1 });
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

   
    worksheet.columns = [
      { header: "Order ID", key: "orderId", width: 20 },
      { header: "Date", key: "date", width: 20 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Status", key: "status", width: 15 }
    ];

  
    orders.forEach(order => {
      worksheet.addRow({
        orderId: order.orderId,
        date: new Date(order.createdAt).toLocaleDateString(),
        amount: order.totalAmount,
        status: order.orderStatus
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales-report.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.log("Excel Error:", error);
    res.status(500).send("Error generating Excel");
  }
};



export default{
    getSalesReport,
    downloadSalesReportPDF,
    downloadSalesReportExcel
}