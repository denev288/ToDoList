const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  type: { type: String, enum: ['task', 'friend_request'], required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  relatedId: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now }
});

const NotificationModel = mongoose.model("notification", NotificationSchema);
module.exports = NotificationModel;
