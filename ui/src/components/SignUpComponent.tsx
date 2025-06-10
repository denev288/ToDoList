import "../css/SignUpComponentSryle.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { useState } from "react";
import  useAuthContext  from "../hooks/useAuthContext";
import { Link, useNavigate } from "react-router-dom";
import api from '../utils/axiosConfig';

function SignUpComponent() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const { dispatch } = useAuthContext();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    api
      .post(`/register`, { name, email, password })
      .then((result) => {
        if (result) {
          localStorage.setItem("user", JSON.stringify(result.data));

          //update auth context
          dispatch({ type: "LOGIN", payload: result.data });
          navigate("/login");
        }
      })
      .catch((error) => {
        if (error.response?.data?.message) {
          setErrorMessage(error.response.data.message);
        } else {
          setErrorMessage("An error occurred. Please try again.");
        }
      });
  }

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="bg-light p-3 rounded w-80">
        <h2>Register</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="name">
              <strong>Name</strong>
            </label>
            <input
              type="text"
              placeholder="Enter Name"
              autoComplete="off"
              name="name"
              value={name}
              className="form-control rounded-0"
              onChange={(e) => setName(e.target.value)}
            />
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
            {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
            <button type="submit" className="btn btn-success w-100 rounded-0">
              Register
            </button>
          </div>
        </form>
        <p>Already Have an Account?</p>
        <Link
          type="submit"
          to={"/login"}
          className="btn btn-success w-100 rounded-0"
        >
          Login
        </Link>
      </div>
    </div>
  );
}

export default SignUpComponent;
