import cors from "cors";
import express from "express";
import helmet from "helmet";

import authRoutes from "./modules/auth/auth.routes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`, req.body);
  next();
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "mon-sdis85-api",
  });
});

app.use("/api/auth", authRoutes);

export default app;
