import { GoogleGenerativeAI } from '@google/generative-ai';
import { useCallback, useState } from 'react';
import { GEMINI_MODEL, SYSTEM_PROMPT } from '../lib/constants';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export function useGemini() {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const sendMessage = useCallback(async ({ userMessage, allFiles }) => {
        if (!API_KEY) {
            setMessages(prev => [...prev,
            { role: 'error', text: 'VITE_GEMINI_API_KEY is not set in your .env file.' },
            ]);
            return null;
        }

        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setIsLoading(true);

        // Build the full file listing for context
        const fileList = Object.entries(allFiles)
            .map(([path, content]) => `--- ${path} ---\n${content}`)
            .join('\n\n');

        const prompt = `Project files:\n\n${fileList}\n\nRequest: ${userMessage}`;

        try {
            const genAI = new GoogleGenerativeAI(API_KEY);

            const model = genAI.getGenerativeModel({
                model: GEMINI_MODEL,
                systemInstruction: SYSTEM_PROMPT,
            });

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
            });

            let raw = result.response.text().trim();

            // Strip markdown fences if the model adds them despite instructions
            raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

            const parsed = JSON.parse(raw);

            setMessages(prev => [...prev, {
                role: 'assistant',
                text: parsed.message,
                targetFile: parsed.targetFile,
                changedLines: parsed.changedLines ?? [],
                didEdit: parsed.newContent != null,
            }]);

            return parsed; // { message, targetFile, newContent, changedLines }

        } catch (err) {
            setMessages(prev => [...prev, { role: 'error', text: err.message }]);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const clearMessages = useCallback(() => setMessages([]), []);

    return { messages, isLoading, sendMessage, clearMessages };
}