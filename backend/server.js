const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Enable CORS for Express and allow requests from Netlify
app.use(cors({ origin: 'https://eztransfer.netlify.app', credentials: true }));

// Initialize Socket.io with CORS enabled and proper transports
const io = socketIO(server, {
  cors: {
    origin: 'https://eztransfer.netlify.app',  // Your Netlify URL
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['my-custom-header'],
  },
  transports: ['websocket', 'polling'],  // Enable both transports explicitly
});

// Serve static files from the 'public' folder
app.use(express.static('public'));

// Test route to ensure the server is running
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// Handle WebSocket connections
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Handle WebRTC signaling
  socket.on('signal', (data) => {
    io.to(data.peerId).emit('signal', data);  // Relaying signaling messages to peers
  });

  // Handle file uploads and broadcast to other clients
  socket.on('file-upload', (data) => {
    console.log('File received:', data.fileName);
    socket.broadcast.emit('file-download', {
      fileName: data.fileName,
      fileData: data.fileData,
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start the server on the port specified by Heroku or default to 3000
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
