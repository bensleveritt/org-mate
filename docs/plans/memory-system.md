# Memory System Implementation Plan

## Overview
Add comprehensive memory capabilities to org-mate, enabling conversation persistence, long-term fact extraction, and conversation summaries.

## Phase 1: Session Persistence

### 1.1 Conversation Storage
- Create `src/lib/memory.ts` with `ConversationStore` class
- Store conversations in SQLite database (`conversations.db`)
- Schema:
  - `conversations` table: id, title, created_at, updated_at, archived
  - `messages` table: id, conversation_id, role, content, timestamp, metadata (JSON)
  - `conversation_metadata` table: id, conversation_id, key, value

### 1.2 Conversation Management
- Auto-save messages during chat sessions
- List previous conversations
- Load/resume specific conversation
- Archive/delete conversations
- Auto-generate conversation titles from first few messages

### 1.3 CLI Commands
- `chat` - Start new conversation or resume last
- `chat --list` - Show all conversations
- `chat --resume <id>` - Resume specific conversation
- `chat --new` - Force new conversation
- `conversations list` - Detailed conversation list
- `conversations show <id>` - Display full conversation
- `conversations delete <id>` - Delete conversation
- `conversations export <id>` - Export to markdown/JSON

## Phase 2: Long-term Memory

### 2.1 Fact Extraction
- After each conversation, use LLM to extract:
  - User preferences (e.g., "prefers markdown over org-mode")
  - Important tasks/todos mentioned
  - Personal information (projects, interests, goals)
  - Recurring themes/topics
- Store in `facts` table: id, fact_type, content, source_conversation_id, confidence, created_at, last_seen

### 2.2 Memory Injection
- Before processing user messages, query facts database
- Inject relevant facts into system prompt
- "Remember: User prefers X, is working on Y project, has Z deadline"
- Track fact usage/relevance over time

### 2.3 Fact Management
- `memory list` - Show all stored facts
- `memory search <query>` - Search facts
- `memory forget <id>` - Remove specific fact
- `memory edit <id>` - Update fact
- Automatic fact decay (reduce confidence over time if not reinforced)

## Phase 3: Conversation Summaries

### 3.1 Auto-summarization
- Generate summary after conversation ends (configurable)
- Write summaries as plaintext markdown files in `memory/summaries/`
- Multi-level summaries:
  - Brief (1-2 sentences)
  - Standard (1 paragraph)
  - Detailed (key points list)
- File naming: `memory/summaries/conversations/YYYY-MM-DD-{conversation_id}.md`

### 3.2 Periodic Summaries
- Daily summary: aggregate all conversations from the day
- Weekly summary: major themes, tasks, decisions
- Written as markdown files:
  - `memory/summaries/daily/YYYY-MM-DD.md`
  - `memory/summaries/weekly/YYYY-Www.md`
  - `memory/summaries/monthly/YYYY-MM.md`

### 3.3 Summary Commands
- `summary today` - Display (or create) today's summary
- `summary week` - This week's summary
- `summary month` - This month's summary
- `conversations summary <id>` - Specific conversation summary

### 3.4 Summary File Format

Example conversation summary (`memory/summaries/conversations/2025-10-03-42.md`):

```markdown
# Conversation Summary

**Date**: 2025-10-03  
**Conversation ID**: 42  
**Title**: Planning memory system for org-mate  

## Brief
Discussed and planned a comprehensive memory system including session persistence, fact extraction, and conversation summaries.

## Key Points
- Decided on SQLite for conversation/message storage
- Will extract facts using LLM after conversations
- Summaries will be plaintext markdown for human readability
- Three phases: persistence, long-term memory, summaries

## Tasks Mentioned
- Implement conversation database schema
- Create fact extraction pipeline
- Build summary generation system

## Decisions Made
- Use SQLite for structured data
- Use plaintext markdown for summaries
- Keep all memory local-first
```

Example daily summary (`memory/summaries/daily/2025-10-03.md`):

```markdown
# Daily Summary - October 3, 2025

## Conversations
- 3 conversations today
- Main topics: memory system planning, knowledge base RAG, configuration

## Key Activities
- Implemented knowledge base search with ripgrep
- Planned comprehensive memory system
- Updated configuration for org file integration

## Tasks Created
- Build conversation persistence layer
- Implement fact extraction
- Create summary generation

## Notes
Productive day focused on adding memory capabilities to org-mate.
```

## Technical Architecture

### Database Schema (SQLite)

```sql
-- Conversations
CREATE TABLE conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived BOOLEAN DEFAULT 0
);

-- Messages
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  role TEXT NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT, -- JSON for search results, etc.
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

-- Long-term facts
CREATE TABLE facts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fact_type TEXT NOT NULL, -- 'preference', 'task', 'personal', 'theme'
  content TEXT NOT NULL,
  source_conversation_id INTEGER,
  confidence REAL DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_conversation_id) REFERENCES conversations(id)
);

-- Indexes
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_facts_type ON facts(fact_type);
CREATE INDEX idx_facts_conversation ON facts(source_conversation_id);
```

### File Structure

```
src/lib/
  memory/
    database.ts        - SQLite connection and schema management
    conversation.ts    - ConversationStore class
    facts.ts          - FactExtractor and FactStore classes
    summarizer.ts     - ConversationSummarizer class
    index.ts          - Memory facade/orchestrator

index.ts              - Updated CLI with new commands
```

### Configuration

Add to `config.json`:

```json
{
  "memory": {
    "enabled": true,
    "databasePath": "./memory.db",
    "summariesPath": "./memory/summaries",
    "autoSave": true,
    "autoSummarize": true,
    "factExtraction": {
      "enabled": true,
      "minConfidence": 0.7,
      "maxFacts": 100
    },
    "summaries": {
      "generateOnEnd": true,
      "periodicSummaries": ["daily", "weekly"],
      "format": "markdown"
    }
  }
}
```

## Implementation Order

1. **Phase 1.1**: Database schema + ConversationStore
2. **Phase 1.2**: Auto-save during chat + conversation loading
3. **Phase 1.3**: CLI commands for conversation management
4. **Phase 2.1**: Fact extraction using LLM
5. **Phase 2.2**: Inject facts into chat context
6. **Phase 2.3**: Fact management commands
7. **Phase 3.1**: Auto-summarization after conversations
8. **Phase 3.2**: Periodic summary generation
9. **Phase 3.3**: Summary CLI commands

## Design Principles

- **Incremental**: Each phase delivers value independently
- **Local-first**: All data stored locally (SQLite + plaintext files)
- **Privacy**: User controls all data, easy to export/delete
- **Transparent**: User can see what's remembered and why
- **Human-readable**: Summaries stored as plaintext markdown for easy inspection/editing
- **Configurable**: Fine-grained control over memory features
- **Lightweight**: Efficient storage, minimal overhead

## Future Enhancements (Post-MVP)

- Vector embeddings for semantic search over conversations
- Conversation branching/forking
- Shared memory across multiple assistants
- Export to org-mode files for integration with knowledge base
- Memory synchronization across devices (optional)
- Conversation tagging and categorization
- Smart fact merging and deduplication
