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

    // Check if already friends
    const currentUser = await UserModel.findById(currentUserId);
    const isAlreadyFriend = currentUser.friendsList.some(friend => 
      friend.userId.toString() === targetUserId
    );

    if (isAlreadyFriend) {
      return res.status(400).json({ message: "Users are already friends" });
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
      message: '',  
      senderEmail: sender.email, 
      relatedId: friendRequest._id
    });

    res.status(200).json({ message: "Friend request sent successfully" });
  } catch (error) {
    console.error("Friend request error:", error); 
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
    if (!requestId || !action) {
      return res.status(400).json({ message: "Request ID and action are required" });
    }

    const statusMap = {
      'accept': 'accepted',
      'reject': 'rejected'
    };

    const status = statusMap[action];
    if (!status) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const request = await FriendRequestModel.findById(requestId).populate('from to', 'email');
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (action === 'accept') {
      const [fromUser, toUser] = await Promise.all([
        UserModel.findById(request.from),
        UserModel.findById(request.to)
      ]);

      await Promise.all([
        // Add each user to other's friendsList
        UserModel.findByIdAndUpdate(request.to, {
          $push: { 
            friendsList: {
              userId: request.from,
              email: fromUser.email
            }
          }
        }),
        UserModel.findByIdAndUpdate(request.from, {
          $push: { 
            friendsList: {
              userId: request.to,
              email: toUser.email
            }
          }
        }),
        NotificationModel.create({
          userId: request.from,
          type: 'friend_request',
          message: `${request.to.email} accepted your friend request`,
          senderEmail: request.to.email,
        })
      ]);
    } else {
      await NotificationModel.create({
        userId: request.from,
        type: 'friend_request',
        message: `${request.to.email} rejected your friend request`,
        senderEmail: request.to.email,
      });
    }

    request.status = status;
    await request.save();

    res.status(200).json({ message: `Friend request ${action}ed` });
  } catch (error) {
    console.error("Friend request error:", error);
    res.status(500).json({ message: "Error handling friend request", error: error.message });
  }
};

const unfollowFriend = async (req, res) => {
  const friendId = req.params.friendId;
  const userId = req.user._id;

  try {
    // Remove friend from current user's friendsList
    await UserModel.findByIdAndUpdate(userId, {
      $pull: { friendsList: { userId: friendId } }
    });

    // Remove current user from friend's friendsList
    await UserModel.findByIdAndUpdate(friendId, {
      $pull: { friendsList: { userId: userId } }
    });

    console.log(friendId, userId);

    // Delete any friend requests between the users
    await FriendRequestModel.deleteMany({
      $or: [
        { from: userId, to: friendId },
        { from: friendId, to: userId }
      ]
    });

    res.status(200).json({ message: "Friend removed successfully" });
  } catch (error) {
    console.error("Error unfollowing friend:", error);
    res.status(500).json({ message: "Error removing friend" });
  }
};

module.exports = {
  sendFriendRequest,
  getPendingRequests,
  handleFriendRequest,
  unfollowFriend
};
