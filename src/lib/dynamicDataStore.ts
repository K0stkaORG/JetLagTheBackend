import { ActiveEffects, db } from "~/db";

import { Game } from "~/types";
import { eq } from "drizzle-orm";

export class DynamicDataStore {
	public static async get(gameId: Game["id"]) {
		const activeEffects = await db.query.ActiveEffects.findMany({
			where: eq(ActiveEffects.gameId, gameId),
		});

		return new DynamicDataStore();
	}

	private constructor() {}
}
