import "../css/ToDoComponentStyle.css";
import api from '../utils/axiosConfig';
import { useEffect, useState } from "react";
import { FaRegTrashAlt } from "react-icons/fa";
import { CiEdit, CiShare2 } from "react-icons/ci";
import useAuthContext from "../hooks/useAuthContext";
import TaskModal from "../modals/TaskModal";
import ShareModal from "../modals/ShareModal";
import { logError } from '../utils/errorLogger';

interface Task {
  _id: string;
  text: string;
  description: string;
  completed: boolean;
  showDescription?: boolean;
  sharedBy?: string;
  sharedWith?: string;
  originalTaskId?: string;
}

function ToDoComponent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingTaskId, setSharingTaskId] = useState<string | null>(null);
  const { user } = useAuthContext();
  const [shareError, setShareError] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  function refreshAccessToken() {
    const userFromStorage = JSON.parse(localStorage.getItem("user") || "{}");
    const refreshToken = userFromStorage.refreshToken;

    if (!refreshToken) {
      logError("Refresh token is missing", { 
        component: 'ToDoComponent', 
        operation: 'refreshAccessToken' 
      });
      return Promise.reject("Refresh token is missing");
    }

    return api
      .post(`/refresh`, { refreshToken })
      .then((res) => {
        const newAccessToken = res.data.token;

        // Update the user object in localStorage with the new token
        userFromStorage.token = newAccessToken;
        localStorage.setItem("user", JSON.stringify(userFromStorage));

        return newAccessToken;
      })
      .catch((err) => {
        console.error("Failed to refresh token", err);
        throw err;
      });
  }

  function fetchTasks() {
    const userFromStorage = JSON.parse(localStorage.getItem("user") || "{}");
    const accessToken = userFromStorage.token;

    if (!user || !accessToken) {
      logError("User not logged in or token missing", { 
        component: 'ToDoComponent', 
        operation: 'fetchTasks' 
      });
      return;
    }

    api
      .get(`/tasks`)
      .then((response) => {
        const fetchedTasks: Task[] = Array.isArray(response.data)
          ? response.data
          : [];
        setTasks(fetchedTasks);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          refreshAccessToken()
            .then(() => {
              return api.get(`/tasks`);
            })
            .then((res) => {
              setTasks(res.data);
            })
            .catch((refreshErr) => {
              logError(refreshErr, {
                component: 'ToDoComponent',
                operation: 'fetchTasksAfterTokenRefresh'
              });
            });
        } else {
          logError(err, {
            component: 'ToDoComponent',
            operation: 'fetchTasks',
            accessToken: 'present'
          });
        }
      });
  }

  useEffect(() => {
    if (user) {
      fetchTasks(); // Fetch all tasks, including shared ones
    }
  }, [user]);

  function handleOpenModal() {
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
  }

  function handleOpenEditModal(taskId: string) {
    const task = tasks.find((task) => task._id === taskId);

    if (task) {
      setEditingIndex(taskId);
      setEditingTask(task.text);
      setEditingDescription(task.description || "");
      setIsEditModalOpen(true);
    }
  }

  function handleCloseEditModal() {
    setIsEditModalOpen(false);
    setEditingIndex(null);
    setEditingTask("");
    setEditingDescription("");
  }

  function handleOpenShareModal(taskId: string) {
    setSharingTaskId(taskId);
    setIsShareModalOpen(true);
  }

  function handleCloseShareModal() {
    setSharingTaskId(null);
    setIsShareModalOpen(false);
  }

  function handleAddTask(title: string, description: string) {
    const userFromStorage = JSON.parse(localStorage.getItem("user") || "{}");
    const accessToken = userFromStorage.token;

    if (!user || !accessToken) {
      logError("User not logged in or token missing", {
        component: 'ToDoComponent',
        operation: 'handleAddTask'
      });
      setError("Please log in");
      return;
    }

    const taskExists = tasks.some(
      (task) => task.text.toLowerCase() === title.toLowerCase()
    );
    if (taskExists) {
      alert("Task already exists");
      return;
    }

    api
      .post(`/add`, { text: title, description: description })
      .then(() => {
        fetchTasks(); // Refresh tasks after adding a new one
        handleCloseModal();
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          refreshAccessToken()
            .then(() => {
              return api.post(`/add`, { text: title, description: description });
            })
            .then(() => {
              fetchTasks(); // Refresh tasks after retrying
              handleCloseModal();
            })
            .catch((err) => {
              console.error("Error adding task after token refresh:", err);
            });
        } else {
          console.error("Error adding task:", err);
        }
      });
  }

  function saveEditedTask(title: string, description: string) {
    const userFromStorage = JSON.parse(localStorage.getItem("user") || "{}");
    const accessToken = userFromStorage.token;

    if (!user || !accessToken) {
      logError("User not logged in or token missing", {
        component: 'ToDoComponent',
        operation: 'saveEditedTask'
      });
      return;
    }

    const taskId = editingIndex;
    if (!taskId) return;

    const taskIndex = tasks.findIndex((task) => task._id === taskId);
    if (taskIndex === -1) {
      console.error("Task not found");
      return;
    }

    if (title.trim() === "") {
      alert("Task cannot be empty");
      return;
    }

    if (
      title.trim() === tasks[taskIndex].text &&
      description === tasks[taskIndex].description
    ) {
      alert("No changes made");
      handleCloseEditModal();
      return;
    }

    api
      .patch(
        `/edit/${taskId}`,
        { text: title, description: description }
      )
      .then(() => {
        const updatedTasks = [...tasks];
        updatedTasks[taskIndex].text = title;
        updatedTasks[taskIndex].description = description;
        setTasks(updatedTasks);
        handleCloseEditModal();
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          // If we get a 401 error, refresh the token and retry
          refreshAccessToken()
            .then(() => {
              return api.patch(
                `/edit/${taskId}`,
                { text: title, description: description }
              );
            })
            .then(() => {
              const updatedTasks = [...tasks];
              updatedTasks[taskIndex].text = title;
              updatedTasks[taskIndex].description = description;
              setTasks(updatedTasks);
              handleCloseEditModal();
            })
            .catch((refreshErr) => {
              console.error(
                "Error saving task after token refresh:",
                refreshErr
              );
            });
        } else {
          console.error("Error updating task:", err);
        }
      });
  }

  function handleShareTask(email: string, message: string) {
    const userFromStorage = JSON.parse(localStorage.getItem("user") || "{}");
    const accessToken = userFromStorage.token;

    if (!user || !accessToken) {
      alert("Please log in");
      return;
    }

    if (!sharingTaskId) {
      console.error("No task selected for sharing");
      return;
    }

    setShareError(""); // Clear previous errors

    api
      .post(
        `/share/${sharingTaskId}`,
        { email, message }
      )
      .then(() => {
        alert("Task shared successfully");
        fetchTasks(); // Add this line to refresh tasks
        handleCloseShareModal();
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          refreshAccessToken()
            .then(() => {
              return api.post(
                `/share/${sharingTaskId}`,
                { email, message }
              );
            })
            .then(() => {
              alert("Task shared successfully");
              fetchTasks(); // Add this line here too
              handleCloseShareModal();
            })
            .catch((refreshErr) => {
              if (refreshErr.response?.data?.error) {
                setShareError(refreshErr.response.data.error);
              } else {
                setShareError("Error sharing task. Please try again.");
              }
            });
        } else if (err.response?.data?.error) {
          setShareError(err.response.data.error);
        } else {
          setShareError("Error sharing task. Please try again.");
        }
      });
  }

  function deleteTask(taskId: string) {
    const userFromStorage = JSON.parse(localStorage.getItem("user") || "{}");
    const accessToken = userFromStorage.token;

    if (!user || !accessToken) {
      logError("User not logged in or token missing", {
        component: 'ToDoComponent',
        operation: 'deleteTask',
        taskId
      });
      return;
    }

    api
      .delete(`/delete/${taskId}`)
      .then(() => {
        // Remove the task from the frontend
        const updatedTasks = tasks.filter((task) => task._id !== taskId);
        setTasks(updatedTasks);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          // Refresh token and retry deleting the task
          refreshAccessToken()
            .then(() => {
              return api.delete(`/delete/${taskId}`);
            })
            .then(() => {
              // Remove the task from the frontend
              const updatedTasks = tasks.filter((task) => task._id !== taskId);
              setTasks(updatedTasks);
            })
            .catch((refreshErr) => {
              console.error(
                "Error deleting task after token refresh:",
                refreshErr
              );
            });
        } else {
          console.error("Error deleting task:", err);
        }
      });
  }

  function taskCompleted(taskId: string) {
    const userFromStorage = JSON.parse(localStorage.getItem("user") || "{}");
    const accessToken = userFromStorage.token;

    if (!user || !accessToken) {
      logError("User not logged in or token missing", {
        component: 'ToDoComponent',
        operation: 'taskCompleted',
        taskId
      });
      return;
    }

    const taskIndex = tasks.findIndex((task) => task._id === taskId);
    if (taskIndex === -1) {
      console.error("Task not found");
      return;
    }

    const updatedCompleted = !tasks[taskIndex].completed;

    api
      .patch(
        `/update/${taskId}`,
        { completed: updatedCompleted }
      )
      .then(() => {
        const updatedTasks = [...tasks];
        updatedTasks[taskIndex].completed = updatedCompleted;
        setTasks(updatedTasks);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          // Refresh token and retry updating the task completion status
          refreshAccessToken()
            .then(() => {
              return api.patch(
                `/update/${taskId}`,
                { completed: updatedCompleted }
              );
            })
            .then(() => {
              const updatedTasks = [...tasks];
              updatedTasks[taskIndex].completed = updatedCompleted;
              setTasks(updatedTasks);
            })
            .catch((refreshErr) => {
              console.error(
                "Error updating task completion after token refresh:",
                refreshErr
              );
            });
        } else {
          console.error("Error updating task completion:", err);
        }
      });
  }

  function toggleDescription(taskId: string) {
    const taskIndex = tasks.findIndex((task) => task._id === taskId);
    if (taskIndex === -1) {
      console.error("Task not found:", taskId);
      return;
    }

    const updatedTasks = [...tasks];
    updatedTasks[taskIndex].showDescription =
      !updatedTasks[taskIndex].showDescription;
    setTasks(updatedTasks);
  }

  function getTaskStatusText(task: Task) {
    if (task.sharedBy) {
      return `📥 Shared by: ${task.sharedBy}${
        task.completed ? ` (Completed)` : ""
      }`;
    }
    if (task.sharedWith) {
      return `📤 Shared with: ${task.sharedWith}${
        task.completed ? ` (Completed)` : ""
      }`;
    }
    return "👤 Own task";
  }

  return (
    <>
      <div className="add-task">
        <button 
          className="add-task-button" 
          onClick={handleOpenModal}
          aria-label="create new task" 
        >
          Create New Task
        </button>
      </div>

      {/* Add New Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleAddTask}
        modalTitle="Add New Task"
        error={error}
      />

      {/* Edit Task Modal */}
      <TaskModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSubmit={saveEditedTask}
        title={editingTask}
        description={editingDescription}
        modalTitle="Edit Task"
      />

      {/* Share Task Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={handleCloseShareModal}
        onSubmit={handleShareTask}
        error={shareError}
        currentUserEmail={user?.email}
      />

      <div className="parent">
        <div className="to-do-list">
          <h1>To Do List</h1>

          {tasks.filter((task) => !task.completed).length > 0 ? (
            tasks
              .filter((task) => !task.completed)
              .map((task) => (
                <div key={task._id}>
                  <li>
                    <div className="task-header">
                      <div className="task-checkbox-title">
                        <input
                        data-testid="complete-button"
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => taskCompleted(task._id)}
                        />
                        <span
                          className={`text ${
                            task.completed ? "completed-task" : ""
                          }`}
                        >
                          {task.text}
                        </span>
                      </div>
                      <div className="task-actions">
                        <button
                          data-testid="share-button"
                          className="edit-button"
                          onClick={() => handleOpenShareModal(task._id)}
                        >
                          <CiShare2 />
                        </button>
                        <button
                        data-testid="edit-button"
                          className="edit-button"
                          onClick={() => handleOpenEditModal(task._id)}
                        >
                          <CiEdit />
                        </button>
                        <button
                          data-testid="delete-button"
                          className="delete-button"
                          onClick={() => deleteTask(task._id)}
                        >
                          <FaRegTrashAlt />
                        </button>
                      </div>
                    </div>

                    <p className="task-shared-status">
                      {getTaskStatusText(task)}
                    </p>

                    {task.description ? (
                      <div className="task-description">
                        <button
                          className="toggle-description"
                          onClick={() => toggleDescription(task._id)}
                        >
                          {task.showDescription
                            ? "Hide Description"
                            : "Show Description"}
                        </button>
                        {task.showDescription && (
                          <div className="description-content">
                            {task.description}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="description-missing">
                        Description is missing
                      </p>
                    )}
                  </li>
                </div>
              ))
          ) : (
            <p>No current tasks</p>
          )}
        </div>

        <div className="completed-list">
          <h1>Completed</h1>
          <ol>
            {tasks.filter((task) => task.completed).length > 0 ? (
              tasks
                .filter((task) => task.completed)
                .map((task) => (
                  <li key={task._id}>
                    <div className="task-header">
                      <div className="task-checkbox-title">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => taskCompleted(task._id)}
                        />
                        <span className="completed-task">{task.text}</span>
                      </div>
                      <button
                        className="completed-delete-button"
                        onClick={() => deleteTask(task._id)}
                      >
                        <FaRegTrashAlt />
                      </button>
                    </div>

                    <p className="task-shared-status">
                      {getTaskStatusText(task)}
                    </p>

                    {task.description ? (
                      <div className="task-description">
                        <button
                          className="toggle-description"
                          onClick={() => toggleDescription(task._id)}
                        >
                          {task.showDescription
                            ? "Hide Description"
                            : "Show Description"}
                        </button>
                        {task.showDescription && (
                          <div className="description-content">
                            {task.description}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="description-missing">
                        Description is missing
                      </p>
                    )}
                  </li>
                ))
            ) : (
              <p>No completed tasks</p>
            )}
          </ol>
        </div>
      </div>
    </>
  );
}

export default ToDoComponent;
