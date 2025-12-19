import { GoogleGenAI } from "@google/genai";

const AUDIT_SYSTEM_INSTRUCTION = `You are the Cirrus Lead Intelligence Auditor. Your objective is to perform a high-fidelity "Essentialist Audit" for enterprise codebases.

STRICT FORMATTING PROTOCOL:
1. CLICKABLE CITATIONS: Every recommendation, refactor, or deletion MUST be followed by a citation formatted as a Markdown link [Source: Name](URL).
2. TONE: Authoritative, minimalist, and clinically precise.
3. REPORT ARCHITECTURE:
   - # 🎯 CORE ENTITY MISSION
   - ## 📉 CRITICAL ENTROPY
   - ## ⚡ SYSTEMIC REFACTOR
   - ## 🛠️ THE ESSENTIALIST REWRITE
4. VISUAL STYLE: Use Bold for technical identifiers.

Every single change must be justified by a linked source. Use Google Search to find current official documentation URLs.`;

export const handler = async (event: any) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { model, contents, config } = JSON.parse(event.body || '{}');
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "API Key not configured." })
      };
    }

    const ai = new GoogleGenAI({ apiKey });
    
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
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || "Audit failed." })
    };
  }
};