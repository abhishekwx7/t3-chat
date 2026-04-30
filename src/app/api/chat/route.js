import { convertToModelMessages, streamText } from "ai";
import db from "@/lib/db";
import { MessageRole, MessageType } from "@prisma/client";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { CHAT_SYSTEM_PROMPT } from "@/lib/prompt";

const provider = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

function convertStoredMessageToUI(msg) {
  try {
    const parsed = JSON.parse(msg.content);
    const parts = Array.isArray(parsed)
      ? parsed.filter((part) => part?.type === "text" && part?.text)
      : [{ type: "text", text: msg.content }];

    if (parts.length === 0) return null;

    return {
      id: msg.id,
      role: msg.messageRole.toLowerCase(),
      parts,
      createdAt: msg.createdAt,
    };
  } catch {
    return {
      id: msg.id,
      role: msg.messageRole.toLowerCase(),
      parts: [{ type: "text", text: msg.content }],
      createdAt: msg.createdAt,
    };
  }
}

function normalizeUIMessage(message) {
  if (!message) return null;

  if (message.role && Array.isArray(message.parts)) {
    return {
      id: message.id,
      role: message.role,
      parts: message.parts
        .filter((part) => part?.type === "text" && part?.text)
        .map((part) => ({
          type: "text",
          text: part.text,
        })),
      createdAt: message.createdAt,
    };
  }

  if (message.role && typeof message.content === "string") {
    return {
      id: message.id,
      role: message.role,
      parts: [{ type: "text", text: message.content }],
      createdAt: message.createdAt,
    };
  }

  if (typeof message.text === "string") {
    return {
      id: message.id,
      role: "user",
      parts: [{ type: "text", text: message.text }],
      createdAt: message.createdAt,
    };
  }

  return null;
}

function extractPartsAsJSON(message) {
  if (message?.parts && Array.isArray(message.parts)) {
    return JSON.stringify(
      message.parts.filter((part) => part?.type === "text" && part?.text),
    );
  }

  if (typeof message?.content === "string") {
    return JSON.stringify([{ type: "text", text: message.content }]);
  }

  if (typeof message?.text === "string") {
    return JSON.stringify([{ type: "text", text: message.text }]);
  }

  return JSON.stringify([]);
}

export async function POST(req) {
  try {
    const body = await req.json();

    console.log("API /chat body:", body);

    const { chatId, messages, message, model, skipUserMessage } = body;

    if (!model) {
      return new Response(
        JSON.stringify({
          error: "Model is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const previousMessages = chatId
      ? await db.message.findMany({
          where: { chatId },
          orderBy: {
            createdAt: "asc",
          },
        })
      : [];

    const storedUIMessages = previousMessages
      .map(convertStoredMessageToUI)
      .filter(Boolean);

    const incomingMessages = Array.isArray(messages)
      ? messages
      : message
        ? [message]
        : [];

    const normalizedIncomingMessages = incomingMessages
      .map(normalizeUIMessage)
      .filter(Boolean)
      .filter((msg) => Array.isArray(msg.parts) && msg.parts.length > 0);

    const allUIMessages = [
      ...storedUIMessages,
      ...normalizedIncomingMessages,
    ].filter(Boolean);

    if (!Array.isArray(allUIMessages) || allUIMessages.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No valid messages found",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const modelMessages = allUIMessages.map((msg) => ({
      role: msg.role,
      content: msg.parts
        .filter((part) => part.type === "text" && part.text)
        .map((part) => part.text)
        .join("\n"),
    }));

    console.log("modelMessages:", modelMessages);

    const result = streamText({
      model: provider.chat(model),
      messages: modelMessages,
      system: CHAT_SYSTEM_PROMPT,
    });

    return result.toUIMessageStreamResponse({
      sendReasoning: true,
      originalMessages: allUIMessages,

      onFinish: async ({ responseMessage }) => {
        try {
          if (!chatId) return;

          const messagesToSave = [];

          if (!skipUserMessage) {
            const latestUserMessage = [...normalizedIncomingMessages]
              .reverse()
              .find((msg) => msg.role === "user");

            if (latestUserMessage) {
              const userPartsJSON = extractPartsAsJSON(latestUserMessage);

              messagesToSave.push({
                chatId,
                content: userPartsJSON,
                messageRole: MessageRole.USER,
                model,
                messageType: MessageType.NORMAL,
              });
            }
          }

          if (
            responseMessage?.parts &&
            Array.isArray(responseMessage.parts) &&
            responseMessage.parts.length > 0
          ) {
            const assistantPartsJSON = extractPartsAsJSON(responseMessage);

            messagesToSave.push({
              chatId,
              content: assistantPartsJSON,
              messageRole: MessageRole.ASSISTANT,
              model,
              messageType: MessageType.NORMAL,
            });
          }

          if (messagesToSave.length > 0) {
            await db.message.createMany({
              data: messagesToSave,
            });
          }
        } catch (error) {
          console.error("❌ Error saving messages:", error);
        }
      },
    });
  } catch (error) {
    console.error("❌ API Route Error:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
