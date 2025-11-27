import React, { useState } from 'react';
import { AssetBay } from './components/AssetBay';
import { DirectorDeck } from './components/DirectorDeck';
import { Canvas } from './components/Canvas';
import { Inspector } from './components/Inspector';
import { Asset, GeneratedImage, GenerationMode, AspectRatio, ImageSize } from './types';
import { generateSingleImage, generateMultiViewGrid, fileToBase64, enhancePrompt, analyzeAsset, ReferenceImageData, generateCinematicPrompt } from './services/geminiService';
import { AlertCircle } from 'lucide-react';
// @ts-ignore
import JSZip from 'jszip';

const App: React.FC = () => {
  // --- State ---
  const [assets, setAssets] = useState<Asset[]>([]);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  
  // Selection State (Shared between Lightbox/Assets and Inspector)
  const [selectedImageId, setSelectedImageId] = useState<string | undefined>(undefined);
  const [selectedAssetId, setSelectedAssetId] = useState<string | undefined>(undefined);
  
  // Generation Settings
  const [mode, setMode] = useState<GenerationMode>(GenerationMode.SINGLE);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.WIDE);
  const [imageSize, setImageSize] = useState<ImageSize>(ImageSize.K2);
  const [prompt, setPrompt] = useState<string>('');
  
  // Processing Flags
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAutoDirecting, setIsAutoDirecting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // --- Handlers ---

  const handleModeChange = (newMode: GenerationMode) => {
    setMode(newMode);
  };

  const handleAddAsset = (files: FileList) => {
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const newAsset: Asset = {
        id: crypto.randomUUID(),
        file,
        previewUrl: url,
        type: file.type.startsWith('video') ? 'video' : 'image',
      };
      setAssets((prev) => [...prev, newAsset]);
      // Optional: Auto select uploaded asset
      handleSelectAsset(newAsset);
    });
  };

  const handleRemoveAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    if (selectedAssetId === id) setSelectedAssetId(undefined);
  };

  const handleSelectAsset = (asset: Asset) => {
      setSelectedAssetId(asset.id);
      setSelectedImageId(undefined); // Deselect image when asset is selected
      setAnalysisResult('');
  };

  const handleSelectImage = (image: GeneratedImage) => {
      setSelectedImageId(image.id);
      setSelectedAssetId(undefined); // Deselect asset when image is selected
      setAnalysisResult('');
  };

  const handleAnalyzeSelection = async (instructionPrompt: string) => {
    const assetToAnalyze = assets.find(a => a.id === selectedAssetId);
    const imageToAnalyze = images.find(i => i.id === selectedImageId);
    
    let base64Data = '';
    let mimeType = 'image/jpeg';

    if (assetToAnalyze) {
        try {
            base64Data = await fileToBase64(assetToAnalyze.file);
            mimeType = assetToAnalyze.file.type;
        } catch (e) {
            setError("Could not read asset file.");
            return;
        }
    } else if (imageToAnalyze) {
        base64Data = imageToAnalyze.url.split(',')[1];
    } else {
        return;
    }

    setIsAnalyzing(true);
    try {
        const result = await analyzeAsset(base64Data, mimeType, instructionPrompt);
        setAnalysisResult(result);
    } catch (e: any) {
        setError(e.message || "Analysis failed");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleAutoDirect = async () => {
      setIsAutoDirecting(true);
      try {
        // Prepare context from assets
        const imageAssets = assets.filter(a => a.type === 'image');
        const referenceImages: ReferenceImageData[] = await Promise.all(
            imageAssets.map(async (asset) => ({
                data: await fileToBase64(asset.file),
                mimeType: asset.file.type
            }))
        );

        const cinematicPrompt = await generateCinematicPrompt(prompt, referenceImages);
        setPrompt(cinematicPrompt);

      } catch (e: any) {
          setError("Auto-director failed: " + e.message);
      } finally {
          setIsAutoDirecting(false);
      }
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true); // Re-use generation loading state for simple enhance
    try {
        const enhanced = await enhancePrompt(prompt);
        setPrompt(enhanced);
    } catch (e) {
        console.error(e);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const imageAssets = assets.filter(a => a.type === 'image');
      const referenceImages: ReferenceImageData[] = await Promise.all(
        imageAssets.map(async (asset) => ({
            data: await fileToBase64(asset.file),
            mimeType: asset.file.type
        }))
      );

      const timestamp = Date.now();

      if (mode !== GenerationMode.SINGLE) {
          const rows = mode === GenerationMode.GRID_2x2 ? 2 : 3;
          const cols = mode === GenerationMode.GRID_2x2 ? 2 : 3;
          const total = rows * cols;

          const result = await generateMultiViewGrid(prompt, rows, cols, aspectRatio, imageSize, referenceImages);
          
          const newImages: GeneratedImage[] = result.slices.map((url, index) => ({
             id: crypto.randomUUID(),
             url,
             fullGridUrl: result.fullImage,
             prompt: `[${mode} Panel ${index+1}/${total}] ${prompt.substring(0, 30)}...`, 
             aspectRatio: aspectRatio,
             timestamp: timestamp + index
          }));
          
          setImages(prev => [...newImages, ...prev]);
          if (newImages.length > 0) handleSelectImage(newImages[0]);

      } else {
          const imageUrl = await generateSingleImage(prompt, aspectRatio, imageSize, referenceImages);

          const newImage: GeneratedImage = {
            id: crypto.randomUUID(),
            url: imageUrl,
            prompt: prompt,
            aspectRatio,
            timestamp: timestamp,
          };

          setImages((prev) => [newImage, ...prev]);
          handleSelectImage(newImage);
      }

    } catch (err: any) {
      setError(err.message || "Failed to generate image.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteImage = (id: string) => {
      setImages(prev => prev.filter(img => img.id !== id));
      if (selectedImageId === id) setSelectedImageId(undefined);
  };

  const handleDownloadBatch = async () => {
      if (images.length === 0) return;
      
      const zip = new JSZip();
      const folder = zip.folder("cinescout_renders");
      
      try {
          // Add all images to zip
          for (let i = 0; i < images.length; i++) {
              const img = images[i];
              const response = await fetch(img.url);
              const blob = await response.blob();
              folder?.file(`render_${i + 1}_${img.id.substring(0, 6)}.png`, blob);
          }

          // Add Full Grids if unique
          const processedGrids = new Set();
          for (let i = 0; i < images.length; i++) {
               const img = images[i];
               if (img.fullGridUrl && !processedGrids.has(img.fullGridUrl)) {
                   processedGrids.add(img.fullGridUrl);
                   const response = await fetch(img.fullGridUrl);
                   const blob = await response.blob();
                   folder?.file(`grid_source_${img.id.substring(0,6)}.png`, blob);
               }
          }

          const content = await zip.generateAsync({ type: "blob" });
          const url = URL.createObjectURL(content);
          
          const a = document.createElement("a");
          a.href = url;
          a.download = `cinescout_batch_${Date.now()}.zip`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

      } catch (e: any) {
          setError("Failed to create zip file: " + e.message);
      }
  };

  const activeImage = images.find(i => i.id === selectedImageId) || null;
  const activeAsset = assets.find(a => a.id === selectedAssetId) || null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-cine-black text-cine-text-muted font-sans">
      
      {/* 1. Left Sidebar: Assets & Controls (340px) */}
      <aside className="w-[340px] flex flex-col border-r border-cine-border bg-cine-dark z-20 shadow-2xl flex-shrink-0">
        <div className="p-5 pb-3 border-b border-zinc-800/50 bg-black/20">
            <h1 className="text-white text-sm font-bold tracking-[0.2em] uppercase font-mono flex items-center gap-2">
                <span className="w-2 h-2 bg-cine-accent rounded-[1px] shadow-[0_0_10px_rgba(212,252,121,0.5)]"></span>
                CineScout
            </h1>
        </div>

        <div className="flex-1 flex flex-col p-4 gap-6 overflow-y-auto custom-scrollbar">
            {/* Reduced flex ratio for Assets */}
            <div className="flex-[0.25] min-h-[140px]">
                <AssetBay 
                    assets={assets} 
                    onAddAsset={handleAddAsset} 
                    onRemoveAsset={handleRemoveAsset} 
                    onSelectAsset={handleSelectAsset}
                    selectedAssetId={selectedAssetId}
                />
            </div>

            {/* Increased flex ratio for Controls/Prompt */}
            <div className="flex-[0.75]">
                <DirectorDeck 
                    mode={mode}
                    setMode={handleModeChange}
                    aspectRatio={aspectRatio}
                    setAspectRatio={setAspectRatio}
                    imageSize={imageSize}
                    setImageSize={setImageSize}
                    prompt={prompt}
                    setPrompt={setPrompt}
                    onGenerate={handleGenerate}
                    isGenerating={isGenerating}
                    onEnhancePrompt={handleEnhancePrompt}
                    onAutoDirect={handleAutoDirect}
                    isAutoDirecting={isAutoDirecting}
                />
            </div>
        </div>
      </aside>

      {/* 2. Middle: Canvas */}
      <main className="flex-1 relative bg-black flex flex-col min-w-0">
        <Canvas
            images={images} 
            onSelect={handleSelectImage} 
            selectedId={selectedImageId}
            onDelete={handleDeleteImage} 
            onDownloadAll={handleDownloadBatch}
        />
        
        {isGenerating && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center space-y-6 pointer-events-none animate-in fade-in duration-300">
                 <div className="relative">
                    <div className="w-16 h-16 border-t-2 border-b-2 border-cine-accent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-cine-accent rounded-full animate-pulse"></div>
                    </div>
                 </div>
                 <div className="text-center space-y-2">
                     <p className="text-white font-mono tracking-[0.2em] text-sm uppercase">
                         Processing Request
                     </p>
                     <p className="text-cine-accent/70 font-mono text-xs">
                         Generating {mode !== GenerationMode.SINGLE ? `${mode} View` : 'Single Shot'}
                     </p>
                 </div>
            </div>
        )}

        {error && (
            <div className="absolute bottom-8 left-8 z-50 bg-red-950/90 border border-red-500/50 text-red-200 p-4 rounded-sm text-xs flex gap-3 items-start animate-in slide-in-from-bottom-5 max-w-md shadow-2xl backdrop-blur-sm">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
                <div className="space-y-1">
                    <p className="font-bold uppercase tracking-wider text-red-400">System Error</p>
                    <span className="leading-relaxed opacity-80">{error}</span>
                </div>
                <button onClick={() => setError(null)} className="ml-auto hover:text-white border-l border-red-800/50 pl-3 transition-colors">
                    <X size={14} />
                </button>
            </div>
        )}
      </main>

      {/* 3. Right: Inspector (360px) */}
      <aside className="w-[360px] bg-cine-dark border-l border-cine-border z-20 shadow-2xl flex-shrink-0">
         <Inspector 
            selectedImage={activeImage}
            selectedAsset={activeAsset}
            onClose={() => {
                setSelectedImageId(undefined);
                setSelectedAssetId(undefined);
            }}
            onAnalyze={handleAnalyzeSelection}
            isAnalyzing={isAnalyzing}
            analysisResult={analysisResult}
         />
      </aside>
    </div>
  );
};

// Simple X icon helper for error toast since Lucide X is used in AssetBay
const X = ({ size, className, ...props }: any) => (
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
        {...props}
    >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
    </svg>
)

export default App;