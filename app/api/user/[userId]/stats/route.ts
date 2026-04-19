import { NextRequest, NextResponse } from 'next/server';
import { getDbClient, ensureDbSchema } from '@/lib/db/client';

export interface UserStats {
    totalGames: number;
    averageKpm: number;
    averageCorrectRate: number;
    highestKpm: number;
    totalCorrectCount: number;
    totalErrorCount: number;
    totalInputCount: number;
    difficultyStats: {
        difficulty: string;
        games: number;
        averageKpm: number;
        averageCorrectRate: number;
        highestKpm: number;
    }[];
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> },
) {
    try {
        const userId = (await params).userId;

        if (!userId) {
            return NextResponse.json(
                { error: 'userIdが必須です' },
                { status: 400 },
            );
        }

        await ensureDbSchema();
        const db = getDbClient();

        // ユーザーのゲーム結果を取得
        const results = await db.execute({
            sql: `
                SELECT
                    COUNT(*) as total_games,
                    AVG(kpm) as avg_kpm,
                    MAX(kpm) as highest_kpm,
                    SUM(correct_count) as total_correct,
                    SUM(error_count) as total_errors,
                    SUM(total_input_count) as total_inputs
                FROM game_results
                WHERE player_id = ?
            `,
            args: [userId],
        });

        const result = results.rows[0];
        const totalGames = Number(result?.total_games ?? 0);

        // ゲームがない場合
        if (totalGames === 0) {
            return NextResponse.json(
                {
                    totalGames: 0,
                    averageKpm: 0,
                    averageCorrectRate: 0,
                    highestKpm: 0,
                    totalCorrectCount: 0,
                    totalErrorCount: 0,
                    totalInputCount: 0,
                    difficultyStats: [],
                },
                { status: 200 },
            );
        }

        // 正答率を正しく計算
        const totalCorrect = Number(result?.total_correct ?? 0);
        const totalErrors = Number(result?.total_errors ?? 0);
        const avgCorrectRate = totalCorrect > 0 || totalErrors > 0
            ? totalCorrect / (totalCorrect + totalErrors)
            : 0;

        // 難易度別の統計を取得
        const difficultyResults = await db.execute({
            sql: `
                SELECT
                    difficulty,
                    COUNT(*) as games,
                    AVG(kpm) as avg_kpm,
                    MAX(kpm) as highest_kpm,
                    SUM(correct_count) as correct,
                    SUM(error_count) as errors
                FROM game_results
                WHERE player_id = ?
                GROUP BY difficulty
                ORDER BY difficulty
            `,
            args: [userId],
        });

        const stats: UserStats = {
            totalGames,
            averageKpm: Number(Number(result?.avg_kpm ?? 0).toFixed(2)),
            averageCorrectRate: Number(avgCorrectRate.toFixed(4)),
            highestKpm: Number(result?.highest_kpm ?? 0),
            totalCorrectCount: totalCorrect,
            totalErrorCount: totalErrors,
            totalInputCount: Number(result?.total_inputs ?? 0),
            difficultyStats: difficultyResults.rows.map((row) => {
                const correct = Number(row.correct ?? 0);
                const errors = Number(row.errors ?? 0);
                const correctRate = correct > 0 || errors > 0
                    ? correct / (correct + errors)
                    : 0;
                return {
                    difficulty: row.difficulty as string,
                    games: Number(row.games),
                    averageKpm: Number(Number(row.avg_kpm ?? 0).toFixed(2)),
                    averageCorrectRate: Number(correctRate.toFixed(4)),
                    highestKpm: Number(row.highest_kpm ?? 0),
                };
            }),
        };

        return NextResponse.json(stats, { status: 200 });
    } catch (error) {
        console.error('[api/user/[userId]/stats]', error);
        return NextResponse.json(
            { error: 'エラーが発生しました' },
            { status: 500 },
        );
    }
}
