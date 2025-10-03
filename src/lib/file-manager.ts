import { readFile, writeFile, stat } from "fs/promises";
import { existsSync } from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  modified: Date;
}

export class FileManager {
  private directories: string[];
  private filePatterns: string[];
  private excludePatterns: string[];

  constructor(
    directories: string[] = [],
    filePatterns: string[] = ["*.org", "*.md", "*.txt"],
    excludePatterns: string[] = [".git", "node_modules"],
  ) {
    this.directories = directories;
    this.filePatterns = filePatterns;
    this.excludePatterns = excludePatterns;
  }

  /**
   * Read the contents of a file
   */
  async readFile(filePath: string): Promise<string> {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    return await readFile(filePath, "utf-8");
  }

  /**
   * Write content to a file
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    await writeFile(filePath, content, "utf-8");
  }

  /**
   * List all files in configured directories matching patterns using fd
   */
  async listFiles(): Promise<FileInfo[]> {
    const files: FileInfo[] = [];

    for (const directory of this.directories) {
      if (!existsSync(directory)) {
        console.warn(`Directory not found: ${directory}`);
        continue;
      }

      const dirFiles = await this.scanDirectoryWithFd(directory);
      files.push(...dirFiles);
    }

    return files;
  }

  /**
   * Use fd to find files matching patterns
   */
  private async scanDirectoryWithFd(dirPath: string): Promise<FileInfo[]> {
    const excludeArgs = this.excludePatterns.map((p) => `-E "${p}"`).join(" ");
    const extensionArgs = this.filePatterns
      .map((p) => {
        // Extract extension from pattern like *.org
        const match = p.match(/\*\.(\w+)/);
        return match ? `-e ${match[1]}` : "";
      })
      .filter(Boolean)
      .join(" ");

    const command = `fd ${extensionArgs} ${excludeArgs} --type f --absolute-path . "${dirPath}"`;

    try {
      const { stdout } = await execAsync(command, {
        maxBuffer: 10 * 1024 * 1024,
      });

      const filePaths = stdout
        .trim()
        .split("\n")
        .filter((p) => p.length > 0);
      const files: FileInfo[] = [];

      for (const path of filePaths) {
        try {
          const stats = await stat(path);
          const pathParts = path.split("/");
          const name = pathParts[pathParts.length - 1] || "";

          files.push({
            path,
            name,
            size: stats.size,
            modified: stats.mtime,
          });
        } catch (error) {
          // Skip files that can't be stat'd
          continue;
        }
      }

      return files;
    } catch (error: any) {
      if (error.code === 1) {
        // fd returns exit code 1 when no matches found
        return [];
      }
      throw error;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(
    directories?: string[],
    filePatterns?: string[],
    excludePatterns?: string[],
  ): void {
    if (directories) this.directories = directories;
    if (filePatterns) this.filePatterns = filePatterns;
    if (excludePatterns) this.excludePatterns = excludePatterns;
  }
}
