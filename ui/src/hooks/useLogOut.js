import { useAuthContext } from "../hooks/useAuthContext";

export function useLogOut() {
    const {dispatch} = useAuthContext();


    const logOut = () => {
        localStorage.removeItem('user');
        dispatch({type: 'LOGOUT'});

    }
    return {logOut};
}