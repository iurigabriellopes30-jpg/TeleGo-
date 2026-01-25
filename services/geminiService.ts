
import { GoogleGenAI } from "@google/genai";

// Use the API key directly from process.env.API_KEY as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getRouteInsight = async (pickup: string, delivery: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Como um especialista em logística, dê uma dica rápida (máximo 20 palavras) para o motoboy sobre uma rota entre:
      Origem: ${pickup}
      Destino: ${delivery}
      Considere trânsito e eficiência urbana no Brasil.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Mantenha a atenção no trânsito e use o GPS para rotas atualizadas.";
  }
};
