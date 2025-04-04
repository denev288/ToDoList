import "../css/ToDoComponentStyle.css";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import axios from "axios";
import { SetStateAction, useEffect, useState } from "react";
import { FaRegTrashAlt } from "react-icons/fa";
import { CiEdit } from "react-icons/ci";

function ToDoComponent() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [isEditing, setEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingTask, setEditingTask] = useState("");

  const apiUrl = "http://localhost:3004";

  useEffect(() => {
    axios
      .get(`${apiUrl}/tasks`)
      .then((response) => {
        setTasks(response.data);
      })
      .catch((err) => console.error("Error fetching tasks on load:", err));

  }, []);

  function handleInputChange(event) {
    setNewTask(event.target.value);
  }

  function handleAdd(e) {
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
      .post(`${apiUrl}/add`, { text: newTask }) 
      .then(() => {
        axios
          .get(`${apiUrl}/tasks`)
          .then((response) => {
            setTasks(response.data);
            setNewTask("");
          })
          .catch((err) => console.error("Error fetching tasks:", err));
      })
      .catch((err) => console.error("Error adding task:", err));
  }

  function deleteTask(index: number) {
    const taskId = tasks[index]._id;
  
    axios
      .delete(`${apiUrl}/delete/${taskId}`)
      .then(() => {

        // Remove the task from the frontend
        const updatedTasks = tasks.filter((_, i) => i !== index);
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

  function startEditing(index: number) {
    setEditing(true);
    setEditingIndex(index);
    setEditingTask(tasks[index].text);
  }

  function handleEditChange(event: {
    target: { value: SetStateAction<string> };
  }) {
    setEditingTask(event.target.value);
  }

  function saveEdit(index: number) {  
    const taskId = tasks[index]._id;
    const updatedText = editingTask;
    
    if (updatedText.trim() === "") {
      alert("Task cannot be empty");
      return;
    }
    updatedText.trim() === tasks[index].text ? alert("Task is the same") 
    :  
    axios
      .patch(`${apiUrl}/edit/${taskId}`, { text: updatedText })
      .then(() => {
        const updatedTasks = [...tasks];
        updatedTasks[index].text = updatedText;
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

  function taskCompleted(index) {
    const taskId = tasks[index]._id;
    const updatedCompleted = !tasks[index].completed;

    axios
      .patch(`http://localhost:3004/update/${taskId}`, { completed: updatedCompleted })
      .then(() => {

        const updatedTasks = [...tasks];
        updatedTasks[index].completed = updatedCompleted;
        setTasks(updatedTasks);
      })
      .catch((err) => console.error("Error updating task completion:", err));
  }

  return (
    <>
      <div className="to-do-list">
        <h1>To Do List</h1>
        <div>
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
          <ol>
            {tasks.length > 0 ? (
              tasks.map((task, index) => (
                <li key={index}>
                  {isEditing && editingIndex === index ? (
                    <>
                      <input
                        type="text"
                        value={editingTask}
                        onChange={handleEditChange}
                      />
                      <button className="save-button" onClick={() => saveEdit(editingIndex)}>
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
                    </>
                  ) : (
                    <>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => taskCompleted(index)}
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
                        onClick={() => deleteTask(index)}
                      >
                        <FaRegTrashAlt />
                      </button>                 
                      <button
                        className="edit-button"
                        onClick={() => startEditing(index)}
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
      </div>
    </>
  );
}

export default ToDoComponent;
