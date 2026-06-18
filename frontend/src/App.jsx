import React, { useEffect, useRef } from 'react';
import { useSocket } from './hooks/useSocket';
import { AuthPanel } from './components/AuthPanel';
import { Sidebar } from './components/Sidebar';
import { GridBoard } from './components/GridBoard';

function App() {
  const {
    isConnected,
    user,
    tiles,
    users,
    leaderboard,
    activity,
    onlineCount,
    cooldownRemaining,
    error,
    connect,
    captureTile,
    logout
  } = useSocket();

  const attemptReconnection = useRef(false);

  // Re-connect automatically if there is a saved user id
  useEffect(() => {
    const savedUserId = localStorage.getItem('gridgame_userId');
    if (savedUserId && !isConnected && !user && !attemptReconnection.current) {
      attemptReconnection.current = true;
      connect('');
    }
  }, [connect, isConnected, user]);

  if (!user) {
    return <AuthPanel onJoin={connect} error={error} />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-100">
      <Sidebar 
        user={user}
        onlineCount={onlineCount}
        leaderboard={leaderboard}
        activity={activity}
        cooldownRemaining={cooldownRemaining}
        onLogout={logout}
      />
      <GridBoard 
        tiles={tiles}
        users={users}
        onTileClick={captureTile}
        currentUserId={user.id}
      />
      
      {!isConnected && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg font-medium text-sm z-50 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          Disconnected from server...
        </div>
      )}
      
      {/* Toast for ephemeral errors (like cooldown active) */}
      {error && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900 text-white px-6 py-3 rounded-full shadow-xl font-medium text-sm z-50 transition-all animate-in slide-in-from-bottom-5">
          {error}
        </div>
      )}
    </div>
  );
}

export default App;
