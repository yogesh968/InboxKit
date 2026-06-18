import React, { useRef, useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Crosshair, ZoomIn, ZoomOut } from 'lucide-react';

const GRID_SIZE = 50;
const TILE_SIZE = 24;

export function GridBoard({ tiles, users, onTileClick, currentUserId }) {
  const containerRef = useRef(null);
  
  // Pan and Zoom state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const dragState = useRef({ moved: false });

  // Center the grid initially
  useEffect(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      const boardWidth = GRID_SIZE * TILE_SIZE;
      const boardHeight = GRID_SIZE * TILE_SIZE;
      
      setPosition({
        x: (clientWidth - boardWidth) / 2,
        y: (clientHeight - boardHeight) / 2
      });
    }
  }, []);

  // Handlers for Pan and Zoom
  const handleWheel = (e) => {
    // Zoom on ctrl/meta key, pan on trackpad otherwise
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = -e.deltaY * 0.01;
      const newScale = Math.min(Math.max(0.3, scale + zoomFactor), 4);
      
      // Keep center of zoom roughly at mouse
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const scaleChange = newScale / scale;
        setPosition(prev => ({
          x: mouseX - (mouseX - prev.x) * scaleChange,
          y: mouseY - (mouseY - prev.y) * scaleChange
        }));
      }
      setScale(newScale);
    } else {
      setPosition(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  const handlePointerDown = (e) => {
    setIsDragging(true);
    dragState.current.moved = false;
    setDragStart({ x: e.clientX, y: e.clientY });
    // e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragState.current.moved = true;
    }
    
    setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    // e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleTileClick = (id, e) => {
    e.stopPropagation();
    if (dragState.current.moved) return;

    // Trigger local confetti for satisfying UX
    const rect = e.target.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    
    confetti({
      particleCount: 15,
      spread: 50,
      origin: { x, y },
      colors: ['#a1a1aa', '#e4e4e7', '#f4f4f5'],
      disableForReducedMotion: true,
      zIndex: 100
    });
    
    onTileClick(id);
  };

  // Memoize cells to avoid 2500 DOM recreations on every zoom/pan tick
  const gridCells = useMemo(() => {
    const cells = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const id = x + y * GRID_SIZE;
        const ownerId = tiles[id];
        const owner = ownerId ? users[ownerId] : null;
        const isMine = ownerId === currentUserId;
        
        cells.push(
          <div
            key={id}
            onClick={(e) => handleTileClick(id, e)}
            className={`
              w-[24px] h-[24px] border-r border-b border-black/5
              transition-colors cursor-crosshair relative group
              ${ownerId ? 'opacity-90 hover:opacity-100' : 'bg-white hover:bg-zinc-100'}
              ${isMine ? 'ring-inset ring-1 ring-black/20 z-10' : ''}
            `}
            style={{
              backgroundColor: owner ? owner.color : undefined,
            }}
            title={owner ? `Owned by ${owner.username}` : `Tile ${x},${y}`}
          />
        );
      }
    }
    return cells;
  }, [tiles, users, currentUserId, onTileClick]);

  return (
    <div 
      className="flex-1 relative overflow-hidden bg-zinc-100/50" 
      ref={containerRef} 
      onWheel={handleWheel}
      style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 0)', backgroundSize: '24px 24px' }}
    >
      {/* Grid Canvas */}
      <div 
        className="absolute origin-top-left touch-none select-none"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          width: GRID_SIZE * TILE_SIZE,
          height: GRID_SIZE * TILE_SIZE,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div 
          className="grid shadow-2xl border-l border-t border-black/10 bg-white"
          style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
        >
          {gridCells}
        </div>
      </div>

      {/* Toolbar */}
      <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-white p-1.5 rounded-xl shadow-lg border border-zinc-200 z-50">
        <button onClick={() => setScale(s => Math.max(0.3, s - 0.2))} className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-600 transition-colors">
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono font-medium text-zinc-500 w-12 text-center">
          {Math.round(scale * 100)}%
        </span>
        <button onClick={() => setScale(s => Math.min(4, s + 0.2))} className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-600 transition-colors">
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-zinc-200 mx-1"></div>
        <button 
          onClick={() => {
            setScale(1);
            if (containerRef.current) {
               setPosition({
                  x: (containerRef.current.clientWidth - GRID_SIZE * TILE_SIZE) / 2,
                  y: (containerRef.current.clientHeight - GRID_SIZE * TILE_SIZE) / 2
               });
            }
          }}
          className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-600 transition-colors"
          title="Reset View"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
