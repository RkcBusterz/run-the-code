# Run The Code

A lightweight VS Code extension to execute your code files with custom commands or default language runners via an integrated play button or hotkey.

## Features

- **Play Button:** Adds a direct run button to the editor title bar.
- **Shortcut:** Run any active file instantly using `Ctrl+Alt+N` (`Cmd+Alt+N` on macOS).
- **Custom Config Support:** Drop a `run_config.json` in your workspace or folder to override commands per-file or globally.
- **Built-in Language Defaults:** Out-of-the-box support for Python, JavaScript, TypeScript, C++, C, Rust, Go, Java, and Bash.

## Usage

1. Open any file in VS Code.
2. Click the **Play** button in the top-right corner of the editor title bar, or press `Ctrl + Alt + N`.
3. The dedicated terminal will open and execute the file.

### Configuration (`run_config.json`)

You can create an optional `run_config.json` in your workspace root or subfolder:

```json
{
  "commands": {
    "index.ts": "npm start",
    "main.py": "python -u main.py --debug",
    "*": "echo 'Running: $file'"
  }
}