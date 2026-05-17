import client from "./client";

// 내 정보 조회
export const getMyInfo = async () => {
  const response = await client.get("/users/me");
  return response.data;
};

// 프로필 조회 (닉네임, 프로필 이미지)
export const getMyProfile = async () => {
  const response = await client.get("/users/me/profile");
  return response.data;
};

// 프로필 수정
export const updateMyProfile = async (nickname) => {
  const response = await client.put("/users/me", { nickname });
  return response.data;
};

// 통계 (팝콘 갯수, 알곡식히기 횟수, 생각줄기)
export const getMyStats = async () => {
  const response = await client.get("/users/me/stats");
  return response.data;
};
