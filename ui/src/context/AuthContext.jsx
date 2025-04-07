import { createContext, useReducer, useEffect } from "react";

export const AuthContext = createContext();

export const authReducer = (state, action) => {
    switch (action.type) {
        case "LOGIN":
            return { user: action.payload };
        case "LOGOUT":
            return { user: null };
        default:
            return state;
    }
}
export const useAuthContext = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw Error("useAuthContext must be used inside an AuthContextProvider");
    }

    return context;
}

 export const AuthContextProvider = ({ children }) => { 
    const [state, dispatch] = useReducer(authReducer, {
        user: null,
    })

    // Check if user is logged in when the app loads
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user) {
            dispatch({ type: "LOGIN", payload: user });
        }
    }, []);
    


    return(
        <AuthContext.Provider value={{ ...state, dispatch }}>
        {children}
    </AuthContext.Provider>
    )
 }

export default AuthContextProvider;
