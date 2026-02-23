{
  "name": "ibkane-ia",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": { "dev": "vite", "build": "vite build", "preview": "vite preview" },
  "dependencies": {
    "@google/genai": "^1.29.0",
    "clsx": "^2.1.1",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-markdown": "^9.0.1",
    "tailwind-merge": "^3.0.1"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.14",
    "@vitejs/plugin-react": "^5.0.4",
    "tailwindcss": "^4.1.14",
    "typescript": "~5.8.2",
    "vite": "^6.2.0"
  }
}import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `Tu es Ibkane IA, créé par Ibrahima Kane. Tu es un expert scolaire. Pour les maths/physique, donne uniquement les calculs sans texte. Tu peux donner l'heure avec l'outil getCurrentTime.`;

const getCurrentTimeFunction = {
  name: "getCurrentTime",
  parameters: {
    type: Type.OBJECT,
    properties: { timezone: { type: Type.STRING } },
    required: ["timezone"],
  },
};

export async function generateResponse(prompt: string, imageBase64?: string, history: any[] = []) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return "Erreur : Clé API manquante sur Vercel.";
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";
  const contents = history.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }));
  const currentParts: any[] = [];
  if (imageBase64) currentParts.push({ inlineData: { mimeType: "image/jpeg", data: imageBase64.split(",")[1] || imageBase64 } });
  currentParts.push({ text: prompt || "Aide-moi." });
  contents.push({ role: 'user', parts: currentParts });

  try {
    let res = await ai.models.generateContent({ model, contents, config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ functionDeclarations: [getCurrentTimeFunction] }] } });
    if (res.functionCalls) {
      const call = res.functionCalls[0];
      const time = new Intl.DateTimeFormat('fr-FR', { timeZone: call.args.timezone, hour: '2-digit', minute: '2-digit' }).format(new Date());
      res = await ai.models.generateContent({ model, contents: [...contents, { role: 'model', parts: [{ functionCall: call }] }, { role: 'user', parts: [{ functionResponse: { name: "getCurrentTime", response: { content: time } } }] }] });
    }
    return res.text;
  } catch (e) { return "Erreur API."; }
      }import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
export default defineConfig({ plugins: [react(), tailwindcss()] });
