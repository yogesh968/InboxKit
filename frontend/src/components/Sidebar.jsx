import React from 'react';
import { LogOut, Activity as ActivityIcon, Users, Trophy } from 'lucide-react';

export function Sidebar({ user, onlineCount, leaderboard, activity, cooldownRemaining, onLogout }) {
  // calculate cooldown percentage
  const cooldownPercent = cooldownRemaining ? Math.max(0, Math.min(100, (cooldownRemaining / 5000) * 100)) : 0;
  const isCooldown = cooldownRemaining !== null && cooldownRemaining > 0;

  return (
    <div className="w-80 bg-white border-r border-zinc-200 h-screen flex flex-col shadow-sm shrink-0 z-10 relative">
      {/* Header Profile */}
      <div className="p-5 border-b border-zinc-100 bg-zinc-50/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full shadow-inner border border-black/10 flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: user.color }}
            >
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="font-semibold text-zinc-900 text-sm truncate w-32">{user.username}</div>
              <div className="text-xs text-zinc-500 font-medium">Score: {user.tilesCount}</div>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="p-2 hover:bg-zinc-200 rounded-md transition-colors text-zinc-500 hover:text-zinc-900"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Cooldown bar */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-zinc-500 font-medium">Capture Ready</span>
            {isCooldown && <span className="text-zinc-400 font-mono">{(cooldownRemaining / 1000).toFixed(1)}s</span>}
          </div>
          <div className="h-1.5 bg-zinc-200/60 rounded-full overflow-hidden relative">
            <div 
              className={`absolute top-0 left-0 h-full transition-all duration-75 ease-linear ${isCooldown ? 'bg-zinc-400' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'}`}
              style={{ width: isCooldown ? `${cooldownPercent}%` : '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Online Stats */}
      <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2 text-zinc-600">
          <Users className="w-4 h-4" />
          <span className="text-sm font-medium">Online Players</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
          <span className="text-sm font-semibold text-zinc-900">{onlineCount}</span>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="px-5 py-4 border-b border-zinc-100">
        <div className="flex items-center gap-2 text-zinc-600 mb-3">
          <Trophy className="w-4 h-4" />
          <h2 className="text-sm font-semibold text-zinc-900">Leaderboard</h2>
        </div>
        <div className="space-y-3">
          {leaderboard.map((entry, idx) => (
            <div key={entry.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 text-xs w-3 font-mono">{idx + 1}.</span>
                <div className="w-3 h-3 rounded-sm border border-black/10 shadow-sm" style={{ backgroundColor: entry.color }} />
                <span className={`font-medium ${entry.id === user.id ? 'text-zinc-900' : 'text-zinc-600'} truncate w-32`}>
                  {entry.username}
                </span>
              </div>
              <span className="font-semibold text-zinc-900 font-mono">{entry.tilesCount}</span>
            </div>
          ))}
          {leaderboard.length === 0 && <div className="text-xs text-zinc-400">No data</div>}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 flex items-center gap-2 text-zinc-600 shrink-0 bg-white">
          <ActivityIcon className="w-4 h-4" />
          <h2 className="text-sm font-semibold text-zinc-900">Live Activity</h2>
        </div>
        <div className="flex-1 overflow-y-auto minimal-scrollbar p-5 space-y-4">
          {activity.map((act) => (
            <div key={act.id} className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 shadow-sm" style={{ backgroundColor: act.color }} />
              <div className="text-sm text-zinc-600 leading-snug">
                <span className="font-medium text-zinc-900">{act.username}</span> captured tile{' '}
                <span className="font-mono text-xs text-zinc-500 bg-zinc-100 px-1 py-0.5 rounded border border-zinc-200">
                  {act.x},{act.y}
                </span>
                <div className="text-[10px] text-zinc-400 mt-1">
                  {new Date(act.capturedAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {activity.length === 0 && <div className="text-xs text-zinc-400">No activity yet.</div>}
        </div>
      </div>
    </div>
  );
}
