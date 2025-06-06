import { handleLoginAttempt, handleRegistrationAttempt } from "./handlers/auth";

import { Server } from "socket.io";
import { UserError } from "./handlers/handler";
import cors from "cors";
import { env } from "./env";
import express, { type ErrorRequestHandler } from "express";
import { z } from "zod/v4";

z.config(z.locales.cs());

const REST_API = express();
REST_API.use(express.json());
REST_API.use(cors());

REST_API.use(((err, req, res, next) => {
	if (err instanceof SyntaxError && (err as any).status === 400 && "body" in err) return res.status(400).json(UserError(err.message));

	next();
}) as ErrorRequestHandler);

const WS_SERVER = new Server({
	cors: {
		origin: "*",
	},
});

WS_SERVER.on("connection", async (socket) => {
	socket.on("disconnect", () => {});
});

REST_API.post("/auth/register", handleRegistrationAttempt);
REST_API.post("/auth/login", handleLoginAttempt);

Promise.all([REST_API.listen(env.SERVER_PORT), WS_SERVER.listen(env.WS_PORT)]);
