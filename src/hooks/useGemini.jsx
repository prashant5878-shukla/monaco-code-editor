import { GoogleGenerativeAI } from "@google/generative-ai";
import { useCallback, useState } from "react";
import { GEMINI_MODEL, SYSTEM_PROMPT } from "../lib/constants";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const tools = [
  {
    functionDeclarations: [
      {
        name: "read_file",
        description: "Read the full content of a file by its path",
        parameters: {
          type: "object",
          properties: {
            path: { type: "string", description: "File path e.g. src/App.jsx" },
          },
          required: ["path"],
        },
      },
      {
        name: "edit_file",
        description: "Replace the entire content of an existing file",
        parameters: {
          type: "object",
          properties: {
            path: { type: "string", description: "File path to edit" },
            content: { type: "string", description: "New full file content" },
          },
          required: ["path", "content"],
        },
      },
      {
        name: "create_file",
        description: "Create a new file with content",
        parameters: {
          type: "object",
          properties: {
            path: { type: "string", description: "File path to create" },
            content: { type: "string", description: "File content" },
          },
          required: ["path", "content"],
        },
      },
      {
        name: "list_files",
        description: "List all file paths in the project",
        parameters: { type: "object", properties: {} },
      },
    ],
  },
];

function executeTool(name, args, allFiles, { onEdit, onCreate }) {
  switch (name) {
    case "read_file": {
      const content = allFiles[args.path];
      if (content == null) return { error: `File not found: ${args.path}` };
      return { content };
    }
    case "edit_file": {
      if (allFiles[args.path] == null)
        return { error: `File not found: ${args.path}` };
      onEdit(args.path, args.content);
      return { success: true, path: args.path };
    }
    case "create_file": {
      onCreate(args.path, args.content);
      return { success: true, path: args.path };
    }
    case "list_files": {
      return { files: Object.keys(allFiles) };
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

export function useGemini() {
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async ({
      userMessage,
      allFiles,
      onEdit,
      onCreate,
      onToolCall, // (name, args, phase: 'start'|'end', resultData) => void
      onStream, // (accumulatedText: string) => void
    }) => {
      if (!API_KEY) return { error: "VITE_GEMINI_API_KEY not set" };

      setIsLoading(true);

      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        systemInstruction: SYSTEM_PROMPT,
        tools,
        generationConfig: {
          maxOutputTokens: 10000, // max tokens per single response turn
          temperature: 0.2,
        },
      });

      const chat = model.startChat();

      const fileList = Object.keys(allFiles).join(", ");
      const prompt = `Project files: [${fileList}]\n\nRequest: ${userMessage}`;

      try {
        let response = await chat.sendMessageStream(prompt);

        while (true) {
          let fullText = "";

          for await (const chunk of response.stream) {
            const text = chunk.text();
            if (text) {
              fullText += text;
              onStream?.(fullText); // ← stream to ChatPanel in real time
            }
          }

          const finalResponse = await response.response;
          const calls = finalResponse.functionCalls();

          if (!calls || calls.length === 0) {
            return { message: fullText };
          }

          const functionResponses = [];

          for (const call of calls) {
            onToolCall?.(call.name, call.args, "start", null); // ← spinner on

            const result = executeTool(call.name, call.args, allFiles, {
              onEdit,
              onCreate,
            });

            onToolCall?.(call.name, call.args, "end", result); // ← spinner off + duration

            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: result,
              },
            });
          }

          response = await chat.sendMessageStream(functionResponses);
        }
      } catch (err) {
        return { error: err.message };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { sendMessage, isLoading };
}
