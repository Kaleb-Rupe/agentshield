import { Hono } from "hono";
import { discovery } from "./routes/discovery";
import { provision } from "./routes/provision";
import { provisionTee } from "./routes/provision-tee";
import { fund } from "./routes/fund";
import { status } from "./routes/status";
import { protection } from "./routes/protection";
import { emergencyCloseAuth } from "./routes/emergency-close-auth";
import { syncPositions } from "./routes/sync-positions";
import { escrow } from "./routes/escrow";

const app = new Hono();

// Mount routes
app.route("/", discovery);
app.route("/", provision);
app.route("/", provisionTee);
app.route("/", fund);
app.route("/", status);
app.route("/", protection);
app.route("/", emergencyCloseAuth);
app.route("/", syncPositions);
app.route("/", escrow);

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

export { app };
