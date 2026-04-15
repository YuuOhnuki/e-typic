'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TypingDisplay } from '@/components/TypingDisplay';
import { ProgressBar } from '@/components/ProgressBar';
import { ResultCard } from '@/components/ResultCard';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';
import { GameResult, Question } from '@/types/typing';
import questionsData from '@/data/questions.json';

/**
 * シングルプレイ画面コンポーネント
 */
export const SinglePlayScreen: React.FC<{ onBackToHome?: () => void }> = ({ onBackToHome }) => {
    // ゲーム状態
    const { isPlaying, isPaused, difficulty, gameDurationMinutes, currentSession, startGame, endGame, resetGame } =
        useGameStore();

    const [showResult, setShowResult] = useState(false);
    const [gameResult, setGameResult] = useState<GameResult | null>(null);
    const [timeLimit, setTimeLimit] = useState(60);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [gameStartedAt, setGameStartedAt] = useState<number | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [correctCount, setCorrectCount] = useState(0);
    const [totalInputCount, setTotalInputCount] = useState(0);
    const [errorCount, setErrorCount] = useState(0);
    const [currentQuestionProgress, setCurrentQuestionProgress] = useState(0);
    const [completedQuestionCount, setCompletedQuestionCount] = useState(0);

    const accentColor = 'emerald';
    const difficultyLabelMap: Record<string, string> = {
        easy: '初級',
        medium: '中級',
        hard: '上級',
    };

    /**
     * ランダムな問題を取得
     */
    const getRandomQuestion = useCallback((diff: string): Question => {
        const questions = (questionsData as unknown as { questions: Record<string, Question[]> }).questions[diff] || [];
        if (questions.length === 0) {
            return {
                id: 'default',
                difficulty: 'easy',
                japanese: 'テスト',
                romaji: 'tesuto',
            };
        }
        return questions[Math.floor(Math.random() * questions.length)];
    }, []);

    /**
     * ゲーム開始処理
     */
    const handleStartGame = useCallback(() => {
        setTimeLimit(gameDurationMinutes * 60);
        setElapsedTime(0);
        setGameStartedAt(Date.now());

        const question = getRandomQuestion(difficulty);
        setCurrentQuestion(question);
        setCorrectCount(0);
        setTotalInputCount(0);
        setErrorCount(0);
        setCurrentQuestionProgress(0);
        setCompletedQuestionCount(0);
        setShowResult(false);

        startGame(difficulty, question);
    }, [difficulty, gameDurationMinutes, getRandomQuestion, startGame]);

    /**
     * タイピング完了処理（次の問題へ）
     */
    const handleTypingComplete = useCallback(() => {
        if (!isPlaying) return;
        const nextQuestion = getRandomQuestion(difficulty);
        setCompletedQuestionCount((prev) => prev + 1);
        setCurrentQuestionProgress(0);
        setCurrentQuestion(nextQuestion);
    }, [difficulty, getRandomQuestion, isPlaying]);

    const handleGameFinish = useCallback(() => {
        if (!currentQuestion) return;

        const totalTime = elapsedTime * 1000;
        const kpm = totalInputCount / (totalTime / 60000) || 0;
        const totalAttemptCount = totalInputCount + errorCount;

        const result: GameResult = {
            sessionId: currentSession?.sessionId || `session-${Date.now()}`,
            playerId: currentSession?.playerId || 'player',
            playerName: 'You',
            difficulty,
            totalTime,
            correctCount,
            errorCount,
            totalInputCount,
            correctRate: totalAttemptCount > 0 ? (correctCount / totalAttemptCount) * 100 : 0,
            errorRate: totalAttemptCount > 0 ? (errorCount / totalAttemptCount) * 100 : 0,
            kpm,
        };

        setGameResult(result);
        setShowResult(true);
        endGame(result);
    }, [correctCount, currentQuestion, currentSession, difficulty, elapsedTime, endGame, errorCount, totalInputCount]);

    /**
     * タイムアップ処理
     */
    const handleTimeUp = useCallback(() => {
        if (isPlaying) {
            handleGameFinish();
        }
    }, [isPlaying, handleGameFinish]);

    /**
     * 進捗更新
     */
    const handleProgress = useCallback(
        (state: { correctIndices: number[]; currentIndex: number }) => {
            const delta = state.currentIndex - currentQuestionProgress;
            if (delta <= 0) return;
            setCurrentQuestionProgress(state.currentIndex);
            setCorrectCount((prev) => prev + delta);
            setTotalInputCount((prev) => prev + delta);
        },
        [currentQuestionProgress],
    );

    const handleError = useCallback(() => {
        setErrorCount((prev) => prev + 1);
    }, []);

    /**
     * リスタート処理
     */
    const handleRestart = useCallback(() => {
        resetGame();
        handleStartGame();
    }, [resetGame, handleStartGame]);

    /**
     * メニューに戻る
     */
    const handleBackToMenu = useCallback(() => {
        resetGame();
        setShowResult(false);
        setGameResult(null);
        setCurrentQuestion(null);
        onBackToHome?.();
    }, [resetGame, onBackToHome]);

    /**
     * 経過時間更新
     */
    useEffect(() => {
        if (!isPlaying || isPaused || showResult || gameStartedAt === null) return;

        const interval = setInterval(() => {
            const nextElapsed = Math.min(Math.floor((Date.now() - gameStartedAt) / 1000), timeLimit);
            setElapsedTime(nextElapsed);
            if (nextElapsed >= timeLimit) {
                clearInterval(interval);
                setTimeout(() => {
                    handleTimeUp();
                }, 0);
            }
        }, 200);

        return () => clearInterval(interval);
    }, [isPlaying, isPaused, showResult, gameStartedAt, timeLimit, handleTimeUp]);

    // 状態の初期化は useState の初期値で行い、ゲーム開始はボタンクリック時に実行
    useEffect(() => {
        // 現在のセッションが存在しない場合のリセット処理
        if (!isPlaying && gameResult === null) {
            // 初期化処理（必要に応じて）
        }
    }, [isPlaying, gameResult]);

    if (showResult && gameResult) {
        return (
            <ResultCard
                result={gameResult}
                accentColor={accentColor}
                onRestart={handleRestart}
                onBackToMenu={handleBackToMenu}
            />
        );
    }

    if (!isPlaying || !currentQuestion) {
        return (
            <div className="w-full h-screen flex flex-col items-center justify-center gap-6">
                <div className="w-full max-w-md rounded-xl border border-gray-200 bg-gray-50 px-6 py-5 text-center space-y-2">
                    <div className="text-sm text-gray-500 tracking-wide">ゲーム設定</div>
                    <div className="text-lg text-gray-800">
                        難易度: <span className="font-semibold">{difficultyLabelMap[difficulty] ?? difficulty}</span>
                    </div>
                    <div className="text-lg text-gray-800">
                        制限時間: <span className="font-semibold">{gameDurationMinutes}分</span>
                    </div>
                </div>
                <div className="block space-y-4">
                    <Button
                        onClick={handleStartGame}
                        className="w-full rounded-xl font-semibold bg-gray-900 hover:bg-gray-800 text-white"
                        size="lg"
                    >
                        ゲーム開始
                    </Button>
                    <Button
                        onClick={handleBackToMenu}
                        variant="ghost"
                        className="w-full text-gray-600 rounded-xl"
                        size="lg"
                    >
                        戻る
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-screen bg-white flex flex-col">
            <div className="flex-shrink-0 p-4 md:p-6 border-b border-gray-200">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-light">タイピング練習</h1>
                        <div className="text-sm text-gray-500">
                            難易度: {difficultyLabelMap[difficulty] ?? difficulty} / 制限時間: {gameDurationMinutes}分
                        </div>
                    </div>
                    <Button onClick={handleBackToMenu} variant="outline" className="rounded-xl" size="sm">
                        戻る
                    </Button>
                </div>
            </div>

            <div className="flex-shrink-0 p-4 md:p-6">
                <div className="max-w-3xl mx-auto">
                    <ProgressBar timeLimit={timeLimit} elapsedSeconds={elapsedTime} />
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 md:p-6">
                <div className="w-full max-w-4xl">
                    <TypingDisplay
                        key={`${currentQuestion.id}-${completedQuestionCount}`}
                        japanese={currentQuestion.japanese}
                        romaji={currentQuestion.romaji}
                        alternatives={currentQuestion.alternatives}
                        accentColor={`${accentColor}-500`}
                        onProgress={handleProgress}
                        onComplete={handleTypingComplete}
                        onError={handleError}
                    />
                </div>
            </div>

            <div className="flex-shrink-0 p-4 md:p-6 border-t border-gray-200">
                <div className="max-w-3xl mx-auto">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="space-y-1">
                            <div className="text-sm text-gray-500">正解数</div>
                            <div className={`text-xl font-bold text-${accentColor}-500`}>{correctCount}</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm text-gray-500">正タイプ数</div>
                            <div className="text-xl font-bold text-gray-700">{totalInputCount}</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm text-gray-500">誤タイプ数</div>
                            <div className="text-xl font-bold text-red-500">{errorCount}</div>
                        </div>
                    </div>
                    <div className="text-center text-sm text-gray-400 mt-4">キーボードでタイピング</div>
                </div>
            </div>
        </div>
    );
};
