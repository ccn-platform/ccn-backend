const fs = require("fs");
const path = require("path");

class LoggerService {
  constructor() {
    this.logDir = path.join(__dirname, "../logs");

    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir);
    }
  }

  write(level, message, meta = {}) {
    const log = {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta,
    };

    const file = path.join(this.logDir, `${level}.log`);
    fs.appendFileSync(file, JSON.stringify(log) + "\n");

    // Dev visibility
    if (level === "error") {
      console.error(log);
    }
  }

  info(message, meta) {
    this.write("info", message, meta);
  }

  warn(message, meta) {
    this.write("warn", message, meta);
  }

  error(message, meta) {
    this.write("error", message, meta);
  }
}

module.exports = new LoggerService();
