const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },

    answer: {
      type: String,
      required: true,
      trim: true,
    },

    /**
     * 👁 INAONEKANA KWENYE APP AU HAPANA
     */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    /**
     * 🔢 ORDER YA KUONYESHA
     */
    order: {
      type: Number,
      default: 0,
      index: true,
    },

    /**
     * 👨‍💻 NANI ALIYEWEKA
     */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

/**
 * 🚀 INDEX
 */
faqSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model("FAQ", faqSchema);
