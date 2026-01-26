
import { GoogleGenerativeAI } from "@google/genai";

// Use the API key directly from import.meta.env.VITE_GEMINI_API_KEY as per guidelines
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY as string);

export const getRouteInsight = async (pickup: string, delivery: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const prompt = `Como um especialista em logística, dê uma dica rápida (máximo 20 palavras) para o motoboy sobre uma rota entre:
      Origem: ${pickup}
      Destino: ${delivery}
      Considere trânsito e eficiência urbana no Brasil.`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Mantenha a atenção no trânsito e use o GPS para rotas atualizadas.";
  }
};
