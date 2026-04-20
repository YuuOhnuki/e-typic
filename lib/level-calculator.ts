/**
 * レベル計算ロジック
 * ユーザーの統計情報からレベルを計算します
 */

export interface LevelInfo {
    currentLevel: number;
    totalExperience: number;
    experienceToNextLevel: number;
}

export interface LevelUpInfo {
    previousLevel: number;
    currentLevel: number;
    leveledUp: boolean;
}

/**
 * ユーザーの統計情報からレベルを計算
 * @param totalGames ゲーム総数
 * @param averageKpm 平均KPM
 * @param averageCorrectRate 平均正答率 (0-1)
 * @returns レベル情報
 */
export function calculateLevel(
    totalGames: number,
    averageKpm: number,
    averageCorrectRate: number,
): LevelInfo {
    let experience = 0;

    // ゲーム数に基づく経験値
    // 基本: 1ゲーム = 10 exp
    experience += totalGames * 10;

    // 平均KPMに基づくボーナス経験値
    // 基準: 80 KPM = 標準、100+ で高評価
    if (averageKpm >= 100) {
        experience += Math.floor((averageKpm - 80) * 5);
    } else if (averageKpm >= 80) {
        experience += Math.floor((averageKpm - 80) * 3);
    }

    // 正答率に基づくボーナス経験値
    // 基準: 95% = 標準、98%+ で高評価
    if (averageCorrectRate >= 0.98) {
        experience += Math.floor((averageCorrectRate - 0.95) * 500);
    } else if (averageCorrectRate >= 0.95) {
        experience += Math.floor((averageCorrectRate - 0.95) * 300);
    }

    // レベルを計算 (1レベル = 100 exp)
    const currentLevel = Math.max(1, 1 + Math.floor(experience / 100));
    const experienceInThisLevel = experience % 100;
    const experienceToNextLevel = 100 - experienceInThisLevel;

    return {
        currentLevel,
        totalExperience: experience,
        experienceToNextLevel,
    };
}

/**
 * レベルアップを検出
 * @param previousStats 前回の統計
 * @param currentStats 現在の統計
 * @returns レベルアップ情報
 */
export function detectLevelUp(
    previousStats: {
        totalGames: number;
        averageKpm: number;
        averageCorrectRate: number;
    },
    currentStats: {
        totalGames: number;
        averageKpm: number;
        averageCorrectRate: number;
    },
): LevelUpInfo {
    const previousLevel = calculateLevel(
        previousStats.totalGames,
        previousStats.averageKpm,
        previousStats.averageCorrectRate,
    ).currentLevel;

    const currentLevel = calculateLevel(
        currentStats.totalGames,
        currentStats.averageKpm,
        currentStats.averageCorrectRate,
    ).currentLevel;

    return {
        previousLevel,
        currentLevel,
        leveledUp: currentLevel > previousLevel,
    };
}

/**
 * ゲーム結果から新しいレベルを計算（1試合後）
 * @param previousStats 前回の統計
 * @param newGameKpm 新しいゲームのKPM
 * @param newGameCorrectRate 新しいゲームの正答率
 * @returns レベルアップ情報
 */
export function calculateLevelAfterGame(
    previousStats: {
        totalGames: number;
        averageKpm: number;
        averageCorrectRate: number;
        totalCorrectCount: number;
        totalErrorCount: number;
    },
    newGameKpm: number,
    newGameCorrectRate: number,
    newGameCorrectCount: number,
    newGameErrorCount: number,
): LevelUpInfo {
    // 前のレベルを計算
    const previousLevel = calculateLevel(
        previousStats.totalGames,
        previousStats.averageKpm,
        previousStats.averageCorrectRate,
    ).currentLevel;

    // 新しい統計を計算
    const totalGames = previousStats.totalGames + 1;
    const totalCorrectCount = previousStats.totalCorrectCount + newGameCorrectCount;
    const totalErrorCount = previousStats.totalErrorCount + newGameErrorCount;

    // 新しい平均を計算
    const newAverageKpm =
        (previousStats.averageKpm * previousStats.totalGames + newGameKpm) /
        totalGames;
    const newAverageCorrectRate =
        totalCorrectCount / (totalCorrectCount + totalErrorCount);

    // 新しいレベルを計算
    const newLevelInfo = calculateLevel(
        totalGames,
        newAverageKpm,
        newAverageCorrectRate,
    );

    return {
        previousLevel,
        currentLevel: newLevelInfo.currentLevel,
        leveledUp: newLevelInfo.currentLevel > previousLevel,
    };
}
