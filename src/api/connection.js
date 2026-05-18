import client from "./client";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 연결 추천 요청
export const recommendConnection = async (recordId) => {
  const userId = await AsyncStorage.getItem("userId");
  const response = await client.post("/connections/recommend", {
    userId: Number(userId),
    recordId,
  });
  return response.data;
};

// 연결 추천 결과 조회
export const getRecommendResult = async (recordId) => {
  const response = await client.get(`/connections/recommend/${recordId}`);
  return response.data;
};

// 연결 생성
export const createConnection = async (sourceRecordId, targetRecordId) => {
  const response = await client.post("/connections", {
    sourceRecordId,
    targetRecordId,
  });
  return response.data;
};

// 연결 조회
export const getConnections = async (recordId) => {
  const response = await client.get(`/connections/${recordId}`);
  return response.data;
};

// 연결 삭제
export const deleteConnection = async (linkId) => {
  const response = await client.delete(`/connections/${linkId}`);
  return response.data;
};
