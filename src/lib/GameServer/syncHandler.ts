import { HidersSyncFrame, SeekersSyncFrame } from "~/types";

import { Server } from "socket.io";

export class SyncHandler {
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

	public get debug() {
		return {
			hidersRoomId: this.hidersRoomId,
			seekersRoomId: this.seekersRoomId,
		};
	}
}
