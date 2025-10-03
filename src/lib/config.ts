import { existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";

export interface Config {
  ollama: {
    host: string;
    defaultModel: string;
  };
  assistant: {
    systemPrompt: string;
  };
  knowledgeBase: {
    directories: string[];
    filePatterns: string[];
    excludePatterns: string[];
    enableAutoSearch: boolean;
  };
}

const DEFAULT_CONFIG: Config = {
  ollama: {
    host: "http://localhost:11434",
    defaultModel: "llama3.2",
  },
  assistant: {
    systemPrompt:
      "You are a helpful personal organization assistant. Help the user manage tasks, schedule, and stay organized.",
  },
  knowledgeBase: {
    directories: [],
    filePatterns: ["*.org", "*.md", "*.txt"],
    excludePatterns: [".git", "node_modules", ".obsidian"],
    enableAutoSearch: false,
  },
};

export class ConfigManager {
  private configPath: string;
  private config: Config | null = null;

  constructor(configPath: string = "./config.json") {
    this.configPath = configPath;
  }

  async load(): Promise<Config> {
    if (this.config) {
      return this.config;
    }

    if (!existsSync(this.configPath)) {
      await this.save(DEFAULT_CONFIG);
      this.config = DEFAULT_CONFIG;
      return this.config;
    }

    const content = await readFile(this.configPath, "utf-8");
    this.config = JSON.parse(content);
    return this.config!;
  }

  async save(config: Config): Promise<void> {
    await writeFile(this.configPath, JSON.stringify(config, null, 2), "utf-8");
    this.config = config;
  }

  async update(partial: Partial<Config>): Promise<Config> {
    const current = await this.load();
    const updated = { ...current, ...partial };
    await this.save(updated);
    return updated;
  }

  async get<K extends keyof Config>(key: K): Promise<Config[K]> {
    const config = await this.load();
    return config[key];
  }

  async set<K extends keyof Config>(key: K, value: Config[K]): Promise<void> {
    const config = await this.load();
    config[key] = value;
    await this.save(config);
  }

  getPath(): string {
    return this.configPath;
  }
}
