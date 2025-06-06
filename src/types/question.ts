// TODO:Není domyšlené

export type Question = {
	id: number;
	text: string;
	type: QuestionType;
	price_draw: number;
	price_keep: number;
};

export type QuestionType = "radar" | "thermometer" | "photo" | "matching";
