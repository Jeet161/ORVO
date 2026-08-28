const net = require('net');

const host = 'ep-royal-salad-aypa6g3h-pooler.c-5.us-east-2.aws.neon.tech';
const port = 5432;

console.log(`Connecting to ${host}:${port}...`);

const socket = new net.Socket();
socket.setTimeout(5000);

socket.on('connect', () => {
  console.log('✅ Port 5432 is OPEN and REACHABLE!');
  socket.destroy();
});

socket.on('timeout', () => {
  console.log('❌ Connection TIMED OUT. Port 5432 is blocked outbound.');
  socket.destroy();
});

socket.on('error', (err) => {
  console.log(`❌ Connection FAILED: ${err.message}`);
});

socket.connect(port, host);
