import { useState, useEffect } from "react";
import "../css/TaskModalStyle.css";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string) => void;
  title?: string;
  description?: string;
  modalTitle?: string;
}

function TaskModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title = "", 
  description = "", 
  modalTitle = "Add New Task" 
}: TaskModalProps) {
  const [taskTitle, setTaskTitle] = useState(title);
  const [taskDescription, setTaskDescription] = useState(description);

  // Reset form when props change
  useEffect(() => {
    setTaskTitle(title);
    setTaskDescription(description);
  }, [title, description, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskTitle.trim() === "") {
      alert("Task title cannot be empty");
      return;
    }
    onSubmit(taskTitle, taskDescription);
  };

  const handleKeyDown = (e: any) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter" && !e.shiftKey) {
  
      e.preventDefault();
      onSubmit(taskTitle, taskDescription);
    }
  };

  return (
    <div className="modal-overlay" onKeyDown={handleKeyDown} onClick={(e) => {
      // Close modal when clicking outside
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>{modalTitle}</h2>
        <form onSubmit={handleSubmit}>
          <div className="modal-field">
            <label htmlFor="task-title">Title:</label>
            <input
              id="task-title"
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Enter task title"
            />
          </div>
          <div className="modal-field">
            <label htmlFor="task-description">Description:</label>
            <textarea
              id="task-description"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Enter task description (optional)"
              rows={4}
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="add-button">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskModal;