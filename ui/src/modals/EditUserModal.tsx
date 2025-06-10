import { useState } from "react";
import api from '../utils/axiosConfig';
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

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');

    try {
      const response = await api.patch('/user/update', { name, email, password });

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
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to update user details");
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
