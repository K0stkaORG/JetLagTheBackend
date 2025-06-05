import { Card, Coordinates, Game, GameEvent, Question, User } from ".";

type SyncFrameBase = {
	id: number;
	gameId: Game["id"];
	timestamp: Date;
	type: "position" | "game_event" | "question_asked" | "question_answered" | "card_played" | "cards_drawn" | "cards_picked";
	data: any;
};

export type SeekersPositionSyncFrame = SyncFrameBase & {
	type: "position";
	data: {
		userId: User["id"];
		position: Coordinates;
	};
};

export type GameEventsSyncFrame = SyncFrameBase & {
	type: "game_event";
	data: {
		eventId: GameEvent["id"];
	};
};

export type QuestionAskedSyncFrame = SyncFrameBase & {
	type: "question_asked";
	data: {
		questionId: Question["id"];
	};
};

export type QuestionAnsweredSyncFrame = SyncFrameBase & {
	type: "question_answered";
	data: {
		yesNo: boolean | null;
		imageUrl: string | null;
		unable: true | null;
	};
};

export type CardPlayedSyncFrame = SyncFrameBase & {
	type: "card_played";
	data: {
		cardId: Card["id"];
	};
};

export type CardsDrawnSyncFrame = SyncFrameBase & {
	type: "cards_drawn";
	data: {
		cards: Card["id"][];
		keep: number;
	};
};

export type CardsPickedSyncFrame = SyncFrameBase & {
	type: "cards_picked";
	data: {
		cards: Card["id"][];
	};
};

export type SyncFrame = SeekersPositionSyncFrame | GameEventsSyncFrame | QuestionAskedSyncFrame | QuestionAnsweredSyncFrame | CardPlayedSyncFrame | CardsDrawnSyncFrame | CardsPickedSyncFrame;
