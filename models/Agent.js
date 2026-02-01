 const mongoose = require("mongoose");
const normalizePhone = require("../utils/normalizePhone");

const AgentSchema = new mongoose.Schema(
  {
    // ⭐ LINK NA USER (SAFE — haivunji data za zamani)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      sparse: true,
    },

    // ⭐ AGENT ID RASMI (SAFE)
    agentId: {
      type: String,
      unique: true,
      index: true,
      sparse: true,
    },

    fullName: String,

    // ORIGINAL PHONE (HAIJAGUSWA)
    phone: {
      type: String,
      index: true,
    },

    // ⭐ NORMALIZED PHONE (2557XXXXXXXX)
    normalizedPhone: {
      type: String,
      index: true,
      sparse: true,
    },

    pin: String,

    businessName: String,

    businessCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessCategory",
    },

    tinNumber: String,
    location: String,

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    // ✅ ADDED — used by services (HAIVUNJI DATA)
    isFrozen: {
      type: Boolean,
      default: false,
    },

    freezeReason: {
      type: String,
      default: null,
    },

    /**
     * ======================================================
     * ⭐🆕 PAYOUT ACCOUNTS (ADD ONLY — SAFE)
     * ======================================================
     */
    payoutAccounts: [
      {
        type: {
          type: String,
          enum: ["MOBILE_MONEY", "BANK"],
        },

        provider: String,
        accountNumber: String,
        accountName: String,

        isPrimary: {
          type: Boolean,
          default: false,
        },

        status: {
          type: String,
          enum: ["active", "inactive"],
          default: "active",
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

       /**
        * 🔹 Primary payout shortcut (cached)
        * Hii ni reference tu ya akaunti iliyo primary
        */
       primaryPayoutAccount: {
         type: mongoose.Schema.Types.Mixed,
         default: null,
       },
     

    /**
     * ======================================================
     * 🆕 SUBSCRIPTION SNAPSHOT (READ ONLY CACHE)
     * ======================================================
     */
    subscriptionSnapshot: {
      status: {
        type: String,
        enum: ["active", "expired", null],
        default: null,
      },
      expiresOn: {
        type: Date,
        default: null,
      },
      plan: {
        type: String,
        default: null,
      },
    },

    /**
     * ======================================================
     * 🆕 SECURITY & ACTIVITY
     * ======================================================
     */
    lastLoginAt: {
      type: Date,
      default: null,
    },

    lastActivityAt: {
      type: Date,
      default: null,
    },

    /**
     * ======================================================
     * 🆕 OPERATIONAL LIMITS (SAFE)
     * ======================================================
     */
    limits: {
      maxLoanAmount: {
        type: Number,
        default: null,
      },

      dailyLoanLimit: {
        type: Number,
        default: null,
      },

      canDisburse: {
        type: Boolean,
        default: true,
      },

      canCollect: {
        type: Boolean,
        default: true,
      },
    },

    /**
     * ======================================================
     * 🆕 FLAGS (FUTURE PROOF)
     * ======================================================
     */
    flags: {
      isTestAgent: {
        type: Boolean,
        default: false,
      },
      isSystemAgent: {
        type: Boolean,
        default: false,
      },
    },

    /**
     * ======================================================
     * 🆕🟢 ONBOARDING STEP (ADD ONLY — SAFE)
     * ======================================================
     */
    onboardingStep: {
      type: String,
      enum: ["PAYOUT_REQUIRED", "COMPLETE"],
      default: "PAYOUT_REQUIRED",
      index: true,
    },
  },
  { timestamps: true }
);

/**
 * ======================================================
 * SAFE PRE-SAVE HOOKS
 * ======================================================
 */

AgentSchema.pre("save", function (next) {
  if (
    this.phone &&
    typeof this.phone === "string" &&
    this.phone.trim().length >= 9 &&
    !this.normalizedPhone
  ) {
    try {
      this.normalizedPhone = normalizePhone(this.phone);
    } catch (e) {
      this.normalizedPhone = null;
    }
  }

  // ⭐ ensure only ONE primary payout account (SAFE)
  if (Array.isArray(this.payoutAccounts)) {
    const primaries = this.payoutAccounts.filter(a => a.isPrimary);
    if (primaries.length > 1) {
      this.payoutAccounts.forEach((a, i) => {
        a.isPrimary = i === this.payoutAccounts.length - 1;
      });
    }

    const primary = this.payoutAccounts.find(a => a.isPrimary);
    if (primary) {
      this.primaryPayoutAccount = primary;
    }
  }

  next();
});

/**
 * ======================================================
 * SAFE INDEXES
 * ======================================================
 */

AgentSchema.index(
  { normalizedPhone: 1 },
  { unique: true, sparse: true }
);

AgentSchema.index(
  { agentId: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model("Agent", AgentSchema);
