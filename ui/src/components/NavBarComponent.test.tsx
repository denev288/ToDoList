import "@testing-library/jest-dom";
import {
  fireEvent,
  render,
  waitFor,
  act,
  screen,
} from "@testing-library/react";
import NavBarComponent from "./NavBarComponent";
import { BrowserRouter } from "react-router-dom";
import { AuthContextProvider } from "../context/AuthContext";
import axios from "axios";

// Mock the environment variables
jest.mock("../config", () => ({
  VITE_APIURL: "https://todolist-jr6y.onrender.com",
}));

// Add axios mock
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthContextProvider>
      <BrowserRouter>{children}</BrowserRouter>
    </AuthContextProvider>
  );
};

describe("NavBarComponent", () => {
  const mockUser = {
    email: "test@test.com",
    token: "fake-token",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem("user", JSON.stringify(mockUser));
  });
  
  afterEach(() => {
    localStorage.clear();
  });

  it("renders the NavBarComponent", () => {
    render(
      <TestWrapper>
        <NavBarComponent />
      </TestWrapper>
    );
    // Check for specific elements that we know exist
    expect(screen.getByRole('button', { name: /find friends/i })).toBeInTheDocument();
  });

  it("shows welcome message with user email when logged in", () => {
    render(
      <TestWrapper>
        <NavBarComponent />
      </TestWrapper>
    );
    // Look for the welcome text container
    const welcomeMessage = screen.getByText((content) => {
      return content.includes('Welcome:') && content.includes('test@test.com');
    });
    expect(welcomeMessage).toBeInTheDocument();
  });

  it("shows dropdown menu when clicking welcome message", async () => {
    render(
      <TestWrapper>
        <NavBarComponent />
      </TestWrapper>
    );
    
    // Click on the welcome message span
    const welcomeSpan = screen.getByText((content) => 
      content.includes('Welcome:') && content.includes('test@test.com')
    );
    fireEvent.click(welcomeSpan);

    // Check for dropdown items
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /find friends/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
    });
  });

  it("handles logout correctly", async () => {
    render(
      <TestWrapper>
        <NavBarComponent />
      </TestWrapper>
    );
    
    const logoutButton = screen.getByRole('button', { name: /log out/i });
    fireEvent.click(logoutButton);

    expect(localStorage.getItem("user")).toBeNull();
  });
});
