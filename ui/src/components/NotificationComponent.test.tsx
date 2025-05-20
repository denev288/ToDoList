import "@testing-library/jest-dom";
import { fireEvent, render, waitFor, screen } from "@testing-library/react";
import NotificationComponent from "./NotificationComponent";
import { BrowserRouter } from "react-router-dom";
import { AuthContextProvider } from "../context/AuthContext";
import axios from "axios";

window.alert = jest.fn();
// Mock the environment variables
jest.mock("../config", () => ({
  VITE_APIURL: "https://todolist-jr6y.onrender.com",
}));

// Add axios mock
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockNotifications = [
  {
    _id: "1",
    type: "task",
    message: "Test notification",
    read: false,
    createdAt: new Date().toISOString()
  },
  {
    _id: "2",
    type: "friend_request",
    message: "Friend request from user",
    read: false,
    createdAt: new Date().toISOString(),
    relatedId: "123",
    senderEmail: "friend@test.com"
  }
];

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthContextProvider>
      <BrowserRouter>{children}</BrowserRouter>
    </AuthContextProvider>
  );
};

describe("NotificationComponent", () => {
  const mockUser = {
    email: "test@test.com",
    token: "fake-token",
    refreshToken: "fake-refresh-token" // Add refresh token
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem("user", JSON.stringify(mockUser));
    mockedAxios.get.mockResolvedValue({ data: mockNotifications });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders notification icon", () => {
    render(
      <TestWrapper>
        <NotificationComponent />
      </TestWrapper>
    );
    expect(screen.getByTestId("notification-button")).toBeInTheDocument();
  });

  it("shows notification badge when there are unread notifications", async () => {
    render(
      <TestWrapper>
        <NotificationComponent />
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });

  it("opens notification dropdown on click", async () => {
    render(
      <TestWrapper>
        <NotificationComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    const notificationButton = screen.getByTestId("notification-button");
    fireEvent.click(notificationButton);

    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByTestId("task-notification-message")).toHaveTextContent("Test notification");
  });

  it("shows friend request actions for friend request notifications", async () => {
    render(
      <TestWrapper>
        <NotificationComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    const notificationButton = screen.getByTestId("notification-button");
    fireEvent.click(notificationButton);

    expect(screen.getByTestId("friend-request-message")).toHaveTextContent(/friend request from/i);
    expect(screen.getByTestId("accept-request")).toBeInTheDocument();
    expect(screen.getByTestId("reject-request")).toBeInTheDocument();
  });

  it("marks notifications as read when opening dropdown", async () => {
    mockedAxios.post.mockResolvedValueOnce({});
    
    render(
      <TestWrapper>
        <NotificationComponent />
      </TestWrapper>
    );

    // Wait for initial notifications to load
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    const notificationButton = screen.getByTestId("notification-button");
    fireEvent.click(notificationButton);

    // Use mock timer to allow for state updates
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining("/notifications/read"),
      {},
      expect.any(Object)
    );
  });

  it("clears all notifications when clicking clear all", async () => {
    mockedAxios.delete.mockResolvedValueOnce({});
    
    render(
      <TestWrapper>
        <NotificationComponent />
      </TestWrapper>
    );

    const notificationButton = screen.getByTestId("notification-button");
    fireEvent.click(notificationButton);

    await waitFor(() => {
      const clearButton = screen.getByRole("button", { name: /clear all/i });
      fireEvent.click(clearButton);
    });

    expect(mockedAxios.delete).toHaveBeenCalledWith(
      expect.stringContaining("/notifications/clear"),
      expect.any(Object)
    );
  });

  it("handles fetch notifications error and token refresh", async () => {
    // Mock initial error
    mockedAxios.get.mockRejectedValueOnce({ 
      response: { status: 401 } 
    });
    
    // Mock refresh token success
    mockedAxios.post.mockResolvedValueOnce({ 
      data: { token: "new-token" } 
    });
    
    // Mock retry success
    mockedAxios.get.mockResolvedValueOnce({ 
      data: mockNotifications 
    });

    render(
      <TestWrapper>
        <NotificationComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining("/refresh"),
        { refreshToken: mockUser.refreshToken } // Match exact payload
      );
    });

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });
  });

  it("handles mark as read error and token refresh", async () => {
    // Setup mocks in correct order
    mockedAxios.get.mockResolvedValueOnce({ data: mockNotifications });
    mockedAxios.post
      .mockRejectedValueOnce({ response: { status: 401 } }) // First mark as read fails
      .mockResolvedValueOnce({ data: { token: "new-token" } }) // Refresh succeeds 
      .mockResolvedValueOnce({}); // Retry mark as read succeeds

    render(
      <TestWrapper>
        <NotificationComponent />
      </TestWrapper>
    );

    // Wait for initial notifications to load
    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    const notificationButton = screen.getByTestId("notification-button");
    fireEvent.click(notificationButton);

    // Wait for all operations to complete
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledTimes(3);
    });

    expect(mockedAxios.post).toHaveBeenLastCalledWith(
      expect.stringContaining("/notifications/read"),
      {},
      expect.any(Object)
    );
  });  

  it("handles friend request actions and token refresh", async () => {
    mockedAxios.post.mockRejectedValueOnce({ 
      response: { status: 401 } 
    }).mockResolvedValueOnce({ 
      data: { token: "new-token" } 
    }).mockResolvedValueOnce({});

    render(
      <TestWrapper>
        <NotificationComponent />
      </TestWrapper>
    );

    const notificationButton = screen.getByTestId("notification-button");
    fireEvent.click(notificationButton);

    const acceptButton = await screen.findByTestId("accept-request");
    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining("/friends/handle"),
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  it("handles friend request error cases", async () => {
    mockedAxios.post.mockRejectedValueOnce({ 
      response: { 
        status: 400,
        data: { message: "Invalid request" } 
      } 
    });

    render(
      <TestWrapper>
        <NotificationComponent />
      </TestWrapper>
    );

    const notificationButton = screen.getByTestId("notification-button");
    fireEvent.click(notificationButton);

    const rejectButton = await screen.findByTestId("reject-request");
    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining("/friends/handle"),
        expect.any(Object),
        expect.any(Object)
      );
    });
  });
});
