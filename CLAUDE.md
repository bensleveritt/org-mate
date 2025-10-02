# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Org-mate is a local-first AI-powered personal organization assistant built with Bun, TypeScript, React (via Ink for CLI rendering), and Ollama for local LLM inference.

## Commands

**Development & Running:**
```bash
bun install              # Install dependencies
bun run index.ts         # Run the CLI tool
bun run index.ts chat    # Start interactive chat session
bun run index.ts ask "question"  # Ask a one-off question
bun run index.ts config --show   # View current configuration
bun run index.ts config --path   # Show config file location
```

**Requirements:**
- Ollama must be running locally (default: http://localhost:11434)
- Default model is `llama3.2` (configurable via config.json or --model flag)

## Architecture

**Entry Point:**
- `index.ts` - CLI entry point using Commander.js, defines three commands: `chat`, `ask`, and `config`

**Core Libraries (`src/lib/`):**
- `ollama.ts` - `OllamaClient` wrapper around the ollama package, handles both streaming and non-streaming chat
- `config.ts` - `ConfigManager` handles config.json loading/saving with defaults for Ollama host, model, and system prompt

**Components (`src/components/`):**
- `Chat.tsx` - Ink-based interactive terminal UI component for chat sessions. Manages message history, input handling, and streaming responses

**Configuration:**
- Config stored in `config.json` (created automatically with defaults on first run)
- Structure: `{ ollama: { host, defaultModel }, assistant: { systemPrompt } }`
- ConfigManager creates config.json if it doesn't exist

**Key Design Patterns:**
- OllamaClient supports both streaming (`chatStream`) and non-streaming (`chat`) methods
- Chat component uses Ink's `useInput` hook for terminal input handling
- Messages are typed as `{ role: 'user' | 'assistant' | 'system', content: string }`
- System prompt is always inserted as first message in chat sessions

**Build System:**
- Uses Bun as runtime and package manager (not Node.js)
- TypeScript with strict mode, bundler module resolution
- Module type: ES modules with `.js` extensions in imports (TypeScript outputs .js)
