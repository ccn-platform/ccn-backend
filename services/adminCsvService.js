const { Parser } = require("json2csv");

class AdminCsvService {
  export(report, res) {
    const parser = new Parser({
      fields: ["date", "type", "amount", "reference"],
    });

    const csv = parser.parse(report.timeline);

    res.header("Content-Type", "text/csv");
    res.attachment(`report-${Date.now()}.csv`);
    res.send(csv);
  }
}

module.exports = new AdminCsvService();
