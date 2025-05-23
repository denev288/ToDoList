import "@testing-library/jest-dom";
import { fireEvent, render, waitFor, act, screen } from "@testing-library/react";
import NavBarComponent from "./NavBarComponent";
import { MemoryRouter } from "react-router-dom";
import { AuthContextProvider } from "../context/AuthContext";
import axios from "axios";

const mockNavigate = jest.fn();

// Mocks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../hooks/useAuthContext', () => ({
  __esModule: true,
  default: () => ({
    user: { email: "test@test.com" },
    dispatch: jest.fn()
  })
}));

jest.mock("../config", () => ({
  VITE_APIURL: "https://todolist-jr6y.onrender.com",
}));

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <MemoryRouter>
      <AuthContextProvider>{children}</AuthContextProvider>
    </MemoryRouter>
  );
};

describe("NavBarComponent", () => {
  const mockUser = {
    email: "test@test.com",
    token: "fake-token",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
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

  it("opens edit profile modal when clicking profile button", async () => {
    render(
      <TestWrapper>
        <NavBarComponent />
      </TestWrapper>
    );

    // Open dropdown
    const welcomeSpan = screen.getByText((content) => 
      content.includes('Welcome:') && content.includes('test@test.com')
    );
    fireEvent.click(welcomeSpan);

    // Click profile button - use correct text content
    const profileButton = screen.getByText('Edit User');
    fireEvent.click(profileButton);

    // Verify modal is opened - use correct text content
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
  });

  it("opens find friends modal when clicking find friends button", async () => {
    render(
      <TestWrapper>
        <NavBarComponent />
      </TestWrapper>
    );

    // Click friends button
    const friendsButton = screen.getByText('Find Friends');
    fireEvent.click(friendsButton);

    // Verify modal is opened
    expect(screen.getByRole('heading', { name: /find friends/i })).toBeInTheDocument();
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
