import { getSalesReportData } from "../../services/admin/salesReportService.js";
import Order from "../../model/orderSchema.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;  

   
    let filter = {
  orderStatus: { $in: ["delivered", "returned"] }
};
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }
    if (status && status !== 'all') {
      filter.orderStatus = status;  
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    const data = await getSalesReportData({ startDate, endDate });

    res.render("admin/salesReport", {
      chartData: data.chartData,
      totals: data.totals,
      orders,           
      startDate,
      endDate,
      currentMenu: "salesReport"
    });

  } catch (error) {
    console.log(error);
    res.status(500).send("server error");
  }
};

const downloadSalesReportPDF = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let filter = {};
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=sales-report.pdf");
    doc.pipe(res);

   
    doc.rect(0, 0, doc.page.width, 70).fill('#3D2B24');
    doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
       .text('ELARA — Sales Report', 40, 24, { align: 'center' });

    if (startDate && endDate) {
      doc.fontSize(9).fillColor('#e0c9b0')
         .text(`Period: ${new Date(startDate).toLocaleDateString()} — ${new Date(endDate).toLocaleDateString()}`, 
               40, 50, { align: 'center' });
    }

    doc.moveDown(3);


    const totalRevenue = orders.reduce((sum, o) => sum + (o.finalAmount || o.totalAmount || 0), 0);
    const delivered = orders.filter(o => o.orderStatus === 'delivered').length;
    const cancelled = orders.filter(o => o.orderStatus === 'cancelled').length;

    doc.fillColor('#3D2B24').fontSize(11).font('Helvetica-Bold').text('Summary', 40, doc.y);
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').fillColor('#333')
       .text(`Total Orders: ${orders.length}   |   Total Revenue: Rs. ${totalRevenue.toLocaleString('en-IN')}   |   Delivered: ${delivered}   |   Cancelled: ${cancelled}`);
    
    doc.moveDown(1);

   
    const tableTop = doc.y;
    const colX = [40, 160, 250, 340, 430]; 
    const colWidths = [120, 90, 90, 90, 90];
    const headers = ['Order ID', 'Date', 'Amount', 'Status', 'Payment'];

    
    doc.rect(40, tableTop, 511, 22).fill('#3D2B24');
    headers.forEach((h, i) => {
      doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
         .text(h, colX[i] + 4, tableTop + 6, { width: colWidths[i], align: 'left' });
    });

    let rowY = tableTop + 22;

    orders.forEach((order, idx) => {
      const rowHeight = 20;

      
      if (idx % 2 === 0) {
        doc.rect(40, rowY, 511, rowHeight).fill('#FAF9F7');
      } else {
        doc.rect(40, rowY, 511, rowHeight).fill('#FFFFFF');
      }

      const rowData = [
        order.orderId || '—',
        new Date(order.createdAt).toLocaleDateString('en-IN'),
        `Rs. ${(order.finalAmount || order.totalAmount || 0).toLocaleString('en-IN')}`,
        order.orderStatus || '—',
        order.paymentStatus || '—'
      ];

      rowData.forEach((val, i) => {
        doc.fillColor('#333').fontSize(8).font('Helvetica')
           .text(val, colX[i] + 4, rowY + 6, { width: colWidths[i], align: 'left' });
      });

      rowY += rowHeight;

      if (rowY > doc.page.height - 60) {
        doc.addPage();
        rowY = 40;
      }
    });

   
    doc.rect(40, tableTop, 511, rowY - tableTop).stroke('#E0D6D0');

    
    doc.fontSize(8).fillColor('#aaa')
       .text(`Generated on ${new Date().toLocaleString('en-IN')}`, 40, doc.page.height - 40, { align: 'center' });

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
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Sales Report");

   
    ws.mergeCells('A1:F1');
    ws.getCell('A1').value = 'ELARA — Sales Report';
    ws.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3D2B24' } };
    ws.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 36;

   
    if (startDate && endDate) {
      ws.mergeCells('A2:F2');
      ws.getCell('A2').value = `Period: ${new Date(startDate).toLocaleDateString('en-IN')} — ${new Date(endDate).toLocaleDateString('en-IN')}`;
      ws.getCell('A2').font = { italic: true, size: 10, color: { argb: 'FF7A5C4D' } };
      ws.getCell('A2').alignment = { horizontal: 'center' };
      ws.getRow(2).height = 20;
    }

    
    const totalRevenue = orders.reduce((sum, o) => sum + (o.finalAmount || o.totalAmount || 0), 0);
    const delivered = orders.filter(o => o.orderStatus === 'delivered').length;
    const cancelled = orders.filter(o => o.orderStatus === 'cancelled').length;

    ws.mergeCells('A3:F3');
    ws.getCell('A3').value = `Total Orders: ${orders.length}  |  Revenue: Rs. ${totalRevenue.toLocaleString('en-IN')}  |  Delivered: ${delivered}  |  Cancelled: ${cancelled}`;
    ws.getCell('A3').font = { bold: true, size: 10 };
    ws.getCell('A3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4F1EE' } };
    ws.getCell('A3').alignment = { horizontal: 'center' };
    ws.getRow(3).height = 22;

    ws.addRow([]); 

   
    ws.columns = [
      { key: 'orderId',        width: 22 },
      { key: 'date',           width: 18 },
      { key: 'amount',         width: 18 },
      { key: 'finalAmount',    width: 18 },
      { key: 'status',         width: 18 },
      { key: 'payment',        width: 18 },
    ];

    const headerRow = ws.addRow(['Order ID', 'Date', 'Total Amount', 'Final Amount', 'Order Status', 'Payment Status']);
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3D2B24' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFA68B67' } }
      };
    });
    headerRow.height = 24;

  
    orders.forEach((order, idx) => {
      const row = ws.addRow({
        orderId:     order.orderId || '—',
        date:        new Date(order.createdAt).toLocaleDateString('en-IN'),
        amount:      order.totalAmount || 0,
        finalAmount: order.finalAmount || order.totalAmount || 0,
        status:      order.orderStatus || '—',
        payment:     order.paymentStatus || '—',
      });

      
      const bg = idx % 2 === 0 ? 'FFFAF9F7' : 'FFFFFFFF';
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { size: 10 };
      });

      
      const statusCell = row.getCell(5);
      if (order.orderStatus === 'delivered') statusCell.font = { color: { argb: 'FF2e7d32' }, size: 10 };
      if (order.orderStatus === 'cancelled') statusCell.font = { color: { argb: 'FFc62828' }, size: 10 };

      row.height = 20;
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=sales-report.xlsx");

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