import { Link } from "react-router-dom";
import {useLogOut} from "../hooks/useLogOut";
import useAuthContext from "../hooks/useAuthContext";
import "../css/NavBarStyle.css";
import NotificationComponent from './NotificationComponent';
import { useState } from "react";
import FriendRequestModal from '../modals/FriendRequestModal';
import EditUserModal from '../modals/EditUserModal';
import FriendsListModal from '../modals/FriendsListModal';

function NavBarComponent() {
  const { logOut } = useLogOut();
  const { user } = useAuthContext();
  const [showFriendModal, setShowFriendModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFriendsListModal, setShowFriendsListModal] = useState(false);

  function handleClick() {
    logOut();
  }

  return (
    <header>
      <nav>
        { user && (
        <div className="navbar1">
          <div className="user-dropdown-container">
            <span 
              className="welcome" 
              onClick={() => setShowUserDropdown(!showUserDropdown)}
            >
              Welcome: {user.email} ▼
            </span>
            {showUserDropdown && (
              <div className="user-dropdown">
                <button onClick={() => {
                  setShowEditModal(true);
                  setShowUserDropdown(false);
                }}>
                  Edit User
                </button>
                <button onClick={() => {
                  setShowFriendsListModal(true);
                  setShowUserDropdown(false);
                }}>
                  Friends List
                </button>
              </div>
            )}
          </div>
          <div className="navbar-actions">
            <NotificationComponent />
            <button 
              onClick={() => setShowFriendModal(true)}
              className="btn btn-outline-primary me-2"
            >
              Find Friends
            </button>
            <button 
              onClick={handleClick} 
              className="btn btn-outline-success me-2"
            >
              Log Out
            </button>
          </div>
        </div>
        )}
        {!user && (
        <div className="navbar2">
          <Link to="/signup" className="navbar-brand">
            Sign Up
          </Link>
          <Link to="/login" className="navbar-brand">
            Login
          </Link>
        </div>
        )}
        <FriendRequestModal 
          isOpen={showFriendModal}
          onClose={() => setShowFriendModal(false)}
        />
        <EditUserModal 
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          currentUser={user || { email: "" }}
        />
        <FriendsListModal 
          isOpen={showFriendsListModal}
          onClose={() => setShowFriendsListModal(false)}
        />
      </nav>
    </header>
  );
}

export default NavBarComponent;
