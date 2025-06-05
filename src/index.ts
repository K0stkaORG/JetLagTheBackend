import { handleLoginAttempt, handleRegistrationAttempt } from "./handlers/auth";

import { Server } from "socket.io";
import cors from "cors";
import { env } from "./env";
import express from "express";

const REST_API = express();
REST_API.use(express.json());
REST_API.use(cors());

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
