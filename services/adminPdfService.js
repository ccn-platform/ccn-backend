const PDFDocument = require("pdfkit");

class AdminPdfService {
  generateReportPdf(report, res) {
    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=report-${Date.now()}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(18).text("ADMIN REPORT", { underline: true });
    doc.moveDown();

    doc.fontSize(12).text(`Entity: ${report.entityType}`);
    doc.text(`Name: ${report.entityProfile.name}`);
    doc.text(`Phone: ${report.entityProfile.phone}`);
    doc.moveDown();

    doc.text("SUMMARY", { underline: true });
    doc.text(`Total Loans: ${report.summary.totalLoans}`);
    doc.text(`Paid Loans: ${report.summary.paidLoans}`);
    doc.text(`Outstanding: ${report.summary.totalOutstanding}`);
    doc.moveDown();

     doc.moveDown();
     doc.text("STATUS", { underline: true });
     doc.text(`Active: ${report.statusSnapshot?.isActive}`);
     doc.text(`Adjustments: ${report.behaviorMetrics?.adjustmentCount}`);
     doc.text(`Blocked events: ${report.behaviorMetrics?.blockedEvents}`);
     doc.text(`Suspended events: ${report.behaviorMetrics?.suspendedEvents}`);
     doc.moveDown();

    doc.text("TIMELINE", { underline: true });
    doc.moveDown(0.5);

    report.timeline.forEach(item => {
      doc
        .fontSize(10)
        .text(
          `${new Date(item.date).toLocaleString()} | ${item.type} | ${item.amount || ""}`
        );
    });

    doc.end();
  }
}

module.exports = new AdminPdfService();
