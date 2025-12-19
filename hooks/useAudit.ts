import { useState, useCallback } from 'react';
import JSZip from 'jszip';
import { CodeFile, GroundingSource } from '../types';

const ALLOWED_EXTENSIONS = /\.(js|ts|jsx|tsx|json|css|html|md|py|go|rs|c|cpp|cs|java|rb|php|sh)$/i;

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
      const context = files.map(f => `FILE [${f.name}]:\n${f.content}\n---`).join('\n\n');
      
      const response = await fetch('/.netlify/functions/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          model: 'gemini-3-flash-preview',
          contents: context,
          config: {
            temperature: 0.1
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Server function failed to return data.");
      }

      const data = await response.json();
      setReport(data.text);
      setSources(data.sources || []);
      
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