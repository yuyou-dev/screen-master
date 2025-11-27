import React, { useRef, useState } from 'react';
import { X, Film, Image as ImageIcon, Plus, UploadCloud } from 'lucide-react';
import { Asset } from '../types';

interface AssetBayProps {
  assets: Asset[];
  onAddAsset: (files: FileList) => void;
  onRemoveAsset: (id: string) => void;
  onSelectAsset: (asset: Asset) => void;
  selectedAssetId?: string;
}

export const AssetBay: React.FC<AssetBayProps> = ({ assets, onAddAsset, onRemoveAsset, onSelectAsset, selectedAssetId }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddAsset(e.dataTransfer.files);
    }
  };

  return (
    <div 
        className={`flex flex-col h-full space-y-3 transition-colors duration-200 rounded-sm ${isDragging ? 'bg-zinc-800/50 ring-1 ring-cine-accent' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
    >
      <div className="flex items-center justify-between px-1">
         <span className="text-cine-text-muted text-[10px] uppercase tracking-[0.2em] font-mono font-bold">01. Assets</span>
         <span className="text-zinc-600 text-[10px] font-mono">{assets.length} REF</span>
      </div>

      {/* Drag Overlay Indicator (Visible only when dragging) */}
      {isDragging && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm border-2 border-dashed border-cine-accent rounded-md pointer-events-none">
              <div className="flex flex-col items-center gap-2 text-cine-accent">
                  <UploadCloud size={32} />
                  <span className="font-mono text-xs uppercase tracking-widest">Drop files to upload</span>
              </div>
          </div>
      )}

      <div className="grid grid-cols-4 lg:grid-cols-3 gap-2 pr-1 overflow-y-auto content-start custom-scrollbar h-full">
        {/* Add Button Tile */}
        <div 
          className="aspect-square border border-dashed border-zinc-700 bg-zinc-900/30 rounded-sm hover:border-cine-accent hover:bg-cine-accent/5 transition-all cursor-pointer flex flex-col items-center justify-center group relative overflow-hidden"
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            multiple 
            accept="image/*,video/*"
            onChange={(e) => e.target.files && onAddAsset(e.target.files)}
          />
          <Plus className="w-5 h-5 text-zinc-500 group-hover:text-cine-accent transition-colors mb-1" />
        </div>

        {/* Asset List */}
        {assets.map((asset) => (
          <div 
            key={asset.id} 
            onClick={() => onSelectAsset(asset)}
            className={`relative group aspect-square bg-zinc-950 border rounded-sm overflow-hidden cursor-pointer transition-all ${
                selectedAssetId === asset.id 
                ? 'border-cine-accent ring-1 ring-cine-accent/30 shadow-[0_0_10px_-2px_rgba(212,252,121,0.2)]' 
                : 'border-zinc-800 hover:border-zinc-500'
            }`}
          >
            {asset.type === 'video' ? (
                <video src={asset.previewUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            ) : (
                <img src={asset.previewUrl} alt="asset" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            )}
            
            {/* Type Indicator */}
            <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/90 to-transparent">
                <div className="flex items-center gap-1 text-[8px] text-zinc-400 font-mono">
                    {asset.type === 'video' ? <Film size={8}/> : <ImageIcon size={8}/>}
                </div>
            </div>

            {/* Remove Button */}
            <button 
                onClick={(e) => { e.stopPropagation(); onRemoveAsset(asset.id); }} 
                className="absolute top-0 right-0 p-1.5 text-zinc-400 hover:text-red-500 hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100"
            >
                <X size={10} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};