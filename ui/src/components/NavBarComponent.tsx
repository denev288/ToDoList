import { Link } from "react-router-dom";
import {useLogOut} from "../hooks/useLogOut";
import {useAuthContext} from "../hooks/useAuthContext";

function NavBarComponent() {
  const { logOut } = useLogOut();
  const { user } = useAuthContext();

  function handleClick() {
    logOut();
  }

  return (
    <header>
      <nav>
        { user && (
        <div className="navbar d-flex justify-content-end gap-3">
          <span >{user.email}</span>
          <button onClick={handleClick} className="btn btn-outline-success me-2" type="button">Log Out</button>
        </div>
        )}
        {!user && (
        <div className="navbar d-flex justify-content-end gap-3">
          <Link to="/signup" className="navbar-brand">
            Sign Up
          </Link>
          <Link to="/todo" className="navbar-brand">
            To Do
          </Link>
          <Link to="/login" className="navbar-brand">
            Login
          </Link>
        </div>
        )}
      </nav>
    </header>
  );
}

export default NavBarComponent;
