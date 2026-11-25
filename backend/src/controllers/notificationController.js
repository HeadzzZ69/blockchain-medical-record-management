const Notification = require("../models/Notification");

async function getUserNotifications(req, res) {
  try {
    const { walletAddress } = req.params;
    if (!walletAddress) {
      return res.status(400).json({ message: "Wallet address is required" });
    }
    const cleanWallet = walletAddress.toLowerCase();
    const notifications = await Notification.find({ recipientWallet: cleanWallet })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function createNotification(req, res) {
  try {
    const { recipientWallet, senderWallet, title, message, type, metadata } = req.body;
    if (!recipientWallet || !title || !message) {
      return res.status(400).json({ message: "recipientWallet, title, and message are required" });
    }

    const notif = new Notification({
      recipientWallet: recipientWallet.toLowerCase(),
      senderWallet: senderWallet ? senderWallet.toLowerCase() : null,
      title,
      message,
      type: type || "system",
      metadata: metadata || {},
    });

    await notif.save();
    return res.status(201).json({ success: true, notification: notif });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const notif = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
    return res.json({ success: true, notification: notif });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function markAllAsRead(req, res) {
  try {
    const { walletAddress } = req.params;
    await Notification.updateMany({ recipientWallet: walletAddress.toLowerCase(), isRead: false }, { isRead: true });
    return res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getUserNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
};
