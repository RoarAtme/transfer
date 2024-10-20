const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Enable CORS for the entire Express server
app.use(cors({
  origin: 'https://eztransfer.netlify.app',  // Your Netlify frontend URL
  methods: ['GET', 'POST', 'OPTIONS'],  // Allow necessary methods
  credentials: true
}));

// Trust Heroku's reverse proxy
app.set('trust proxy', 1);

// Initialize Socket.io with CORS configuration and WebSocket-only transport
const io = socketIO(server, {
  cors: {
    origin: 'https://eztransfer.netlify.app',
    methods: ['GET', 'POST', 'OPTIONS'],  // Add OPTIONS for preflight requests
    credentials: true
  },
  transports: ['websocket'],  // Force WebSocket transport only
  pingTimeout: 60000,  // Increase ping timeout to handle network latency
  pingInterval: 25000  // Interval to keep WebSocket connection alive
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

  // Confirm the connection from the new window
  socket.on('confirm-connection', (peerId) => {
    if (peerId) {
      console.log(`Window with peerId: ${peerId} connected.`);
      socket.join(peerId);  // Join a room for this peerId
    } else {
      console.log('Received connection with null or invalid peerId');
    }
  });

  // Handle file uploads
  socket.on('file-upload', (data) => {
    const { peerId, fileName, fileData, fileType } = data;
    if (peerId) {
      console.log(`File received: ${fileName} from peerId: ${peerId}`);
      
      // Emit the file to the specific peer (new window) using peerId
      io.to(peerId).emit('file-download', {
        fileName,
        fileData,
        fileType  // Ensure fileType is included
      });
      console.log(`Broadcasting file ${fileName} to peerId: ${peerId}`);
    } else {
      console.log('No valid peerId found for file upload');
    }
  });

  // Handle client disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start the server on Heroku's dynamic port or default to port 3000
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
