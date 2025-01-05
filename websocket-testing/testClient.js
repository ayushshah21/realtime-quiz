import {io} from 'socket.io-client';

const socket = io("http://localhost:4000");

socket.on("connect", () => {
  console.log("Connected:", socket.id);
});

socket.emit('message', "Hi there buddy yush");

socket.on('message', (message) => {
  console.log(message);
})

socket.on("disconnect", () => {
  console.log("Disconnected");
});
