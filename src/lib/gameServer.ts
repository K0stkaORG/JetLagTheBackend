import { Card, Dataset, IdMap, Question } from "~/types";
import { Cards, Datasets, Questions, db } from "~/db";
import { eq, inArray } from "drizzle-orm";

import { MapById } from "./utility";

export class GameServer {
	public static async load(id: GameServer["id"]): Promise<GameServer> {
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

		return new GameServer(game.id, game.dataset, MapById(questions), MapById(cards));
	}

	private constructor(public readonly id: number, public readonly dataset: Dataset, public readonly questions: IdMap<Question>, public readonly cards: IdMap<Card>) {}

	public get hidersRoomId() {
		return `hiders-${this.id}`;
	}
	public get seekersRoomId() {
		return `seekers-${this.id}`;
	}
}
