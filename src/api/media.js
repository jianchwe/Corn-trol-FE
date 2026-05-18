import client from "./client";

// 음성 파일 업로드 + STT 변환
export const uploadMedia = async (uri) => {
  console.log("미디어 업로드 시작:", uri);
  const formData = new FormData();
  formData.append("file", {
    uri,
    type: "audio/m4a",
    name: "recording.m4a",
  });

  try {
    const response = await client.post("/media/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    console.log("미디어 업로드 결과:", response.data);
    return response.data;
  } catch (e) {
    console.log("미디어 업로드 에러:", e.response?.data, e.message);
    throw e;
  }
};

// 미디어 조회
export const getMedia = async (id) => {
  const response = await client.get(`/media/${id}`);
  return response.data;
};
