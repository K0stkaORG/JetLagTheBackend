import { ActiveEffect, Card, CardInHand, Dataset, Game, IdMap, RemainingCard } from "~/types";
import { ActiveEffects, CardsInHand, Events, Games, RemainingCards, db } from "~/db";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { GameServer } from "./gameServer";
import { MapById } from "./utility";

export class DynamicDataStore {
	private emitToHiders: GameServer["emitToHiders"] = () => {};
	private emitToSeekers: GameServer["emitToSeekers"] = () => {};
	private emitToAll: GameServer["emitToAll"] = () => {};

	public static async load(game: Game & { dataset: Dataset }) {
		const activeEffects = (await db.query.ActiveEffects.findMany({
			where: eq(ActiveEffects.gameId, game.id),
		})) as ActiveEffect[];

		const remainingCards = await db.query.RemainingCards.findMany({
			where: eq(RemainingCards.gameId, game.id),
		});

		const cardsInHand = await db.query.CardsInHand.findMany({
			where: eq(CardsInHand.gameId, game.id),
		});

		const lastStartedAt =
			(
				await db.query.Events.findFirst({
					where: and(
						eq(Events.gameId, game.id),
						inArray(Events.type, ["hiding_phase_started", "game_resumed"])
					),
					columns: {
						timestamp: true,
					},
					orderBy: desc(Events.timestamp),
				})
			)?.timestamp ?? null;

		return new DynamicDataStore(
			game.id,
			game.dataset.hidingTime,
			game.state,
			lastStartedAt,
			game.duration ?? 0,
			MapById(activeEffects),
			remainingCards,
			cardsInHand
		);
	}

	private constructor(
		private readonly gameId: Game["id"],
		private readonly hidingPhaseLength: number,
		private _state: Game["state"],
		private lastStartedAt: Date | null,
		private durationTillLastStartedAt: number,
		private readonly activeEffects: IdMap<ActiveEffect>,
		private readonly remainingCards: RemainingCard[],
		private readonly cardsInHand: CardInHand[]
	) {}

	public setEventEmitters({
		emitToHiders,
		emitToSeekers,
		emitToAll,
	}: {
		emitToHiders: DynamicDataStore["emitToHiders"];
		emitToSeekers: DynamicDataStore["emitToSeekers"];
		emitToAll: DynamicDataStore["emitToAll"];
	}) {
		this.emitToHiders = emitToHiders;
		this.emitToSeekers = emitToSeekers;
		this.emitToAll = emitToAll;
	}

	public get state() {
		return this._state;
	}

	public getFullDuration(now?: number) {
		if (!this.lastStartedAt) return 0;

		if (!["hiding_phase", "main_phase"].includes(this._state)) return this.durationTillLastStartedAt;

		return Math.floor(((now ?? Date.now()) - this.lastStartedAt.getTime()) / 1000) + this.durationTillLastStartedAt;
	}

	public get duration() {
		return this.getFullDuration() - this.hidingPhaseLength * 60;
	}

	public async startHidingPhase() {
		await this.setState("hiding_phase");

		this.lastStartedAt = new Date();
		await db.insert(Events).values([
			{
				gameId: this.gameId,
				type: "hiding_phase_started",
				timestamp: this.lastStartedAt,
			},
		]);
	}

	public async pause() {
		if (!["hiding_phase", "main_phase"].includes(this._state))
			throw new Error("Game is not in a state that can be paused.");

		const now = Date.now();

		this.durationTillLastStartedAt = this.getFullDuration(now);

		await this.setState("paused");

		await db.insert(Events).values([{ gameId: this.gameId, type: "game_paused", timestamp: new Date(now) }]);
		await db
			.update(Games)
			.set({
				duration: this.durationTillLastStartedAt,
			})
			.where(eq(Games.id, this.gameId));
	}

	public async resume() {
		if (this._state !== "paused") throw new Error("Game is not paused.");

		await this.setState(this.getFullDuration() >= this.hidingPhaseLength * 60 ? "main_phase" : "hiding_phase");

		this.lastStartedAt = new Date();
		await db.insert(Events).values([
			{
				gameId: this.gameId,
				type: "game_resumed",
				timestamp: this.lastStartedAt,
			},
		]);
	}

	private async setState(state: Exclude<Game["state"], "planned">) {
		this._state = state;

		await db.update(Games).set({
			state,
		});

		switch (state) {
			case "hiding_phase":
				this.emitToAll({
					type: "hiding_phase_started",
				});
				break;
			case "main_phase":
				this.emitToAll({
					type: "main_phase_started",
				});
				break;
			case "finished":
				this.emitToAll({
					type: "game_finished",
				});
				break;
			case "paused":
				this.emitToAll({
					type: "game_paused",
				});
				break;
		}
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

	public get debug() {
		return {
			state: this._state,
			lastStartedAt: this.lastStartedAt,
			durationTillLastStartedAt: this.durationTillLastStartedAt,
			fullDuration: this.getFullDuration(),
			duration: this.duration,
			activeEffects: this.activeEffects,
			remainingCards: this.remainingCards,
			cardsInHand: this.cardsInHand,
		};
	}
}
