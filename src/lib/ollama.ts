import { Ollama } from 'ollama';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class OllamaClient {
  private client: Ollama;
  private model: string;

  constructor(model: string = 'llama3.2', host: string = 'http://localhost:11434') {
    this.client = new Ollama({ host });
    this.model = model;
  }

  async chat(messages: Message[]): Promise<string> {
    const response = await this.client.chat({
      model: this.model,
      messages,
      stream: false,
    });

    return response.message.content;
  }

  async *chatStream(messages: Message[]): AsyncGenerator<string> {
    const response = await this.client.chat({
      model: this.model,
      messages,
      stream: true,
    });

    for await (const part of response) {
      if (part.message.content) {
        yield part.message.content;
      }
    }
  }

  async listModels(): Promise<string[]> {
    const response = await this.client.list();
    return response.models.map(m => m.name);
  }

  setModel(model: string) {
    this.model = model;
  }

  getModel(): string {
    return this.model;
  }
}
