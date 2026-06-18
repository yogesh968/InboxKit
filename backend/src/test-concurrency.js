import { io as ClientIO } from 'socket.io-client';
import prisma from './db.js';

const SERVER_URL = 'http://localhost:5050';
const TILE_A = 100;
const TILE_B = 101;
const TILE_C = 102;
const TILE_D = 103;
const TILE_E = 104;
const SHARED_TILE = 999;

async function runSingleUserTest() {
  console.log('\n--- Test 1: Single User Cooldown Protection ---');
  
  // Clean DB tiles
  await prisma.tile.updateMany({
    where: { id: { in: [TILE_A, TILE_B, TILE_C, TILE_D, TILE_E] } },
    data: { userId: null },
  });

  const socket = ClientIO(SERVER_URL, { forceNew: true, transports: ['websocket'] });
  
  const user = await new Promise((resolve) => {
    socket.on('connect', () => socket.emit('join', { username: 'SingleUserTester' }));
    socket.on('init', (data) => resolve(data.user));
  });

  // Reset user cooldown in DB to make sure they can capture
  await prisma.user.update({
    where: { id: user.id },
    data: { lastCaptureAt: null },
  });

  const responses = [];
  const captureDone = new Promise((resolve) => {
    let count = 0;
    const handleResponse = (type) => {
      responses.push(type);
      count++;
      if (count === 5) resolve();
    };

    socket.on('capture_success', () => handleResponse('success'));
    socket.on('cooldown_active', () => handleResponse('cooldown'));
    socket.on('error_message', () => handleResponse('error'));
    
    setTimeout(resolve, 3000); // safety timeout
  });

  // Emit 5 captures simultaneously
  console.log('Emitting 5 capture requests for 5 different tiles from the SAME user...');
  socket.emit('tile:capture', { tileId: TILE_A });
  socket.emit('tile:capture', { tileId: TILE_B });
  socket.emit('tile:capture', { tileId: TILE_C });
  socket.emit('tile:capture', { tileId: TILE_D });
  socket.emit('tile:capture', { tileId: TILE_E });

  await captureDone;

  const successes = responses.filter(r => r === 'success').length;
  const cooldowns = responses.filter(r => r === 'cooldown').length;

  console.log(`Results: Successes = ${successes}, Cooldowns = ${cooldowns}`);
  socket.disconnect();

  if (successes === 1 && cooldowns === 4) {
    console.log('SUCCESS: Single-user cooldown protection worked. Only 1 capture succeeded, 4 were blocked.');
    return true;
  } else {
    console.error('FAILED: Expected 1 success and 4 cooldown blocks.');
    return false;
  }
}

async function runMultiUserTest() {
  console.log('\n--- Test 2: Multi-User Race Condition ---');
  
  // Clean DB tile
  await prisma.tile.update({
    where: { id: SHARED_TILE },
    data: { userId: null },
  });

  const clientsCount = 5;
  const sockets = [];
  const joinPromises = [];

  for (let i = 0; i < clientsCount; i++) {
    const socket = ClientIO(SERVER_URL, { forceNew: true, transports: ['websocket'] });
    sockets.push(socket);
    joinPromises.push(new Promise((resolve) => {
      socket.on('connect', () => socket.emit('join', { username: `MultiUser_${i}` }));
      socket.on('init', (data) => resolve(data.user));
    }));
  }

  const joinedUsers = await Promise.all(joinPromises);
  
  // Clear cooldowns in DB
  await prisma.user.updateMany({
    where: { id: { in: joinedUsers.map(u => u.id) } },
    data: { lastCaptureAt: null },
  });

  const successOrder = [];
  const finishedPromises = sockets.map((socket, idx) => {
    return new Promise((resolve) => {
      socket.on('capture_success', () => {
        successOrder.push(joinedUsers[idx].id);
        resolve();
      });
      socket.on('cooldown_active', () => resolve());
      socket.on('error_message', () => resolve());
      setTimeout(resolve, 3000);
    });
  });

  console.log(`Emitting 5 capture requests for shared tile ${SHARED_TILE} from 5 DIFFERENT users...`);
  sockets.forEach(s => s.emit('tile:capture', { tileId: SHARED_TILE }));

  await Promise.all(finishedPromises);

  // Check the DB
  const dbTile = await prisma.tile.findUnique({
    where: { id: SHARED_TILE },
  });

  console.log(`Success order (user IDs):`, successOrder);
  console.log(`Database owner ID:`, dbTile?.userId);

  sockets.forEach(s => s.disconnect());

  if (successOrder.length > 0 && dbTile?.userId === successOrder[successOrder.length - 1]) {
    console.log('SUCCESS: Multi-user race condition resolved correctly. Database matches the last processed client.');
    return true;
  } else {
    console.error('FAILED: Database state does not match the last successful client.');
    return false;
  }
}

async function runAll() {
  const t1 = await runSingleUserTest();
  const t2 = await runMultiUserTest();
  
  console.log('\n=================================');
  if (t1 && t2) {
    console.log('ALL TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error('SOME TESTS FAILED!');
    process.exit(1);
  }
}

runAll().catch(console.error);
