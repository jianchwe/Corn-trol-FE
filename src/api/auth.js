import client from "./client";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const sendVerificationEmail = async (email) => {
  const response = await client.post("/auth/email/send", { email });
  return response.data;
};

export const verifyEmail = async (email, code) => {
  const response = await client.post("/auth/email/verify", { email, code });
  return response.data;
};

export const signup = async (email, password, nickname) => {
  const response = await client.post("/auth/signup", {
    email,
    password,
    nickname,
  });
  return response.data;
};

export const login = async (email, password) => {
  const response = await client.post("/auth/login", { email, password });
  const { userId, token, refreshToken } = response.data;
  await AsyncStorage.setItem("accessToken", token);
  await AsyncStorage.setItem("refreshToken", refreshToken);
  await AsyncStorage.setItem("userId", String(userId));
  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await client.put("/auth/password", {
    currentPassword,
    newPassword,
  });
  return response.data;
};

export const logout = async () => {
  await client.post("/auth/logout");
  await AsyncStorage.removeItem("accessToken");
  await AsyncStorage.removeItem("refreshToken");
  await AsyncStorage.removeItem("userId");
};

export const withdraw = async () => {
  await client.delete("/auth/withdraw");
  await AsyncStorage.removeItem("accessToken");
  await AsyncStorage.removeItem("refreshToken");
  await AsyncStorage.removeItem("userId");
};
