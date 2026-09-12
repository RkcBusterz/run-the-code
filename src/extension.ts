import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

interface RunConfig {
  commands?: {
    [key: string]: string;
  };
}

export function activate(context: vscode.ExtensionContext) {
  const runFileCommand = vscode.commands.registerCommand('runTheCode.runFile', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('Run The Code: No active file open to run.');
      return;
    }

    const document = editor.document;
    if (document.isUntitled) {
      vscode.window.showWarningMessage('Run The Code: Please save the file before running.');
      return;
    }

    // Auto-save the file if there are unsaved edits
    if (document.isDirty) {
      await document.save();
    }

    const filePath = document.fileName;
    const fileDir = path.dirname(filePath);
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const fileNameWithoutExt = path.basename(filePath, ext);

    // 1. Check for run_config.json in the current file directory or workspace root
    let resolvedCommand = getCustomConfigCommand(fileDir, fileName);

    // 2. Fall back to default language runners if no custom config command matched
    if (!resolvedCommand) {
      resolvedCommand = getDefaultLanguageCommand(ext, fileName, fileNameWithoutExt);
    }

    if (!resolvedCommand) {
      vscode.window.showErrorMessage(`Run The Code: No execution command configured for file type "${ext}".`);
      return;
    }

    // 3. Get or create the dedicated integrated terminal
    let terminal = vscode.window.terminals.find(t => t.name === 'Run The Code');
    if (!terminal) {
      terminal = vscode.window.createTerminal('Run The Code');
    }

    terminal.show();

    // 4. Navigate to the directory and run the command
    // Windows PowerShell / Command Prompt & POSIX friendly
    terminal.sendText(`cd "${fileDir}"`);
    terminal.sendText(resolvedCommand);
  });

  context.subscriptions.push(runFileCommand);
}

export function deactivate() {}

/**
 * Searches for a `run_config.json` in the active file directory
 * or workspace folders, checking for exact file match or a wildcard fallback.
 */
function getCustomConfigCommand(fileDir: string, fileName: string): string | null {
  const configLocations: string[] = [path.join(fileDir, 'run_config.json')];

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (workspaceFolder && workspaceFolder !== fileDir) {
    configLocations.push(path.join(workspaceFolder, 'run_config.json'));
  }

  for (const configPath of configLocations) {
    if (fs.existsSync(configPath)) {
      try {
        const raw = fs.readFileSync(configPath, 'utf-8');
        const config: RunConfig = JSON.parse(raw);

        if (config.commands) {
          // Direct file match (e.g. "index.ts": "npm start")
          if (config.commands[fileName]) {
            return config.commands[fileName];
          }
          // Wildcard fallback (e.g. "*": "echo running default")
          if (config.commands['*']) {
            return config.commands['*'].replace(/\$file/g, fileName);
          }
        }
      } catch (err) {
        vscode.window.showErrorMessage(`Error parsing run_config.json: ${err}`);
      }
    }
  }

  return null;
}

/**
 * Default runner commands based on common file extensions.
 */
function getDefaultLanguageCommand(ext: string, fileName: string, fileNameWithoutExt: string): string | null {
  switch (ext) {
    case '.py':
      return `python "${fileName}"`;
    case '.js':
      return `node "${fileName}"`;
    case '.ts':
      return `npx tsx "${fileName}"`;
    case '.cpp':
    case '.cc':
      return `g++ "${fileName}" -o "${fileNameWithoutExt}" && ./"${fileNameWithoutExt}"`;
    case '.c':
      return `gcc "${fileName}" -o "${fileNameWithoutExt}" && ./"${fileNameWithoutExt}"`;
    case '.rs':
      return `rustc "${fileName}" && ./"${fileNameWithoutExt}"`;
    case '.go':
      return `go run "${fileName}"`;
    case '.java':
      return `javac "${fileName}" && java "${fileNameWithoutExt}"`;
    case '.sh':
      return `bash "${fileName}"`;
    case '.ps1':
      return `powershell -ExecutionPolicy Bypass -File "${fileName}"`;
    default:
      return null;
  }
}