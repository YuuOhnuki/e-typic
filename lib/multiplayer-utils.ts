/**
 * Multiplayer utilities - shared validation and normalization functions
 */

// Constants
export const MINUTES_MIN = 1;
export const MINUTES_MAX = 5;
export const ROOM_CODE_LENGTH = 3;
export const MAX_PLAYERS_MIN = 2;
export const MAX_PLAYERS_MAX = 20;

/**
 * ルームコード入力を 3 桁数字に正規化する。
 */
export const normalizeRoomCode = (value: string): string =>
    value.replace(/\D/g, '').slice(0, ROOM_CODE_LENGTH);

/**
 * ユーザー名をトリム・長さ制限して送信値を安定化する。
 */
export const normalizePlayerName = (value: string, fallback: string): string => {
    const normalized = value.trim().slice(0, 16);
    return normalized || fallback;
};

/**
 * 時間(分)を許可範囲に丸めて不正な UI 値混入を防ぐ。
 */
export const clampMinutes = (value: number): number =>
    Math.max(MINUTES_MIN, Math.min(MINUTES_MAX, Math.round(value)));

export const clampMaxPlayers = (value: number): number =>
    Math.max(MAX_PLAYERS_MIN, Math.min(MAX_PLAYERS_MAX, Math.round(value)));
