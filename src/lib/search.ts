import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface SearchResult {
  file: string;
  line: number;
  content: string;
  context: {
    before: string[];
    after: string[];
  };
}

export interface SearchOptions {
  caseSensitive?: boolean;
  contextLines?: number;
  maxResults?: number;
  filePatterns?: string[];
}

export class SearchEngine {
  private directories: string[];

  constructor(directories: string[] = []) {
    this.directories = directories;
  }

  /**
   * Search for a query using ripgrep
   */
  async search(
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResult[]> {
    const {
      caseSensitive = false,
      contextLines = 2,
      maxResults = 50,
      filePatterns = ["*.org", "*.md", "*.txt"],
    } = options;

    if (this.directories.length === 0) {
      return [];
    }

    const results: SearchResult[] = [];

    for (const directory of this.directories) {
      try {
        const dirResults = await this.searchDirectory(
          directory,
          query,
          caseSensitive,
          contextLines,
          filePatterns,
        );
        results.push(...dirResults);

        if (results.length >= maxResults) {
          break;
        }
      } catch (error) {
        console.warn(`Failed to search directory ${directory}:`, error);
      }
    }

    return results.slice(0, maxResults);
  }

  /**
   * Search a specific directory using ripgrep
   */
  private async searchDirectory(
    directory: string,
    query: string,
    caseSensitive: boolean,
    contextLines: number,
    filePatterns: string[],
  ): Promise<SearchResult[]> {
    // Build ripgrep command
    const caseFlag = caseSensitive ? "" : "-i";
    const globArgs = filePatterns.map((p) => `-g '${p}'`).join(" ");
    const escapedQuery = query.replace(/'/g, "'\\''");

    const command = `rg ${caseFlag} -n -C ${contextLines} --json ${globArgs} '${escapedQuery}' '${directory}'`;

    try {
      const { stdout } = await execAsync(command, {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      return this.parseRipgrepJson(stdout);
    } catch (error: any) {
      // ripgrep returns exit code 1 when no matches found
      if (error.code === 1) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Parse ripgrep JSON output
   */
  private parseRipgrepJson(output: string): SearchResult[] {
    const results: SearchResult[] = [];
    const lines = output.trim().split("\n");

    let currentFile = "";
    let currentLine = 0;
    let currentContent = "";
    let beforeContext: string[] = [];
    let afterContext: string[] = [];
    let isMatch = false;

    for (const line of lines) {
      if (!line) continue;

      try {
        const json = JSON.parse(line);

        if (json.type === "match") {
          if (isMatch && currentFile) {
            // Save previous match
            results.push({
              file: currentFile,
              line: currentLine,
              content: currentContent,
              context: {
                before: [...beforeContext],
                after: [...afterContext],
              },
            });
          }

          currentFile = json.data.path.text;
          currentLine = json.data.line_number;
          currentContent = json.data.lines.text.trim();
          beforeContext = [];
          afterContext = [];
          isMatch = true;
        } else if (json.type === "context" && isMatch) {
          const contextText = json.data.lines.text.trim();
          if (json.data.line_number < currentLine) {
            beforeContext.push(contextText);
          } else {
            afterContext.push(contextText);
          }
        }
      } catch (e) {
        // Skip unparseable lines
        continue;
      }
    }

    // Add last match
    if (isMatch && currentFile) {
      results.push({
        file: currentFile,
        line: currentLine,
        content: currentContent,
        context: {
          before: beforeContext,
          after: afterContext,
        },
      });
    }

    return results;
  }

  /**
   * Update search directories
   */
  updateDirectories(directories: string[]): void {
    this.directories = directories;
  }
}
