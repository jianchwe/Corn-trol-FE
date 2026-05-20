import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const client = axios.create({
  baseURL: "http://13.125.241.12:8080",
  timeout: 120000, // 2분 - Render 슬립 대응
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // 무한 루프 방지

      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("no refresh token");

        // 토큰 재발급
        const response = await axios.post(
          "http://13.125.241.12:8080/auth/refresh",
          { refreshToken },
        );
        const newAccessToken = response.data.accessToken;

        // 새 토큰 저장
        await AsyncStorage.setItem("accessToken", newAccessToken);

        // 실패했던 요청 새 토큰으로 재시도
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return client(originalRequest);
      } catch (e) {
        // 리프레시도 실패 시 완전 로그아웃
        await AsyncStorage.removeItem("accessToken");
        await AsyncStorage.removeItem("refreshToken");
        await AsyncStorage.removeItem("userId");
      }
    }

    return Promise.reject(error);
  },
);

export default client;
