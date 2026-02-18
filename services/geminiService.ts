import { GoogleGenAI, Modality } from "@google/genai";

export const generateSuhoorVoice = async (message: string, voiceName: string = 'Kore') => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "" || apiKey === "undefined") {
    console.warn("Gemini Service: API_KEY is missing from environment. Voice features will not work.");
    console.log("Tip: Ensure API_KEY is set in your Vercel/Netlify Environment Variables AND that you re-deployed.");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: message }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      console.error("Gemini Service: API returned success but no audio data was found in response.");
    }
    return base64Audio;
  } catch (error) {
    console.error("Gemini Service TTS Error:", error);
    return null;
  }
};