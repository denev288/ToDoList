import "@testing-library/jest-dom";
import { fireEvent, render, waitFor, act, screen } from "@testing-library/react";
import ToDoComponent from "./ToDoComponent";
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

// Add mock user data before the tests
const mockUser = {
  email: "test@test.com",
  token: "fake-token",
  refreshToken: "fake-refresh-token",
};

// Mock useAuthContext at the top level
jest.mock("../hooks/useAuthContext", () => ({
  __esModule: true,
  default: () => ({
    user: mockUser,
  }),
}));

const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn() as jest.MockedFunction<typeof console.error>;
});

afterAll(() => {
  console.error = originalConsoleError;
});

beforeEach(() => {
  jest.clearAllMocks();
  (console.error as jest.MockedFunction<typeof console.error>).mockClear();
  localStorage.setItem("user", JSON.stringify(mockUser));
  window.alert = jest.fn();
});

// Helper function to render with act and wait for effects
const renderWithAct = async (component: React.ReactElement) => {
  let renderResult;
  await act(async () => {
    renderResult = render(component);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return renderResult!;
};

describe("ToDoComponent", () => {
  // Helper function to add a task in tests
  const addTestTask = async ({ 
    getByRole, 
    taskText = "Test Task", 
    taskDescription = "Test Description" 
  }: { 
    getByRole: (role: string, options?: { name?: RegExp }) => HTMLElement; 
    taskText?: string; 
    taskDescription?: string; 
  }) => {
    const addNewTaskButton = getByRole("button", { name: /create new task/i });
    fireEvent.click(addNewTaskButton);

    const taskInput = getByRole("textbox", { name: /title/i });
    const descriptionInput = getByRole("textbox", { name: /description/i });
    const submitButton = getByRole("button", { name: /add/i }); 

    await act(async () => {
      fireEvent.change(taskInput, { target: { value: taskText } });
      fireEvent.change(descriptionInput, { target: { value: taskDescription } });
      fireEvent.click(submitButton);
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    localStorage.setItem("user", JSON.stringify(mockUser));
    window.alert = jest.fn();

    // Mock axios responses - add patch to the mocks
    mockedAxios.get.mockResolvedValue({ data: [] });
    mockedAxios.patch.mockResolvedValue({ data: {} });
    mockedAxios.post.mockImplementation((url) => {
      if (url.includes("/refresh")) {
        return Promise.resolve({
          data: { token: "new-token" },
        });
      }
      return Promise.resolve({ data: {} });
    });

    // Wait for initial data fetch
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });

  afterEach(() => {
    localStorage.clear();
    jest.resetAllMocks();
  });

  it("should render without crashing", async () => {
    const { container } = await renderWithAct(
      <TestWrapper>
        <ToDoComponent />
      </TestWrapper>
    );
    expect(container).toBeInTheDocument();
  });

  it("should display the add new task button", async () => {
    const { getByRole } = await renderWithAct(
      <TestWrapper>
        <ToDoComponent />
      </TestWrapper>
    );
    const getButton = getByRole("button", { name: /create new task/i });
    expect(getButton).toBeInTheDocument();
    expect(getButton).toHaveTextContent("Create New Task");
  });

  it("should display the task list", async () => {
    const { getByRole } = await renderWithAct(
      <TestWrapper>
        <ToDoComponent />
      </TestWrapper>
    );
    const taskList = getByRole("heading", { name: /To Do List/i });
    expect(taskList).toBeInTheDocument();
  });

  it("should diplay the complete list", async () => {
    const { getByRole } = await renderWithAct(
      <TestWrapper>
        <ToDoComponent />
      </TestWrapper>
    );
    const completeList = getByRole("heading", { name: /completed/i });
    expect(completeList).toBeInTheDocument();
  });

  it("should display the add new task modal", async () => {
    const { getByRole } = await renderWithAct(
      <TestWrapper>
        <ToDoComponent />
      </TestWrapper>
    );
    const addNewTaskButton = getByRole("button", { name: /create new task/i });
    fireEvent.click(addNewTaskButton);
    const modalTitle = getByRole("heading", { name: /add new task/i });
    const taskInput = getByRole("textbox", { name: /title/i });
    const descriptionInput = getByRole("textbox", { name: /description/i });
    const addButton = getByRole("button", { name: /add/i }); 
    const cancelButton = getByRole("button", { name: /cancel/i });
    expect(modalTitle).toBeInTheDocument();
    expect(taskInput).toBeInTheDocument();
    expect(descriptionInput).toBeInTheDocument();
    expect(addButton).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();
    expect(addButton).toHaveTextContent("Add");
    expect(cancelButton).toHaveTextContent("Cancel");
  });

  it("should add a new task", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { id: 1, text: "Test Task", description: "Test Description" },
    });

    const { getByRole } = await renderWithAct(
      <TestWrapper>
        <ToDoComponent />
      </TestWrapper>
    );

    await addTestTask({ getByRole });

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining("/add"),
        {
          text: "Test Task",
          description: "Test Description",
        },
        expect.objectContaining({
          headers: { Authorization: "Bearer fake-token" },
        })
      );
    });
  });

  it("should share task", async () => {
    // Mock responses
    mockedAxios.get.mockImplementation(() =>
      Promise.resolve({
        data: [{ id: 1, text: "Test Task", description: "Test Description" }],
      })
    );

    mockedAxios.post.mockImplementation((url) => {
      if (url.includes("/add")) {
        return Promise.resolve({
          data: { id: 1, text: "Test Task", description: "Test Description" },
        });
      }
      if (url.includes("/share/1")) {
        return Promise.resolve({
          data: { message: "Task shared successfully" },
        });
      }
      if (url.includes("/refresh")) {
        return Promise.resolve({ data: { token: "new-token" } });
      }
      if (url.includes("/user")) {
        return Promise.resolve({
          data: {
            friendsList: [{ userId: "123", email: "friend@example.com" }],
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    const { getByRole, findByTestId } = await renderWithAct(
      <TestWrapper>
        <ToDoComponent />
      </TestWrapper>
    );

    await addTestTask({ getByRole });

    // Wait for task to appear and share it
    await waitFor(async () => {
      const shareButton = await findByTestId("share-button");
      fireEvent.click(shareButton);
      await new Promise((resolve) => setTimeout(resolve, 100)); // Give more time
    });

    // Wait for the friends list to load and select friend
    await waitFor(() => {
      const friendSelect = getByRole("combobox");
      expect(friendSelect).toBeInTheDocument();
    });

    const friendSelect = getByRole("combobox");
    fireEvent.change(friendSelect, { target: { value: "friend@example.com" } });

    const shareSubmitButton = getByRole("button", { name: /share/i });
    await act(async () => {
      fireEvent.click(shareSubmitButton);
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
  });

  it("should delete a task", async () => {
    // Mock initial GET to include the task we want to delete
    mockedAxios.get.mockImplementation(() =>
      Promise.resolve({
        data: [{ _id: "1", text: "Test Task", description: "Test Description" }],
      })
    );
    
    mockedAxios.post.mockResolvedValueOnce({
      data: { _id: "1", text: "Test Task", description: "Test Description" },
    });
    
    mockedAxios.delete.mockResolvedValueOnce({ data: {} });

    const { getByRole, findByTestId, findByText } = await renderWithAct(
      <TestWrapper>
        <ToDoComponent />
      </TestWrapper>
    );

    await addTestTask({ getByRole });

    const taskElement = await findByText("Test Task");
    expect(taskElement).toBeInTheDocument();

    // Find and click delete button
    const deleteButton = await findByTestId("delete-button");
    await act(async () => {
      fireEvent.click(deleteButton);
      // Wait for the deletion to complete
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Verify the delete API was called
    expect(mockedAxios.delete).toHaveBeenCalledWith(
      expect.stringContaining("/delete/1"),
      expect.objectContaining({
        headers: { Authorization: "Bearer fake-token" },
      })
    );
  });

  it("should complete a task", async () => {
    // Mock initial GET to include the task we want to complete
    mockedAxios.get.mockImplementation(() =>
      Promise.resolve({
        data: [{ _id: "1", text: "Test Task", description: "Test Description" }],
      })
    );

    mockedAxios.post.mockResolvedValueOnce({
      data: { _id: "1", text: "Test Task", description: "Test Description" },
    });

    const { getByRole, findByText, findByTestId } = await renderWithAct(
      <TestWrapper>
        <ToDoComponent />
      </TestWrapper>
    );

    await addTestTask({ getByRole });

    const taskElement = await findByText("Test Task");
    expect(taskElement).toBeInTheDocument();

    // Find and click complete button
    const completeButton = await findByTestId("complete-button");;
    await act(async () => {
      fireEvent.click(completeButton);
      // Wait for the completion to complete
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Verify the patch API was called with correct params
    expect(mockedAxios.patch).toHaveBeenCalledWith(
      expect.stringContaining("/update/1"),
      { completed: true },
      expect.objectContaining({
        headers: { Authorization: "Bearer fake-token" },
      })
    );
  })

  it("should edit a task", async () => {
    // Mock initial GET and POST responses
    const mockTask = {
      _id: "1", 
      text: "Test Task",
      description: "Test Description",
      completed: false
    };

    // Set up all mocks before rendering
    mockedAxios.get.mockResolvedValue({
      data: [mockTask]
    });

    mockedAxios.post.mockResolvedValueOnce({
      data: mockTask
    });  

    const { getByRole, findByText, findByTestId } = await renderWithAct(
      <TestWrapper>
        <ToDoComponent />
      </TestWrapper>
    );

    // Wait for initial task to be displayed
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    // Find and click edit button
    const editButton = await findByTestId("edit-button");
    fireEvent.click(editButton);

    // Edit the task in the modal
    const taskInput = getByRole("textbox", { name: /title/i });
    const descriptionInput = getByRole("textbox", { name: /description/i });
    const submitButton = getByRole("button", { name: /edit/i });

    fireEvent.change(taskInput, { target: { value: "Updated Task" } });
    fireEvent.change(descriptionInput, { target: { value: "Updated Description" } });
    
    // Submit changes and wait longer
    await act(async () => {
      fireEvent.click(submitButton);
      await new Promise(resolve => setTimeout(resolve, 500)); // Increased timeout
    });

    // Wait for and verify the API call
    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        expect.stringContaining("/edit/1"),
        {
          text: "Updated Task",
          description: "Updated Description",
        },
        expect.objectContaining({
          headers: { Authorization: "Bearer fake-token" },
        })
      );
    }, { timeout: 2000 }); // Increased timeout

    // Verify UI updates
    const updatedTaskElement = await findByText("Updated Task");
    expect(updatedTaskElement).toBeInTheDocument();
  });

  it("should handle token refresh failure", async () => {
    // First API call fails with 401
    mockedAxios.post.mockRejectedValueOnce({ 
      response: { status: 401 }
    });
    
    // Refresh token call fails
    mockedAxios.post.mockImplementationOnce((url) => {
      if (url.includes("/refresh")) {
        return Promise.reject(new Error("Failed to refresh token"));
      }
      return Promise.resolve({ data: {} });
    });
    
    const { getByRole } = await renderWithAct(
      <TestWrapper>
        <ToDoComponent />
      </TestWrapper>
    );

    await addTestTask({ getByRole });

    // Check for the exact error message from the component
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "Failed to refresh token", 
        expect.any(Error)
      );
    });
  });

  it("should handle task completion sync errors", async () => {
    const mockTask = {
      _id: "1",
      text: "Test Task",
      completed: false
    };

    mockedAxios.get.mockResolvedValueOnce({
      data: [mockTask]
    });

    mockedAxios.patch.mockRejectedValueOnce({
      response: { status: 500 }
    });

    const { findByTestId } = await renderWithAct(
      <TestWrapper>
        <ToDoComponent />
      </TestWrapper>
    );

    const completeButton = await findByTestId("complete-button");
    await act(async () => {
      fireEvent.click(completeButton);
    });

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "Error updating task completion:",
        expect.any(Object)
      );
    });
  });

  it("should handle network errors when fetching tasks", async () => {
    mockedAxios.get.mockRejectedValueOnce({
      response: { status: 500 }
    });

    await renderWithAct(
      <TestWrapper>
        <ToDoComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "Error fetching tasks",
        expect.any(Object)
      );
    });
  });

  it("should handle description toggle", async () => {
    const mockTask = {
      _id: "1",
      text: "Test Task",
      description: "Test Description",
      completed: false,
      showDescription: false
    };

    mockedAxios.get.mockResolvedValueOnce({
      data: [mockTask]
    });

    const { findByText } = await renderWithAct(
      <TestWrapper>
        <ToDoComponent />
      </TestWrapper>
    );

    const toggleButton = await findByText("Show Description");
    await act(async () => {
      fireEvent.click(toggleButton);
    });

    const description = await findByText("Test Description");
    expect(description).toBeInTheDocument();

    // Toggle description off
    await act(async () => {
      fireEvent.click(toggleButton);
    });

    expect(description).not.toBeInTheDocument();
  });

  it("should show different status texts based on task sharing state", async () => {
    const mockTasks = [
      {
        _id: "1",
        text: "Own Task",
        completed: false
      },
      {
        _id: "2", 
        text: "Shared By Task",
        completed: false,
        sharedBy: "other@user.com"
      },
      {
        _id: "3",
        text: "Shared With Task", 
        completed: true,
        sharedWith: "another@user.com"
      }
    ];

    mockedAxios.get.mockResolvedValueOnce({
      data: mockTasks
    });

    await renderWithAct(
      <TestWrapper>
        <ToDoComponent />
      </TestWrapper>
    );

    // Verify status texts with proper waiting
    await waitFor(() => {
      expect(screen.getByText("👤 Own task")).toBeInTheDocument();
      expect(screen.getByText("📥 Shared by: other@user.com")).toBeInTheDocument();
      expect(screen.getByText("📤 Shared with: another@user.com (Completed)")).toBeInTheDocument();
    });
  });
}); // End of describe block
