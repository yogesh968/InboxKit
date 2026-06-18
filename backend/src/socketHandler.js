import { Server } from 'socket.io';
import prisma from './db.js';

// Keep track of online users: socketId -> { userId, username, color }
const onlineSockets = new Map();

// Helper to get unique online users count
function getOnlineCount() {
  const uniqueUsers = new Set(Array.from(onlineSockets.values()).map((u) => u.userId));
  return uniqueUsers.size;
}

// Generate random soft pastel color in hex
function getRandomPastelColor() {
  const h = Math.floor(Math.random() * 360);
  const s = 60 + Math.random() * 15; // 60% - 75%
  const l = 70 + Math.random() * 10; // 70% - 80%
  
  // Convert HSL to Hex
  const lFraction = l / 100;
  const a = (s * Math.min(lFraction, 1 - lFraction)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = lFraction - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    // 1. JOIN EVENT
    socket.on('join', async ({ username, userId }) => {
      try {
        const cleanedUsername = username.trim().substring(0, 20);
        if (!cleanedUsername) {
          socket.emit('error_message', { message: 'Username cannot be blank.' });
          return;
        }

        let user;

        if (userId) {
          // Check if existing user exists
          user = await prisma.user.findUnique({
            where: { id: userId },
          });

          if (user) {
            // Update username in case it changed
            user = await prisma.user.update({
              where: { id: userId },
              data: { username: cleanedUsername },
            });
          }
        }

        // If no user found/provided, create a new one
        if (!user) {
          const color = getRandomPastelColor();
          user = await prisma.user.create({
            data: {
              username: cleanedUsername,
              color,
            },
          });
        }

        // Store user in socket data
        socket.data.userId = user.id;
        socket.data.username = user.username;
        socket.data.color = user.color;

        // Register in online list
        onlineSockets.set(socket.id, {
          userId: user.id,
          username: user.username,
          color: user.color,
        });

        // Broadcast updated online count
        io.emit('online_count', { count: getOnlineCount() });

        // Retrieve initial board state (only claimed tiles)
        const claimedTiles = await prisma.tile.findMany({
          where: { NOT: { userId: null } },
          select: { id: true, userId: true },
        });

        // Map claimed tiles: tileId -> userId
        const tilesMap = {};
        claimedTiles.forEach((tile) => {
          if (tile.userId) {
            tilesMap[tile.id] = tile.userId;
          }
        });

        // Find users who own tiles or are currently online
        const tileUserIds = claimedTiles.map((t) => t.userId).filter((id) => !!id);
        const activeUserIds = Array.from(onlineSockets.values()).map((u) => u.userId);
        const relevantUserIds = Array.from(new Set([...tileUserIds, ...activeUserIds]));

        const relevantUsers = await prisma.user.findMany({
          where: { id: { in: relevantUserIds } },
          select: { id: true, username: true, color: true },
        });

        const usersMap = {};
        relevantUsers.forEach((u) => {
          usersMap[u.id] = { username: u.username, color: u.color };
        });

        // Get leaderboard
        const leaderboard = await prisma.user.findMany({
          orderBy: { tilesCount: 'desc' },
          take: 10,
          select: { id: true, username: true, color: true, tilesCount: true },
        });

        // Get activity log (last 20 captures)
        const activityLog = await prisma.tileHistory.findMany({
          orderBy: { capturedAt: 'desc' },
          take: 20,
          include: {
            user: {
              select: { username: true, color: true },
            },
            tile: {
              select: { x: true, y: true },
            },
          },
        });

        // Send initialization package to the connected client
        socket.emit('init', {
          user: {
            id: user.id,
            username: user.username,
            color: user.color,
            tilesCount: user.tilesCount,
            lastCaptureAt: user.lastCaptureAt,
          },
          tiles: tilesMap,
          users: usersMap,
          leaderboard,
          activity: activityLog.map((log) => ({
            id: log.id,
            tileId: log.tileId,
            x: log.tile.x,
            y: log.tile.y,
            userId: log.userId,
            username: log.user.username,
            color: log.user.color,
            capturedAt: log.capturedAt,
          })),
        });
      } catch (err) {
        console.error('Error during join:', err);
        socket.emit('error_message', { message: 'Failed to join game server.' });
      }
    });

    // 2. CAPTURE TILE EVENT
    socket.on('tile:capture', async ({ tileId }) => {
      const userId = socket.data.userId;
      if (!userId) {
        socket.emit('error_message', { message: 'Unauthorized. Join the game first.' });
        return;
      }

      if (tileId < 0 || tileId >= 2500) {
        socket.emit('error_message', { message: 'Invalid tile ID.' });
        return;
      }

      try {
        // Fetch user and check cooldown
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!currentUser) {
          socket.emit('error_message', { message: 'User not found.' });
          return;
        }

        const now = new Date();

        if (currentUser.lastCaptureAt) {
          const elapsed = now.getTime() - new Date(currentUser.lastCaptureAt).getTime();
          if (elapsed < 5000) {
            socket.emit('cooldown_active', { remaining: 5000 - elapsed });
            return;
          }
        }

        // Fetch the target tile
        const currentTile = await prisma.tile.findUnique({
          where: { id: tileId },
        });

        if (!currentTile) {
          socket.emit('error_message', { message: 'Tile not found.' });
          return;
        }

        if (currentTile.userId === userId) {
          return; // Already owned by this user
        }

        const previousOwnerId = currentTile.userId;

        // Update tile owner
        await prisma.tile.update({
          where: { id: tileId },
          data: { userId },
        });

        // Update user capture timestamp and increment score
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            lastCaptureAt: now,
            tilesCount: { increment: 1 },
          },
        });

        // Decrement previous owner's score if tile was captured from someone
        if (previousOwnerId) {
          await prisma.user.update({
            where: { id: previousOwnerId },
            data: {
              tilesCount: { decrement: 1 },
            },
          });
        }

        // Create capturing history log
        const history = await prisma.tileHistory.create({
          data: {
            tileId,
            userId,
            capturedAt: now,
          },
        });

        // Emit success back to the capturer
        socket.emit('capture_success', {
          lastCaptureAt: updatedUser.lastCaptureAt,
          tilesCount: updatedUser.tilesCount,
        });

        // Broadcast tile update to all connected users
        io.emit('tile:updated', {
          tileId,
          x: currentTile.x,
          y: currentTile.y,
          userId,
          username: currentUser.username,
          color: currentUser.color,
        });

        // Fetch and broadcast updated leaderboard
        const updatedLeaderboard = await prisma.user.findMany({
          orderBy: { tilesCount: 'desc' },
          take: 10,
          select: { id: true, username: true, color: true, tilesCount: true },
        });
        io.emit('leaderboard:updated', { leaderboard: updatedLeaderboard });

        // Broadcast new activity feed event
        io.emit('activity:new', {
          id: history.id,
          tileId,
          x: currentTile.x,
          y: currentTile.y,
          userId,
          username: currentUser.username,
          color: currentUser.color,
          capturedAt: now,
        });
      } catch (err) {
        console.error('Error during tile capture:', err);
        socket.emit('error_message', { message: 'Database error while capturing tile.' });
      }
    });

    // 3. DISCONNECT EVENT
    socket.on('disconnect', () => {
      onlineSockets.delete(socket.id);
      io.emit('online_count', { count: getOnlineCount() });
    });
  });
}
