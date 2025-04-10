import "../css/ToDoComponentStyle.css";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import axios from "axios";
import { SetStateAction, useEffect, useState } from "react";
import { FaRegTrashAlt } from "react-icons/fa";
import { CiEdit } from "react-icons/ci";
import { useAuthContext } from "../hooks/useAuthContext";

function ToDoComponent() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [isEditing, setEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingTask, setEditingTask] = useState("");
  const { user } = useAuthContext();

  const apiUrl = "http://localhost:3004";

  function fetchTasks() {
    axios
      .get(`${apiUrl}/tasks`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      .then((response) => {        
        setTasks(response.data);
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

  function handleInputChange(event) {
    setNewTask(event.target.value);
  }

  function handleAdd(e) {
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

  function moveTaskUp(index) {
    if (index > 0) {
      const updatedTasks = [...tasks];
      [updatedTasks[index], updatedTasks[index - 1]] = [
        updatedTasks[index - 1],
        updatedTasks[index],
      ];
      setTasks(updatedTasks);
    }
  }
  function moveTaskDown(index: number) {
    if (index < tasks.length - 1) {
      const updatedTasks = [...tasks];
      [updatedTasks[index], updatedTasks[index + 1]] = [
        updatedTasks[index + 1],
        updatedTasks[index],
      ];
      setTasks(updatedTasks);
    }
  }

  function startEditing(taskId: string) {
    const task = tasks.find((task) => task._id === taskId);
  
    setEditing(true);
    setEditingIndex(taskId); 
    setEditingTask(task.text);
  }

  function handleEditChange(event: {
    target: { value: SetStateAction<string> };
  }) {
    setEditingTask(event.target.value);
  }

  function saveEdit() {
    const taskId = editingIndex; // Use the stored task ID
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

  function handleDragEvent(event: any) {
    const { active, over } = event;

    if (!over) return;

    const oldIndex = active.id;
    const newIndex = over.id;

    if (oldIndex === newIndex) return;

    const updatedTasks = [...tasks];
    const [movedTask] = updatedTasks.splice(oldIndex, 1);
    updatedTasks.splice(newIndex, 0, movedTask);

    setTasks(updatedTasks);
  }

  function taskCompleted(taskId) {
    const taskIndex = tasks.findIndex((task) => task._id === taskId);
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
            {tasks.filter((task) => !task.completed).length > 0 ? (
              tasks
                .filter((task) => !task.completed)
                .map((task, index) => (
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
                            onClick={() => saveEdit(editingIndex)}
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
                .map((task, index) => (
                  <li key={task._id}>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => taskCompleted(task._id)}
                    />
                    <span className="completed-task">{task.text}</span>
                    <button
                      className="completed-delete-button"
                      onClick={() => deleteTask(index)}
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
