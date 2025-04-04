import "./App.css";
import LogInComponent from "./components/LogInComponent";
import SignUpComponent from "./components/SignUpComponent";
import ToDoComponent from "./components/ToDoComponent";
import { Routes, Route, Navigate } from "react-router-dom";
import NavbarComponent from "./components/NavBarComponent";
import AuthContextProvider from "./context/AuthContext";
import { useAuthContext } from "./hooks/useAuthContext";



function App() {

  const { user } = useAuthContext();

  return (
    <AuthContextProvider>
    <main className="main-content">
      <NavbarComponent />
      <Routes>
          <Route path="/signup" element={ !user ? <SignUpComponent /> : <Navigate to="/todo"/>} />
          <Route path="/login" element={ !user ? <LogInComponent /> : <Navigate to="/todo"/>} />
          <Route path="/todo" element={user ? <ToDoComponent /> : <Navigate to="/login"/>} />

      </Routes>
      </main>
    </AuthContextProvider>
 
  );
}

export default App;
