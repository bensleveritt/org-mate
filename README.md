# org-mate

A local-first AI-powered personal organization assistant that runs entirely on your machine.

## Features

- **Interactive Chat**: Terminal-based chat interface powered by local LLMs
- **Knowledge Base RAG**: Search and retrieve context from your org/markdown files
- **Quick Questions**: Ask one-off questions directly from the command line
- **Privacy-First**: All processing happens locally via Ollama
- **Configurable**: Customize model, host, system prompts, and knowledge base

## Prerequisites

- [Bun](https://bun.sh) runtime installed
- [Ollama](https://ollama.ai) running locally with a model pulled (e.g., `ollama pull llama3.2`)
- [ripgrep](https://github.com/BurntSushi/ripgrep) (`rg`) - Fast text search (for knowledge base)
- [fd](https://github.com/sharkdp/fd) - Fast file finder (for knowledge base)

## Installation

```bash
bun install
```

## Usage

### Interactive Chat

Start a conversation with your assistant:

```bash
bun run index.ts chat
```

Use `--model` to override the default model:

```bash
bun run index.ts chat --model llama3.2
```

### Quick Questions

Ask a single question without entering chat mode:

```bash
bun run index.ts ask "What's the weather like today?"
```

### Configuration

View your current configuration:

```bash
bun run index.ts config --show
```

Find the config file location:

```bash
bun run index.ts config --path
```

Edit `config.json` to customize:
- Ollama host URL (default: `http://localhost:11434`)
- Default model (default: `llama3.2`)
- System prompt for the assistant
- Knowledge base directories and file patterns

### Knowledge Base Setup

To enable RAG (Retrieval-Augmented Generation) with your notes:

1. Edit `config.json` and add directories to search:

```json
{
  "knowledgeBase": {
    "directories": [
      "/path/to/your/org-files",
      "/path/to/your/markdown-notes"
    ],
    "filePatterns": ["*.org", "*.md", "*.txt"],
    "excludePatterns": [".git", "node_modules", ".obsidian"],
    "enableAutoSearch": true
  }
}
```

2. When `enableAutoSearch` is `true`, the assistant will automatically search your knowledge base for relevant context when you ask questions

3. Search results are displayed with file:line references and injected into the conversation context

## Development

This project uses:
- **Bun** - Fast JavaScript runtime and package manager
- **TypeScript** - Type-safe development
- **Ink** - React for CLI interfaces
- **Ollama** - Local LLM inference
- **Commander.js** - CLI framework
