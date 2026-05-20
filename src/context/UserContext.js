import { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [nickname, setNickname] = useState("새싹");
  const [profileEmoji, setProfileEmoji] = useState("🌱");
  const [focusCount, setFocusCount] = useState(0);

  useEffect(() => {
    const loadEmoji = async () => {
      const saved = await AsyncStorage.getItem("profileEmoji");
      if (saved) setProfileEmoji(saved);
    };
    loadEmoji();
  }, []);

  const handleSetProfileEmoji = (emoji) => {
    setProfileEmoji(emoji);
    AsyncStorage.setItem("profileEmoji", emoji);
  };

  const incrementFocusCount = () => setFocusCount((prev) => prev + 1);

  return (
    <UserContext.Provider
      value={{
        nickname,
        setNickname,
        profileEmoji,
        setProfileEmoji: handleSetProfileEmoji,
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
