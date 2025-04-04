import "./App.css";
import LogInComponent from "./components/LogInComponent";
import SignUpComponent from "./components/SignUpComponent";
import ToDoComponent from "./components/ToDoComponent";
import { Routes, Route } from "react-router-dom";
import NavbarComponent from "./components/NavBarComponent";
import AuthContextProvider from "./context/AuthContext";



function App() {
  return (
    <AuthContextProvider>
    <main className="main-content">
      <NavbarComponent />
      <Routes>
          <Route path="/signup" element={<SignUpComponent />} />
          <Route path="/login" element={<LogInComponent />} />
          <Route path="/todo" element={<ToDoComponent />} />
      </Routes>
      </main>
    </AuthContextProvider>
 
  );
}

export default App;
