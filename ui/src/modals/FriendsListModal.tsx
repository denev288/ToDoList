import { useState, useEffect } from "react";
import api from '../utils/axiosConfig';
import "../css/FriendsListModalStyle.css";


interface Friend {
  userId: string;
  email: string;
}

interface FriendsListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function FriendsListModal({ isOpen, onClose }: FriendsListModalProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [error] = useState("");
  

  useEffect(() => {
    if (isOpen) {
      fetchFriends();
    }
  }, [isOpen]);

  async function fetchFriends() {
    try {
      const response = await api.get('/user');
      if (response.data.friendsList) {
        setFriends(response.data.friendsList);
      }
    } catch (err) {
      console.error("Error fetching friends:", err);
    }
  }

  async function unfollowFriend(friendId: string) {
    try {
      await api.delete(`/friends/${friendId}`);
      await fetchFriends(); // Refresh friends list
      postMessage("Friend removed successfully");
    } catch (err: any) {
      postMessage(err.response?.data?.message || "Error unfollowing friend");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Friends List</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="friends-list">
          {friends.length > 0 ? (
            friends.map((friend) => (
              <div key={friend.userId} className="friend-item">
                <span className="friend-email">{friend.email}</span>
                <button className="unfollow" onClick={() => unfollowFriend(friend.userId)}>Unfollow</button>
              </div>
              
            ))            
          ) : (
            <p className="no-friends">No friends added yet</p>
          )}
        </div>
        <button onClick={onClose} className="close-button">Close</button>
      </div>
    </div>
  );
}

export default FriendsListModal;
