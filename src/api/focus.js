import client from "./client";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const requestQuestions = async (recordId, topic) => {
  const userId = await AsyncStorage.getItem("userId");
  const response = await client.post("/focus/questions", {
    userId: Number(userId),
    recordId,
    topic,
  });
  return response.data;
};

export const getQuestions = async (recordId) => {
  const response = await client.get(`/focus/questions/${recordId}`);
  return response.data;
};

export const startFocus = async (recordId, duration) => {
  const userId = await AsyncStorage.getItem("userId");
  const response = await client.post("/focus/start", {
    userId: Number(userId),
    recordId,
    duration,
  });
  return response.data;
};

export const endFocus = async (sessionId) => {
  const response = await client.post("/focus/end", { sessionId });
  return response.data;
};
