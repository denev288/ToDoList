import React, { useState } from "react";
import api from '../utils/axiosConfig';
import { Link, useNavigate } from "react-router-dom";
import useAuthContext from "../hooks/useAuthContext";
import "../css/LoginComponentStyle.css";
import {
  MDBBtn,
  MDBContainer,
  MDBCard,
  MDBCardBody,
  MDBCardImage,
  MDBRow,
  MDBCol,
  MDBInput
} from 'mdb-react-ui-kit';

function LogInComponent() {
  const [errorMessage, setErrorMessage] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const { dispatch } = useAuthContext();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) {
      setErrorMessage("Email is required");
      return;
    }
    if (!password.trim()) {
      setErrorMessage("Password is required");
      return;
    }

    api
      .post(`/login`, { email, password })
      .then((result) => {
        if (result?.data) {
          localStorage.setItem("user", JSON.stringify(result.data));
          localStorage.setItem('refreshToken', result.data.refreshToken);
          dispatch({ type: "LOGIN", payload: result.data });
          navigate("/todo");
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
    <MDBContainer className='my-5'>
      <MDBCard>
        <MDBRow className='g-0 d-flex align-items-center'>
          <MDBCol md='4'>
            <MDBCardImage
              src='https://mdbootstrap.com/img/new/ecommerce/vertical/004.jpg'
              alt='phone'
              className='rounded-t-5 rounded-tr-lg-0'
              fluid
            />
          </MDBCol>
          <MDBCol md='8'>
            <MDBCardBody>
              <h2 className="mb-4">Login</h2>
              <form onSubmit={handleSubmit}>
                <MDBInput
                  wrapperClass='mb-4'
                  label='Email address'
                  id='form1'
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  name="email"
                />
                <MDBInput
                  wrapperClass='mb-4'
                  label='Password'
                  id='form2'
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="off"
                  name="password"
                />
               
                {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
                <MDBBtn className="mb-4 w-100" type="submit">Sign in</MDBBtn>
              </form>
              <p>Don't have an account?</p>
              <Link
                to={"/signup"}
                className="btn btn-default border w-100 bg-light rounded-0"
              >
                Sign Up
              </Link>
            </MDBCardBody>
          </MDBCol>
        </MDBRow>
      </MDBCard>
    </MDBContainer>
  );
}

export default LogInComponent;