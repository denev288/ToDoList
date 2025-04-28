const UserModel = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const NotificationModel = require("../models/NotificationModel");
const FriendRequestModel = require("../models/FriendRequestModel");

const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn: "15m" }); // access token
};
const createRefreshToken = (_id) => {
  return jwt.sign({ _id }, process.env.RREFRESH_TOKEN_SECRET, {
    expiresIn: "3d",
  }); // refresh token
};

const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token not found" });
    }

    await jwt.verify(
      refreshToken,
      process.env.RREFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err) {
          return res
            .status(403)
            .json({ message: "Invalid or expired refresh token" });
        }

        const user = await UserModel.findById(decoded._id);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        const newAccessToken = createToken(user._id);

        res.status(200).json({ token: newAccessToken });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "refreshToken Method" });
  }
};

// Finds the user in the database and checks if the password is correct
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await UserModel.login(email, password);
    const token = createToken(user._id);
    const refreshToken = createRefreshToken(user._id);

    res.status(200).json({ email, token, refreshToken });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const createRegistration = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const user = await UserModel.signup(name, email, password);
    const token = createToken(user._id);
    res.status(200).json({ email, token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Fetch notifications for the logged-in user
async function getNotifications(req, res) {
  try {
    const notifications = await NotificationModel.find({ 
      userId: req.user._id 
    }).sort({ createdAt: -1 });
    
    res.status(200).json(notifications);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Mark notifications as read
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

// Search for users
const searchUsers = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ message: "Email parameter required" });
    }

    const users = await UserModel.find({ email: email }).select('name email');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error searching for users" });
  }
};

// Send follow request
const sendFollowRequest = async (req, res) => {
  const targetUserId = req.body._id;
  const currentUserId = req.user._id;

  try {
    // Check if request already exists
    const existingRequest = await FriendRequestModel.findOne({
      from: currentUserId,
      to: targetUserId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Follow request already sent" });
    }

    // Create friend request
    const friendRequest = await FriendRequestModel.create({
      from: currentUserId,
      to: targetUserId
    });

    // Create notification for target user
    await NotificationModel.create({
      userId: targetUserId,
      type: 'friend_request',
      message: `You have a new friend request`,
      relatedId: friendRequest._id
    });

    res.status(200).json({ message: "Follow request sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error sending follow request" });
  }
};

// Handle follow request (accept/reject)
const handleFollowRequest = async (req, res) => {
  const { requestId, action } = req.body;
  const currentUserId = req.user._id;

  try {
    const currentUser = await UserModel.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const request = currentUser.friendRequests.id(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (action === 'accept') {
      // Add to followers/following lists
      const [targetUser] = await Promise.all([
        UserModel.findById(request.from),
        UserModel.findByIdAndUpdate(currentUserId, {
          $push: { followers: request.from }
        }),
        UserModel.findByIdAndUpdate(request.from, {
          $push: { following: currentUserId }
        })
      ]);

      if (!targetUser) {
        return res.status(404).json({ message: "Requesting user no longer exists" });
      }

      request.status = 'accepted';
    } else if (action === 'reject') {
      request.status = 'rejected';
    }

    await currentUser.save();
    res.status(200).json({ message: `Follow request ${action}ed` });

  } catch (error) {
    res.status(500).json({ message: "Error handling follow request" });
  }
};

// Get follow requests
const getFollowRequests = async (req, res) => {
  try {
    const requests = await FriendRequestModel.find({ 
      to: req.user._id,
      status: 'pending'
    }).populate('from', 'name email');
    
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching follow requests" });
  }
};

module.exports = {
  loginUser,
  createRegistration,
  refreshToken,
  getNotifications,
  markNotificationsAsRead,
  searchUsers,
  sendFollowRequest,
  handleFollowRequest,
  getFollowRequests
};
