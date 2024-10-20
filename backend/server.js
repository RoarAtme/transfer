const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const cors = require('cors');
app.use(cors({ origin: 'https://eztransfer.netlify.app' })); // Replace with your actual Netlify domain


// Serve static files (your front-end code)
app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Relay WebRTC signaling messages
    socket.on('signal', (data) => {
        io.to(data.peerId).emit('signal', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
