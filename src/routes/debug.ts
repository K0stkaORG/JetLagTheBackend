import { Success, UserError, handler } from "~/lib/apiRouteHandler";

import { Orchestrator } from "~/lib/orchestrator";
import { Router } from "express";

export const debugHandler = (ORCHESTRATOR: Orchestrator) => {
	const debugRouter = Router();

	debugRouter.get(
		"/games",
		handler(() =>
			Success({
				loadedGameServerIds: ORCHESTRATOR.debug.serverIds,
			})
		)
	);

	debugRouter.get(
		"/game/:id",
		handler(async ({ params }) => {
			const gameId = Number(params.id);
			const server = ORCHESTRATOR.debug.servers.get(gameId);

			if (!server) return UserError(`Game server for game with ID ${gameId} not found.`);

			return Success(server.debug);
		})
	);

	debugRouter.post(
		"/game/:id/pause",
		handler(async ({ params }) => {
			const gameId = Number(params.id);
			const server = ORCHESTRATOR.debug.servers.get(gameId);

			if (!server) return UserError(`Game server for game with ID ${gameId} not found.`);

			await server.pause();

			return Success({ message: `Game ${gameId} paused successfully.` });
		})
	);

	debugRouter.post(
		"/game/:id/resume",
		handler(async ({ params }) => {
			const gameId = Number(params.id);
			const server = ORCHESTRATOR.debug.servers.get(gameId);

			if (!server) return UserError(`Game server for game with ID ${gameId} not found.`);

			await server.resume();

			return Success({ message: `Game ${gameId} resumed successfully.` });
		})
	);

	return debugRouter;
};
