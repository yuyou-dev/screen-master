import React from 'react';
import { Button } from './Button';
import { AspectRatio, ImageSize, GenerationMode } from '../types';
import { Square, Grid2X2, Grid3X3, Zap, Layers, Wand2, Lock } from 'lucide-react';

interface DirectorDeckProps {
  mode: GenerationMode;
  setMode: (mode: GenerationMode) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (ar: AspectRatio) => void;
  imageSize: ImageSize;
  setImageSize: (size: ImageSize) => void;
  prompt: string;
  setPrompt: (text: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  onAutoDirect: () => void;
  isAutoDirecting: boolean;
  onEnhancePrompt?: () => void;
}

export const DirectorDeck: React.FC<DirectorDeckProps> = ({
  mode,
  setMode,
  aspectRatio,
  setAspectRatio,
  imageSize,
  setImageSize,
  prompt,
  setPrompt,
  onGenerate,
  isGenerating,
  onAutoDirect,
  isAutoDirecting
}) => {
  const isGrid = mode !== GenerationMode.SINGLE;

  return (
    <div className="flex flex-col h-full space-y-6 select-none">
      <div className="flex items-center justify-between border-t border-zinc-800/50 pt-5 mt-2">
         <span className="text-cine-text-muted text-[10px] uppercase tracking-[0.2em] font-mono font-bold">02. Controls</span>
         {isGenerating && (
             <div className="flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 bg-cine-accent rounded-full animate-pulse"></div>
                 <span className="text-[9px] text-cine-accent font-mono tracking-widest">PROCESSING</span>
             </div>
         )}
      </div>

      {/* Composition Group */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
            <label className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider flex items-center gap-2">
                <span className="w-1 h-3 bg-zinc-700 rounded-sm"></span>
                Composition
            </label>
        </div>
        
        <div className="grid grid-cols-1 gap-3 p-3 bg-zinc-900/30 border border-zinc-800/50 rounded-sm">
             {/* Mode Selector */}
            <div className="grid grid-cols-3 gap-1">
                {[
                    { m: GenerationMode.SINGLE, icon: Square, label: "Single" },
                    { m: GenerationMode.GRID_2x2, icon: Grid2X2, label: "2x2 Grid" },
                    { m: GenerationMode.GRID_3x3, icon: Grid3X3, label: "3x3 Grid" }
                ].map((item) => (
                    <button
                        key={item.label}
                        onClick={() => setMode(item.m)}
                        className={`flex flex-col items-center justify-center gap-1 py-2 rounded-[2px] border transition-all ${
                            mode === item.m 
                            ? 'bg-zinc-800 border-cine-accent text-cine-accent shadow-sm' 
                            : 'bg-black border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                        }`}
                    >
                        <item.icon size={14} />
                        <span className="text-[8px] uppercase tracking-wider font-mono">{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Aspect Ratio */}
             <div className="space-y-1.5 pt-2 border-t border-dashed border-zinc-800">
                <span className="text-[8px] text-zinc-600 font-mono uppercase">Aspect Ratio</span>
                <div className="grid grid-cols-3 gap-1">
                    {Object.values(AspectRatio).map((ar) => (
                        <button
                            key={ar}
                            onClick={() => setAspectRatio(ar)}
                            className={`text-[9px] h-6 border rounded-[1px] font-mono transition-colors flex items-center justify-center ${
                                aspectRatio === ar 
                                ? 'border-zinc-600 text-white bg-zinc-700' 
                                : 'border-zinc-800 text-zinc-600 hover:border-zinc-600 hover:text-zinc-400 bg-black'
                            }`}
                        >
                            {ar}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* Quality Group */}
      <div className="space-y-2">
        <label className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider flex items-center gap-2">
            <span className="w-1 h-3 bg-zinc-700 rounded-sm"></span>
            Resolution
        </label>
        <div className="flex p-0.5 bg-black border border-zinc-800 rounded-sm">
            {Object.values(ImageSize).map((size) => (
                <button
                    key={size}
                    onClick={() => setImageSize(size)}
                    className={`flex-1 text-[9px] py-1.5 font-mono transition-colors text-center uppercase tracking-widest ${
                        imageSize === size
                        ? 'bg-zinc-800 text-cine-accent font-bold' 
                        : 'text-zinc-600 hover:text-zinc-400'
                    }`}
                >
                    {size}
                </button>
            ))}
        </div>
      </div>

      {/* Prompt Area */}
      <div className="space-y-2 flex-1 flex flex-col min-h-[160px]">
        <div className="flex justify-between items-end">
            <label className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider flex items-center gap-2">
                <span className="w-1 h-3 bg-cine-accent rounded-sm"></span>
                Direction
            </label>
            <button 
                onClick={onAutoDirect}
                disabled={isAutoDirecting}
                className={`text-[9px] px-2 py-0.5 border border-zinc-800 rounded-[2px] bg-zinc-900 hover:bg-zinc-800 flex items-center gap-1.5 transition-all font-mono uppercase tracking-wider ${isAutoDirecting ? 'text-cine-accent border-cine-accent/50' : 'text-zinc-400 hover:text-cine-accent'}`}
            >
                <Wand2 size={10} className={isAutoDirecting ? "animate-spin" : ""} /> 
                {isAutoDirecting ? 'Processing' : 'AI Director'}
            </button>
        </div>
        
        <div className="relative flex-1 group">
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={isGrid ? "// Describe scene layout for multi-view grid..." : "// Enter shot description or use AI Director..."}
                className="w-full h-full absolute inset-0 bg-black border border-zinc-800 rounded-sm p-3 text-sm text-zinc-300 focus:border-cine-accent focus:ring-0 resize-none font-mono leading-relaxed placeholder:text-zinc-700 custom-scrollbar focus:bg-zinc-900/50 transition-colors"
                spellCheck={false}
            />
        </div>
      </div>

      {/* Generate Button */}
      <Button 
        variant="accent" 
        className="w-full py-4 tracking-[0.2em] uppercase font-mono text-[10px] font-bold relative overflow-hidden group shadow-[0_0_20px_-5px_rgba(212,252,121,0.3)] hover:shadow-[0_0_25px_-5px_rgba(212,252,121,0.5)] transition-all"
        onClick={onGenerate}
        disabled={isGenerating || !prompt.trim()}
      >
        <span className="relative z-10 flex items-center justify-center gap-3">
            {isGenerating ? <Zap size={14} className="animate-spin" /> : <Layers size={14} />}
            {isGenerating ? 'Rendering...' : 'Execute Render'}
        </span>
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
      </Button>
    </div>
  );
};