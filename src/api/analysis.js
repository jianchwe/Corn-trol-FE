import client from "./client";

export const getAnalysis = async (recordId) => {
  const response = await client.get(`/analysis/${recordId}`);
  return response.data;
};

export const requestAnalysis = async (recordId) => {
  const response = await client.post("/analysis", { recordId });
  return response.data;
};
