
import { GoogleGenAI } from "@google/genai";
import { OptimizationScenario } from "../types";

// Helper to handle Gemini API errors including key selection reset as per guidelines
const handleGeminiError = (error: any) => {
  console.error("Gemini API Error:", error);
  if (error.message?.includes("Requested entity was not found.")) {
    // If the request fails with this specific error, prompt for a new key
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      (window as any).aistudio.openSelectKey();
    }
  }
  return "Failed to generate AI analysis. Please check your connection or API quota.";
};

export const analyzeSimulationResults = async (
  context: string,
  data: any
): Promise<string> => {
  // Fix: Initialization MUST use process.env.API_KEY directly.
  // Fix: Create instance right before the call to ensure latest API key if selection changed.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const prompt = `
      You are a Senior Metallurgist and Mineral Processing Engineer.
      Analyze the following simulation results for a ${context} context.
      Provide insights on efficiency, potential issues (e.g., roping in cyclones, overload in mills), and recommendations.
      Keep it concise (max 2 paragraphs).
      
      Data:
      ${JSON.stringify(data, null, 2)}
    `;

    // Fix: Using generateContent with model name and contents string.
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
    });

    // Fix: Access response.text property directly.
    return response.text || "No analysis generated.";
  } catch (error) {
    return handleGeminiError(error);
  }
};

export const generateOptimizationInsights = async (
    baseline: OptimizationScenario,
    scenarios: OptimizationScenario[]
): Promise<string> => {
    // Fix: Initialization MUST use process.env.API_KEY directly.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const topScenarios = scenarios.slice(0, 3);
        
        const prompt = `
            Act as a Lead Process Engineer using an AI Co-pilot for industrial optimization.
            
            CONTEXT:
            We are optimizing a mineral processing circuit. We have run a baseline simulation and explored the parameter space.
            The goal is to maximize Economic Score (which balances Recovery, Grade, and Costs).

            BASELINE PERFORMANCE:
            ${JSON.stringify(baseline.results, null, 2)}
            PARAMETERS: ${JSON.stringify(baseline.parameters, null, 2)}

            TOP FOUND SCENARIOS (AI EXPLORATION):
            ${JSON.stringify(topScenarios.map(s => ({
                name: s.name,
                changes: s.parameters,
                results: s.results
            })), null, 2)}

            TASK:
            1. Compare the Baseline with the Top Scenarios.
            2. Explain the TRADE-OFFS.
            3. Recommend the best operational strategy in natural language.
            4. Suggest what parameter we should test next.
            
            Tone: Professional, analytical. Keep it under 200 words. Format with bullet points.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
        });

        // Fix: Access response.text property directly.
        return response.text || "Não foi possível gerar insights detalhados.";

    } catch (error) {
        return handleGeminiError(error);
    }
};
