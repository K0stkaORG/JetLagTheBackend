import { ActiveEffect, Card, CardInHand, Game, IdMap, RemainingCard } from "~/types";
import { ActiveEffects, CardsInHand, RemainingCards, db } from "~/db";
import { and, eq, sql } from "drizzle-orm";

import { GameServer } from "./gameServer";
import { MapById } from "./utility";

export class DynamicDataStore {
	private emitToHiders: GameServer["emitToHiders"] = () => {};
	private emitToSeekers: GameServer["emitToSeekers"] = () => {};

	public static async load(gameId: Game["id"]) {
		const activeEffects = (await db.query.ActiveEffects.findMany({
			where: eq(ActiveEffects.gameId, gameId),
		})) as ActiveEffect[];

		const remainingCards = await db.query.RemainingCards.findMany({
			where: eq(RemainingCards.gameId, gameId),
		});

		const cardsInHand = await db.query.CardsInHand.findMany({
			where: eq(CardsInHand.gameId, gameId),
		});

		return new DynamicDataStore(gameId, MapById(activeEffects), remainingCards, cardsInHand);
	}

	private constructor(
		private readonly gameId: Game["id"],
		private readonly activeEffects: IdMap<ActiveEffect>,
		private readonly remainingCards: RemainingCard[],
		private readonly cardsInHand: CardInHand[]
	) {}

	public setEventEmitters({
		emitToHiders,
		emitToSeekers,
	}: {
		emitToHiders: DynamicDataStore["emitToHiders"];
		emitToSeekers: DynamicDataStore["emitToSeekers"];
	}) {
		this.emitToHiders = emitToHiders;
		this.emitToSeekers = emitToSeekers;
	}

	public drawNCards(numberOfCards: number): Card["id"][] {
		const drawnCards: Card["id"][] = [];
		const cards = this.remainingCards.filter((card) => card.remaining > 0);

		let total = cards.reduce((sum, card) => sum + card.remaining, 0);

		for (let i = 0; i < numberOfCards && total > 0; i++) {
			let r = Math.floor(Math.random() * total);
			let acc = 0;
			for (const card of cards) {
				acc += card.remaining;
				if (r < acc) {
					drawnCards.push(card.id);
					card.remaining--;
					total--;
					break;
				}
			}
		}

		return drawnCards;
	}

	public async pickCardsFromDrawn(pickedCards: Card["id"][]) {
		await db.insert(CardsInHand).values(
			pickedCards.map((cardId) => ({
				gameId: this.gameId,
				cardId,
			}))
		);

		await Promise.allSettled(
			pickedCards
				.reduce((acc, cardId) => {
					const existing = acc.find((item) => item.id === cardId);
					if (existing) {
						existing.amount++;
					} else {
						acc.push({ id: cardId, amount: 1 });
					}
					return acc;
				}, [] as { id: Card["id"]; amount: number }[])
				.map(({ id, amount }) => {
					return db
						.update(RemainingCards)
						.set({ remaining: sql`${RemainingCards.remaining} - ${amount}` })
						.where(and(eq(RemainingCards.gameId, this.gameId), eq(RemainingCards.id, id)));
				})
		);

		this.emitToSeekers({
			type: "cards_picked",
			data: {
				cards: pickedCards,
			},
		});
	}
}
