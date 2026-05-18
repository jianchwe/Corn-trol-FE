import client from "./client";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 기록 생성
export const createRecord = async (content, type = "TEXT", audioUrl = null) => {
  const userId = await AsyncStorage.getItem("userId");
  const response = await client.post("/records", {
    userId: Number(userId),
    type,
    content,
    audioUrl,
  });
  return response.data;
};

// 기록 목록 조회
export const getRecords = async (page = 0, size = 20, date = null) => {
  const userId = await AsyncStorage.getItem("userId");
  const params = {
    userId: Number(userId),
    page,
    size,
    sort: "createdAt,desc",
  };
  if (date) params.date = date;
  const response = await client.get("/records", { params });
  return response.data;
};

// 기록 상세 조회
export const getRecordDetail = async (recordId) => {
  const response = await client.get(`/records/${recordId}`);
  return response.data;
};

// 기록 수정
export const updateRecord = async (recordId, content) => {
  const response = await client.put(`/records/${recordId}`, { content });
  return response.data;
};

// 기록 삭제
export const deleteRecord = async (recordId) => {
  const response = await client.delete(`/records/${recordId}`);
  return response.data;
};

// 기록 검색
export const searchRecords = async (keyword, page = 0, size = 20) => {
  const userId = await AsyncStorage.getItem("userId");
  const response = await client.get("/records/search", {
    params: {
      userId: Number(userId),
      keyword,
      page,
      size,
    },
  });
  return response.data;
};

// 마인드맵 전체 조회
export const getMindMap = async () => {
  const userId = await AsyncStorage.getItem("userId");
  const response = await client.get("/records/mindmap", {
    params: { userId: Number(userId) },
  });
  return response.data;
};
