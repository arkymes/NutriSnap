import { GoogleGenAI, Type } from "@google/genai";
import { FoodAnalysis } from "../types";

export const analyzeFoodImage = async (base64Image: string, mimeType: string, apiKey: string): Promise<FoodAnalysis> => {
  if (!apiKey) {
    throw new Error("Chave API não configurada. Por favor, adicione sua chave nas configurações.");
  }

  // Initialize Gemini Client dynamically with the provided key
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: `Analise esta imagem de comida. Identifique o prato principal e estime as calorias e macronutrientes (proteína, carboidratos, gorduras). 
            Forneça um breve comentário nutricional (analysis) sobre a qualidade da refeição em português.
            Se não for comida, retorne valores zerados e avise no campo 'analysis'.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Nome curto do prato" },
            calories: { type: Type.INTEGER, description: "Calorias estimadas (kcal)" },
            protein: { type: Type.INTEGER, description: "Proteína em gramas" },
            carbs: { type: Type.INTEGER, description: "Carboidratos em gramas" },
            fats: { type: Type.INTEGER, description: "Gorduras em gramas" },
            analysis: { type: Type.STRING, description: "Breve comentário nutricional em pt-BR" },
          },
          required: ["name", "calories", "protein", "carbs", "fats", "analysis"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response text from Gemini");

    return JSON.parse(text) as FoodAnalysis;

  } catch (error) {
    console.error("Error analyzing food:", error);
    // Propagate the specific error message if possible
    if (error instanceof Error) {
       throw error;
    }
    throw new Error("Falha ao analisar a imagem. Tente novamente.");
  }
};
