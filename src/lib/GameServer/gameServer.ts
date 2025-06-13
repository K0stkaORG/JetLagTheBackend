import { DataStore } from "./dataStore";
import { PhaseManager } from "./phaseManager";
import { Server } from "socket.io";
import { SyncHandler } from "./syncHandler";

export class GameServer {
	private constructor(
		private readonly syncHandler: SyncHandler,
		private readonly data: DataStore,
		private readonly phaseManager: PhaseManager
	) {}

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
		await this.phaseManager.resume();
	}

	public async oneMinuteTick() {
		await this.phaseManager.oneMinuteTick();
	}
}
