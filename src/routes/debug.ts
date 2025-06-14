import { ActiveEffects, CardsInHand, Datasets, Events, Games, Positions, RemainingCards, Users, db } from "~/db";
import { Success, UserError, handler } from "~/lib/apiRouteHandler";

import { Orchestrator } from "~/lib/orchestrator";
import { Router } from "express";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

export const debugHandler = (ORCHESTRATOR: Orchestrator) => {
	const debugRouter = Router();

	debugRouter.post(
		"/reset-database",
		handler(async () => {
			await db.delete(Events);
			await db.delete(CardsInHand);
			await db.delete(ActiveEffects);
			await db.delete(RemainingCards);
			await db.delete(Positions);
			await db.delete(Games);
			await db.delete(Datasets);

			const devAccountId =
				(
					await db.query.Users.findFirst({
						where: eq(Users.nickname, "dev"),
					})
				)?.id ??
				(await db
					.insert(Users)
					.values({ nickname: "dev", passwordHash: await bcrypt.hash("Dev12345", 10) })
					.returning()
					.then((res) => res[0].id))!;

			const datasetId = await db
				.insert(Datasets)
				.values({
					ownerId: devAccountId,
					name: "Default Dataset",
					description: "Default dataset for development purposes.",
					gameAreaPolygon: [],
					hidingTime: 5,
					timeBonusMultiplier: 1,
					cards: [],
					questions: [],
				})
				.returning()
				.then((res) => res[0].id);

			const gameId = await db
				.insert(Games)
				.values([
					{
						datasetId,
						hidersTeamLeader: devAccountId,
						startsAt: new Date(Math.floor(Date.now() / 60000) * 60000 + 1000 * 60 * 5), // 5 minutes from now aligned to start on whole minute
						hiders: [devAccountId],
					},
				])
				.returning()
				.then((res) => res[0].id);

			await ORCHESTRATOR.restart();

			return Success({});
		})
	);

	debugRouter.post(
		"/restart-orchestrator",
		handler(async () => {
			await ORCHESTRATOR.restart();
			return Success({});
		})
	);

	debugRouter.get(
		"/games",
		handler(() =>
			Success({
				loadedGameServerIds: ORCHESTRATOR.loadedServerIds,
			})
		)
	);

	debugRouter.get(
		"/game/:id",
		handler(async ({ params }) => {
			const gameId = params.id === "first" ? ORCHESTRATOR.loadedServerIds[0] : Number(params.id);
			const server = ORCHESTRATOR.getServerById(gameId);

			if (!server) return UserError(`Game server for game with ID ${gameId} not found.`);

			return Success(server.debug);
		})
	);

	return debugRouter;
};
