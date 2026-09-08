import React, { createContext, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

export const Context = createContext({
  isAuthorized: false,
  isLoading: true,
});

const AppWrapper = () => {
  const initialUser = (() => {
    try {
      const stored = localStorage.getItem("job_portal_user");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  })();
  const hasUser = Boolean(initialUser && initialUser._id);
  const [isAuthorized, setIsAuthorized] = useState(hasUser);
  const [user, setUserState] = useState(initialUser);
  const [isLoading, setIsLoading] = useState(!hasUser);

  const setUser = (newUser) => {
    setUserState(newUser);
    try {
      if (newUser && newUser._id) {
        localStorage.setItem("job_portal_user", JSON.stringify(newUser));
      } else {
        localStorage.removeItem("job_portal_user");
      }
    } catch (e) {}
  };

  return (
    <Context.Provider
      value={{
        isAuthorized,
        setIsAuthorized,
        user,
        setUser,
        isLoading,
        setIsLoading,
      }}
    >
      <App />
    </Context.Provider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);
