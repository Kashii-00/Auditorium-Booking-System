# Auditorium Booking System

A full-stack web application for managing auditorium bookings with React frontend and Node.js backend.

## Prerequisites

- Node.js (>=18.0.0)
- pnpm (>=8.0.0)

## Installation

1. Install pnpm globally (if not already installed):
   ```bash
   npm install -g pnpm
   ```

2. Install dependencies for both client and server:
   ```bash
   pnpm install:sequential
   ```

## Available Scripts

### Installation
- `pnpm install:client` - Install only client dependencies
- `pnpm install:server` - Install only server dependencies
- `pnpm install:sequential` - Install client first, then server (sequential)

### Development
- `pnpm dev:client` - Start only the client in development mode
- `pnpm dev:server` - Start only the server in development mode

### Building
- `pnpm build` - Build both client and server
- `pnpm build:client` - Build only the client
- `pnpm build:server` - Build only the server

### Production
- `pnpm start:client` - Start only the client in production mode
- `pnpm start:server` - Start only the server in production mode

### Maintenance
- `pnpm clean:client` - Clean client build artifacts
- `pnpm clean:server` - Clean server build artifacts
- `pnpm clean:all` - Clean all node_modules and build artifacts
- `pnpm setup` - Install dependencies and build everything


## Project Structure

```
├── client/          # React frontend application
├── server/          # Node.js backend application
└── package.json     # Root package.json with management scripts
```

## Quick Start

### Option 1: Sequential Installation (Recommended)
1. Clone the repository
2. Run `pnpm install:sequential` to install client first, then server
3. Run `pnpm build` to build both applications
4. Run `pnpm dev:server` to start the server (in one terminal)
5. Run `pnpm dev:client` to start the client (in another terminal)

### Option 2: All at Once
1. Clone the repository
2. Run `pnpm setup` to install all dependencies and build everything
3. Run `pnpm dev:server` to start the server (in one terminal)
4. Run `pnpm dev:client` to start the client (in another terminal)

## Management Scripts

The root package.json contains convenience scripts that navigate to each directory and run the appropriate commands. Each script uses `cd` to change to the target directory before running pnpm commands.

For example:
- `pnpm build:client` - Changes to client directory and runs `pnpm run build`
- `pnpm dev:server` - Changes to server directory and runs `pnpm run dev`
