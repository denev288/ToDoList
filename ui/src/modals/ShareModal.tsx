import { useState, useEffect } from "react";
import "../css/ShareModalStyle.css";
import axios from "axios";
import { VITE_APIURL } from "../config";

interface Friend {
  userId: string;
  email: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string, message: string) => void;
  error?: string;
  currentUserEmail?: string;
}

function ShareModal({ isOpen, onClose, onSubmit, error, currentUserEmail }: ShareModalProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const apiUrl = VITE_APIURL;

  useEffect(() => {
    if (isOpen) {
      fetchUserDetails();
    }
  }, [isOpen, apiUrl]);

  function refreshAccessToken() {
    const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
    const refreshToken = userFromStorage.refreshToken;

    if (!refreshToken) {
      console.error("Refresh token is missing");
      return Promise.reject("Refresh token is missing");
    }

    return axios
      .post(`${apiUrl}/refresh`, { refreshToken })
      .then((res) => {
        const newAccessToken = res.data.token;
        userFromStorage.token = newAccessToken;
        localStorage.setItem('user', JSON.stringify(userFromStorage));
        return newAccessToken;
      })
      .catch((err) => {
        console.error("Failed to refresh token", err);
        throw err;
      });
  }

  async function fetchUserDetails() {
    const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
    const accessToken = userFromStorage.token;

    try {
      const response = await axios.get(`${apiUrl}/user`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (response.data.friendsList) {
        setFriends(response.data.friendsList);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        try {
          const newToken = await refreshAccessToken();
          const response = await axios.get(`${apiUrl}/user`, {
            headers: { Authorization: `Bearer ${newToken}` }
          });
          
          if (response.data.friendsList) {
            setFriends(response.data.friendsList);
          }
        } catch (refreshErr) {
          console.error('Error fetching user details after token refresh:', refreshErr);
        }
      } else {
        console.error('Error fetching user details:', err);
      }
    }
  }

  function handleSubmit() {
    if (!email.trim()) {
      alert("Please select a friend to share with");
      return;
    }
    
    if (email.trim().toLowerCase() === currentUserEmail?.toLowerCase()) {
      alert("Cannot share task with yourself");
      return;
    }
    
    onSubmit(email, message);
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Share Task</h2>
        {error && <div className="error-message">{error}</div>}
        
        <select 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="friend-select"
        >
          <option value="" disabled>Select a friend</option>
          {friends.map((friend) => (
            <option key={friend.userId} value={friend.email}>
              {friend.email}
            </option>
          ))}
        </select>

        <textarea
          placeholder="Message (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="modal-actions">
          <button onClick={handleSubmit}>Share</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default ShareModal;
