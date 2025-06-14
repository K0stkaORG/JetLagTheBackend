import { HidersSyncFrame, SeekersSyncFrame } from "~/types";

import { Server } from "socket.io";

export class SyncHandler {
	private readonly UserIdLookup: Map<string, number> = new Map();
	private readonly UserSocketLookup: Map<number, string> = new Map();

	public constructor(private readonly gameId: number, private readonly WS_SERVER: Server) {}

	private get hidersRoomId() {
		return `h-${this.gameId}`;
	}
	private get seekersRoomId() {
		return `s-${this.gameId}`;
	}

	public emitToHiders(syncFrame: HidersSyncFrame) {
		this.WS_SERVER.to(this.hidersRoomId).emit(syncFrame.type, syncFrame.data);
	}

	public emitToSeekers(syncFrame: SeekersSyncFrame) {
		this.WS_SERVER.to(this.seekersRoomId).emit(syncFrame.type, syncFrame.data);
	}

	public emitToAll(syncFrame: Extract<HidersSyncFrame, SeekersSyncFrame>) {
		this.WS_SERVER.to([this.hidersRoomId, this.seekersRoomId]).emit(syncFrame.type, syncFrame.data);
	}

	public close() {
		this.WS_SERVER.to([this.hidersRoomId, this.seekersRoomId]).disconnectSockets();
	}

	public get debug() {
		return {
			hidersRoomId: this.hidersRoomId,
			seekersRoomId: this.seekersRoomId,
		};
	}
}
