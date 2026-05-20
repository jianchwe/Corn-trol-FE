import client from "./client";

export const getMyInfo = async () => {
  const response = await client.get("/users/me");
  return response.data;
};

export const getMyProfile = async () => {
  const response = await client.get("/users/me/profile");
  return response.data;
};

export const updateMyProfile = async (nickname) => {
  const response = await client.put("/users/me", { nickname });
  return response.data;
};

export const getMyStats = async () => {
  const response = await client.get("/users/me/stats");
  return response.data;
};
