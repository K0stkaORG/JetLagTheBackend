import { Server } from "socket.io";
import { env } from "./env";
import express from "express";

const REST_API = express();
REST_API.use(express.json());

const WS_SERVER = new Server({
	cors: {
		origin: "*",
	},
});

WS_SERVER.on("connection", async (socket) => {
	socket.on("disconnect", () => {});
});

REST_API.get("/", (req, res) => {
	res.send("Hello World!");
});

Promise.all([REST_API.listen(env.SERVER_PORT), WS_SERVER.listen(env.WS_PORT)]);
