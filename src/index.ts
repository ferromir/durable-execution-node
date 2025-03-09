import express from "express";
import "dotenv/config";

const app = express();
const port = process.env.HTTP_PORT;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`durex app listening on port ${port}`);
});
