import { Games, db } from "~/db";
import { and, eq, lte, notInArray } from "drizzle-orm";

import { CronJob } from "cron";
import { GameServer } from "./gameServer";
import { IdMap } from "~/types";
import { Server } from "socket.io";
import { io } from "./io";

export class Orchestrator {
	private readonly WS_SERVER: Server;

	private readonly serverIds: number[] = [];
	private readonly servers: IdMap<GameServer> = new Map();

	private readonly eventLoop: CronJob<null, this>;

	public constructor() {
		this.WS_SERVER = new Server({
			cors: {
				origin: "*",
			},
		});

		this.WS_SERVER.on("connection", async (socket) => {
			socket.on("disconnect", () => {});
		});

		this.eventLoop = CronJob.from({
			cronTime: "0 * * * * *",
			onTick: this.oneMinuteTick,
			start: false,
			timeZone: "Europe/Prague",
			context: this,
			runOnInit: true,
		});
	}

	public async listen(port: number) {
		await this.WS_SERVER.listen(port);

		this.eventLoop.start();
	}

	public async oneMinuteTick() {
		const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000);

		const gamesToBeLoaded = await db.query.Games.findMany({
			where: and(notInArray(Games.id, this.serverIds), lte(Games.startsAt, tenMinutesFromNow)),
			columns: {
				id: true,
			},
		});

		await Promise.allSettled(
			gamesToBeLoaded.map(async (game) => {
				const gameServer = await GameServer.load({
					id: game.id,
					USE_WS_SERVER: this.WS_SERVER,
				});

				this.serverIds.push(gameServer.id);
				this.servers.set(gameServer.id, gameServer);

				io.log(`Loaded game server for game ${game.id}`);
			})
		);

		this.servers.forEach((server) => {
			if (server.shouldHidingPhaseBeStarted) server.startHidingPhase();
		});
	}

	public get debug() {
		return {
			serverIds: this.serverIds,
			servers: this.servers,
		};
	}
}
