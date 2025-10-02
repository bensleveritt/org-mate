import React, { useState, useEffect } from "react";
import { Box, Text, useInput, useApp } from "ink";
import { OllamaClient, type Message } from "../lib/ollama.js";

interface ChatProps {
  model: string;
  host: string;
  systemPrompt: string;
}

const Chat: React.FC<ChatProps> = ({ model, host, systemPrompt }) => {
  const { exit } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content: systemPrompt,
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState("");

  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === "c")) {
      exit();
      return;
    }

    if (key.return) {
      if (!isLoading) {
        handleSubmit();
      }
      return;
    }

    if (key.backspace || key.delete) {
      setInputText((prev) => prev.slice(0, -1));
    } else if (!key.ctrl && !key.meta && input.length === 1) {
      setInputText((prev) => prev + input);
    }
  });

  const handleSubmit = async () => {
    const userMessage = inputText.trim();
    if (!userMessage) return;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];

    setMessages(newMessages);
    setInputText("");
    setIsLoading(true);
    setResponse("");

    try {
      const client = new OllamaClient(model, host);
      let fullResponse = "";

      for await (const chunk of client.chatStream(newMessages)) {
        fullResponse += chunk;
        setResponse(fullResponse);
      }

      setMessages([
        ...newMessages,
        { role: "assistant", content: fullResponse },
      ]);
    } catch (error) {
      setResponse(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="round" borderColor="cyan" padding={1} marginBottom={1}>
        <Text bold color="cyan">
          Org-Mate Assistant ({model})
        </Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        {messages
          .filter((m) => m.role !== "system")
          .map((msg, idx) => (
            <Box key={idx} marginBottom={1} flexDirection="column">
              <Text bold color={msg.role === "user" ? "green" : "blue"}>
                {msg.role === "user" ? "→ You" : "← Assistant"}:
              </Text>
              <Text>{msg.content}</Text>
            </Box>
          ))}

        {isLoading && response && (
          <Box marginBottom={1} flexDirection="column">
            <Text bold color="blue">
              ← Assistant:
            </Text>
            <Text>{response}</Text>
          </Box>
        )}
      </Box>

      <Box borderStyle="single" borderColor="gray" padding={1}>
        <Text>
          {isLoading ? (
            <Text color="yellow">Loading...</Text>
          ) : (
            <>
              <Text color="green">{"> "}</Text>
              <Text>{inputText}</Text>
              <Text color="gray">█</Text>
            </>
          )}
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>
          Press <Text bold>Enter</Text> to send • <Text bold>Esc</Text> to quit
        </Text>
      </Box>
    </Box>
  );
};

export default Chat;
