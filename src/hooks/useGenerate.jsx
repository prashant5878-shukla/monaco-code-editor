import { GoogleGenerativeAI } from '@google/generative-ai';
import { useCallback, useState } from 'react';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `You are a code generator inside a code editor.
The user describes what they want. Generate the files needed.

Return ONLY a raw JSON object — no markdown, no code fences, nothing else:
{
  "message": "What you created in one sentence",
  "files": [
    { "path": "src/Login.jsx", "content": "full file content" },
    { "path": "src/Login.css", "content": "full file content" }
  ]
}

Rules:
- path: relative from project root e.g. "src/App.jsx", "server.js"
- content: complete working code, no placeholders or TODOs
- Only return files that need to be created or changed
- 2-6 files max unless the request clearly needs more
- Raw JSON only. First char must be {`;

// Robustly extract a JSON object from a string that may contain
// surrounding text or markdown fences from the model.
function extractJSON(text) {
    // Strip markdown fences first
    let raw = text.trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/i, '')
        .trim();

    // Find the outermost { ... } in case the model added text around it
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');

    if (start === -1 || end === -1 || end < start) {
        throw new Error('No JSON object found in response');
    }

    return raw.slice(start, end + 1);
}

export function useGenerate() {
    const [isGenerating, setIsGenerating] = useState(false);

    const generate = useCallback(async ({ prompt, existingFiles = {} }) => {
        if (!API_KEY) return { error: 'VITE_GEMINI_API_KEY not set in .env' };

        setIsGenerating(true);

        const context = Object.keys(existingFiles).length > 0
            ? `\n\nExisting project files: ${Object.keys(existingFiles).join(', ')}`
            : '';

        try {
            const genAI = new GoogleGenerativeAI(API_KEY);
            const model = genAI.getGenerativeModel({
                model: MODEL,
                systemInstruction: SYSTEM_PROMPT,
            });

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt + context }] }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 8192,
                    responseMimeType: 'application/json', // force JSON output
                },
            });

            const raw = extractJSON(result.response.text());
            const parsed = JSON.parse(raw);

            if (!Array.isArray(parsed.files)) {
                throw new Error('Response missing "files" array');
            }

            return { message: parsed.message ?? 'Done', files: parsed.files };

        } catch (err) {
            return { error: err.message };
        } finally {
            setIsGenerating(false);
        }
    }, []);

    return { generate, isGenerating };
}