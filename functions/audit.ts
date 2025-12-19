
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

Every single change must be justified by a linked source. Logic without a source link is prohibited.`;

export const handler = async (event: any) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { contents } = JSON.parse(event.body || '{}');
    
    if (!contents) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing contents in request" })
      };
    }

    // The API key is securely accessed only here, on the server side.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: contents }] }],
      config: { 
        systemInstruction: AUDIT_SYSTEM_INSTRUCTION,
        temperature: 0.1,
        tools: [{ googleSearch: {} }]
      }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const extractedSources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title,
        uri: chunk.web.uri
      }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: response.text,
        sources: extractedSources
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