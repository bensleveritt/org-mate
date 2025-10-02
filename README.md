# org-mate

A local-first AI-powered personal organization assistant that runs entirely on your machine.

## Features

- **Interactive Chat**: Terminal-based chat interface powered by local LLMs
- **Quick Questions**: Ask one-off questions directly from the command line
- **Privacy-First**: All processing happens locally via Ollama
- **Configurable**: Customize model, host, and system prompts

## Prerequisites

- [Bun](https://bun.sh) runtime installed
- [Ollama](https://ollama.ai) running locally with a model pulled (e.g., `ollama pull llama3.2`)

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

## Development

This project uses:
- **Bun** - Fast JavaScript runtime and package manager
- **TypeScript** - Type-safe development
- **Ink** - React for CLI interfaces
- **Ollama** - Local LLM inference
- **Commander.js** - CLI framework
