import "./App.css";
import LogInComponent from "./components/LogInComponent";
import SignUpComponent from "./components/SignUpComponent";
import ToDoComponent from "./components/ToDoComponent";
import { Routes, Route, BrowserRouter } from "react-router-dom";

function App() {
  return (
    // <Fragment>
    //   <ToDoComponent></ToDoComponent>
    // </Fragment>

    <main className="main-content">

        <Routes>
          <Route path="/" element={<SignUpComponent />} />
          <Route path="/login" element={<LogInComponent />} />
          <Route path="/todo" element={<ToDoComponent />} />
        </Routes>

    </main>
  );
}

export default App;
