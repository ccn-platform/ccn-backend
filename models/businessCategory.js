 // models/BusinessCategory.js
const mongoose = require("mongoose");

const BusinessCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    // ⭐ OPTIONAL BUT USEFUL: ensure category can be activated/deactivated
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    // ⭐ OPTIONAL: auto slug for clean URLs
    slug: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

/** =============================
 * Auto-generate slug from name
 * =============================*/
BusinessCategorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, "-");
  }
  next();
});

/** =============================
 * Index for faster search
 * =============================*/
BusinessCategorySchema.index({ name: "text" });

module.exports = mongoose.model("BusinessCategory", BusinessCategorySchema);
