import "@testing-library/jest-dom";
import LogInComponent from "./LogInComponent";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthContextProvider } from "../context/AuthContext";

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthContextProvider>
      <BrowserRouter>
        {children}
      </BrowserRouter>
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
});

