import React, { useState, useEffect } from "react";
import { Box, Text, useInput, useApp } from "ink";
import { OllamaClient, type Message } from "../lib/ollama.js";
import { SearchEngine, type SearchResult } from "../lib/search.js";

interface ChatProps {
  model: string;
  host: string;
  systemPrompt: string;
  searchEngine?: SearchEngine;
  enableAutoSearch?: boolean;
}

const Chat: React.FC<ChatProps> = ({
  model,
  host,
  systemPrompt,
  searchEngine,
  enableAutoSearch = false,
}) => {
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
  const [messageQueue, setMessageQueue] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === "c")) {
      exit();
      return;
    }

    if (key.return) {
      handleSubmit();
      return;
    }

    if (key.backspace || key.delete) {
      setInputText((prev) => prev.slice(0, -1));
    } else if (!key.ctrl && !key.meta && input.length === 1) {
      setInputText((prev) => prev + input);
    }
  });

  const handleSubmit = () => {
    const userMessage = inputText.trim();
    if (!userMessage) return;

    setInputText("");

    if (isLoading) {
      // Add to queue if currently processing
      setMessageQueue((prev) => [...prev, userMessage]);
    } else {
      // Process immediately if not loading
      processMessage(userMessage);
    }
  };

  const processMessage = async (userMessage: string) => {
    setIsLoading(true);
    setResponse("");
    setSearchResults([]);

    // Perform search if enabled and search engine available
    let searchContext = "";
    if (searchEngine && enableAutoSearch) {
      try {
        const results = await searchEngine.search(userMessage, {
          maxResults: 5,
          contextLines: 2,
        });

        setSearchResults(results);

        if (results.length > 0) {
          searchContext = "\n\nRelevant context from your knowledge base:\n\n";
          results.forEach((result) => {
            searchContext += `From ${result.file}:${result.line}\n`;
            if (result.context.before.length > 0) {
              searchContext += result.context.before.join("\n") + "\n";
            }
            searchContext += `> ${result.content}\n`;
            if (result.context.after.length > 0) {
              searchContext += result.context.after.join("\n") + "\n";
            }
            searchContext += "\n";
          });
        }
      } catch (error) {
        console.warn("Search failed:", error);
      }
    }

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage + searchContext },
    ];

    setMessages(newMessages);

    try {
      const client = new OllamaClient(model, host);
      let fullResponse = "";

      for await (const chunk of client.chatStream(newMessages)) {
        fullResponse += chunk;
        setResponse(fullResponse);
      }

      const updatedMessages: Message[] = [
        ...newMessages,
        { role: "assistant", content: fullResponse },
      ];
      setMessages(updatedMessages);
    } catch (error) {
      setResponse(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Process queued messages when loading completes
  useEffect(() => {
    if (!isLoading && messageQueue.length > 0) {
      const nextMessage = messageQueue[0];
      const remainingQueue = messageQueue.slice(1);
      setMessageQueue(remainingQueue);
      if (nextMessage !== undefined) {
        processMessage(nextMessage);
      }
    }
  }, [isLoading, messageQueue]);

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
              <Text>{msg.content.split("\n\nRelevant context")[0]}</Text>
            </Box>
          ))}

        {searchResults.length > 0 && (
          <Box marginBottom={1} flexDirection="column">
            <Text bold color="magenta">
              📚 Found {searchResults.length} relevant{" "}
              {searchResults.length === 1 ? "match" : "matches"}:
            </Text>
            {searchResults.map((result, idx) => (
              <Text key={idx} color="gray">
                • {result.file}:{result.line}
              </Text>
            ))}
          </Box>
        )}

        {isLoading && response && (
          <Box marginBottom={1} flexDirection="column">
            <Text bold color="blue">
              ← Assistant:
            </Text>
            <Text>{response}</Text>
          </Box>
        )}

        {messageQueue.length > 0 && (
          <Box marginBottom={1} flexDirection="column">
            <Text bold color="yellow">
              Queued messages ({messageQueue.length}):
            </Text>
            {messageQueue.map((msg, idx) => (
              <Text key={idx} color="gray">
                {idx + 1}. {msg}
              </Text>
            ))}
          </Box>
        )}
      </Box>

      <Box borderStyle="single" borderColor="gray" padding={1}>
        <Text>
          <Text color="green">{"> "}</Text>
          <Text>{inputText}</Text>
          <Text color="gray">█</Text>
          {isLoading && <Text color="yellow"> (processing...)</Text>}
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
