const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'user', 
    required: true,
    index: true  // Add index for better query performance
  },
  type: { 
    type: String, 
    enum: ['task', 'friend_request', 'email_update'], 
    required: true 
  },
  message: { 
    type: String,
    required: true  // Make message required
  },
  read: { 
    type: Boolean, 
    default: false,
    index: true  // Add index for better query performance
  },
  relatedId: mongoose.Schema.Types.ObjectId,
  senderEmail: { type: String },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true  // Add index for better query performance
  }
}, {
  timestamps: true  // Add automatic timestamp handling
});

// Add compound index for common queries
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

const NotificationModel = mongoose.model("notification", NotificationSchema);
module.exports = NotificationModel;
