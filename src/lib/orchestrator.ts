import { Games, db } from "~/db";
import { and, lte, notInArray } from "drizzle-orm";

import { CronJob } from "cron";
import { GameServer } from "./GameServer/gameServer";
import { IdMap } from "~/types";
import { Server } from "socket.io";
import { io } from "./io";

export class Orchestrator {
	private readonly WS_SERVER: Server;

	private readonly serverIds: number[] = [];
	private readonly servers: IdMap<GameServer> = new Map();

	private loadServersLoop: CronJob<null, this> | null = null;

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

	public get loadedServerIds(): number[] {
		return this.serverIds;
	}

	public getServerById(id: number): GameServer | undefined {
		return this.servers.get(id);
	}

	public async listen(port: number) {
		await this.WS_SERVER.listen(port);

		this.loadServersLoop = CronJob.from({
			cronTime: "0 * * * * *",
			onTick: this.loadServers,
			start: true,
			timeZone: "Europe/Prague",
			context: this,
			waitForCompletion: true,
			runOnInit: true,
		});
	}

	private async loadServers() {
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
	}

	public async restart() {
		io.log("Restarting orchestrator...");

		this.loadServersLoop?.stop();

		this.servers.values().forEach((server) => server.unload());

		this.servers.clear();
		this.serverIds.length = 0;

		this.WS_SERVER.disconnectSockets();

		await this.loadServers();

		this.loadServersLoop?.start();
	}

	public getJoinableGamesForUser(userId: number) {
		return Array.from(this.servers.values())
			.filter((server) => server.isJoinableByUser(userId))
			.map((server) => server.joinInfo);
	}
}
