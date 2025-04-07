import "./App.css";
import LogInComponent from "./components/LogInComponent";
import SignUpComponent from "./components/SignUpComponent";
import ToDoComponent from "./components/ToDoComponent";
import { Routes, Route, Navigate } from "react-router-dom";
import NavbarComponent from "./components/NavBarComponent";
import AuthContextProvider from "./context/AuthContext";
import { useAuthContext } from "./hooks/useAuthContext";

function App() {
  return (
    <AuthContextProvider>
      <main className="main-content">
        <NavbarComponent />
        <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
          <Route
            path="/signup"
            element={
              <ProtectedRoute redirectTo="/todo" inverse>
                <SignUpComponent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/login"
            element={
              <ProtectedRoute redirectTo="/todo" inverse>
                <LogInComponent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/todo"
            element={
              <ProtectedRoute redirectTo="/login">
                <ToDoComponent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </AuthContextProvider>
  );
}

function ProtectedRoute({ children, redirectTo, inverse = false }) {
  const { user } = useAuthContext();

  const shouldRedirect = inverse ? !!user : !user;

  return shouldRedirect ? <Navigate to={redirectTo} /> : children;
}

export default App;
