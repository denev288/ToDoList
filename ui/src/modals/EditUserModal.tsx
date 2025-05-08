import { useState } from "react";
import axios from "axios";
import useAuthContext from "../hooks/useAuthContext";
import "../css/EditUserModalStyle.css";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    name?: string;
    email: string;
  };
}

function EditUserModal({ isOpen, onClose, currentUser }: EditUserModalProps) {
  const [name, setName] = useState(currentUser.name || "");
  const [email, setEmail] = useState(currentUser.email || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { dispatch } = useAuthContext();
  const apiUrl = import.meta.env.VITE_APIURL;

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');

    try {
      const response = await axios.patch(
        `${apiUrl}/user/update`,
        { name, email, password },
        { headers: { Authorization: `Bearer ${userFromStorage.token}` } }
      );

      // Update local storage and auth context with new user data
      const updatedUser = {
        ...userFromStorage,
        email: response.data.email,
        name: response.data.name
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      dispatch({ type: 'LOGIN', payload: updatedUser });
      
      onClose();
    } catch (err: any) {
      if (err.response?.status === 401) {
        try {
          const refreshResponse = await axios.post(`${apiUrl}/refresh`, {
            refreshToken: userFromStorage.refreshToken
          });
          
          // Retry the update with new token
          const response = await axios.patch(
            `${apiUrl}/user/update`,
            { name, email, password },
            { headers: { Authorization: `Bearer ${refreshResponse.data.token}` } }
          );

          const updatedUser = {
            ...userFromStorage,
            token: refreshResponse.data.token,
            email: response.data.email,
            name: response.data.name
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          dispatch({ type: 'LOGIN', payload: updatedUser });
          
          onClose();
        } catch (refreshErr: any) {
          if (refreshErr.response?.data?.message) {
            setError(refreshErr.response.data.message);
          } else {
            setError("Session expired. Please login again.");
          }
        }
      } else {
        setError(err.response?.data?.message || "Failed to update user details");
      }
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Edit Profile</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter new name"
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter new email"
            />
          </div>
          <div className="form-group">
            <label>New Password (leave blank to keep current):</label>
            <input
              type=""
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="modal-actions">
            <button type="submit" className="save-button">Save Changes</button>
            <button type="button" onClick={onClose} className="cancel-button">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditUserModal;
