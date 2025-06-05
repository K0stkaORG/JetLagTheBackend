import { Card, Polygon, Question } from ".";

// Aka. Olomouc, Brno, ...
export type Dataset = {
	id: number;
	name: string;
	description: string;
	ownerId: number; // Stretch goal
	data: {
		gameAreaPolygon: Polygon;
		// Idk what else to put here
		questions: Question[];
		cards: {
			card: Card;
			amount: number;
		}[];
	};
	deprecated: boolean;
};
