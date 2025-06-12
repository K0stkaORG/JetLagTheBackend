import { Card, Dataset, HidersSyncFrame, IdMap, Question, SeekersSyncFrame, User } from "~/types";
import { Cards, Datasets, Questions, db } from "~/db";
import { eq, inArray } from "drizzle-orm";

import { DynamicDataStore } from "./dynamicDataStore";
import { MapById } from "./utility";
import { Server } from "socket.io";
import { io } from "./io";

export class GameServer {
	public static async load({
		id,
		USE_WS_SERVER: WS_SERVER,
	}: {
		id: number;
		USE_WS_SERVER: Server;
	}): Promise<GameServer> {
		const game = await db.query.Games.findFirst({
			where: eq(Datasets.id, id),
			with: {
				dataset: true,
			},
		});

		if (!game) throw new Error(`Game with id ${id} not found`);

		const questions = await db.query.Questions.findMany({
			where: inArray(Questions.id, game.dataset.questions),
		});

		const cards = await db.query.Cards.findMany({
			where: inArray(
				Cards.id,
				game.dataset.cards.map((card) => card.cardId)
			),
		});

		const dynamicData = await DynamicDataStore.load(game);

		return new GameServer(
			WS_SERVER,
			game.id,
			game.dataset,
			{
				hiders: game.hiders,
				seekers: game.seekers,
				hidersTeamLeader: game.hidersTeamLeader,
			},
			game.startsAt,
			MapById(questions),
			MapById(cards),
			dynamicData
		);
	}

	private constructor(
		private readonly WS_SERVER: Server,
		public readonly id: number,
		private readonly dataset: Dataset,
		private readonly players: {
			hiders: User["id"][];
			seekers: User["id"][];
			hidersTeamLeader: User["id"];
		},
		private readonly startsAt: Date,
		private readonly questions: IdMap<Question>,
		private readonly cards: IdMap<Card>,
		private readonly dynamicData: DynamicDataStore
	) {
		this.dynamicData.setEventEmitters({
			emitToHiders: this.emitToHiders.bind(this),
			emitToSeekers: this.emitToSeekers.bind(this),
			emitToAll: this.emitToAll.bind(this),
		});
	}

	private get hidersRoomId() {
		return `h-${this.id}`;
	}
	private get seekersRoomId() {
		return `s-${this.id}`;
	}

	private emitToHiders(syncFrame: HidersSyncFrame) {
		this.WS_SERVER.to(this.hidersRoomId).emit(syncFrame.type, syncFrame.data);
	}

	private emitToSeekers(syncFrame: SeekersSyncFrame) {
		this.WS_SERVER.to(this.seekersRoomId).emit(syncFrame.type, syncFrame.data);
	}

	private emitToAll(syncFrame: Extract<HidersSyncFrame, SeekersSyncFrame>) {
		this.WS_SERVER.to(this.hidersRoomId).emit(syncFrame.type, syncFrame.data);
		this.WS_SERVER.to(this.seekersRoomId).emit(syncFrame.type, syncFrame.data);
	}

	public get shouldHidingPhaseBeStarted() {
		return this.startsAt.getTime() <= Date.now() && this.dynamicData.state === "planned";
	}

	public async startHidingPhase() {
		io.log(`Started hiding phase of game ${this.id}`);

		await this.dynamicData.startHidingPhase();
	}

	public async pause() {
		io.log(`Paused game ${this.id}`);

		await this.dynamicData.pause();
	}

	public async resume() {
		io.log(`Resumed game ${this.id}`);

		await this.dynamicData.resume();
	}

	public get shouldMainPhaseBeStarted() {
		return (
			this.dynamicData.state === "hiding_phase" &&
			this.dynamicData.getFullDuration() >= this.dataset.hidingTime * 60
		);
	}

	public get debug() {
		return {
			id: this.id,
			dataset: this.dataset,
			players: this.players,
			startsAt: this.startsAt.toLocaleString(),
			questions: this.questions,
			cards: this.cards,
			dynamicData: this.dynamicData.debug,
			hidersRoomId: this.hidersRoomId,
			seekersRoomId: this.seekersRoomId,
		};
	}
}
