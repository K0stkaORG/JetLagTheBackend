import { CronJob } from "cron";
import { DataStore } from "./dataStore";
import { PhaseManager } from "./phaseManager";
import { Server } from "socket.io";
import { SyncHandler } from "./syncHandler";

export class GameServer {
	private readonly eventLoop: CronJob<null, this>;

	private constructor(
		private readonly syncHandler: SyncHandler,
		private readonly data: DataStore,
		private readonly phaseManager: PhaseManager
	) {
		this.eventLoop = CronJob.from({
			cronTime: "* * * * * *",
			onTick: this.tick,
			start: true,
			timeZone: "Europe/Prague",
			context: this,
			waitForCompletion: true,
		});
	}

	public static async load({
		id,
		USE_WS_SERVER: WS_SERVER,
	}: {
		id: number;
		USE_WS_SERVER: Server;
	}): Promise<GameServer> {
		const syncHandler = new SyncHandler(id, WS_SERVER);

		const dataStore = await DataStore.load({
			id,
			syncHandler,
		});

		const phaseManager = new PhaseManager(dataStore);

		return new GameServer(syncHandler, dataStore, phaseManager);
	}

	public get id(): number {
		return this.data.id;
	}

	public get debug() {
		return {
			id: this.id,
			data: this.data.debug,
			syncHandler: this.syncHandler.debug,
		};
	}

	public async pause() {
		await this.phaseManager.pause();
	}

	public async resume() {
		return await this.phaseManager.resume();
	}

	private async tick() {
		await this.phaseManager.tick();
	}

	public unload() {
		this.eventLoop.stop();
		this.syncHandler.close();
	}

	public isJoinableByUser(userId: number): boolean {
		return this.data.players.hiders.includes(userId) || this.data.players.seekers.includes(userId);
	}

	public get joinInfo() {
		return {
			id: this.id,
			name: this.data.datasetName,
			description: this.data.datasetDescription,
			startsAt: this.data.startsAt.getTime(),
			state: this.data.state,
			duration: this.data.duration,
			durationSync: Date.now(),
		};
	}

	public getJoinInfoForUser(userId: number) {
		return this.data.getJoinInfoForUser(userId);
	}
}
