const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Enable CORS to allow requests from your Netlify frontend
app.use(cors({ origin: 'https://eztransfer.netlify.app' }));

// Serve static files from the 'public' folder (if you want to serve any static frontend assets)
app.use(express.static('public'));

// Add a root route for testing the server
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // WebRTC signaling message handling
  socket.on('signal', (data) => {
    io.to(data.peerId).emit('signal', data); // Relaying signaling messages to peers
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start the server on Heroku's dynamically assigned port or default to port 3000
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
