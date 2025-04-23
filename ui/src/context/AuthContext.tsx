import { createContext, useReducer, useEffect, ReactNode } from "react";

// Define types
type User = any; // Replace with your actual user type
type AuthState = {
  user: User | null;
};
type AuthAction = 
  | { type: "LOGIN"; payload: User }
  | { type: "LOGOUT" }
  | { type: "RESET_APP_STATE" }; // Added the new action type

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthContextType = AuthState & {
  dispatch: React.Dispatch<AuthAction>;
};

export const authReducer = (state: AuthState, action: AuthAction): AuthState => {
    switch (action.type) {
        case "LOGIN":
            return { user: action.payload };
        case "LOGOUT":
            return { user: null };
        case "RESET_APP_STATE":
            return { user: null }; 
        default:
            return state;
    }
}

interface AuthContextProviderProps {
  children: ReactNode;
}

export const AuthContextProvider = ({ children }: AuthContextProviderProps) => { 
    const [state, dispatch] = useReducer(authReducer, {
        user: null,
    });

    // Check if user is logged in when the app loads
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        if (user) {
            dispatch({ type: "LOGIN", payload: user });
        }
    }, []);
    
    return (
        <AuthContext.Provider value={{ ...state, dispatch }}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContextProvider;