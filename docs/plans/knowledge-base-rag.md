# Knowledge Base RAG Implementation Plan

## Overview
Add file reading/writing capabilities and RAG (Retrieval-Augmented Generation) functionality to org-mate, designed to work with any text-based knowledge base (org files, markdown, plain text, etc.).

## Phase 1: File Capabilities

### 1. FileManager Class
Create `src/lib/file-manager.ts` to handle:
- Reading text files
- Writing/updating text files
- Listing files in configured directories
- Filtering by file patterns

### 2. Configuration Extension
Extend `config.json` structure:
```json
{
  "ollama": { ... },
  "assistant": { ... },
  "knowledgeBase": {
    "directories": ["/path/to/notes"],
    "filePatterns": ["*.org", "*.md", "*.txt"],
    "excludePatterns": [".git", "node_modules"]
  }
}
```

## Phase 2: Simple RAG (ripgrep-based)

### 3. Search Implementation
Create `src/lib/search.ts`:
- Use ripgrep to search across configured file patterns
- Return relevant file snippets with context (lines before/after)
- Support case-insensitive and regex searches
- Rank results by relevance

### 4. Chat Integration
Enhance Chat component:
- Automatically search knowledge base based on user queries (configurable)
- Include relevant snippets in system context sent to LLM
- Display which files were referenced in responses
- Optional explicit search commands (e.g., `/search <query>`)

## Phase 3: Future Full RAG

### 5. Advanced RAG (Future)
- Generate embeddings for knowledge base files
- Vector store for semantic search
- Chunk management and indexing
- Re-ranking and retrieval strategies

## Design Principles
- **Generic**: Works with any text file format (org, markdown, txt, etc.)
- **Configurable**: User controls directories and file patterns
- **Local-first**: All processing happens locally
- **Progressive**: Start simple (ripgrep), upgrade to full RAG later

## Todo List
- [ ] Add file reading capability with FileManager class
- [ ] Add file writing capability for text files
- [ ] Implement ripgrep-based search for knowledge base files
- [ ] Add knowledge base configuration (directories, file patterns)
- [ ] Integrate file search with chat context
