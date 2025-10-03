#!/usr/bin/env bun
import { Command } from "commander";
import { render } from "ink";
import React from "react";
import Chat from "./src/components/Chat.js";
import { ConfigManager } from "./src/lib/config.js";
import { SearchEngine } from "./src/lib/search.js";

const config = new ConfigManager();

const program = new Command();

program
  .name("org-mate")
  .description("Local-first AI-powered personal organization assistant")
  .version("0.1.0");

program
  .command("chat")
  .description("Start an interactive chat session with your assistant")
  .option("-m, --model <model>", "Ollama model to use (overrides config)")
  .action(async (options) => {
    const cfg = await config.load();
    const model = options.model || cfg.ollama.defaultModel;
    const host = cfg.ollama.host;
    const systemPrompt = cfg.assistant.systemPrompt;

    // Initialize search engine if knowledge base is configured
    let searchEngine: SearchEngine | undefined;
    if (cfg.knowledgeBase.directories.length > 0) {
      searchEngine = new SearchEngine(cfg.knowledgeBase.directories);
    }

    render(
      React.createElement(Chat, {
        model,
        host,
        systemPrompt,
        searchEngine,
        enableAutoSearch: cfg.knowledgeBase.enableAutoSearch,
      }),
    );
  });

program
  .command("ask")
  .description("Ask a quick question")
  .argument("<question>", "Question to ask")
  .option("-m, --model <model>", "Ollama model to use (overrides config)")
  .action(async (question: string, options) => {
    const cfg = await config.load();
    const { Ollama } = await import("ollama");
    const ollama = new Ollama({ host: cfg.ollama.host });
    const model = options.model || cfg.ollama.defaultModel;

    try {
      const response = await ollama.chat({
        model,
        messages: [{ role: "user", content: question }],
        stream: false,
      });

      console.log("\n" + response.message.content + "\n");
    } catch (error) {
      console.error(
        "Error:",
        error instanceof Error ? error.message : "Unknown error",
      );
      process.exit(1);
    }
  });

program
  .command("config")
  .description("Manage configuration")
  .option("-s, --show", "Show current configuration")
  .option("-p, --path", "Show config file path")
  .action(async (options) => {
    if (options.path) {
      console.log(config.getPath());
      return;
    }

    if (options.show) {
      const cfg = await config.load();
      console.log(JSON.stringify(cfg, null, 2));
      return;
    }

    console.log(
      "Use --show to view config or --path to see config file location",
    );
  });

program.parse();
