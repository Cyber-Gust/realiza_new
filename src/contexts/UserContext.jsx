"use client";

import { createContext, useContext } from "react";

export const UserContext = createContext(null);

export function UserProvider({ user, profile, children }) {
  return (
    <UserContext.Provider value={{ user, profile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
