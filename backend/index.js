import app from "./app.js";

const PORT = process.env.BACKEND_PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend listening on port ${PORT}`);
});
