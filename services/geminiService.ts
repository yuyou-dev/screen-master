import { GoogleGenAI } from "@google/genai";
import { AspectRatio, ImageSize } from "../types";

// Helper to ensure API key selection for premium models
export const ensureApiKey = async () => {
  // @ts-ignore
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
    // @ts-ignore
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    }
  }
};

const getClient = () => {
  // Always create a new client to pick up the potentially newly selected key
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Helper to slice a grid image into individual images
const sliceImageGrid = (base64Data: string, rows: number, cols: number): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const w = img.width;
      const h = img.height;
      const pieceWidth = Math.floor(w / cols);
      const pieceHeight = Math.floor(h / rows);
      
      const pieces: string[] = [];
      const canvas = document.createElement('canvas');
      canvas.width = pieceWidth;
      canvas.height = pieceHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            ctx.clearRect(0, 0, pieceWidth, pieceHeight);
            // Source x, y, w, h -> Dest x, y, w, h
            ctx.drawImage(
                img, 
                c * pieceWidth, 
                r * pieceHeight, 
                pieceWidth, 
                pieceHeight, 
                0, 
                0, 
                pieceWidth, 
                pieceHeight
            );
            pieces.push(canvas.toDataURL('image/png'));
        }
      }
      resolve(pieces);
    };
    img.onerror = (e) => reject(new Error("Failed to load image for slicing"));
    img.src = base64Data;
  });
};

export interface ReferenceImageData {
  mimeType: string;
  data: string;
}

export const generateMultiViewGrid = async (
  prompt: string,
  gridRows: number, // 2 or 3
  gridCols: number, // 2 or 3
  aspectRatio: AspectRatio,
  imageSize: ImageSize,
  referenceImages: ReferenceImageData[] = []
): Promise<{ fullImage: string, slices: string[] }> => {
  await ensureApiKey();
  const ai = getClient();
  const model = 'gemini-3-pro-image-preview';
  
  const totalViews = gridRows * gridCols;
  const gridType = `${gridRows}x${gridCols}`;

  // Enhance prompt for multi-view grid generation
  const gridPrompt = `Create a high-resolution ${gridType} grid layout containing exactly ${totalViews} distinct panels.
    The overall image must be divided into a ${gridRows} row by ${gridCols} column grid.
    Subject: "${prompt}".
    Instructions:
    - Generate a "Character Sheet" or "Multi-Angle View" contact sheet.
    - Each panel must show the SAME subject/scene from a DIFFERENT angle or perspective (e.g., Front, Side, 3/4 View, Back, Close-up, Wide Action).
    - Maintain PERFECTION in consistency: The character/object must look identical in design, clothing, and lighting across all panels.
    - Use invisible or very thin black borders between panels.
    - Ensure the composition fits the grid perfectly so it can be sliced later.`;

  const parts: any[] = [];
  
  // Add all reference images
  for (const ref of referenceImages) {
    parts.push({
      inlineData: {
        mimeType: ref.mimeType,
        data: ref.data
      }
    });
  }
  
  parts.push({ text: gridPrompt });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: parts
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: imageSize
        }
      }
    });

    let fullImageBase64 = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        fullImageBase64 = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!fullImageBase64) throw new Error("No grid image generated");

    // Slice the single high-res grid into separate base64 images
    const panels = await sliceImageGrid(fullImageBase64, gridRows, gridCols);
    return { fullImage: fullImageBase64, slices: panels };

  } catch (error) {
    console.error("Grid generation error:", error);
    throw error;
  }
};

export const generateSingleImage = async (
  prompt: string,
  aspectRatio: AspectRatio,
  imageSize: ImageSize,
  referenceImages: ReferenceImageData[] = []
): Promise<string> => {
  await ensureApiKey();
  const ai = getClient();
  const model = 'gemini-3-pro-image-preview';
  
  const parts: any[] = [];
  
  // Add all reference images
  for (const ref of referenceImages) {
    parts.push({
      inlineData: {
        mimeType: ref.mimeType,
        data: ref.data
      }
    });
  }
  
  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: parts
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: imageSize
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
};

export const analyzeAsset = async (
  fileBase64: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  await ensureApiKey();
  const ai = getClient();
  const model = 'gemini-3-pro-preview';

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: fileBase64
            }
          },
          { text: prompt }
        ]
      }
    });

    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Analysis error:", error);
    throw error;
  }
};

export const enhancePrompt = async (rawPrompt: string): Promise<string> => {
  await ensureApiKey();
  const ai = getClient();
  const model = 'gemini-2.5-flash';

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `You are a film director's assistant. Rewrite the following scene description into a detailed, cinematic image generation prompt. Focus on lighting, camera angle, texture, and mood. Keep it under 100 words. \n\nInput: "${rawPrompt}"`,
    });
    return response.text || rawPrompt;
  } catch (error) {
    console.error("Prompt enhancement error:", error);
    return rawPrompt;
  }
};

export const generateCinematicPrompt = async (
  baseIdea: string,
  referenceImages: ReferenceImageData[] = []
): Promise<string> => {
  await ensureApiKey();
  const ai = getClient();
  const model = 'gemini-2.5-flash';

  const systemInstruction = `You are an Academy Award-winning cinematographer and Director of Photography. 
  Your task is to take a simple concept or user input and convert it into a highly technical, evocative, and visually stunning image generation prompt.
  
  If reference images are provided, analyze their style/content and incorporate them into the scene description.

  The output MUST include:
  1. Subject description (detailed)
  2. Camera Shot (e.g., Extreme Close-Up, Wide, Dutch Angle, Over-the-Shoulder)
  3. Lens Choice (e.g., 35mm, 85mm anamorphic, macro)
  4. Lighting (e.g., Chiaroscuro, Rim lighting, Volumetric fog, Neon, Practical lights)
  5. Color Grade/Mood (e.g., Teal & Orange, Noir, Desaturated, Cyberpunk)
  6. Film Stock/Texture (e.g., Kodak Portra 400, IMAX 70mm grain)

  Output ONLY the final prompt text. Do not add introductory phrases like "Here is the prompt".`;

  const contents: any[] = [];
  
  if (baseIdea.trim()) {
    contents.push({ text: `User Idea: "${baseIdea}"` });
  } else {
    contents.push({ text: `User Idea: Create a random, stunning cinematic masterpiece shot based on the attached visual references.` });
  }

  // Add references for context (Gemini 2.5 Flash handles images well)
  referenceImages.forEach(ref => {
    contents.push({
      inlineData: {
        mimeType: ref.mimeType,
        data: ref.data
      }
    });
  });

  try {
    const response = await ai.models.generateContent({
      model,
      config: {
        systemInstruction,
        temperature: 0.8 // Slightly creative
      },
      contents: { parts: contents }
    });
    return response.text || baseIdea;
  } catch (error) {
    console.error("Auto-Director error:", error);
    return baseIdea;
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};