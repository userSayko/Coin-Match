const ws = new WebSocket(`ws://${location.host}`);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  document.getElementById("timer").innerHTML =
    new Date(data.timer * 1000).toISOString().substr(14, 5);

  let r = Object.entries(data.ranking)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([user, coins], i) => `${i+1}. ${user}: ${coins}`)
    .join("<br>");

  document.getElementById("ranking").innerHTML = r;

  if (data.winner) {
    document.getElementById("winner").innerHTML =
      `🏆 ${data.winner[0]} — ${data.winner[1]} coins`;
  }
};
