import "@testing-library/jest-dom";
import { fireEvent, render, waitFor, screen } from "@testing-library/react";
import EditUserModal from "../EditUserModal";
import { BrowserRouter } from "react-router-dom";
import { AuthContextProvider } from "../../context/AuthContext";
import axios from "axios";

jest.mock("../../config", () => ({
  VITE_APIURL: "https://todolist-jr6y.onrender.com",
}));

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockUser = {
  email: "test@test.com",
  name: "Test User",
  token: "fake-token",
  refreshToken: "fake-refresh-token"
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthContextProvider>
      <BrowserRouter>{children}</BrowserRouter>
    </AuthContextProvider>
  );
};

describe("EditUserModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem("user", JSON.stringify(mockUser));
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders edit user modal when open", () => {
    render(
      <TestWrapper>
        <EditUserModal 
          isOpen={true}
          onClose={() => {}}
          currentUser={mockUser}
        />
      </TestWrapper>
    );

    expect(screen.getByText("Edit Profile")).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockUser.name)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockUser.email)).toBeInTheDocument();
  });

  it("handles successful user update", async () => {
    mockedAxios.patch.mockResolvedValueOnce({
      data: {
        ...mockUser,
        name: "Updated Name",
        email: "updated@test.com"
      }
    });

    const onCloseMock = jest.fn();

    render(
      <TestWrapper>
        <EditUserModal 
          isOpen={true}
          onClose={onCloseMock}
          currentUser={mockUser}
        />
      </TestWrapper>
    );

    const nameInput = screen.getByPlaceholderText("Enter new name");
    const emailInput = screen.getByPlaceholderText("Enter new email");
    
    fireEvent.change(nameInput, {
      target: { value: "Updated Name" }
    });
    
    fireEvent.change(emailInput, {
      target: { value: "updated@test.com" }
    });

    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        expect.stringContaining("/user/update"), // Fix endpoint
        {
          name: "Updated Name",
          email: "updated@test.com",
          password: "" // Add password field
        },
        expect.any(Object)
      );
    });

    expect(onCloseMock).toHaveBeenCalled();
  });

  it("handles token refresh during update", async () => {
    mockedAxios.patch
      .mockRejectedValueOnce({ response: { status: 401 } })
      .mockResolvedValueOnce({ data: mockUser });

    mockedAxios.post.mockResolvedValueOnce({
      data: { token: "new-token" }
    });

    render(
      <TestWrapper>
        <EditUserModal 
          isOpen={true}
          onClose={() => {}}
          currentUser={mockUser}
        />
      </TestWrapper>
    );

    const nameInput = screen.getByPlaceholderText("Enter new name");
    fireEvent.change(nameInput, {
      target: { value: "New Name" }
    });

    fireEvent.click(screen.getByText("Save Changes"));
    
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining("/refresh"),
        { refreshToken: mockUser.refreshToken }
      );
    });

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
    });
  });  

  it("closes modal on cancel", () => {
    const onCloseMock = jest.fn();

    render(
      <TestWrapper>
        <EditUserModal 
          isOpen={true}
          onClose={onCloseMock}
          currentUser={mockUser}
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCloseMock).toHaveBeenCalled();
  });
});
