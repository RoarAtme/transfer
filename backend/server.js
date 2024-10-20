const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Enable CORS for the entire server, including WebSocket connections
app.use(cors({ origin: 'https://eztransfer.netlify.app' }));

// Socket.io setup with CORS configuration
const io = socketIO(server, {
  cors: {
    origin: 'https://eztransfer.netlify.app',  // Allow only your Netlify frontend
    methods: ['GET', 'POST'],                   // Allow necessary methods
    credentials: true                           // If cookies are involved, allow credentials
  }
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

  // WebRTC signaling message handling
  socket.on('signal', (data) => {
    io.to(data.peerId).emit('signal', data);
  });

  // Handle file uploads and broadcast to other clients
  socket.on('file-upload', (data) => {
    console.log('File received:', data.fileName);
    socket.broadcast.emit('file-download', {
      fileName: data.fileName,
      fileData: data.fileData
    });
  });

  // Handle client disconnections
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start the server on Heroku's dynamically assigned port or port 3000 for local testing
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
