const mongoose = require('mongoose');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });


let managedMongodProcess = null;

function checkPortListening(host, port, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const done = (result) => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(result);
      }
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
    socket.connect(port, host);
  });
}

async function ensureLocalMongodIfNeeded(uri) {
  if (!uri.includes('127.0.0.1') && !uri.includes('localhost')) {
    return uri;
  }

  const portMatch = uri.match(/:(\d+)\//);
  const port = portMatch ? parseInt(portMatch[1], 10) : 27017;

  const isListening = await checkPortListening('127.0.0.1', port);
  if (isListening) {
    return uri;
  }

  // Locate local mongod binary if Windows service is not currently running
  const candidates = [
    process.env.MONGOD_BIN,
    'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\6.0\\bin\\mongod.exe',
  ].filter(Boolean);

  const mongodBin = candidates.find((binPath) => fs.existsSync(binPath));
  if (!mongodBin) {
    return uri;
  }

  const dbPath = path.resolve(__dirname, '../../.data/mongodb');
  fs.mkdirSync(dbPath, { recursive: true });

  managedMongodProcess = spawn(
    mongodBin,
    ['--dbpath', dbPath, '--port', String(port), '--bind_ip', '127.0.0.1'],
    {
      stdio: 'ignore',
      detached: false,
      windowsHide: true,
    }
  );

  managedMongodProcess.unref();

  // Wait up to 8 seconds for mongod to start accepting connections
  for (let i = 0; i < 32; i++) {
    const ready = await checkPortListening('127.0.0.1', port, 300);
    if (ready) {
      break;
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  return uri;
}

async function connectDB() {
  const rawUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/Modu_pro';
  const directUri = process.env.MONGODB_DIRECT_URI || '';
  const dbName = process.env.MONGODB_DB_NAME || 'Modu_pro';
  const uri = await ensureLocalMongodIfNeeded(rawUri);

  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 12000,
    });
  } catch (err) {
    if (directUri && directUri !== uri) {
      console.warn(
        `[MongoDB] Primary URI connection failed (${err.message}). Falling back to direct replicaSet URI...`
      );
      await mongoose.connect(directUri, {
        dbName,
        serverSelectionTimeoutMS: 15000,
      });
    } else {
      throw err;
    }
  }

  console.log(
    `[MongoDB] Connected successfully to database "${mongoose.connection.name}" on ${mongoose.connection.host}`
  );
  return mongoose.connection;
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (managedMongodProcess) {
    try {
      managedMongodProcess.kill();
    } catch (_) {
      // ignore cleanup error
    }
    managedMongodProcess = null;
  }
}

module.exports = { connectDB, disconnectDB };
