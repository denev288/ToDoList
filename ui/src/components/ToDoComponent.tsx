import "../css/ToDoComponentStyle.css";

import { SetStateAction, useState } from "react";

function ToDoComponent() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [isEditing, setEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingTask, setEditingTask] = useState("");

  function handleInputChange(event) {
    setNewTask(event.target.value);
  }

  function addTask() {
    if (newTask.trim() !== "") {
      setTasks(() => [...tasks, newTask]);
      setNewTask("");
    }
  }

  function deleteTask(index: number) {
    const updatedTasks = tasks.filter((_, i) => i !== index);
    setTasks(updatedTasks);
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

  function startEditing(index: number | SetStateAction<null>) {
    setEditing(true);
    setEditingIndex(index);
    setEditingTask(tasks[index]);
  }

  function handleEditChange(event: { target: { value: SetStateAction<string>; }; }) {
    setEditingTask(event.target.value);
  }

  function saveEdit() {
    const updatedTasks = [...tasks];
    updatedTasks[editingIndex] = editingTask;
    setTasks(updatedTasks);
    setEditing(false);
    setEditingIndex(null);
    setEditingTask("");
  }

  return (
    <>
      <div className="to-do-list">
        <h1>To Do List</h1>
        <div>
          <input
            type="text"
            placeholder="Add a task..."
            value={newTask}
            onChange={handleInputChange}
          />
          <button className="add-button" onClick={addTask}>
            Add
          </button>
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
                      <button className="save-button" onClick={saveEdit}>
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
                      <span className="text">{task}</span>
                      <button
                        className="delete-button"
                        onClick={() => deleteTask(index)}
                      >
                        Delete
                      </button>
                      <button
                        className="move-button"
                        onClick={() => moveTaskUp(index)}
                      >
                        Up
                      </button>
                      <button
                        className="move-button"
                        onClick={() => moveTaskDown(index)}
                      >
                        Down
                      </button>
                      <button
                        className="edit-button"
                        onClick={() => startEditing(index)}
                      >
                        Edit
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

// function ToDoComponent() {
//   const [inputValue, setInputValue] = useState("");
//   const [todos, setTodos] = useState<string[]>([]);

//   function handleInputChange (event: React.ChangeEvent<HTMLInputElement>) {
//     setInputValue(event.target.value);
//   };

//   function insertTodos (event: React.FormEvent) {
//     event.preventDefault();
//     if (inputValue.trim()) {
//       setTodos([...todos, inputValue]);
//       setInputValue("");
//     }
//   };

//   return (
//     <div className="todoapp stack-large">
//       <h1>To do list</h1>
//       <form onSubmit={insertTodos}>
//         <h2 className="label-wrapper">
//           <label htmlFor="new-todo-input" className="label__lg">
//             Insert what you need to do for the day!
//           </label>
//         </h2>
//         <input
//           type="text"
//           id="new-todo-input"
//           className="input input__lg"
//           name="text"
//           autoComplete="off"
//           value={inputValue}
//           onChange={handleInputChange}
//         />
//         <button type="submit" className="btn btn__primary btn__lg">
//           Add
//         </button>

//       </form>
//       {todos.length > 0 ? (
//         <ul>
//           {todos.map((todo, index) => (
//             <li key={index}>{todo}</li>
//           ))}
//         </ul>
//       ) : (
//         <p>No tasks, add a task</p>
//       )}
//     </div>
//   );
// }
