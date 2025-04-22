import "../css/ToDoComponentStyle.css";
import axios from "axios";
import { useEffect, useState } from "react";
import { FaRegTrashAlt } from "react-icons/fa";
import { CiEdit } from "react-icons/ci";
import useAuthContext from "../hooks/useAuthContext";

// Define a proper Task interface
interface Task {
  _id: string;
  text: string;
  completed: boolean;
}

function ToDoComponent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [isEditing, setEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState("");
  const { user } = useAuthContext();

  const apiUrl = import.meta.env.VITE_APIURL;

  function fetchTasks() {
    axios
      .get(`${apiUrl}/tasks`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      .then((response) => {     
        const fetchedTasks: Task[] = Array.isArray(response.data) ? response.data : [];   
        setTasks(fetchedTasks);
      })
      .catch((err) => console.error("Error fetching tasks on load:", err));
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

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setNewTask(event.target.value);
  }

  function handleAdd(e: React.FormEvent) {
    if (!user) {
      alert("Please log in");
      return;
    }

    e.preventDefault();
    if (newTask.trim() === "") {
      alert("Task cannot be empty");
      return;
    }
    const taskExists = tasks.some(
      (task) => task.text.toLowerCase() === newTask.toLowerCase()
    );
    if (taskExists) {
      console.log("Task already exists");
      alert("Task already exists");
      return;
    }
    axios
      .post(
        `${apiUrl}/add`,
        { text: newTask },
        { headers: { Authorization: `Bearer ${user.token}` } }
      )
      .then(() => {
        axios
          .get(`${apiUrl}/tasks`, {
            headers: { Authorization: `Bearer ${user.token}` },
          })
          .then((response) => {
            setTasks(response.data);
            setNewTask("");
          })
          .catch((err) => console.error("Error fetching tasks:", err));
      })
      .catch((err) => console.error("Error adding task:", err));
  }

  function deleteTask(taskId: string) {
    if (!user) {
      alert("Please log in");
      return;
    }
    axios
      .delete(`${apiUrl}/delete/${taskId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      .then(() => {
        // Remove the task from the frontend
        const updatedTasks = tasks.filter((task) => task._id !== taskId);
        setTasks(updatedTasks);
      })
      .catch((err) => console.error("Error deleting task:", err));
  }

  function startEditing(taskId: string) {
    const task = tasks.find((task) => task._id === taskId);
    
    if (task) {
      setEditing(true);
      setEditingIndex(taskId); 
      setEditingTask(task.text);
    }
  }

  function handleEditChange(event: React.ChangeEvent<HTMLInputElement>) {
    setEditingTask(event.target.value);
  }

  function saveEdit() {
    const taskId = editingIndex;
    if (!taskId) return;
    
    const taskIndex = tasks.findIndex((task) => task._id === taskId);
    if (taskIndex === -1) {
      console.error("Task not found");
      return;
    }
  
    const updatedText = editingTask;
  
    if (updatedText.trim() === "") {
      alert("Task cannot be empty");
      return;
    }
  
    if (updatedText.trim() === tasks[taskIndex].text) {
      alert("Task is the same");
      return;
    }
  
    axios
      .patch(
        `${apiUrl}/edit/${taskId}`,
        { text: updatedText },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      )
      .then(() => {
        const updatedTasks = [...tasks];
        updatedTasks[taskIndex].text = updatedText;
        setTasks(updatedTasks);
        setEditing(false);
        setEditingIndex(null);
        setEditingTask("");
      })
      .catch((err) => console.error("Error updating task:", err));
  }

  function taskCompleted(taskId: string) {
    const taskIndex = tasks.findIndex((task) => task._id === taskId);
    if (taskIndex === -1) return;
    
    const updatedCompleted = !tasks[taskIndex].completed;

    axios
      .patch(
        `${apiUrl}/update/${taskId}`,
        { completed: updatedCompleted },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      )
      .then(() => {
        const updatedTasks = [...tasks];
        updatedTasks[taskIndex].completed = updatedCompleted;
        setTasks(updatedTasks);
      })
      .catch((err) => console.error("Error updating task completion:", err));
  }
  
  return (
    <>
      <div className="add-task">
        <form onSubmit={handleAdd}>
          <input
            type="text"
            placeholder="Add a task..."
            value={newTask}
            onChange={handleInputChange}
          />
          <button className="add-button" type="submit">
            Add
          </button>
        </form>
      </div>
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
                    {isEditing && editingIndex === task._id ? (
                      <>
                        <input
                          type="text"
                          value={editingTask}
                          onChange={handleEditChange}
                        />
                        <div className="button-container">
                          <button
                            className="save-button"
                            onClick={() => saveEdit()}
                          >
                            Save
                          </button>
                          <button
                            className="cancel-button"
                            onClick={() => {
                              setEditing(false);
                              setEditingIndex(null);
                              setEditingTask("");
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <input
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
                        <button
                          className="delete-button"
                          onClick={() => deleteTask(task._id)}
                        >
                          <FaRegTrashAlt />
                        </button>
                        <button
                          className="edit-button"
                          onClick={() => startEditing(task._id)}
                        >
                          <CiEdit />
                        </button>
                      </>
                    )}
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
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => taskCompleted(task._id)}
                    />
                    <span className="completed-task">{task.text}</span>
                    <button
                      className="completed-delete-button"
                      onClick={() => deleteTask(task._id)}
                    >
                      <FaRegTrashAlt />
                    </button>
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