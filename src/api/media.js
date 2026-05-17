import client from "./client";

// 음성 파일 업로드 + STT 변환
export const uploadMedia = async (uri) => {
  const formData = new FormData();
  formData.append("file", {
    uri,
    type: "audio/m4a",
    name: "recording.m4a",
  });

  const response = await client.post("/media/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data; // { id, fileUrl, transcribedText }
};

// 미디어 조회
export const getMedia = async (id) => {
  const response = await client.get(`/media/${id}`);
  return response.data;
};
