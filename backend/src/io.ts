import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

export const initializeSocketIO = (server: HTTPServer) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: ["http://localhost:5173", "https://expense-splitter-jade.vercel.app"],
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    // console.log('User connected:', socket.id);

    socket.on('join-group', (groupId: string) => {
      socket.join(`group-${groupId}`);
      // console.log(`User ${socket.id} joined group group:${groupId}`);
    });
    
    socket.on('leave-group', (groupId: string) => {
      socket.leave(`group-${groupId}`);
      // console.log(`User ${socket.id} left group group:${groupId}`);
    });

    socket.on('disconnect', () => {
      // console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

export type SocketIO = ReturnType<typeof initializeSocketIO>;
