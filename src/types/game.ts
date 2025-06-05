import { Card, Coordinates, Dataset, User } from ".";

export type Game = {
	id: number;
	datasetId: Dataset["id"];
	hiders: User["id"][];
	hidersTeamLeader: User["id"];
	seekers: User["id"][];
	state: "planed" | "hiding_phase" | "main_phase" | "paused" | "finished";
	duration: number | null;
	hidingSpot: Coordinates | null;
	hand: Card["id"][];
};

export type GameEvent = {
	id: number;
	gameId: Game["id"];
	type: "hiding_started" | "main_phase_started" | "game_paused" | "game_resumed" | "game_finished";
	timestamp: Date;
};
