import { Card, Polygon, Question } from ".";

// Aka. Olomouc, Brno, ...
export type Dataset = {
	id: number;
	name: string;
	description: string;
	ownerId: number;
	gameAreaPolygon: Polygon;
	questions: Question[];
	cards: {
		card: Card;
		amount: number;
	}[];
	deprecated: boolean;
};
