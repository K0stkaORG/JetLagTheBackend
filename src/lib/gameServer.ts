import { Card, Dataset, HidersSyncFrame, IdMap, Question, SeekersSyncFrame } from "~/types";
import { Cards, Datasets, Questions, db } from "~/db";
import { eq, inArray } from "drizzle-orm";

import { DynamicDataStore } from "./dynamicDataStore";
import { MapById } from "./utility";
import { Server } from "socket.io";

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

		const dynamicData = await DynamicDataStore.load(id);

		return new GameServer(WS_SERVER, game.id, game.dataset, MapById(questions), MapById(cards), dynamicData);
	}

	private constructor(
		private readonly WS_SERVER: Server,
		public readonly id: number,
		private readonly dataset: Dataset,
		private readonly questions: IdMap<Question>,
		private readonly cards: IdMap<Card>,
		private readonly dynamicData: DynamicDataStore
	) {
		this.dynamicData.setEventEmitters({
			emitToHiders: this.emitToHiders.bind(this),
			emitToSeekers: this.emitToSeekers.bind(this),
		});
	}

	private get hidersRoomId() {
		return `hiders-${this.id}`;
	}
	private get seekersRoomId() {
		return `seekers-${this.id}`;
	}

	private emitToHiders(syncFrame: HidersSyncFrame) {
		this.WS_SERVER.to(this.hidersRoomId).emit(syncFrame.type, syncFrame.data);
	}

	private emitToSeekers(syncFrame: SeekersSyncFrame) {
		this.WS_SERVER.to(this.seekersRoomId).emit(syncFrame.type, syncFrame.data);
	}
}
