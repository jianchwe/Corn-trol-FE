import { createContext, useContext, useState } from "react";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [nickname, setNickname] = useState("새싹");
  const [profileEmoji, setProfileEmoji] = useState("🌱");
  const [focusCount, setFocusCount] = useState(0);

  const incrementFocusCount = () => setFocusCount((prev) => prev + 1);

  return (
    <UserContext.Provider
      value={{
        nickname,
        setNickname,
        profileEmoji,
        setProfileEmoji,
        focusCount,
        incrementFocusCount,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
