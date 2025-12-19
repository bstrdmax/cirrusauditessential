
import { GoogleGenAI } from "@google/genai";

export const handler = async (event: any) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { contents, config } = JSON.parse(event.body || '{}');
    
    if (!contents) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing contents in request" })
      };
    }

    // Initialize Google AI with the secure server-side environment variable
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Using gemini-3-flash-preview for maximum speed without sacrificing reasoning depth
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: config
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: response.text
      })
    };
    
  } catch (error: any) {
    console.error("AI Function Error:", error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: error.message || "Internal server error during audit analysis"
      })
    };
  }
};
