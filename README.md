# InboxKit -- Real-Time Multiplayer Grid Capture Game

A full-stack, real-time multiplayer territory control game built with React, Node.js, Socket.IO, and MongoDB. Players join a shared 50x50 grid, claim tiles by clicking on them, and compete for leaderboard dominance -- all updated live across every connected client.

---
## Overview

InboxKit presents a 50x50 interactive grid where multiple players can simultaneously capture tiles. Each player is assigned a unique color upon joining. Tile ownership is reflected in real time across all connected browsers via WebSocket communication. A server-enforced 5-second cooldown prevents rapid-fire captures, and database validations guarantee correctness under concurrent access.

---

## Features

- **Real-Time Multiplayer** -- All tile captures, leaderboard changes, and activity feed updates are broadcast instantly to every connected player via Socket.IO.
- **Interactive Grid Board** -- A pannable and zoomable 50x50 grid rendered in the browser with smooth drag navigation and scroll-to-zoom controls.
- **Player Identity and Persistence** -- Users are assigned a unique ID stored in localStorage, allowing automatic reconnection across sessions.
- **Live Leaderboard** -- Top 10 players ranked by tile count, updated in real time after every capture.
- **Activity Feed** -- A scrollable feed showing the last 20 tile captures with player name, tile coordinates, and timestamp.
- **Cooldown System** -- A 5-second server-enforced cooldown between captures, with a smooth client-side progress bar indicator.
- **Concurrency Safety** -- Cooldown verification and atomic database updates prevent race conditions and double captures.
- **Confetti Feedback** -- A subtle confetti animation on successful tile capture for visual feedback.

---

## Architecture

```
Client (React + Vite)            Server (Node.js + Express)
---------------------            --------------------------
                                  
  Browser                          Socket.IO Server
    |                                  |
    |--- WebSocket (Socket.IO) ------->|
    |                                  |--- Prisma ORM ---> MongoDB
    |<-- Real-time events -------------|
    |                                  |
  React Components               Event Handlers
  - AuthPanel                     - join
  - GridBoard                     - tile:capture
  - Sidebar                      - disconnect
  - useSocket (hook)
```

The frontend establishes a persistent WebSocket connection to the backend on login. All game state mutations flow through Socket.IO events. The backend validates every action, applies business rules (cooldowns, ownership checks), and persists state to MongoDB via Prisma before broadcasting updates.

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 19, Vite 8, Tailwind CSS 4  |
| Backend    | Node.js, Express 4, Socket.IO 4   |
| Database   | MongoDB                           |
| ORM        | Prisma 5                          |
| Language   | JavaScript (ES Modules)           |

---

## Project Structure

```
InboxKit/
|
|-- backend/
|   |-- prisma/
|   |   |-- schema.prisma          # Database schema (User, Tile, TileHistory)
|   |   |-- migrations/            # SQL migration files
|   |   |-- seed.js                # Seeds the 2500-tile grid
|   |-- src/
|   |   |-- db.js                  # Prisma client instance
|   |   |-- server.js              # Express + Socket.IO server entry point
|   |   |-- socketHandler.js       # All Socket.IO event handlers
|   |   |-- test-concurrency.js    # Concurrency test suite
|   |-- package.json
|
|-- frontend/
|   |-- public/                    # Static assets (favicon, icons)
|   |-- src/
|   |   |-- assets/                # Images
|   |   |-- components/
|   |   |   |-- AuthPanel.jsx      # Login / username entry screen
|   |   |   |-- GridBoard.jsx      # The 50x50 interactive grid
|   |   |   |-- Sidebar.jsx        # Leaderboard, activity feed, user info
|   |   |-- hooks/
|   |   |   |-- useSocket.js       # Socket.IO connection and state management
|   |   |-- App.jsx                # Root application component
|   |   |-- main.jsx               # React DOM entry point
|   |   |-- index.css              # Global styles
|   |   |-- App.css                # App-specific styles
|   |-- index.html
|   |-- vite.config.js
|   |-- tailwind.config.js
|   |-- package.json
```

---

## Prerequisites

Before running the project, ensure the following are installed on your machine:

- **Node.js** -- version 18 or higher
- **npm** -- version 9 or higher (ships with Node.js)
- **MongoDB** -- a running local instance or a MongoDB Atlas cloud database URI

---

## Getting Started

Clone the repository:

```bash
git clone https://github.com/yogesh968/InboxKit.git
cd InboxKit
```

Install dependencies for both backend and frontend:

```bash
cd backend && npm install
cd ../frontend && npm install
```

---

## Environment Variables

### Backend Environment Variables
Create a `.env` file in the `backend/` directory:

```env
PORT=5050
DATABASE_URL="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority"
FRONTEND_URL="http://localhost:5173"
```

- `PORT` -- The port the Express + Socket.IO server runs on (defaults to 5050).
- `DATABASE_URL` -- Your MongoDB connection string.
- `FRONTEND_URL` -- The URL of your frontend application (used for CORS settings).

### Frontend Environment Variables
Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL="http://localhost:5050"
```

- `VITE_API_URL` -- The URL of the backend server.

---

## Database Setup

From the `backend/` directory, run the following commands in order:

```bash
# Generate the Prisma client
npm run db:generate

# Push schema directly to MongoDB (MongoDB does not require SQL migrations)
npm run db:push

# Seed the 2500-tile grid
npm run db:seed
```

This creates the collections (`User`, `Tile`, `TileHistory`) in MongoDB and populates the `Tile` collection with 2500 entries representing the 50x50 grid.

---

## Running the Application

Open two terminal windows.

**Terminal 1 -- Start the backend:**

```bash
cd backend
npm run dev
```

The server will start on `http://localhost:5050`.

**Terminal 2 -- Start the frontend:**

```bash
cd frontend
npm run dev
```

The Vite dev server will start on `http://localhost:5173`. Open this URL in your browser to play.

To test multiplayer, open the same URL in a second browser tab or window and join with a different username.

---

## Concurrency and Data Integrity

The game handles concurrent tile captures safely through the following mechanisms:

1. **State Validation** -- The backend validates both user cooldowns and tile ownership before committing any database writes.

2. **Single-Threaded Event Loop** -- Because the Node.js process handles incoming Socket.IO events sequentially on its single-threaded event loop, microtask execution prevents traditional multi-threaded race conditions before database calls are made.

3. **Incremental Score Updates** -- Score increments, decrements, and tile owner updates are handled immediately following state verification to keep the database consistent.

A test suite is included to verify these guarantees:

```bash
cd backend
npm run test:concurrency
```

This runs two tests:
- **Single-user cooldown protection** -- Fires 5 simultaneous capture requests from one user and verifies only 1 succeeds.
- **Multi-user race condition** -- Fires 5 simultaneous capture requests from 5 different users targeting the same tile and verifies database consistency.

---

## License

This project is provided as-is for educational and demonstration purposes.
