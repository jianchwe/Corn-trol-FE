import client from "./client";

export const uploadMedia = async (uri) => {
  const formData = new FormData();
  formData.append("file", {
    uri,
    type: "audio/wav",
    name: "recording.wav",
  });

  try {
    const response = await client.post("/media/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 120000, // 2분 - Render 슬립 대응
    });
    return response.data;
  } catch (e) {
    throw e;
  }
};

export const getMedia = async (id) => {
  const response = await client.get(`/media/${id}`);
  return response.data;
};
