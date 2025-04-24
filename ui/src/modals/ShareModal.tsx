import React, { useState } from "react";
import "../css/ShareModalStyle.css";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string, message: string) => void;
}

function ShareModal({ isOpen, onClose, onSubmit }: ShareModalProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit() {
    if (!email.trim()) {
      alert("Email is required");
      return;
    }
    onSubmit(email, message);
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Share Task</h2>
        <input
          type="email"
          placeholder="Recipient's Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
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
