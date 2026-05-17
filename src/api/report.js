import client from "./client";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 안티팝콘 리포트 조회
export const getAntiPopcornReport = async () => {
  const userId = await AsyncStorage.getItem("userId");
  const response = await client.get(`/report/${userId}`);
  return response.data;
};

// 포커스 시간 통계 조회
export const getFocusTimeReport = async () => {
  const userId = await AsyncStorage.getItem("userId");
  const response = await client.get(`/report/${userId}/focus`);
  return response.data;
};

// 연결 밀도 조회
export const getConnectionDensityReport = async () => {
  const userId = await AsyncStorage.getItem("userId");
  const response = await client.get(`/report/${userId}/connection`);
  return response.data;
};
