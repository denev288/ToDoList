import "@testing-library/jest-dom";
import { fireEvent, render, waitFor } from "@testing-library/react";
import LogInComponent from "./LogInComponent";
import { BrowserRouter } from "react-router-dom";
import { AuthContextProvider } from "../context/AuthContext";
import axios from 'axios';

// Mock the environment variables
jest.mock("../config", () => ({
  VITE_APIURL: "https://todolist-jr6y.onrender.com",
}));

// Add axios mock
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthContextProvider>
      <BrowserRouter>{children}</BrowserRouter>
    </AuthContextProvider>
  );
};

describe("LogInComponent", () => {
  it("should render without crashing", () => {
    const { container } = render(
      <TestWrapper>
        <LogInComponent />
      </TestWrapper>
    );

    expect(container).toBeInTheDocument();
  });

  it("should display the login form", () => {
    const { getAllByText, getByLabelText } = render(
      <TestWrapper>
        <LogInComponent />
      </TestWrapper>
    );

    expect(getByLabelText(/Email/i)).toBeInTheDocument();
    expect(getByLabelText(/Password/i)).toBeInTheDocument();
    expect(getAllByText(/Login/i)).toHaveLength(2); // Check for both instances of "Login"
  });
  it("password input should be of type password", () => {
    const { getByLabelText } = render(
      <TestWrapper>
        <LogInComponent />
      </TestWrapper>
    );

    const passwordInput = getByLabelText(/Password/i) as HTMLInputElement;
    expect(passwordInput.type).toBe("password");
  });
  it("email input should be of type text", () => {
    const { getByLabelText } = render(
      <TestWrapper>
        <LogInComponent />
      </TestWrapper>
    );

    const emailInput = getByLabelText(/Email/i) as HTMLInputElement;
    expect(emailInput.type).toBe("text");
  });
  it("should have a submit button", () => {
    const { getByRole } = render(
      <TestWrapper>
        <LogInComponent />
      </TestWrapper>
    );

    const submitButton = getByRole("button", { name: /Login/i });
    expect(submitButton).toBeInTheDocument();
  });
  it("should have a link to sign up", () => {
    const { getByRole } = render(
      <TestWrapper>
        <LogInComponent />
      </TestWrapper>
    );

    const signUpLink = getByRole("link", { name: /Sign Up/i });
    expect(signUpLink).toBeInTheDocument();
  });
  it("should login successfully", async () => {
    // Mock successful axios response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        email: "ivan@qwe.qwe",
        token: "fake-token",
        refreshToken: "fake-refresh-token"
      }
    });

    const { getByLabelText, getByRole } = render(
      <TestWrapper>
        <LogInComponent />
      </TestWrapper>
    );

    const emailInput = getByLabelText(/Email/i);
    const passwordInput = getByLabelText(/Password/i);
    const submitButton = getByRole("button", { name: /Login/i });

    // Use fireEvent to simulate user input
    fireEvent.change(emailInput, { target: { value: "ivan@qwe.qwe" } });
    fireEvent.change(passwordInput, { target: { value: "Ivan123!" } });
    
    // Simulate form submission
    fireEvent.click(submitButton);

    // Check if axios was called with correct data
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining("/login"),
        {
          email: "ivan@qwe.qwe",
          password: "Ivan123!"
        }
      );
    });
  });
});
