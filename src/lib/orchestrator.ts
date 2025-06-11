import { Games, db } from "~/db";
import { and, eq, lte, notInArray } from "drizzle-orm";

import { GameServer } from "./gameServer";
import { IdMap } from "~/types";
import { Server } from "socket.io";
import { io } from "./io";

export class Orchestrator {
	private readonly WS_SERVER: Server;

	private readonly serverIds: number[] = [];
	private readonly servers: IdMap<GameServer> = new Map();

	public constructor() {
		this.WS_SERVER = new Server({
			cors: {
				origin: "*",
			},
		});

		this.WS_SERVER.on("connection", async (socket) => {
			socket.on("disconnect", () => {});
		});
	}

	public async listen(port: number) {
		await this.WS_SERVER.listen(port);
	}

	public async oneMinuteTick() {
		const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000);

		const gamesToBeLoaded = await db.query.Games.findMany({
			where: and(eq(Games.state, "planned"), notInArray(Games.id, this.serverIds), lte(Games.startsAt, tenMinutesFromNow)),
			columns: {
				id: true,
			},
		});

		await Promise.allSettled(
			gamesToBeLoaded.map(async (game) => {
				const server = await GameServer.load(game.id);

				this.serverIds.push(server.id);
				this.servers.set(server.id, server);

				io.log(`Loaded game server for game ${game.id}`);
			})
		);
	}
}
