import { Success, UserError, handler } from "~/lib/apiRouteHandler";

import { Orchestrator } from "~/lib/orchestrator";
import { Router } from "express";

//TODO: Add authentication and authorization middleware to protect these routes

export const gameRouter = (ORCHESTRATOR: Orchestrator) => {
	const gameRouter = Router();

	gameRouter.post(
		"/:id/pause",
		handler(async ({ params }) => {
			const gameId = Number(params.id);
			const server = ORCHESTRATOR.debug.servers.get(gameId);

			if (!server) return UserError(`Server pro hru s ID ${gameId} nebyl nalezen.`);

			try {
				await server.pause();
			} catch (error) {
				return UserError(
					`Nepodařilo se pozastavit hru: ${error instanceof Error ? error.message : "Neznámá chyba"}`
				);
			}

			return Success({ message: `Hra ${gameId} byla úspěšně pozastavena.` });
		})
	);

	gameRouter.post(
		"/:id/resume",
		handler(async ({ params }) => {
			const gameId = Number(params.id);
			const server = ORCHESTRATOR.debug.servers.get(gameId);

			if (!server) return UserError(`Server pro hru s ID ${gameId} nebyl nalezen.`);

			try {
				await server.resume();
			} catch (error) {
				return UserError(
					`Nepodařilo se obnovit hru: ${error instanceof Error ? error.message : "Neznámá chyba"}`
				);
			}

			return Success({ message: `Hra ${gameId} byla úspěšně obnovena.` });
		})
	);

	return gameRouter;
};
