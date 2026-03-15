const express = require("express");
const app = express();

app.use(express.json());

const VERIFY_TOKEN = "Web@5679";

// verification endpoint
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("Query:", req.query);

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified!");
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
});

// receive messages
app.post("/webhook", (req, res) => {
  console.log("Incoming WhatsApp event:");
  console.log(JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

app.listen(5000, () => {
  console.log("Webhook server running on port 5000");
});