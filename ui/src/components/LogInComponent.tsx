import axios from "axios";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import  useAuthContext  from "../hooks/useAuthContext";

function LogInComponent() {
  const [errorMessage, setErrorMessage] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
 
  const apiUrl = "http://localhost:3004";

  const { dispatch } = useAuthContext();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    axios
      .post(`${apiUrl}/login`, { email, password })
      .then((result) => {
        if (result) {
          localStorage.setItem("user", JSON.stringify(result.data));
          // localStorage.setItem('accessToken', result.data.token);
          localStorage.setItem('refreshToken', result.data.refreshToken);

          //update auth context
          dispatch({ type: "LOGIN", payload: result.data });
          navigate("/todo");
        }
      })

      .catch((error) => {
        if (error.response) {
          setErrorMessage(error.response.data.message);
        } else {
          setErrorMessage("An error occurred. Please try again.");
        }
      });
  }

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="bg-light p-3 rounded w-80">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email">
              <strong>Email</strong>
            </label>
            <input
              type="text"
              placeholder="Enter Email"
              autoComplete="off"
              name="email"
              value={email}
              className="form-control rounded-0"
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="mb-3">
              <label htmlFor="email">
                <strong>Password</strong>
              </label>
              <input
                type="text"
                placeholder="Enter Password"
                autoComplete="off"
                name="password"
                value={password}
                className="form-control rounded-0"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
          <button type="submit" className="btn btn-success w-100 rounded-0">
            Login
          </button>
        </form>
        <p>Don't have and account?</p>
        <Link
          to={"/signup"}
          className="btn btn-default border w-100 bg-light rounder-0"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}

export default LogInComponent;
