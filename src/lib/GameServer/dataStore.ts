import { Datasets, db } from "~/db";
import { Game, Polygon } from "~/types";

import { DynamicDataStore } from "./dynamicDataStore";
import { StaticDataStore } from "./staticDataStore";
import { SyncHandler } from "./syncHandler";
import { eq } from "drizzle-orm";

export class DataStore {
	private constructor(private readonly staticData: StaticDataStore, private readonly dynamicData: DynamicDataStore) {}

	public static async load({ id, syncHandler }: { id: number; syncHandler: SyncHandler }): Promise<DataStore> {
		const game = await db.query.Games.findFirst({
			where: eq(Datasets.id, id),
			with: {
				dataset: true,
			},
		});

		if (!game) throw new Error(`Game with id ${id} not found`);

		const staticData = await StaticDataStore.load(game);
		const dynamicData = await DynamicDataStore.init({ game, staticData, syncHandler });

		return new DataStore(staticData, dynamicData);
	}

	public get debug() {
		return {
			staticData: this.staticData.debug,
			dynamicData: this.dynamicData.debug,
		};
	}

	public get id(): number {
		return this.staticData.gameId;
	}

	public get datasetId(): number {
		return this.staticData.datasetId;
	}

	public get datasetName(): string {
		return this.staticData.datasetName;
	}

	public get datasetDescription(): string {
		return this.staticData.datasetDescription;
	}

	public get startsAt(): Date {
		return this.staticData.startsAt;
	}

	public get hidingTime(): number {
		return this.staticData.hidingTime;
	}

	public get timeBonusMultiplier(): number {
		return this.staticData.timeBonusMultiplier;
	}

	public get gameAreaPolygon(): Polygon {
		return this.staticData.gameAreaPolygon;
	}

	public get players() {
		return this.staticData.players;
	}

	private getTeamForUser(userId: number): "hiders" | "seekers" | null {
		if (this.staticData.players.hiders.includes(userId)) return "hiders";
		if (this.staticData.players.seekers.includes(userId)) return "seekers";
		return null;
	}

	public get questions() {
		return this.staticData.questions;
	}

	public get cards() {
		return this.staticData.cards;
	}

	public get state() {
		return this.dynamicData.state;
	}

	public async setState(state: Exclude<Game["state"], "planned">) {
		await this.dynamicData.setState(state);
	}

	public get duration() {
		return this.dynamicData.duration;
	}

	public get fullDuration() {
		return this.dynamicData.fullDuration;
	}

	public getSyncedFullDuration(now?: number) {
		return this.dynamicData.getSyncedFullDuration(now);
	}

	public get durationTillLastStartedAt() {
		return this.dynamicData.durationTillLastStartedAt;
	}

	public set durationTillLastStartedAt(duration: number) {
		this.dynamicData.durationTillLastStartedAt = duration;
	}

	public get lastStartedAt(): number | null {
		return this.dynamicData.lastStartedAt;
	}

	public set lastStartedAt(date: number) {
		this.dynamicData.lastStartedAt = date;
	}

	public getJoinInfoForUser(userId: number) {
		return {
			team: this.getTeamForUser(userId)!,
			isHidersLeader: this.staticData.players.hidersTeamLeader === userId,
		};
	}
}
