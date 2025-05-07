import { useState, useEffect } from "react";
import axios from "axios";
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
  const [error, setError] = useState("");
  const apiUrl = import.meta.env.VITE_APIURL;

  useEffect(() => {
    if (isOpen) {
      fetchFriends();
    }
  }, [isOpen]);

  async function fetchFriends() {
    const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
    try {
      const response = await axios.get(`${apiUrl}/user`, {
        headers: { Authorization: `Bearer ${userFromStorage.token}` }
      });
      setFriends(response.data.friendsList || []);
    } catch (err: any) {
      if (err.response?.status === 401) {
        try {
          const refreshResponse = await axios.post(`${apiUrl}/refresh`, {
            refreshToken: userFromStorage.refreshToken
          });
          
          const response = await axios.get(`${apiUrl}/user`, {
            headers: { Authorization: `Bearer ${refreshResponse.data.token}` }
          });
          
          const updatedUser = {
            ...userFromStorage,
            token: refreshResponse.data.token
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setFriends(response.data.friendsList || []);
        } catch (refreshErr) {
          setError("Session expired. Please login again.");
        }
      } else {
        setError("Failed to fetch friends list");
      }
    }
  }

  async function unfollowFriend(friendId: string) {
    const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
    try {
 
      await axios.delete(`${apiUrl}/friends/${friendId}`, {
        headers: { Authorization: `Bearer ${userFromStorage.token}` }
      });
      setFriends(friends.filter(friend => friend.userId !== friendId));
    } catch (err: any) {
      if (err.response?.status === 401) {
        try {
          const refreshResponse = await axios.post(`${apiUrl}/refresh`, {
            refreshToken: userFromStorage.refreshToken
          });          

          await axios.delete(`${apiUrl}/friends/${friendId}`, {
            headers: { Authorization: `Bearer ${refreshResponse.data.token}` }
          });
          
          const updatedUser = {
            ...userFromStorage,
            token: refreshResponse.data.token
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setFriends(friends.filter(friend => friend.userId !== friendId));
        } catch (refreshErr) {
          setError("Session expired. Please login again.");
        }
      } else {
        setError(err.response?.data?.message || "Failed to unfollow friend");
      }
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
