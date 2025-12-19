
import { useState, useCallback } from 'react';
import JSZip from 'jszip';
import { GoogleGenAI } from "@google/genai";
import { CodeFile, GroundingSource } from '../types';

const ALLOWED_EXTENSIONS = /\.(js|ts|jsx|tsx|json|css|html|md|py|go|rs|c|cpp|cs|java|rb|php|sh)$/i;

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

export const useAudit = () => {
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [error, setError] = useState<string | null>(null);

  const processZip = useCallback(async (file: File) => {
    try {
      setError(null);
      const zip = await new JSZip().loadAsync(file);
      const filePromises = Object.entries(zip.files)
        .filter(([name, entry]) => !(entry as any).dir && ALLOWED_EXTENSIONS.test(name))
        .map(async ([name, entry]) => ({
          name,
          content: await (entry as any).async('text')
        }));
      const newFiles = await Promise.all(filePromises);
      if (newFiles.length === 0) throw new Error("No valid code files detected.");
      setFiles(prev => [...prev, ...newFiles]);
    } catch (e: any) {
      setError(e.message || "ZIP parsing failed.");
    }
  }, []);

  const processIndividualFiles = useCallback(async (fileList: FileList) => {
    try {
      setError(null);
      const newFiles: CodeFile[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (ALLOWED_EXTENSIONS.test(file.name)) {
          const content = await file.text();
          newFiles.push({ name: file.name, content });
        }
      }
      if (newFiles.length === 0) throw new Error("No supported files selected.");
      setFiles(prev => [...prev, ...newFiles]);
    } catch (e: any) {
      setError(e.message || "File upload failed.");
    }
  }, []);

  const addPastedFile = useCallback((name: string, content: string) => {
    if (!content.trim()) return;
    setFiles(prev => [...prev, { name: name || `Snippet-${prev.length + 1}`, content }]);
  }, []);

  const updateFileName = (index: number, newName: string) => {
    setFiles(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], name: newName };
      return updated;
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const runAudit = useCallback(async () => {
    if (!files.length) return;
    setIsAuditing(true);
    setError(null);
    setReport(null);
    setSources([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const context = files.map(f => `FILE [${f.name}]:\n${f.content}\n---`).join('\n\n');
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: context }] }],
        config: { 
          systemInstruction: AUDIT_SYSTEM_INSTRUCTION,
          temperature: 0.1,
          tools: [{ googleSearch: {} }]
        }
      });

      const resultText = response.text;
      if (!resultText) throw new Error("Audit generation failed.");
      
      setReport(resultText);
      
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const extractedSources: GroundingSource[] = chunks
          .filter(chunk => chunk.web)
          .map(chunk => ({
            title: chunk.web.title,
            uri: chunk.web.uri
          }));
        setSources(extractedSources);
      }
      
    } catch (e: any) {
      setError(e.message || "Analysis failed.");
    } finally {
      setIsAuditing(false);
    }
  }, [files]);

  const reset = useCallback(() => {
    setFiles([]);
    setReport(null);
    setSources([]);
    setError(null);
  }, []);

  return { 
    files, 
    isAuditing, 
    report, 
    sources,
    error, 
    processZip, 
    processIndividualFiles,
    addPastedFile,
    updateFileName,
    removeFile,
    runAudit, 
    reset 
  };
};
