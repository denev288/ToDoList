import "../css/ToDoComponentStyle.css";
import axios from "axios";
import { useEffect, useState } from "react";
import { FaRegTrashAlt } from "react-icons/fa";
import { CiEdit } from "react-icons/ci";
import useAuthContext from "../hooks/useAuthContext";
import TaskModal from "../modals/TaskModal"; 


interface Task {
  _id: string;
  text: string;
  description: string; 
  completed: boolean;
  showDescription?: boolean; 
}

function ToDoComponent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const { user } = useAuthContext();
  
  const apiUrl = import.meta.env.VITE_APIURL;

  function refreshAccessToken() {
    const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
    const refreshToken = userFromStorage.refreshToken;

    if (!refreshToken) {
      console.error("Refresh token is missing");
      return Promise.reject("Refresh token is missing");
    }

    return axios
      .post(`${apiUrl}/refresh`, { refreshToken })
      .then((res) => {
        const newAccessToken = res.data.token;

        // Update the user object in localStorage with the new token
        userFromStorage.token = newAccessToken;
        localStorage.setItem('user', JSON.stringify(userFromStorage));

        return newAccessToken;
      })
      .catch((err) => {
        console.error("Failed to refresh token", err);
        throw err;
      });
  }

  function fetchTasks() {
    const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
    const accessToken = userFromStorage.token;

    if (!user || !accessToken) {
      console.error("User is not logged in or token is missing");
      return;
    }

    console.log("Access token being sent:", accessToken);

    axios
      .get(`${apiUrl}/tasks`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((response) => {
        console.log(response.data);
        const fetchedTasks: Task[] = Array.isArray(response.data) ? response.data : [];
        setTasks(fetchedTasks);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          refreshAccessToken()
            .then((newToken) => {
              return axios.get(`${apiUrl}/tasks`, {
                headers: { Authorization: `Bearer ${newToken}` }
              });
            })
            .then((res) => {
              setTasks(res.data);
            })
            .catch((refreshErr) => {
              console.error("Token refresh or retry failed", refreshErr);
            });
        } else {
          console.error("Error fetching tasks", err);
        }
      });
  }

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  useEffect(() => {
    console.log("Component rendered");

    return() => {
      console.log("Component destroyed");
    }
  }, []);

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

  function handleAddTask(title: string, description: string) {
    const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
    const accessToken = userFromStorage.token;

    if (!user || !accessToken) {
      alert("Please log in");
      return;
    }
  
    const taskExists = tasks.some(
      (task) => task.text.toLowerCase() === title.toLowerCase()
    );
    if (taskExists) {
      alert("Task already exists");
      return;
    }
  
    console.log("Access token being sent for add task:", accessToken);

    axios
      .post(
        `${apiUrl}/add`,
        { text: title, description: description },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      .then(() => {
        // Fetch updated tasks
        axios
          .get(`${apiUrl}/tasks`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          .then((response) => {
            setTasks(response.data);
            handleCloseModal();
          })
          .catch((err) => console.error("Error fetching tasks:", err));
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          // If we get 401 error, refresh the token and retry
          refreshAccessToken()
            .then((newToken) => {
              // Retry adding the task with the new token
              return axios.post(
                `${apiUrl}/add`,
                { text: title, description: description },
                { headers: { Authorization: `Bearer ${newToken}` } }
              );
            })
            .then(() => {
              // Retry fetching the tasks with the new token
              return axios.get(`${apiUrl}/tasks`, {
                headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('user') || '{}').token}` },
              });
            })
            .then((response) => {
              setTasks(response.data);
              handleCloseModal();
            })
            .catch((err) => {
              console.error("Error adding task or fetching tasks after token refresh:", err);
            });
        } else {
          console.error("Error adding task:", err);
        }
      });
  }

  function saveEditedTask(title: string, description: string) {
    const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
    const accessToken = userFromStorage.token;

    if (!user || !accessToken) {
      console.error("User is not logged in or token is missing");
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
  
    if (title.trim() === tasks[taskIndex].text && 
        description === tasks[taskIndex].description) {
      alert("No changes made");
      handleCloseEditModal();
      return;
    }
  
    axios
      .patch(
        `${apiUrl}/edit/${taskId}`,
        { text: title, description: description },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
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
          // If we get 401 error, refresh the token and retry
          refreshAccessToken()
            .then((newToken) => {
              return axios.patch(
                `${apiUrl}/edit/${taskId}`,
                { text: title, description: description },
                {
                  headers: { Authorization: `Bearer ${newToken}` },
                }
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
              console.error("Error saving task after token refresh:", refreshErr);
            });
        } else {
          console.error("Error updating task:", err);
        }
      });
  }
  
  function deleteTask(taskId: string) {
    const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
    const accessToken = userFromStorage.token;

    if (!user || !accessToken) {
      alert("Please log in");
      return;
    }
  
    axios
      .delete(`${apiUrl}/delete/${taskId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then(() => {
        // Remove the task from the frontend
        const updatedTasks = tasks.filter((task) => task._id !== taskId);
        setTasks(updatedTasks);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          // If we get 401 error, refresh the token and retry
          refreshAccessToken()
            .then((newToken) => {
              // Retry the delete with the new token
              return axios.delete(`${apiUrl}/delete/${taskId}`, {
                headers: { Authorization: `Bearer ${newToken}` },
              });
            })
            .then(() => {
              // Remove the task from the frontend
              const updatedTasks = tasks.filter((task) => task._id !== taskId);
              setTasks(updatedTasks);
            })
            .catch((refreshErr) => {
              console.error("Error deleting task after token refresh:", refreshErr);
            });
        } else {
          console.error("Error deleting task:", err);
        }
      });
  }

  function taskCompleted(taskId: string) {
    const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
    const accessToken = userFromStorage.token;

    if (!user || !accessToken) {
      console.error("User is not logged in or token is missing");
      return;
    }
  
    const taskIndex = tasks.findIndex((task) => task._id === taskId);
    if (taskIndex === -1) return;
  
    const updatedCompleted = !tasks[taskIndex].completed;
  
    axios
      .patch(
        `${apiUrl}/update/${taskId}`,
        { completed: updatedCompleted },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )
      .then(() => {
        const updatedTasks = [...tasks];
        updatedTasks[taskIndex].completed = updatedCompleted;
        setTasks(updatedTasks);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          // If we get 401 error, refresh the token and retry
          refreshAccessToken()
            .then((newToken) => {        
              return axios.patch(
                `${apiUrl}/update/${taskId}`,
                { completed: updatedCompleted },
                {
                  headers: { Authorization: `Bearer ${newToken}` },
                }
              );
            })
            .then(() => {
              const updatedTasks = [...tasks];
              updatedTasks[taskIndex].completed = updatedCompleted;
              setTasks(updatedTasks);
            })
            .catch((refreshErr) => {
              console.error("Error updating task completion after token refresh:", refreshErr);
            });
        } else {
          console.error("Error updating task completion:", err);
        }
      });
  }
  
  // Toggle task description visibility
  function toggleDescription(taskId: string) {
    const taskIndex = tasks.findIndex((task) => task._id === taskId);
    if (taskIndex === -1) return;

    const updatedTasks = [...tasks];
    updatedTasks[taskIndex].showDescription = !updatedTasks[taskIndex].showDescription;
    setTasks(updatedTasks);
  }
  
  return (
    <>
      <div className="add-task">
        <button className="add-task-button" onClick={handleOpenModal}>
          Add New Task
        </button>
      </div>
      
      {/* Add New Task Modal */}
      <TaskModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleAddTask}
        modalTitle="Add New Task"
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
      
      <div className="parent">
        <div className="to-do-list">
          <h1>To Do List</h1>
          <ol>
            {
            tasks.filter((task) => !task.completed).length > 0 ? (
              tasks
                .filter((task) => !task.completed)
                .map((task) => (
                  <li key={task._id}>
                    <div className="task-header">
                      <div className="task-checkbox-title">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => taskCompleted(task._id)}
                        />
                        <span
                          className={`text ${task.completed ? "completed-task" : ""}`}
                        >
                          {task.text}
                        </span>
                      </div>
                      <div className="task-actions">
                        <button
                          className="edit-button"
                          onClick={() => handleOpenEditModal(task._id)}
                        >
                          <CiEdit />
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => deleteTask(task._id)}
                        >
                          <FaRegTrashAlt />
                        </button>
                      </div>
                    </div>
                    
                    {task.description ? (
                      <div className="task-description">
                        <button 
                          className="toggle-description" 
                          onClick={() => toggleDescription(task._id)}
                        >
                          {task.showDescription ? "Hide Description" : "Show Description"}
                        </button>
                        {task.showDescription && (
                          <div className="description-content">
                            {task.description}
                          </div>
                        )}
                      </div>
                    ) : (<p className="description-missing">Description is missing</p>)}
                  </li>
                ))
            ) : (
              <p>No current tasks</p>
            )}
          </ol>
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
                    
                    {task.description ? (
                      <div className="task-description">
                        <button 
                          className="toggle-description" 
                          onClick={() => toggleDescription(task._id)}
                        >
                          {task.showDescription ? "Hide Description" : "Show Description"}
                        </button>
                        {task.showDescription && (
                          <div className="description-content">
                            {task.description}
                          </div>
                        )}
                      </div>
                    ) : (<p className="description-missing">Description is missing</p>)}
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