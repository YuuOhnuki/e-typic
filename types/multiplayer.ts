import { Difficulty, Question } from '@/types/typing';

export type RoomStatus = 'waiting' | 'playing' | 'finished';
export type TeamId = 'A' | 'B' | null;
export type TeamMode = 'free' | 'two-teams';
export type ScoreMode = 'correct-count' | 'correct-rate' | 'completed-questions' | 'kpm';

export interface MultiplayerPlayer {
    playerId: string;
    name: string;
    isReady: boolean;
    teamId: TeamId;
    currentCharIndex: number;
    correctCount: number;
    errorCount: number;
    totalInputCount: number;
    completedQuestionCount: number;
    correctRate: number;
    isCompleted: boolean;
    elapsedTime: number;
    finishedAt: number | null;
    dbRank?: number | null;
}

export interface MultiplayerRoomState {
    roomCode: string;
    roomName: string;
    hostPlayerId: string;
    difficulty: Difficulty;
    minutes: number;
    maxPlayers: number;
    isPublic: boolean;
    autoStart: boolean;
    teamMode: TeamMode;
    scoreMode: ScoreMode;
    status: RoomStatus;
    questionLength: number;
    startedAt: number | null;
    players: MultiplayerPlayer[];
}

export interface PublicRoomSummary {
    roomCode: string;
    roomName: string;
    hostName: string;
    difficulty: Difficulty;
    minutes: number;
    currentPlayers: number;
    maxPlayers: number;
    autoStart: boolean;
    teamMode: TeamMode;
}

export interface GameStartedPayload {
    question: Question;
    timeLimitSeconds: number;
    startedAt: number;
}
