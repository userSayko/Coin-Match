import WebSocket from "ws";

export function connectTikTok(username, onGift) {
  const ws = new WebSocket(
    `wss://tiklive-websocket.fly.dev/live/${username}`
  );

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.type === "gift") {
        onGift({
          nickname: data.nickname,
          uniqueId: data.uniqueId,
          coin_count: data.coins
        });
      }
    } catch (e) {}
  });

  ws.on("open", () => console.log("Connexion TikTok OK"));
  ws.on("close", () => console.log("Déconnecté"));
}
