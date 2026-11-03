import "dotenv/config";

import app from "./app";

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`🚒 Mon SDIS85 API démarrée sur http://localhost:${PORT}`);
});
