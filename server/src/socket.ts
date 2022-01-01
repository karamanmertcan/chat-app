import { Server, Socket } from 'socket.io';
import { nanoid } from 'nanoid';
import logger from './utils/logger';

const EVENTS = {
  connection: 'connection',
  CLIENT: {
    CREATE_ROOM: 'CREATE_ROOM',
    SEND_ROOM_MESSAGE: 'SEND_ROOM_MESSAGE',
    JOIN_ROOM: 'JOIN_ROOM'
  },
  SERVER: {
    ROOMS: 'ROOM',
    JOINED_ROOM: 'JOINED_ROOM',
    ROOM_MESSAGE: 'ROOM_MESSAGE'
  }
};

const rooms: Record<string, { name: string }> = {};

function socket({ io }: { io: Server }) {
  logger.info(`Socket enabled`);
  io.on(EVENTS.connection, (socket: Socket) => {
    logger.info(`user connected ${socket.id}`);

    //when a user creates a new room

    socket.on(EVENTS.CLIENT.CREATE_ROOM, ({ roomName }) => {
      console.log(`roomName: ${roomName}`);

      //create a room id
      const roomId = nanoid();

      //add a new room to the rooms object
      rooms[roomId] = {
        name: roomName
      };

      socket.join(roomId);

      //broadcast an event to all clients in the room
      socket.broadcast.emit(EVENTS.SERVER.ROOMS, rooms);
      //emit back to the room creator with all the rooms
      socket.emit(EVENTS.SERVER.ROOMS, rooms);

      //emit event back to room creator saying they have joined the room
      socket.emit(EVENTS.SERVER.JOINED_ROOM, roomId);
    });

    //when a user sends a room message
    socket.on(EVENTS.CLIENT.SEND_ROOM_MESSAGE, ({ roomId, message, username }) => {
      const date = new Date();

      socket.to(roomId).emit(EVENTS.SERVER.ROOM_MESSAGE, {
        message,
        username,
        time: `${date.getHours()}:${date.getMinutes()}`
      });
    });

    //when a user joins a room
    socket.on(EVENTS.CLIENT.JOIN_ROOM, (roomId) => {
      socket.join(roomId);

      socket.emit(EVENTS.SERVER.JOINED_ROOM, roomId);
    });
  });
}

export default socket;
