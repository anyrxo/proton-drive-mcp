#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { readFile, writeFile, readdir, mkdir, unlink, rm, stat } from 'fs/promises';
import { join, dirname, resolve, basename, sep } from 'path';
import { existsSync, readdirSync } from 'fs';
import { platform, homedir } from 'os';

// Get Proton Drive path based on platform
function getDefaultProtonPath(): string {
  const home = homedir();
  const system = platform();
  
  // First check environment variable
  if (process.env.PROTON_DRIVE_PATH) {
    return process.env.PROTON_DRIVE_PATH;
  }
  
  if (system === 'darwin') {
    // macOS - check CloudStorage folder
    const cloudStorage = join(home, 'Library', 'CloudStorage');
    if (existsSync(cloudStorage)) {
      try {
        const dirs = readdirSync(cloudStorage);
        const protonDir = dirs.find(d => d.startsWith('ProtonDrive-'));
        if (protonDir) {
          return join(cloudStorage, protonDir);
        }
      } catch (e) {
        // Fall through to default
      }
    }
    // Fallback for macOS
    return join(home, 'Proton Drive');
  } else if (system === 'win32') {
    // Windows - check common locations
    const locations = [
      join(home, 'Proton Drive'),
      join(home, 'ProtonDrive'),
      join('C:', 'Proton Drive'),
      join(home, 'Documents', 'Proton Drive'),
    ];
    
    for (const loc of locations) {
      if (existsSync(loc)) {
        return loc;
      }
    }
    return locations[0]; // Default to first option
  } else {
    // Linux - check common locations
    const locations = [
      join(home, 'ProtonDrive'),
      join(home, 'Proton Drive'),
      join(home, 'Documents', 'ProtonDrive'),
      '/media/proton',
    ];
    
    for (const loc of locations) {
      if (existsSync(loc)) {
        return loc;
      }
    }
    return locations[0]; // Default to first option
  }
}

// Configure Proton Drive mount point
const PROTON_DRIVE_PATH = getDefaultProtonPath();

// Create MCP server
const server = new Server(
  {
    name: 'proton-drive-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper to ensure path is within Proton Drive
function validatePath(relativePath: string): string {
  // Handle empty path
  if (!relativePath) {
    return PROTON_DRIVE_PATH;
  }
  
  // Clean the path - remove leading slashes and normalize
  const cleaned = relativePath
    .split(/[/\\]+/)
    .filter(Boolean)
    .join(sep);
  
  const fullPath = resolve(PROTON_DRIVE_PATH, cleaned);
  
  // Security check - ensure we're still within Proton Drive
  if (!fullPath.startsWith(PROTON_DRIVE_PATH)) {
    throw new Error('Invalid path: Access denied outside Proton Drive');
  }
  
  return fullPath;
}

// Helper to get relative path for display
function getRelativePath(fullPath: string): string {
  if (fullPath === PROTON_DRIVE_PATH) {
    return '/';
  }
  return fullPath.replace(PROTON_DRIVE_PATH, '').replace(/^[/\\]/, '') || '/';
}

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'check_mount',
      description: 'Check if Proton Drive is mounted and accessible',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'list_files',
      description: 'List files and folders in Proton Drive',
      inputSchema: {
        type: 'object',
        properties: {
          path: { 
            type: 'string', 
            description: 'Path relative to Proton Drive root (e.g., "Documents" or "Projects/2024")' 
          },
        },
      },
    },
    {
      name: 'read_file',
      description: 'Read a text file from Proton Drive',
      inputSchema: {
        type: 'object',
        properties: {
          path: { 
            type: 'string', 
            description: 'File path relative to Proton Drive root' 
          },
        },
        required: ['path'],
      },
    },
    {
      name: 'write_file',
      description: 'Write or create a file in Proton Drive',
      inputSchema: {
        type: 'object',
        properties: {
          path: { 
            type: 'string', 
            description: 'File path relative to Proton Drive root' 
          },
          content: { 
            type: 'string', 
            description: 'Text content to write to the file' 
          },
        },
        required: ['path', 'content'],
      },
    },
    {
      name: 'delete_file',
      description: 'Delete a file or folder from Proton Drive',
      inputSchema: {
        type: 'object',
        properties: {
          path: { 
            type: 'string', 
            description: 'Path to delete relative to Proton Drive root' 
          },
        },
        required: ['path'],
      },
    },
    {
      name: 'create_folder',
      description: 'Create a new folder in Proton Drive',
      inputSchema: {
        type: 'object',
        properties: {
          path: { 
            type: 'string', 
            description: 'Folder path relative to Proton Drive root' 
          },
        },
        required: ['path'],
      },
    },
    {
      name: 'get_file_info',
      description: 'Get information about a file or folder',
      inputSchema: {
        type: 'object',
        properties: {
          path: { 
            type: 'string', 
            description: 'Path to the file or folder' 
          },
        },
        required: ['path'],
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'check_mount': {
        const exists = existsSync(PROTON_DRIVE_PATH);
        let info: any = {
          mounted: exists,
          path: PROTON_DRIVE_PATH,
          platform: platform(),
        };
        
        if (exists) {
          try {
            const stats = await stat(PROTON_DRIVE_PATH);
            info.accessible = true;
            info.isDirectory = stats.isDirectory();
          } catch (e) {
            info.accessible = false;
            info.error = 'Cannot access Proton Drive directory';
          }
        } else {
          info.accessible = false;
          info.suggestion = 'Please ensure Proton Drive is installed and running';
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(info, null, 2),
            },
          ],
        };
      }

      case 'list_files': {
        const listPath = validatePath(args?.path as string || '');
        
        try {
          const entries = await readdir(listPath, { withFileTypes: true });
          const files = await Promise.all(
            entries
              .filter(entry => !entry.name.startsWith('.'))
              .map(async (entry) => {
                const fullPath = join(listPath, entry.name);
                const relativePath = getRelativePath(fullPath);
                const stats = await stat(fullPath);
                
                return {
                  name: entry.name,
                  path: relativePath,
                  type: entry.isDirectory() ? 'folder' : 'file',
                  size: stats.size,
                  modified: stats.mtime.toISOString(),
                };
              })
          );
          
          // Sort folders first, then files
          files.sort((a, b) => {
            if (a.type === b.type) {
              return a.name.localeCompare(b.name);
            }
            return a.type === 'folder' ? -1 : 1;
          });
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(files, null, 2),
              },
            ],
          };
        } catch (error: any) {
          throw new McpError(
            ErrorCode.InternalError,
            `Cannot list directory: ${error.message}`
          );
        }
      }

      case 'read_file': {
        const readPath = validatePath(args?.path as string);
        
        try {
          // Check if it's a file
          const stats = await stat(readPath);
          if (stats.isDirectory()) {
            throw new Error('Cannot read a directory');
          }
          
          // Read the file
          const content = await readFile(readPath, 'utf-8');
          return {
            content: [
              {
                type: 'text',
                text: content,
              },
            ],
          };
        } catch (error: any) {
          throw new McpError(
            ErrorCode.InternalError,
            `Cannot read file: ${error.message}`
          );
        }
      }

      case 'write_file': {
        const writePath = validatePath(args?.path as string);
        const content = args?.content as string;
        
        try {
          // Create directory if needed
          await mkdir(dirname(writePath), { recursive: true });
          
          // Write the file
          await writeFile(writePath, content, 'utf-8');
          
          return {
            content: [
              {
                type: 'text',
                text: `Successfully wrote file: ${getRelativePath(writePath)}`,
              },
            ],
          };
        } catch (error: any) {
          throw new McpError(
            ErrorCode.InternalError,
            `Cannot write file: ${error.message}`
          );
        }
      }

      case 'delete_file': {
        const deletePath = validatePath(args?.path as string);
        
        try {
          const stats = await stat(deletePath);
          
          if (stats.isDirectory()) {
            await rm(deletePath, { recursive: true, force: true });
          } else {
            await unlink(deletePath);
          }
          
          return {
            content: [
              {
                type: 'text',
                text: `Successfully deleted: ${getRelativePath(deletePath)}`,
              },
            ],
          };
        } catch (error: any) {
          throw new McpError(
            ErrorCode.InternalError,
            `Cannot delete: ${error.message}`
          );
        }
      }

      case 'create_folder': {
        const folderPath = validatePath(args?.path as string);
        
        try {
          await mkdir(folderPath, { recursive: true });
          
          return {
            content: [
              {
                type: 'text',
                text: `Successfully created folder: ${getRelativePath(folderPath)}`,
              },
            ],
          };
        } catch (error: any) {
          throw new McpError(
            ErrorCode.InternalError,
            `Cannot create folder: ${error.message}`
          );
        }
      }

      case 'get_file_info': {
        const infoPath = validatePath(args?.path as string);
        
        try {
          const stats = await stat(infoPath);
          const relativePath = getRelativePath(infoPath);
          
          const info = {
            path: relativePath,
            name: basename(infoPath),
            type: stats.isDirectory() ? 'folder' : 'file',
            size: stats.size,
            sizeFormatted: formatBytes(stats.size),
            created: stats.birthtime.toISOString(),
            modified: stats.mtime.toISOString(),
            accessed: stats.atime.toISOString(),
          };
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(info, null, 2),
              },
            ],
          };
        } catch (error: any) {
          throw new McpError(
            ErrorCode.InternalError,
            `Cannot get file info: ${error.message}`
          );
        }
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error: any) {
    // Re-throw if already an McpError
    if (error instanceof McpError) {
      throw error;
    }
    
    // Otherwise wrap it
    throw new McpError(
      ErrorCode.InternalError,
      `Error in ${name}: ${error.message}`
    );
  }
});

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Log startup info to stderr (won't interfere with protocol)
  console.error('🚀 Proton Drive MCP Server started');
  console.error(`📍 Platform: ${platform()}`);
  console.error(`📁 Proton Drive path: ${PROTON_DRIVE_PATH}`);
  console.error(`✅ Path exists: ${existsSync(PROTON_DRIVE_PATH)}`);
}

// Run the server
main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});