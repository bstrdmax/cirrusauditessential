
import { GoogleGenAI } from "@google/genai";

const AUDIT_SYSTEM_INSTRUCTION = `You are the Cirrus Lead Intelligence Auditor. Your objective is to perform a high-fidelity "Essentialist Audit" for enterprise codebases.

STRICT FORMATTING PROTOCOL:
1. CLICKABLE CITATIONS: Every recommendation, refactor, or deletion MUST be followed by a citation formatted as a Markdown link.
   - FORMAT: [Source: Name of Documentation](Full URL).
   - EXAMPLE: "Move client instantiation to the global scope [Source: Google Generative AI SDK Documentation](https://ai.google.dev/gemini-api/docs/best-practices)."
2. TONE: Authoritative, minimalist, and clinically precise.
3. REPORT ARCHITECTURE:
   - # 🎯 CORE ENTITY MISSION: A singular executive summary of the codebase's purpose.
   - ## 📉 CRITICAL ENTROPY: A bulleted list of redundant assets, dead logic paths, and "Zombie" code.
   - ## ⚡ SYSTEMIC REFACTOR: Deep logic optimizations with embedded documentation links.
   - ## 🛠️ THE ESSENTIALIST REWRITE: The finalized, high-performance logic snippets.
4. VISUAL STYLE: Use Bold for technical identifiers. Use Markdown tables for performance deltas.

Every single change must be justified by a linked source. Logic without a source link is prohibited. Use Google Search to find current official documentation URLs.`;

export const handler = async (event: any, context: any) => {
  try {
    // Parse the incoming request as requested in your pattern
    const { model, contents, config } = JSON.parse(event.body || '{}');
    
    if (!contents) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "Missing contents in request" })
      };
    }

    // Get API key from environment (specifically using GOOGLE_AI_API_KEY as requested)
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      console.error("GOOGLE_AI_API_KEY environment variable is not set");
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "API key not configured on server" })
      };
    }

    // Initialize Google AI
    const ai = new GoogleGenAI({ apiKey });
    
    // Make the API call using the specific properties from the request body
    const response = await ai.models.generateContent({
      model: model || 'gemini-3-flash-preview',
      contents: Array.isArray(contents) ? contents : [{ parts: [{ text: contents }] }],
      config: {
        ...config,
        systemInstruction: AUDIT_SYSTEM_INSTRUCTION,
        temperature: 0.1,
        tools: [{ googleSearch: {} }]
      }
    });

    // Extract grounding sources for the frontend documentation panel
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const extractedSources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title,
        uri: chunk.web.uri
      }));
    
    // Return the response following the exact requested body structure
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: response.text,
        candidates: response.candidates,
        sources: extractedSources
      })
    };
    
  } catch (error: any) {
    console.error("AI Function Error:", error);
    
    let errorMessage = error.message || "Unknown error";
    let statusCode = 500;
    
    if (error.message?.includes("API key") || error.message?.includes("authentication")) {
      errorMessage = "Invalid Google AI API key. Please check server configuration.";
      statusCode = 401;
    } else if (error.message?.includes("quota") || error.message?.includes("rate limit")) {
      errorMessage = "API quota exceeded. Please check your Google Cloud quota.";
      statusCode = 429;
    }
    
    return {
      statusCode: statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: errorMessage,
        details: error.toString()
      })
    };
  }
};