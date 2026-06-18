import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';

export function useSocket() {
  const socketRef = useRef(null);
  const [gameState, setGameState] = useState({
    isConnected: false,
    user: null,
    tiles: {},
    users: {},
    leaderboard: [],
    activity: [],
    onlineCount: 0,
    cooldownRemaining: null,
    error: null,
  });

  // Start a cooldown countdown timer for smooth UI progress bar
  useEffect(() => {
    if (gameState.cooldownRemaining !== null && gameState.cooldownRemaining > 0) {
      const timer = setInterval(() => {
        setGameState((prev) => {
          const newCooldown = (prev.cooldownRemaining ?? 0) - 50;
          if (newCooldown <= 0) {
            clearInterval(timer);
            return { ...prev, cooldownRemaining: null };
          }
          return { ...prev, cooldownRemaining: newCooldown };
        });
      }, 50);
      return () => clearInterval(timer);
    }
  }, [gameState.cooldownRemaining]);

  const connect = useCallback((username) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const savedUserId = localStorage.getItem('gridgame_userId');
    const socket = io(SERVER_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setGameState((prev) => ({ ...prev, isConnected: true, error: null }));
      socket.emit('join', { username, userId: savedUserId || undefined });
    });

    socket.on('disconnect', () => {
      setGameState((prev) => ({ ...prev, isConnected: false }));
    });

    socket.on('init', (data) => {
      if (data.user && data.user.id) {
        localStorage.setItem('gridgame_userId', data.user.id);
      }
      setGameState((prev) => ({
        ...prev,
        user: data.user,
        tiles: data.tiles,
        users: data.users,
        leaderboard: data.leaderboard,
        activity: data.activity,
      }));
    });

    socket.on('online_count', (data) => {
      setGameState((prev) => ({ ...prev, onlineCount: data.count }));
    });

    socket.on('tile:updated', (data) => {
      setGameState((prev) => {
        const newTiles = { ...prev.tiles, [data.tileId]: data.userId };
        const newUsers = { ...prev.users };
        if (!newUsers[data.userId]) {
          newUsers[data.userId] = { username: data.username, color: data.color };
        }
        return { ...prev, tiles: newTiles, users: newUsers };
      });
    });

    socket.on('leaderboard:updated', (data) => {
      setGameState((prev) => ({ ...prev, leaderboard: data.leaderboard }));
    });

    socket.on('activity:new', (data) => {
      setGameState((prev) => {
        const newActivity = [data, ...prev.activity].slice(0, 20); // Keep last 20 events
        return { ...prev, activity: newActivity };
      });
    });

    socket.on('cooldown_active', (data) => {
      setGameState((prev) => ({ ...prev, cooldownRemaining: data.remaining }));
    });

    socket.on('capture_success', (data) => {
      setGameState((prev) => {
        if (!prev.user) return prev;
        return {
          ...prev,
          user: {
            ...prev.user,
            tilesCount: data.tilesCount,
            lastCaptureAt: data.lastCaptureAt,
          },
          cooldownRemaining: 5000,
        };
      });
    });

    socket.on('error_message', (data) => {
      setGameState((prev) => ({ ...prev, error: data.message }));
      setTimeout(() => {
        setGameState((p) => ({ ...p, error: null }));
      }, 3000);
    });

  }, []);

  const captureTile = useCallback((tileId) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('tile:capture', { tileId });
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('gridgame_userId');
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    setGameState((prev) => ({ ...prev, user: null, isConnected: false }));
  }, []);

  return {
    ...gameState,
    connect,
    captureTile,
    logout,
  };
}
