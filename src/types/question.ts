// TODO:Není domyšlené

export type Question = {
	id: number;
	text: string;
	type: QuestionType;
	price: QuestionPrice;
};

export type QuestionType = "radar" | "thermometer" | "photo" | "matching";

export type QuestionPrice = {
	draw: number;
	keep: number;
};
