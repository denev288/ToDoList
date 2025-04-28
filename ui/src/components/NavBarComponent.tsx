import { Link } from "react-router-dom";
import {useLogOut} from "../hooks/useLogOut";
import useAuthContext from "../hooks/useAuthContext";
import "../css/NavBarStyle.css";
import NotificationComponent from './NotificationComponent';
import { useState } from "react";
import FriendRequestModal from '../modals/FriendRequestModal';

function NavBarComponent() {
  const { logOut } = useLogOut();
  const { user } = useAuthContext();
  const [showFriendModal, setShowFriendModal] = useState(false);

  function handleClick() {
    logOut();
  }

  return (
    <header>
      <nav>
        { user && (
        <div className="navbar1">
          <span className="welcome">Welcome: {user.email}</span>         
          <NotificationComponent />
          <button 
            onClick={() => setShowFriendModal(true)}
            className="btn btn-outline-primary me-2"
          >
            Find Friends
          </button>
          <button onClick={handleClick} className="btn btn-outline-success me-2" type="button">Log Out</button>
        </div>
        )}
        {!user && (
        <div className="navbar2">
          {/* <Link to="/todo" className="navbar-brand">
            To Do
          </Link> */}
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
      </nav>
    </header>
  );
}

export default NavBarComponent;
