const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Enable CORS for the entire Express server
app.use(cors({
  origin: 'https://eztransfer.netlify.app',  // Your Netlify frontend URL
  methods: ['GET', 'POST'],
  credentials: true
}));

// Trust Heroku's reverse proxy
app.set('trust proxy', 1);

// Initialize Socket.io with CORS and force WebSocket transport only
const io = socketIO(server, {
  cors: {
    origin: 'https://eztransfer.netlify.app',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket']  // Force WebSocket-only, skip polling
});

// Serve static files if needed
app.use(express.static('public'));

// Add a root route for testing the server
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// Handle Socket.io connections
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Handle WebRTC signaling messages
  socket.on('signal', (data) => {
    io.to(data.peerId).emit('signal', data);  // Relay signaling messages
  });

  // Handle file uploads
  socket.on('file-upload', (data) => {
    console.log('File received:', data.fileName);
    socket.broadcast.emit('file-download', {
      fileName: data.fileName,
      fileData: data.fileData  // Base64-encoded file data
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start the server on Heroku's dynamic port or default to port 3000
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
