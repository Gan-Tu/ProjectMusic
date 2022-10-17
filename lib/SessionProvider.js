import { createContext, useContext, useReducer } from "react";

const Context = createContext();

const initialState = {
  user: "Nick Brenton"
};

function reducer(state, action) {
  switch (action.type) {
    case "set_user":
      return { ...state, user: action.user };
    case "unset_user":
      return { ...state, user: null };
    default:
      throw new Error();
  }
}
export function SessionProvider({ children }) {
  const [session, dispatch] = useReducer(reducer, initialState);
  return (
    <Context.Provider value={[session, dispatch]}>{children}</Context.Provider>
  );
}

export function useSessionContext() {
  return useContext(Context);
}
