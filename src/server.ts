import "dotenv/config";

import app from "./app.js";
import { env } from "./config/env.js";

app.listen(env.port, () => {
  console.log(`🚒 Mon SDIS85 API démarrée sur http://localhost:${env.port}`);
});
