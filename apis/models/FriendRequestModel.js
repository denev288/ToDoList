const mongoose = require("mongoose");

const FriendRequestSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected'], 
    default: 'pending' 
  },
  createdAt: { type: Date, default: Date.now }
});

const FriendRequestModel = mongoose.model("friendRequest", FriendRequestSchema);
module.exports = FriendRequestModel;
