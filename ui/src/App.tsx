import "./App.css";
import ToDoComponent from "./components/ToDoComponent";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    // <Fragment>
    //   <ToDoComponent></ToDoComponent>
    // </Fragment>

    <main className="main-content">
      <Routes>
        <Route path="/" element={<ToDoComponent />} />
      </Routes>
    </main>
  );
}

export default App;
