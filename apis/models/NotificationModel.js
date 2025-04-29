const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  type: { type: String, enum: ['task', 'friend_request'], required: true },
  message: { type: String },  // Removed required
  read: { type: Boolean, default: false },
  relatedId: mongoose.Schema.Types.ObjectId,
  senderEmail: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const NotificationModel = mongoose.model("notification", NotificationSchema);
module.exports = NotificationModel;
