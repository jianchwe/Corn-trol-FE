import client from "./client";
import AsyncStorage from "@react-native-async-storage/async-storage";

// AI 질문 생성 요청
export const requestQuestions = async (recordId, topic) => {
  const userId = await AsyncStorage.getItem("userId");
  const response = await client.post("/focus/questions", {
    userId: Number(userId),
    recordId,
    topic,
  });
  return response.data;
};

// 질문 조회
export const getQuestions = async (recordId) => {
  const response = await client.get(`/focus/questions/${recordId}`);
  return response.data;
};

// 집중 모드 시작
export const startFocus = async (recordId, duration) => {
  const userId = await AsyncStorage.getItem("userId");
  const response = await client.post("/focus/start", {
    userId: Number(userId),
    recordId,
    duration,
  });
  return response.data; // sessionId 반환
};

// 집중 모드 종료
export const endFocus = async (sessionId) => {
  const response = await client.post("/focus/end", { sessionId });
  return response.data;
};
