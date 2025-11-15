import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { connectTikTok } from "./tiktok.js";

const app = express();
app.use(cors());
app.use(express.static("public"));

let timer = 180; // 3 minutes
let extraTime = 20;
let running = false;
let interval = null;
let ranking = {};
let participants = new Set();
let winner = null;

const wss = new WebSocketServer({ noServer: true });
let overlaySockets = [];
let adminSockets = [];

// 🔗 Connexion TikTok
connectTikTok("sxalix2tiktok", (gift) => {
  let user = gift.nickname || gift.uniqueId;

  // Update ranking
  ranking[user] = (ranking[user] || 0) + gift.coin_count;
  participants.add(user);

  broadcastOverlay();
});

// ⏳ Timer loop
function startTimer() {
  if (running) return;
  running = true;

  interval = setInterval(() => {
    timer--;

    if (timer <= 0) {
      clearInterval(interval);
      extraTimeStart();
    }

    broadcastOverlay();
  }, 1000);
}

function extraTimeStart() {
  timer = extraTime;

  interval = setInterval(() => {
    timer--;

    if (timer <= 0) {
      clearInterval(interval);
      running = false;
      calcWinner();
    }

    broadcastOverlay();
  }, 1000);
}

function calcWinner() {
  let sorted = Object.entries(ranking).sort((a, b) => b[1] - a[1]);
  winner = sorted[0] || ["Aucun gagnant", 0];
  broadcastOverlay();
}

// 📡 overlay update
function broadcastOverlay() {
  const data = JSON.stringify({
    type: "update",
    timer,
    running,
    ranking,
    participants: participants.size,
    winner
  });

  overlaySockets.forEach(s => s.send(data));
  adminSockets.forEach(s => s.send(data));
}

// websocket upgrade
app.server = app.listen(3000);

app.server.on("upgrade", (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    if (req.url.includes("admin")) adminSockets.push(ws);
    else overlaySockets.push(ws);

    ws.on("close", () => {
      overlaySockets = overlaySockets.filter(s => s !== ws);
      adminSockets = adminSockets.filter(s => s !== ws);
    });
  });
});

// Admin API actions
app.get("/start", (req, res) => { startTimer(); res.send("ok"); });
app.get("/pause", (req, res) => { running = false; clearInterval(interval); res.send("ok"); });
app.get("/reset", (req, res) => {
  timer = 180;
  ranking = {};
  participants.clear();
  winner = null;
  running = false;
  clearInterval(interval);
  broadcastOverlay();
  res.send("ok");
});
