import "../css/SignUpComponentSryle.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { useState } from "react";
import useAuthContext from "../hooks/useAuthContext";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/axiosConfig";
import {
  MDBBtn,
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBInput,

} from "mdb-react-ui-kit";

function SignUpComponent() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const { dispatch } = useAuthContext();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = `${firstName} ${lastName}`.trim();
    api
      .post(`/register`, { name, email, password })
      .then((result) => {
        if (result) {
          localStorage.setItem("user", JSON.stringify(result.data));
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
    <MDBContainer
      fluid
      className="p-4 background-radial-gradient overflow-hidden "
    >
      <MDBRow>
        <MDBCol
          md="6"
          className="text-center text-md-start d-flex flex-column justify-content-center"
        >
          <h1
            className="my-5 display-3 fw-bold ls-tight px-3"
            style={{ color: "hsl(218, 81%, 95%)" }}
          >
            The best App <br />
            <span style={{ color: "hsl(218, 81%, 75%)" }}>
              for your business
            </span>
          </h1>
          <p className="px-3" style={{ color: "hsl(218, 81%, 85%)" }}>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Eveniet,
            itaque accusantium odio, soluta, corrupti aliquam quibusdam tempora
            at cupiditate quis eum maiores libero veritatis? Dicta facilis sint
            aliquid ipsum atque?
          </p>
        </MDBCol>
        <MDBCol md="6" className="position-relative">
          <div
            id="radius-shape-1"
            className="position-absolute rounded-circle shadow-5-strong"
          ></div>
          <div
            id="radius-shape-2"
            className="position-absolute shadow-5-strong"
          ></div>
          <MDBCard className="my-5 bg-glass">
            <MDBCardBody className="p-5">
              <form onSubmit={handleSubmit}>
                <MDBInput
                  wrapperClass="mb-4"
                  label="First Name"
                  id="form1"
                  type="input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="off"
                  name="firstName"
                />
                <MDBInput
                  wrapperClass="mb-4"
                  label="Last Name"
                  id="form2"
                  type="input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="off"
                  name="lastName"
                />

                <MDBInput
                  wrapperClass="mb-4"
                  label="Email"
                  id="form3"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  name="email"
                />
                <MDBInput
                  wrapperClass="mb-4"
                  label="Password"
                  id="form4"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="off"
                  name="password"
                />
                {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
                <MDBBtn className="w-100 mb-4" type="submit">
                  Sign up
                </MDBBtn>
              </form>
              <p className="mt-4">Already have an account?</p>
              <Link
                to="/login"
                className="btn btn-default border w-100 bg-light rounded-0"
              >
                Login
              </Link>
            </MDBCardBody>
          </MDBCard>
        </MDBCol>
      </MDBRow>
    </MDBContainer>
  );
}

export default SignUpComponent;
