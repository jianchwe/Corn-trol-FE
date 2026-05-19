import client from "./client";

export const uploadMedia = async (uri) => {
  console.log("미디어 업로드 시작:", uri);
  const formData = new FormData();
  formData.append("file", {
    uri,
    type: "audio/wav", // m4a → wav
    name: "recording.wav", // m4a → wav
  });

  try {
    const response = await client.post("/media/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 120000, // 2분 - Render 슬립 대응
    });
    console.log("미디어 업로드 결과:", response.data);
    return response.data;
  } catch (e) {
    console.log("미디어 업로드 에러:", e.response?.data, e.message);
    throw e;
  }
};

export const getMedia = async (id) => {
  const response = await client.get(`/media/${id}`);
  return response.data;
};
