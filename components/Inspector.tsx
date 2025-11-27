import React, { useState, useEffect } from 'react';
import { GeneratedImage, Asset } from '../types';
import { Download, Copy, Maximize2, Wand2, X, MessageSquare, Info } from 'lucide-react';
import { Button } from './Button';

interface InspectorProps {
  selectedImage: GeneratedImage | null;
  selectedAsset: Asset | null;
  onClose: () => void;
  onAnalyze: (prompt: string) => void;
  isAnalyzing: boolean;
  analysisResult?: string;
}

export const Inspector: React.FC<InspectorProps> = ({ 
  selectedImage, 
  selectedAsset, 
  onClose,
  onAnalyze,
  isAnalyzing,
  analysisResult
}) => {
  const [activeTab, setActiveTab] = useState<'view' | 'analyze'>('view');
  const [analysisPrompt, setAnalysisPrompt] = useState("Analyze this image for cinematic composition, lighting, and style.");
  const [showFullGrid, setShowFullGrid] = useState(false);

  // Reset state when selection changes
  useEffect(() => {
    setShowFullGrid(false);
    setActiveTab('view');
  }, [selectedImage?.id, selectedAsset?.id]);

  const activeItem = selectedImage || selectedAsset;
  
  // Determine display URL (Full grid or single slice/asset)
  const displayUrl = selectedImage 
    ? (showFullGrid && selectedImage.fullGridUrl ? selectedImage.fullGridUrl : selectedImage.url)
    : selectedAsset?.previewUrl;

  if (!activeItem) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-3 p-8 text-center border-l border-cine-border bg-cine-dark">
        <Info className="w-8 h-8 opacity-20" />
        <p className="font-mono text-xs uppercase tracking-widest">No Selection</p>
        <p className="text-[10px] text-zinc-700">Select an asset or generated render to inspect details.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col border-l border-cine-border bg-cine-dark animate-in slide-in-from-right-4 duration-200 w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-cine-panel">
        <div className="flex items-center gap-2">
            <span className="text-cine-text-muted text-[10px] uppercase tracking-widest font-mono">03. Inspector</span>
            {selectedImage?.fullGridUrl && (
                <span className="bg-cine-accent/10 text-cine-accent text-[9px] px-1.5 py-0.5 rounded border border-cine-accent/20">GRID SOURCE</span>
            )}
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={14} />
        </button>
      </div>

      {/* Main Preview Area (Big Picture) */}
      <div className="relative aspect-video bg-black border-b border-zinc-800 flex items-center justify-center overflow-hidden group">
         {displayUrl && (
             <img src={displayUrl} alt="Inspector View" className="max-w-full max-h-full object-contain" />
         )}
         
         {/* Grid Toggle Overlay */}
         {selectedImage?.fullGridUrl && (
             <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button 
                    onClick={() => setShowFullGrid(!showFullGrid)}
                    className="bg-black/80 backdrop-blur text-white text-[10px] px-2 py-1 rounded border border-zinc-700 hover:border-cine-accent flex items-center gap-1"
                 >
                    <Maximize2 size={10} />
                    {showFullGrid ? "VIEW SLICE" : "VIEW FULL GRID"}
                 </button>
             </div>
         )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
          <button 
            onClick={() => setActiveTab('view')}
            className={`flex-1 py-3 text-[10px] font-mono uppercase tracking-wider transition-colors ${activeTab === 'view' ? 'text-cine-accent border-b-2 border-cine-accent bg-cine-accent/5' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Details
          </button>
          <button 
            onClick={() => setActiveTab('analyze')}
            className={`flex-1 py-3 text-[10px] font-mono uppercase tracking-wider transition-colors ${activeTab === 'analyze' ? 'text-cine-accent border-b-2 border-cine-accent bg-cine-accent/5' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Analysis & AI
          </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {activeTab === 'view' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Metadata */}
                <div className="space-y-3">
                    <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wide">Metadata</h3>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-[10px] font-mono text-zinc-500">
                        <div className="flex flex-col">
                            <span className="uppercase text-zinc-600 mb-0.5">Type</span>
                            <span className="text-zinc-300">{selectedImage ? 'Render' : 'Reference Asset'}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="uppercase text-zinc-600 mb-0.5">Format</span>
                            <span className="text-zinc-300">
                                {selectedImage ? selectedImage.aspectRatio : 'Original'}
                            </span>
                        </div>
                        <div className="flex flex-col col-span-2">
                            <span className="uppercase text-zinc-600 mb-0.5">ID</span>
                            <span className="text-zinc-300 truncate font-mono select-all">{activeItem.id}</span>
                        </div>
                    </div>
                </div>

                {/* Prompt Section */}
                {selectedImage && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                             <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wide">Prompt</h3>
                             <button 
                                onClick={() => navigator.clipboard.writeText(selectedImage.prompt)}
                                className="text-zinc-500 hover:text-cine-accent transition-colors"
                             >
                                 <Copy size={12} />
                             </button>
                        </div>
                        <div className="p-3 bg-black border border-zinc-800 rounded-sm">
                            <p className="text-zinc-400 text-xs leading-relaxed font-mono">{selectedImage.prompt}</p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                     <a 
                        href={displayUrl} 
                        download={`cinescout-${activeItem.id}.png`}
                        className="flex-1"
                     >
                         <Button variant="secondary" size="sm" className="w-full gap-2">
                             <Download size={12} /> Download
                         </Button>
                     </a>
                </div>
            </div>
        )}

        {activeTab === 'analyze' && (
             <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 h-full flex flex-col">
                <div className="space-y-2 flex-shrink-0">
                    <label className="text-zinc-400 text-xs font-bold uppercase tracking-wide">Instructions</label>
                    <textarea 
                        value={analysisPrompt}
                        onChange={(e) => setAnalysisPrompt(e.target.value)}
                        className="w-full bg-black border border-zinc-800 rounded-sm p-3 text-xs text-zinc-300 focus:border-cine-accent focus:ring-0 resize-none font-mono min-h-[80px]"
                        placeholder="Ask Gemini to analyze this image..."
                    />
                    <Button 
                        variant="primary" 
                        size="sm" 
                        className="w-full gap-2"
                        onClick={() => onAnalyze(analysisPrompt)}
                        disabled={isAnalyzing}
                    >
                         {isAnalyzing ? <Wand2 size={12} className="animate-spin" /> : <MessageSquare size={12} />}
                         {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                    </Button>
                </div>

                <div className="flex-1 min-h-0 flex flex-col space-y-2">
                    <label className="text-zinc-400 text-xs font-bold uppercase tracking-wide">Output</label>
                    <div className="flex-1 bg-black border border-zinc-800 rounded-sm p-4 overflow-y-auto">
                        {analysisResult ? (
                            <p className="text-zinc-300 text-xs leading-relaxed whitespace-pre-wrap">{analysisResult}</p>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-700 gap-2">
                                <Sparkles size={16} className="opacity-20" />
                                <span className="text-[10px] font-mono">AI Analysis will appear here</span>
                            </div>
                        )}
                    </div>
                </div>
             </div>
        )}

      </div>
    </div>
  );
};

// Simple icon for placeholder
const Sparkles = ({ size, className }: { size: number, className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
);