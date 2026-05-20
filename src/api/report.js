import client from "./client";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const getAntiPopcornReport = async () => {
  const userId = await AsyncStorage.getItem("userId");
  const response = await client.get(`/report/${userId}`);
  return response.data;
};

export const getFocusTimeReport = async () => {
  const userId = await AsyncStorage.getItem("userId");
  const response = await client.get(`/report/${userId}/focus`);
  return response.data;
};

export const getConnectionDensityReport = async () => {
  const userId = await AsyncStorage.getItem("userId");
  const response = await client.get(`/report/${userId}/connection`);
  return response.data;
};
