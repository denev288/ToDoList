const FriendRequestModel = require("../models/FriendRequestModel");
const NotificationModel = require("../models/NotificationModel");
const UserModel = require("../models/UserModel");

const sendFriendRequest = async (req, res) => {
  const targetUserId = req.body._id;  
  const currentUserId = req.user._id;

  try {
    // Validate target user exists
    const targetUser = await UserModel.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found" });
    }

    // Check if trying to send request to self
    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ message: "Cannot send friend request to yourself" });
    }

    const existingRequest = await FriendRequestModel.findOne({
      from: currentUserId,
      to: targetUserId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    // Get sender info
    const sender = await UserModel.findById(currentUserId).select('name email');
    
    const friendRequest = await FriendRequestModel.create({
      from: currentUserId,
      to: targetUserId
    });

    await NotificationModel.create({
      userId: targetUserId,
      type: 'friend_request',
      message: '',  // Leave empty since we'll use sender info
      senderEmail: sender.email,  // Add sender email
      relatedId: friendRequest._id
    });

    res.status(200).json({ message: "Friend request sent successfully" });
  } catch (error) {
    console.error("Friend request error:", error);  // Add error logging
    res.status(500).json({ message: "Error sending friend request", error: error.message });
  }
};

const getPendingRequests = async (req, res) => {
  try {
    const requests = await FriendRequestModel.find({ 
      to: req.user._id,
      status: 'pending'
    }).populate('from', 'name email');
    
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching friend requests" });
  }
};

const handleFriendRequest = async (req, res) => {
  const { requestId, action } = req.body;

  try {
    console.log('Handling friend request:', { requestId, action });

    if (!requestId || !action) {
      return res.status(400).json({ message: "Request ID and action are required" });
    }

    // Map frontend actions to model enum values
    const statusMap = {
      'accept': 'accepted',
      'reject': 'rejected'
    };

    const status = statusMap[action];
    if (!status) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const request = await FriendRequestModel.findById(requestId);
    console.log('Found request:', request);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (action === 'accept') {
      await Promise.all([
        UserModel.findByIdAndUpdate(request.to, {
          $push: { followers: request.from }
        }),
        UserModel.findByIdAndUpdate(request.from, {
          $push: { following: request.to }
        })
      ]);
    }

    request.status = status; // Use mapped status value
    await request.save();

    res.status(200).json({ message: `Friend request ${action}ed` });
  } catch (error) {
    console.error("Friend request error:", error);
    res.status(500).json({ 
      message: "Error handling friend request", 
      error: error.message,
      details: error.errors // Include validation errors in response
    });
  }
};

module.exports = {
  sendFriendRequest,
  getPendingRequests,
  handleFriendRequest
};
