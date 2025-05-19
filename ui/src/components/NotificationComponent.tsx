import { useState, useEffect } from 'react';
import { IoNotifications } from "react-icons/io5";
import axios from 'axios';
import useAuthContext from '../hooks/useAuthContext';
import '../css/NotificationStyle.css';
import { VITE_APIURL } from '../config';

interface Notification {
  _id: string;
  type: 'task' | 'friend_request';
  message: string;
  read: boolean;
  createdAt: string;
  relatedId?: string;
  senderEmail?: string;
}

function NotificationIcon() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const { user } = useAuthContext();
  
  const apiUrl = VITE_APIURL;

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

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${apiUrl}/notifications`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setNotifications(response.data);      
    } catch (error: any) {
      if (error.response?.status === 401) {
        try {
          // Get user data from localStorage to access refresh token
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          const refreshResponse = await axios.post(`${apiUrl}/refresh`, {
            refreshToken: userData.refreshToken
          });
          
          // Update token in localStorage
          userData.token = refreshResponse.data.token;
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Retry the original request with new token
          const retryResponse = await axios.get(`${apiUrl}/notifications`, {
            headers: { Authorization: `Bearer ${refreshResponse.data.token}` }
          });
          setNotifications(retryResponse.data);
        } catch (refreshError) {
          console.error('Error refreshing token:', refreshError);
        }
      } else {
        console.error('Error fetching notifications:', error);
      }
    }
  };

  const markAsRead = async () => {
    const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
    const accessToken = userFromStorage.token;

    try {
      await axios.post(
        `${apiUrl}/notifications/read`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      
      // Update local state to mark all as read
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err: any) {
      if (err.response?.status === 401) {
        try {
          const refreshResponse = await refreshAccessToken();
          await axios.post(
            `${apiUrl}/notifications/read`,
            {},
            { headers: { Authorization: `Bearer ${refreshResponse}` } }
          );
          setNotifications(notifications.map(n => ({ ...n, read: true })));
        } catch (refreshErr) {
          console.error('Error marking notifications as read:', refreshErr);
        }
      }
    }
  };

  const clearNotifications = async () => {
    const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
    const accessToken = userFromStorage.token;

    try {
      await axios.delete(
        `${apiUrl}/notifications/clear`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setNotifications([]);
    } catch (err: any) {
      if (err.response?.status === 401) {
        try {
          const refreshResponse = await refreshAccessToken();
          await axios.delete(
            `${apiUrl}/notifications/clear`,
            { headers: { Authorization: `Bearer ${refreshResponse}` } }
          );
          setNotifications([]);
        } catch (refreshErr) {
          console.error('Error clearing notifications:', refreshErr);
        }
      }
    }
  };

  const handleDropdownToggle = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown && unreadCount > 0) {
      markAsRead();
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const handleFriendRequest = async (notificationId: string, relatedId: string, action: 'accept' | 'reject') => {
    const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
    const accessToken = userFromStorage.token;

    if (!relatedId) {
      console.error('No related friend request ID found');
      alert('Error: Invalid friend request');
      return;
    }

    try {      
      await axios.post(
        `${apiUrl}/friends/handle`,
        { requestId: relatedId, action },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );      
      // Remove the notification from the list
      setNotifications(notifications.filter(n => n._id !== notificationId));
      
      // Show success message
      alert(`Friend request ${action}ed successfully`);
    } catch (err: any) {
      console.error('Friend request error:', err.response?.data || err);
      
      if (err.response?.status === 401) {
        try {
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          const refreshResponse = await axios.post(`${apiUrl}/refresh`, {
            refreshToken: userData.refreshToken
          });
          
          userData.token = refreshResponse.data.token;
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Retry with new token
          await axios.post(
            `${apiUrl}/friends/handle`,
            { requestId: relatedId, action },
            { headers: { Authorization: `Bearer ${refreshResponse.data.token}` } }
          );
          
          setNotifications(notifications.filter(n => n._id !== notificationId));
          alert(`Friend request ${action}ed successfully`);
        } catch (refreshErr) {
          console.error('Error after token refresh:', refreshErr);
          alert('Session expired. Please login again.');
        }
      } else {
        alert(err.response?.data?.message || 'Error handling friend request');
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderNotificationContent = (notification: Notification) => {
    if (notification.type === 'friend_request' && notification.relatedId) {
      return (
        <>
          <p data-testid="friend-request-message">You have a new friend request from: {notification.senderEmail}</p>
          <div className="friend-request-actions">
            <button 
              data-testid="accept-request"
              className="accept-btn"
              onClick={() => handleFriendRequest(notification._id, notification.relatedId!, 'accept')}
            >
              Accept
            </button>
            <button 
              data-testid="reject-request"
              className="reject-btn"
              onClick={() => handleFriendRequest(notification._id, notification.relatedId!, 'reject')}
            >
              Reject
            </button>
          </div>
          <small>{new Date(notification.createdAt).toLocaleString()}</small>
        </>
      );
    }
    
    return (
      <>
        <p data-testid="task-notification-message">{notification.message}</p>
        <small>{new Date(notification.createdAt).toLocaleString()}</small>
      </>
    );
  };

  return (
    <div className="notification-container">
      <button 
        className="notification-icon"
        data-testid="notification-button"
        aria-label="Toggle notifications" 
        onClick={handleDropdownToggle}
      >
        <IoNotifications />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {notifications.length > 0 && (
              <button 
                className="clear-notifications-btn"
                onClick={clearNotifications}
              >
                Clear All
              </button>
            )}
          </div>
          {notifications.length > 0 ? (
            notifications.map(notification => (
              <div 
                key={notification._id} 
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
              >
                {renderNotificationContent(notification)}
              </div>
            ))
          ) : (
            <p className="no-notifications">No notifications</p>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationIcon;
