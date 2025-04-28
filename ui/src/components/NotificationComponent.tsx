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

  const unreadCount = notifications.filter(n => !n.read).length;

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
                <p>{notification.message}</p>
                <small>{new Date(notification.createdAt).toLocaleString()}</small>
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
