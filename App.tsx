
import React, { useRef, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Trash2, FileCode, Loader2, ArrowLeft, Wind, 
  X, FilePlus, Clipboard, Check, Zap, Activity,
  ExternalLink, BookOpen, Layers, ShieldCheck, Download, BarChart3,
  Cpu, CheckCircle2, Printer, Copy, AlertCircle, ArrowUpRight,
  Search, FileText
} from 'lucide-react';
import { useAudit } from './hooks/useAudit';

const PROGRESS_STAGES = [
  "Mapping architectural signatures...",
  "Consulting static analysis vectors...",
  "Identifying technical entropy...",
  "Verifying source-grounded logic...",
  "Synthesizing enterprise report..."
];

const App: React.FC = () => {
  const { 
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
  } = useAudit();

  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteName, setPasteName] = useState('');
  const [pasteContent, setPasteContent] = useState('');
  const [auditProgress, setAuditProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [copied, setCopied] = useState(false);

  const zipInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: number;
    if (isAuditing && !report) {
      setAuditProgress(0);
      setCurrentStage(0);
      interval = window.setInterval(() => {
        setAuditProgress(prev => (prev >= 98 ? prev : prev + 0.9));
        setCurrentStage(prev => (prev >= PROGRESS_STAGES.length - 1 ? prev : prev + 1));
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isAuditing, report]);

  const handleCopy = () => {
    if (!report) return;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePasteSubmit = () => {
    if (!pasteContent.trim()) return;
    addPastedFile(pasteName, pasteContent);
    setPasteName('');
    setPasteContent('');
    setShowPasteModal(false);
  };

  if (report) {
    return (
      <div className="min-h-screen bg-[#fcfdfe] p-4 md:p-12 animate-in fade-in duration-700">
        <div className="max-w-6xl mx-auto">
          {/* Executive Controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 no-print">
            <div className="space-y-3">
              <button 
                onClick={reset} 
                className="flex items-center gap-2 text-slate-400 hover:text-black font-bold transition-all p-0 mb-4"
              >
                <ArrowLeft size={16} /> New Analysis
              </button>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-none">Intelligence Analysis</h1>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest border border-emerald-100">
                  <ShieldCheck size={12} /> Grounded Validation
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleCopy}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
              >
                {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl active:scale-95"
              >
                <Printer size={18} /> Export PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* The Document */}
            <div className="lg:col-span-8 print-full">
              <div className="bg-white rounded-[2.5rem] p-8 md:p-16 border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)] report-container relative">
                <div className="absolute top-10 right-10 flex flex-col items-end opacity-20 no-print">
                   <div className="w-12 h-12 border-4 border-emerald-500 rounded-full flex items-center justify-center mb-2">
                     <Check size={24} className="text-emerald-500" />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Verified</span>
                </div>
                
                <article className="prose prose-slate prose-lg max-w-none">
                  <ReactMarkdown>{report}</ReactMarkdown>
                </article>
                
                <div className="mt-24 pt-10 border-t border-slate-50 flex justify-between items-center no-print">
                   <div className="flex items-center gap-2 opacity-30">
                     <Wind size={20} className="text-blue-600" />
                     <span className="text-xs font-black uppercase tracking-[0.3em]">Cirrus Intelligence</span>
                   </div>
                   <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Enterprise Code Optimization Output</p>
                </div>
              </div>
            </div>

            {/* Sidebar Sources */}
            <div className="lg:col-span-4 space-y-8 no-print sticky top-8">
              <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-lg">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-tight">Documentation</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Grounded Bibliograpy</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {sources.length > 0 ? sources.map((source, idx) => (
                    <a 
                      key={idx}
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group flex flex-col p-4 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 line-clamp-1">{source.title || "Ref"}</span>
                        <ArrowUpRight size={14} className="text-slate-300" />
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase truncate">{source.uri}</span>
                    </a>
                  )) : (
                    <div className="py-12 text-center text-slate-200">
                      <Search size={32} className="mx-auto mb-3 opacity-20" />
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em]">Searching for Grounds...</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 rounded-[2rem] p-8 text-white">
                 <div className="flex items-center gap-2 mb-6 opacity-40">
                   <BarChart3 size={16} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Session Metrics</span>
                 </div>
                 <div className="space-y-4">
                    <div className="flex justify-between items-baseline border-b border-white/5 pb-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Input Assets</span>
                      <span className="text-xl font-bold">{files.length}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Entropy Score</span>
                      <span className="text-sm font-bold text-emerald-400">Optimized</span>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="pt-24 pb-48 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,82,255,0.03),transparent_50%)]" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black text-white text-[10px] font-black tracking-[0.3em] uppercase mb-10">
             <Cpu size={14} className="text-blue-500" /> Enterprise v3.9
          </div>
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter text-slate-900 mb-8 leading-[0.85]">
            Optimize Code as <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 italic">Living Biology.</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 font-medium max-w-2xl mx-auto mb-12">
            The Cirrus Essentialist Engine prunes logic entropy and justifies every refactor with source-grounded evidence.
          </p>
          <div className="flex flex-wrap justify-center gap-8">
             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
               <CheckCircle2 size={16} className="text-emerald-500" /> MDN Grounded
             </div>
             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
               <Zap size={16} className="text-blue-500" /> Essentialist Pruning
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 -mt-24 pb-40 relative z-20">
        {error && (
          <div className="mb-8 p-6 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 text-red-600 font-bold shadow-lg">
            <AlertCircle size={20} /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {[
            { title: "Full Archive", desc: "Inject entire .ZIP structures", icon: Layers, color: "blue", onClick: () => zipInputRef.current?.click() },
            { title: "File Pick", desc: "Multi-node source intake", icon: FilePlus, color: "indigo", onClick: () => fileInputRef.current?.click() },
            { title: "Live Snippet", desc: "Rapid logic dissection", icon: Clipboard, color: "emerald", onClick: () => setShowPasteModal(true) },
          ].map((card, idx) => (
            <div 
              key={idx}
              onClick={card.onClick}
              className="group bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 hover:border-slate-300 hover:translate-y-[-4px] transition-all cursor-pointer flex flex-col items-center text-center gap-8 active:scale-95"
            >
              <div className={`w-20 h-20 bg-${card.color}-50 rounded-2xl flex items-center justify-center text-${card.color}-600 group-hover:scale-110 transition-transform`}>
                <card.icon size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight">{card.title}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{card.desc}</p>
              </div>
            </div>
          ))}
          <input type="file" ref={zipInputRef} className="hidden" accept=".zip" onChange={(e) => e.target.files && processZip(e.target.files[0])} />
          <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e) => e.target.files && processIndividualFiles(e.target.files)} />
        </div>

        {files.length > 0 && (
          <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-8">
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white">
                  <BarChart3 size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Analysis Staging</h2>
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Inventory ready for pruning</p>
                </div>
              </div>
              <button onClick={reset} className="text-slate-300 hover:text-red-500 font-bold text-xs uppercase transition-all">Flush</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-xl border border-slate-100 group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileCode size={18} className="text-slate-300" />
                    <span className="text-sm font-bold text-slate-700 truncate">{file.name}</span>
                  </div>
                  <button onClick={() => removeFile(idx)} className="text-slate-300 hover:text-red-500"><X size={18} /></button>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center gap-6">
              <button
                disabled={isAuditing}
                onClick={runAudit}
                className={`
                  px-16 py-8 rounded-[2rem] font-black text-xl uppercase tracking-[0.4em] transition-all
                  ${isAuditing ? 'bg-slate-50 text-slate-300' : 'bg-slate-900 text-white hover:bg-blue-600 shadow-2xl hover:-translate-y-1'}
                `}
              >
                {isAuditing ? <Loader2 className="animate-spin" size={28} /> : 'Initiate Deep Audit'}
              </button>
            </div>
          </div>
        )}

        {isAuditing && !report && (
          <div className="bg-white rounded-[4rem] p-24 text-center border border-slate-50 shadow-2xl animate-in zoom-in-95">
             <div className="w-40 h-40 mx-auto mb-12 relative">
                <div className="absolute inset-0 border-[12px] border-slate-50 rounded-full" />
                <div className="absolute inset-0 border-[12px] border-black rounded-full border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-3xl font-black">{Math.round(auditProgress)}%</div>
             </div>
             <h3 className="text-3xl font-bold mb-4 uppercase tracking-tighter">Analyzing Complexity</h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{PROGRESS_STAGES[currentStage]}</p>
          </div>
        )}
      </main>

      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-xl">
          <div className="bg-white w-full max-w-4xl rounded-[4rem] p-12 shadow-2xl border border-white">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-bold uppercase italic tracking-tight">Manual Intake</h3>
              <button onClick={() => setShowPasteModal(false)} className="p-3 bg-slate-50 rounded-xl"><X size={24} /></button>
            </div>
            <div className="space-y-6">
              <input 
                type="text" placeholder="Asset Name (e.g. index.ts)" value={pasteName} onChange={(e) => setPasteName(e.target.value)}
                className="w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl font-bold"
              />
              <textarea 
                placeholder="Paste code payload here..." value={pasteContent} onChange={(e) => setPasteContent(e.target.value)}
                className="w-full h-80 p-8 bg-slate-50 border border-slate-100 rounded-[2rem] font-mono text-sm resize-none"
              />
              <button onClick={handlePasteSubmit} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-xl uppercase tracking-widest hover:bg-blue-600">Inject Context</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
