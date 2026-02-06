 const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    // 🧑 MTEJA ALIETUMA TICKET
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    // 📝 CONTENT
    subject: {
      type: String,
      trim: true,
    },

    message: {
      type: String,
      trim: true,
      required: true,
    },

    // 📱 CONTACT ALIYOACHA (OPTIONAL)
    contact: {
      type: String,
      trim: true,
    },

    /**
     * ==================================================
     * 📊 STATUS YA TICKET
     * ==================================================
     * open → mpya
     * in_progress → support anaishughulikia
     * resolved → imetatuliwa
     */
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved"],
      default: "open",
      index: true,
    },

    /**
     * 👨‍💻 SUPPORT AGENT ALIYEPEWA
     */
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    /**
     * 🧾 NOTES ZA NDANI (ADMIN ONLY)
     */
    internalNote: {
      type: String,
      trim: true,
    },

    /**
     * ⏱ RESOLUTION TIME
     */
    resolvedAt: Date,
  },
  {
    timestamps: true,
  }
);

/**
 * 🚀 INDEXES
 */
ticketSchema.index({ status: 1, createdAt: -1 });
ticketSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model("SupportTicket", ticketSchema);
