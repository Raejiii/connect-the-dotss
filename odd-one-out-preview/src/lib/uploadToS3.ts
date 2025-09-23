import axios from "axios";

export const downloadSettingsObj = async (
  configFileName: string,
  signal?: AbortSignal
) => {
  const configURL = `${configFileName}`;
  try {
    const { data: gameConfig } = await axios.get(configURL, {
      signal,
    });
    return gameConfig;
  } catch (error) {
    if (axios.isCancel(error)) {
      return;
    }

    throw new Error("Error fetching game config");
  }
};
