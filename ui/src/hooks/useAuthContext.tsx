import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

// Custom hook to use the auth context
const useAuthContext = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw Error("useAuthContext must be used inside an AuthContextProvider");
    }

    return context;
}

export default useAuthContext;