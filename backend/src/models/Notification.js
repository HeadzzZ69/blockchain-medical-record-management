const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    notificationId: {
      type: String,
      unique: true,
      sparse: true,
      default: () => "NOTIF-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
    },
    recipientWallet: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    senderWallet: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["access_request", "access_granted", "access_revoked", "record_uploaded", "verification", "system"],
      default: "system",
    },
    notificationType: {
      type: String,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.pre("save", function (next) {
  if (this.recipientWallet) this.recipientWallet = this.recipientWallet.toLowerCase();
  if (this.senderWallet) this.senderWallet = this.senderWallet.toLowerCase();
  if (!this.notificationType && this.type) this.notificationType = this.type;
  if (!this.type && this.notificationType) this.type = this.notificationType;
  next();
});

module.exports = mongoose.model("Notification", notificationSchema);
