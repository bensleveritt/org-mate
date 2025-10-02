#!/usr/bin/env bun
import { Command } from 'commander';
import { render } from 'ink';
import React from 'react';
import Chat from './src/components/Chat.js';

const program = new Command();

program
  .name('org-mate')
  .description('AI-powered personal organization assistant')
  .version('0.1.0');

program
  .command('chat')
  .description('Start an interactive chat session with your assistant')
  .option('-m, --model <model>', 'Ollama model to use', 'llama3.2')
  .action(async (options) => {
    render(React.createElement(Chat, { model: options.model }));
  });

program
  .command('ask')
  .description('Ask a quick question')
  .argument('<question>', 'Question to ask')
  .option('-m, --model <model>', 'Ollama model to use', 'llama3.2')
  .action(async (question: string, options) => {
    const { Ollama } = await import('ollama');
    const ollama = new Ollama({ host: 'http://localhost:11434' });

    try {
      const response = await ollama.chat({
        model: options.model,
        messages: [{ role: 'user', content: question }],
        stream: false,
      });

      console.log('\n' + response.message.content + '\n');
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program.parse();
