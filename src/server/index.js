const express = require('express');
const path = require('path');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('colyseus');
const { monitor } = require('@colyseus/monitor');

// const demo room handlers
const { GameRoom } = require("./rooms/gameRoom");

const port = Number(process.env.PORT || 2567);
const app = express();

app.use(cors());
app.use(express.json());

// Attach WebSocket Server on HTTP Server.
const gameServer = new Server({
  server: createServer(app),
  express: app,
  pingInterval: 0,
});

// Define "lobby" room
gameServer.define("GameRoom", GameRoom);

app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "..", "..", "dist")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "..", "dist", "index.html"));
});

// (optional) attach web monitoring panel
app.use('/colyseus', monitor());

gameServer.onShutdown(function(){
  console.log(`game server is going down.`);
});

gameServer.listen(port);

// process.on("uncaughtException", (e) => {
//   console.log(e.stack);
//   process.exit(1);
// });

console.log(`Listening on port: ${ port }`);