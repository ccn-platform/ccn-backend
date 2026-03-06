  const pino = require("pino");

const logger = pino({
  level: process.env.LOG_LEVEL || "info",

  base: {
    service: "CCN-BACKEND"
  },

  timestamp: pino.stdTimeFunctions.isoTime,

  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname"
    }
  }
});

module.exports = {
  info: (message, data = {}) => {
    logger.info(data, message);
  },

  error: (message, data = {}) => {
    logger.error(data, message);
  },

  warn: (message, data = {}) => {
    logger.warn(data, message);
  },

  debug: (message, data = {}) => {
    logger.debug(data, message);
  }
};
