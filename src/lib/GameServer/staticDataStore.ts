import { Card, Dataset, Game, IdMap, Polygon, Question, User } from "~/types";
import { Cards, Questions, db } from "~/db";

import { MapById } from "../utility";
import { inArray } from "drizzle-orm";

export class StaticDataStore {
	private constructor(
		public readonly gameId: number,
		public readonly datasetId: Dataset["id"],
		public readonly datasetName: Dataset["name"],
		public readonly datasetDescription: Dataset["description"],
		public readonly startsAt: Date,
		public readonly hidingTime: number,
		public readonly timeBonusMultiplier: number,
		public readonly gameAreaPolygon: Polygon,
		public readonly players: {
			hiders: User["id"][];
			seekers: User["id"][];
			hidersTeamLeader: User["id"];
		},
		public readonly questions: IdMap<Question>,
		public readonly cards: IdMap<Card>
	) {}

	public static async load(game: Game & { dataset: Dataset }): Promise<StaticDataStore> {
		const questions = await db.query.Questions.findMany({
			where: inArray(Questions.id, game.dataset.questions),
		});

		const cards = await db.query.Cards.findMany({
			where: inArray(
				Cards.id,
				game.dataset.cards.map((card) => card.cardId)
			),
		});

		return new StaticDataStore(
			game.id,
			game.dataset.id,
			game.dataset.name,
			game.dataset.description,
			game.startsAt,
			game.dataset.hidingTime,
			game.dataset.timeBonusMultiplier,
			game.dataset.gameAreaPolygon,
			{
				hiders: game.hiders,
				seekers: game.seekers,
				hidersTeamLeader: game.hidersTeamLeader,
			},
			MapById(questions),
			MapById(cards)
		);
	}

	public get debug() {
		return {
			datasetId: this.datasetId,
			startsAt: this.startsAt.toLocaleString(),
			hidingTime: this.hidingTime,
			timeBonusMultiplier: this.timeBonusMultiplier,
			gameAreaPolygon: this.gameAreaPolygon,
			players: this.players,
			questions: this.questions,
			cards: this.cards,
		};
	}
}
