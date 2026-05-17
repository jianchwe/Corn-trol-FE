import client from "./client";

// 기록 분석 결과 조회
export const getAnalysis = async (recordId) => {
  const response = await client.get(`/analysis/${recordId}`);
  return response.data; // { mainTopic, keywords, ... }
};

// 기록 분석 요청 (AI 서버로 전송)
export const requestAnalysis = async (recordId) => {
  const response = await client.post("/analysis", { recordId });
  return response.data;
};
