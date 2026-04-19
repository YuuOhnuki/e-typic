import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Difficulty } from '@/types/typing';
import { getDifficultyLeaderboard, saveGameResult, type ResultMode, type SaveGameResultInput } from '@/lib/db/results-repository';
import { getDbClient, ensureDbSchema } from '@/lib/db/client';
import { calculateLevel } from '@/lib/level-calculator';

export const runtime = 'nodejs';

type SaveResultRequestBody = SaveGameResultInput;

const isDifficulty = (value: string): value is Difficulty => {
    return value === 'easy' || value === 'medium' || value === 'hard' || value === 'survival';
};

const isMode = (value: string): value is ResultMode => {
    return value === 'single' || value === 'multi';
};

export async function GET(request: NextRequest) {
    try {
        const difficultyQuery = request.nextUrl.searchParams.get('difficulty') ?? 'easy';
        const limitQuery = Number(request.nextUrl.searchParams.get('limit') ?? 10);

        if (!isDifficulty(difficultyQuery)) {
            return NextResponse.json({ ok: false, message: 'difficulty is invalid' }, { status: 400 });
        }

        const leaderboard = await getDifficultyLeaderboard(difficultyQuery, limitQuery);

        return NextResponse.json({
            ok: true,
            difficulty: difficultyQuery,
            leaderboard,
        });
    } catch (error) {
        console.error('[api/results][GET]', error);
        return NextResponse.json({ ok: false, message: 'failed to fetch leaderboard' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as SaveResultRequestBody;

        if (!body || !isDifficulty(body.difficulty) || !isMode(body.mode)) {
            return NextResponse.json({ ok: false, message: 'invalid payload' }, { status: 400 });
        }

        // ログイン状態かどうかを確認
        const session = await getServerSession(authOptions);
        let previousLevel = 1;
        let currentLevel = 1;
        let leveledUp = false;

        if (session?.user?.id) {
            // ログイン状態の場合、playerId をユーザーIDに上書き
            body.playerId = session.user.id;

            // 前のレベルを取得
            try {
                await ensureDbSchema();
                const db = getDbClient();

                const userBefore = await db.execute({
                    sql: `SELECT lv FROM users WHERE id = ?`,
                    args: [session.user.id],
                });
                previousLevel = Number(userBefore.rows[0]?.lv ?? 1);
            } catch (err) {
                console.error('[api/results][POST] Failed to get previous level:', err);
            }
        }

        const saved = await saveGameResult(body);

        // ログイン状態の場合、レベルを計算して更新
        if (session?.user?.id) {
            try {
                await ensureDbSchema();
                const db = getDbClient();

                // ユーザーの全ゲーム統計を取得
                const stats = await db.execute({
                    sql: `
                        SELECT
                            COUNT(*) as total_games,
                            AVG(kpm) as avg_kpm,
                            AVG(correct_rate) as avg_correct_rate,
                            SUM(correct_count) as total_correct,
                            SUM(error_count) as total_errors
                        FROM game_results
                        WHERE player_id = ?
                    `,
                    args: [session.user.id],
                });

                const stat = stats.rows[0];
                const totalGames = Number(stat?.total_games ?? 0);
                const averageKpm = Number(stat?.avg_kpm ?? 0);
                const totalCorrect = Number(stat?.total_correct ?? 0);
                const totalErrors = Number(stat?.total_errors ?? 0);
                const averageCorrectRate =
                    totalCorrect + totalErrors > 0
                        ? totalCorrect / (totalCorrect + totalErrors)
                        : 0;

                // レベルを計算
                const levelInfo = calculateLevel(
                    totalGames,
                    averageKpm,
                    averageCorrectRate,
                );

                currentLevel = levelInfo.currentLevel;
                leveledUp = currentLevel > previousLevel;

                // ユーザーのレベルを更新
                await db.execute({
                    sql: `
                        UPDATE users
                        SET lv = ?
                        WHERE id = ?
                    `,
                    args: [levelInfo.currentLevel, session.user.id],
                });
            } catch (levelError) {
                console.error('[api/results][POST] Level update error:', levelError);
                // レベル更新エラーは結果保存の成功を妨げない
            }
        }

        const leaderboard = await getDifficultyLeaderboard(body.difficulty, 10);

        return NextResponse.json({
            ok: true,
            dbRank: saved.dbRank,
            leaderboard,
            levelInfo: {
                previousLevel,
                currentLevel,
                leveledUp,
            },
        });
    } catch (error) {
        console.error('[api/results][POST]', error);
        return NextResponse.json({ ok: false, message: 'failed to save result' }, { status: 500 });
    }
}
