import { useState, useEffect } from 'react';
import { IoNotifications } from "react-icons/io5";
import axios from 'axios';
import useAuthContext from '../hooks/useAuthContext';
import '../css/NotificationStyle.css';

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
  const apiUrl = import.meta.env.VITE_APIURL;

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
          <p>You have a new friend request from: {notification.senderEmail}</p>
          <div className="friend-request-actions">
            <button 
              className="accept-btn"
              onClick={() => handleFriendRequest(notification._id, notification.relatedId!, 'accept')}
            >
              Accept
            </button>
            <button 
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
        <p>{notification.message}</p>
        <small>{new Date(notification.createdAt).toLocaleString()}</small>
      </>
    );
  };

  return (
    <div className="notification-container">
      <button 
        className="notification-icon" 
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <IoNotifications />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
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
