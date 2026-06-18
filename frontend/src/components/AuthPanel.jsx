import React, { useState } from 'react';
import { ArrowRight, Hexagon } from 'lucide-react';

export function AuthPanel({ onJoin, error }) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onJoin(username.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-zinc-200 via-zinc-400 to-zinc-200"></div>
        <div className="flex justify-center mb-8 mt-2">
          <div className="bg-zinc-900 p-3 rounded-xl shadow-sm">
            <Hexagon className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Join the Grid</h1>
          <p className="text-sm text-zinc-500 mt-2">Claim territory and compete with others.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-zinc-700 mb-1.5">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              maxLength={20}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-colors text-zinc-900 placeholder-zinc-400 bg-zinc-50 focus:bg-white"
              placeholder="e.g. Satoshi"
            />
          </div>
          
          {error && <p className="text-sm text-red-500 font-medium bg-red-50 px-3 py-2 rounded-md">{error}</p>}

          <button
            type="submit"
            disabled={!username.trim()}
            className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Enter Game
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
