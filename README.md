# Proton Drive MCP

A Model Context Protocol (MCP) server that enables AI assistants like Claude Desktop, Cursor, and other MCP-compatible clients to interact with your Proton Drive files.

## ✨ Features

- 📁 **List files and folders** in your Proton Drive
- 📄 **Read file contents** directly
- ✏️ **Create and write files** to Proton Drive
- 🗑️ **Delete files and folders**
- 📂 **Create new folders**
- 🔄 **Cross-platform support** (Windows, macOS, Linux)
- 🔒 **Secure** - Works through local filesystem, no credentials needed
- 🚀 **Easy to install** - Just npm install and configure

## 📋 Prerequisites

- Node.js 16 or higher
- Proton Drive desktop app installed and synced
- Claude Desktop, Cursor, or any MCP-compatible client

## 🚀 Quick Start

### 1. Install from npm (Recommended)

```bash
npm install -g proton-drive-mcp
```

### 2. Or install from source

```bash
git clone https://github.com/anyrxo/proton-drive-mcp.git
cd proton-drive-mcp
npm install
npm run build
```

## ⚙️ Configuration

### Finding your Proton Drive path

The MCP will try to auto-detect your Proton Drive location, but you can also set it manually:

- **macOS**: `~/Library/CloudStorage/ProtonDrive-[email]-folder`
- **Windows**: `C:\Users\[username]\Proton Drive`
- **Linux**: `~/ProtonDrive`

### Claude Desktop

Add to your Claude Desktop config:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "proton-drive": {
      "command": "node",
      "args": ["path/to/proton-drive-mcp/dist/index.js"]
    }
  }
}
```

### Cursor

Add to your Cursor settings:

```json
{
  "mcp.servers": {
    "proton-drive": {
      "command": "node",
      "args": ["path/to/proton-drive-mcp/dist/index.js"]
    }
  }
}
```

### Custom Proton Drive Path

If your Proton Drive is in a non-standard location:

```json
{
  "mcpServers": {
    "proton-drive": {
      "command": "node",
      "args": ["path/to/proton-drive-mcp/dist/index.js"],
      "env": {
        "PROTON_DRIVE_PATH": "/custom/path/to/ProtonDrive"
      }
    }
  }
}
```

## 🎯 Usage Examples

Once configured, you can ask your AI assistant:

- "List all files in my Proton Drive"
- "Create a new file called notes.txt with some content"
- "Read the contents of Documents/report.pdf"
- "Create a new folder called Projects"
- "Delete the file old-notes.txt"

## 🛠️ Available Tools

The MCP provides these tools:

| Tool | Description |
|------|-------------|
| `check_mount` | Verify Proton Drive is accessible |
| `list_files` | List contents of a directory |
| `read_file` | Read file contents |
| `write_file` | Create or overwrite files |
| `delete_file` | Remove files or folders |
| `create_folder` | Create new directories |

## 🧪 Testing

Test if the MCP is working:

```bash
# Check if Proton Drive is detected
npm run test:connection

# Run all tests
npm test
```

## 🔧 Troubleshooting

### Proton Drive not found

1. Make sure Proton Drive desktop app is running
2. Check if your files are synced
3. Set `PROTON_DRIVE_PATH` environment variable manually

### Permission errors

- Ensure the MCP has read/write access to your Proton Drive folder
- On macOS, you may need to grant permissions in System Preferences

### Tool not showing in Claude/Cursor

1. Restart your AI client after configuration
2. Check the logs for any error messages
3. Verify the path to the MCP is correct

## 📝 Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🔒 Security

- All operations are performed locally on your filesystem
- No data is sent to external servers
- Proton's end-to-end encryption is preserved
- Path validation prevents directory traversal attacks

## 🐛 Known Issues

- Large files (>10MB) may take time to read
- Binary files are not supported for reading (yet)
- Some special characters in filenames may cause issues

## 📮 Support

- Issues: [GitHub Issues](https://github.com/anyrxo/proton-drive-mcp/issues)
- Discussions: [GitHub Discussions](https://github.com/anyrxo/proton-drive-mcp/discussions)

---

Made with ❤️ for the Proton Drive community