 // config/serverConfig.js

module.exports = {
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || "development",

  isDev() {
    return this.NODE_ENV === "development";
  },

  isProd() {
    return this.NODE_ENV === "production";
  },

  logServerInfo() {
    console.log("=========================================");
    console.log(`🌍 Environment: ${this.NODE_ENV}`);
    console.log(`⚙️  Server Port: ${this.PORT}`);
    console.log("=========================================");
  },
};
