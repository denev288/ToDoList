import { useState } from "react";
import axios from "axios";
import "../css/FriendRequestModalStyle.css";
import { VITE_APIURL } from "../config";

interface FriendRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function FriendRequestModal({ isOpen, onClose }: FriendRequestModalProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const apiUrl = VITE_APIURL;

  if (!isOpen) return null;

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

  const handleSearch = async () => {
    const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
    const accessToken = userFromStorage.token;

    try {
      const response = await axios.post(
        `${apiUrl}/search`,
        { email },
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      setSearchResults(response.data);
      setError("");
    } catch (err: any) {
      if (err.response?.status === 401) {
        refreshAccessToken()
          .then((newToken) => {
            return axios.post(
              `${apiUrl}/search`,
              { email },
              {
                headers: { Authorization: `Bearer ${newToken}` }
              }
            );
          })
          .then((response) => {
            setSearchResults(response.data);
            setError("");
          })
          .catch((refreshErr) => {
            if (refreshErr.response?.status === 404) {
              setError("User not found");
              setSearchResults([]);
            } else {
              console.error('Error after token refresh:', refreshErr);
              setError("Session expired. Please login again.");
            }
          });
      } else if (err.response?.status === 404) {
        setError("User not found");
        setSearchResults([]);
      } else {
        console.error('Search error:', err);
        setError(err.response?.data?.message || "Error searching for user");
        setSearchResults([]);
      }
    }
  };

  const handleSendRequest = async (targetUserId: string) => {
    const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
    const accessToken = userFromStorage.token;

    try {
      await axios.post(
        `${apiUrl}/friends/request`,
        { _id: targetUserId },
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      alert("Friend request sent successfully!");
    } catch (err: any) {
      if (err.response?.status === 401) {
        refreshAccessToken()
          .then((newToken) => {
            return axios.post(
              `${apiUrl}/friends/request`,
              { _id: targetUserId },
              {
                headers: { Authorization: `Bearer ${newToken}` }
              }
            );
          })
          .then(() => {
            alert("Friend request sent successfully!");
          })
          .catch((refreshErr) => {
            console.error('Error after token refresh:', refreshErr);
            alert("Session expired. Please login again.");
          });
      } else {
        console.error('Send request error:', err);
        alert(err.response?.data?.message || "Error sending friend request");
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Find Friends</h2>
        <div className="search-section">
          <input
            type="email"
            placeholder="Search by email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button onClick={handleSearch}>Search</button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="search-results">
          {searchResults.map(user => (
            <div key={user._id} className="user-item">
              <div className="user-info">
                <span>{user.name}</span>
                <small>{user.email}</small>
              </div>
              <button onClick={() => handleSendRequest(user._id)}>
                Send Request
              </button>
            </div>
          ))}
        </div>

        <button onClick={onClose} className="close-button">
          Close
        </button>
      </div>
    </div>
  );
}

export default FriendRequestModal;
