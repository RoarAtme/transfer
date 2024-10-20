const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: 'https://eztransfer.netlify.app',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket'],  // Use WebSocket only, skip polling
});


// Enable CORS for the entire server
app.use(cors({
  origin: 'https://eztransfer.netlify.app',  // Allow requests from your Netlify frontend
  methods: ['GET', 'POST'],                 // Allow GET and POST methods
  credentials: true                         // Allow credentials (cookies, authorization headers)
}));

// Initialize Socket.io with explicit CORS settings
const io = socketIO(server, {
  cors: {
    origin: 'https://eztransfer.netlify.app',  // Netlify frontend URL
    methods: ['GET', 'POST'],                  // Allow GET and POST methods
    credentials: true                          // If you're using cookies
  },
  transports: ['websocket', 'polling'],        // Ensure both polling and websocket are supported
});

// Serve static files from 'public' folder (if needed)
app.use(express.static('public'));

app.set('trust proxy', 1);  // Trust Heroku's reverse proxy


// Root route for testing server
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// Handle Socket.io connections
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // WebRTC signaling messages
  socket.on('signal', (data) => {
    io.to(data.peerId).emit('signal', data);  // Relay signaling to peers
  });

  // Handle file upload and broadcast to other clients
  socket.on('file-upload', (data) => {
    console.log('File received:', data.fileName);
    socket.broadcast.emit('file-download', {
      fileName: data.fileName,
      fileData: data.fileData
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server on Heroku's assigned port or default to 3000
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
