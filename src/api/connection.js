import client from "./client";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const recommendConnection = async (recordId) => {
  const userId = await AsyncStorage.getItem("userId");
  const response = await client.post("/connections/recommend", {
    userId: Number(userId),
    recordId,
  });
  return response.data;
};

export const getRecommendResult = async (recordId) => {
  const response = await client.get(`/connections/recommend/${recordId}`);
  return response.data;
};

export const createConnection = async (sourceRecordId, targetRecordId) => {
  const response = await client.post("/connections", {
    sourceRecordId,
    targetRecordId,
  });
  return response.data;
};

export const getConnections = async (recordId) => {
  const response = await client.get(`/connections/${recordId}`);
  return response.data;
};

export const deleteConnection = async (linkId) => {
  const response = await client.delete(`/connections/${linkId}`);
  return response.data;
};
