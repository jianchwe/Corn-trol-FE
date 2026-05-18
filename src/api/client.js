import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const client = axios.create({
  baseURL: "http://13.125.241.12:8080",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청마다 토큰 자동 첨부
client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 에러 처리
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 시 처리 (추후 자동 갱신)
      await AsyncStorage.removeItem("accessToken");
    }
    return Promise.reject(error);
  },
);

export default client;
