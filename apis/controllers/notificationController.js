const NotificationModel = require("../models/NotificationModel");
const FriendRequestModel = require("../models/FriendRequestModel");

const getNotifications = async (req, res) => {
  try {
    const notifications = await NotificationModel.find({ 
      userId: req.user._id 
    }).sort({ createdAt: -1 });
    
    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ error: "Error fetching notifications" });
  }
};

const markNotificationsAsRead = async (req, res) => {
  try {
    await NotificationModel.updateMany(
      { userId: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) {
    res.status(500).json({ error: "Error marking notifications as read" });
  }
};

module.exports = {
  getNotifications,
  markNotificationsAsRead
};
