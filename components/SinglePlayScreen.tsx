'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TypingDisplay } from '@/components/TypingDisplay';
import { ProgressBar } from '@/components/ProgressBar';
import { ResultCard } from '@/components/ResultCard';
import { useGameStore } from '@/store/gameStore';
import { GameResult, Question } from '@/types/typing';
import questionsData from '@/data/questions.json';

/**
 * シングルプレイ画面コンポーネント
 */
export const SinglePlayScreen: React.FC = () => {
  // ゲーム状態
  const { isPlaying, isPaused, difficulty, currentSession, startGame, endGame, resetGame } =
    useGameStore();

  const [showResult, setShowResult] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [timeLimit, setTimeLimit] = useState(60);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalInputCount, setTotalInputCount] = useState(0);

  const accentColor = 'emerald';

  /**
   * 難易度設定の取得
   */
  const getDifficultyConfig = useCallback(
    (diff: string): { timeLimit: number; description: string } => {
      const configs: Record<
        string,
        { timeLimit: number; description: string }
      > = {
        easy: { timeLimit: 60, description: '初級（単語）' },
        medium: { timeLimit: 90, description: '中級（文）' },
        hard: { timeLimit: 120, description: '上級（長文）' },
      };
      return configs[diff] || configs.easy;
    },
    []
  );

  /**
   * ランダムな問題を取得
   */
  const getRandomQuestion = useCallback(
    (diff: string): Question => {
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
    },
    []
  );

  /**
   * ゲーム開始処理
   */
  const handleStartGame = useCallback(() => {
    const config = getDifficultyConfig(difficulty);
    setTimeLimit(config.timeLimit);
    setElapsedTime(0);

    const question = getRandomQuestion(difficulty);
    setCurrentQuestion(question);
    setCorrectCount(0);
    setTotalInputCount(0);
    setShowResult(false);

    startGame(difficulty, question);
  }, [difficulty, getDifficultyConfig, getRandomQuestion, startGame]);

  /**
   * タイピング完了処理
   */
  const handleTypingComplete = useCallback(() => {
    if (!currentQuestion) return;

    const totalTime = elapsedTime * 1000;
    const kpm = (totalInputCount / (totalTime / 60000)) || 0;

    const result: GameResult = {
      sessionId: currentSession?.sessionId || `session-${Date.now()}`,
      playerId: currentSession?.playerId || 'player',
      playerName: 'You',
      difficulty,
      totalTime,
      correctCount,
      errorCount: totalInputCount - correctCount,
      totalInputCount,
      correctRate: totalInputCount > 0 ? (correctCount / totalInputCount) * 100 : 0,
      errorRate: totalInputCount > 0 ? ((totalInputCount - correctCount) / totalInputCount) * 100 : 0,
      kpm,
    };

    setGameResult(result);
    setShowResult(true);
    endGame(result);
  }, [
    currentQuestion,
    elapsedTime,
    totalInputCount,
    correctCount,
    currentSession,
    difficulty,
    endGame,
  ]);

  /**
   * タイムアップ処理
   */
  const handleTimeUp = useCallback(() => {
    if (isPlaying) {
      handleTypingComplete();
    }
  }, [isPlaying, handleTypingComplete]);

  /**
   * 進捗更新
   */
  const handleProgress = useCallback(
    (state: { correctIndices: number[]; currentIndex: number }) => {
      setCorrectCount(state.correctIndices.length);
      setTotalInputCount(state.currentIndex);
    },
    []
  );

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
  }, [resetGame]);

  /**
   * 経過時間更新
   */
  useEffect(() => {
    if (!isPlaying || isPaused || showResult) return;

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, isPaused, showResult]);

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
        accentColor={`${accentColor}-500`}
        onRestart={handleRestart}
        onBackToMenu={handleBackToMenu}
      />
    );
  }

  if (!isPlaying || !currentQuestion) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center">
        <button
          onClick={handleStartGame}
          className={`px-8 py-4 rounded-lg font-semibold text-white bg-${accentColor}-500 hover:opacity-90 transition-opacity text-lg`}
        >
          ゲーム開始
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* ヘッダー */}
        <div className="border-b border-gray-200 pb-6 space-y-2">
          <h1 className="text-3xl md:text-4xl font-light text-center">タイピング練習</h1>
          <div className="text-center text-gray-500">難易度: {difficulty}</div>
        </div>

        {/* タイマー */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <ProgressBar
            timeLimit={timeLimit}
            isRunning={isPlaying && !isPaused}
            accentColor={`${accentColor}-500`}
            onTimeUp={handleTimeUp}
          />
        </div>

        {/* メインゲーム画面 */}
        <div className="bg-gray-50 p-8 rounded-lg">
          <TypingDisplay
            japanese={currentQuestion.japanese}
            accentColor={`${accentColor}-500`}
            onProgress={handleProgress}
            onComplete={handleTypingComplete}
          />
        </div>

        {/* 統計情報（下部） */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-sm text-gray-500">正解数</div>
            <div className={`text-2xl font-bold text-${accentColor}-500`}>{correctCount}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-gray-500">入力数</div>
            <div className="text-2xl font-bold text-gray-700">{totalInputCount}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-gray-500">経過時間</div>
            <div className="text-2xl font-bold text-gray-700">{elapsedTime}秒</div>
          </div>
        </div>

        {/* キーボードフォーカスヒント */}
        <div className="text-center text-sm text-gray-400 py-4">
          キーボードでタイピング開始（自動フォーカス）
        </div>
      </div>
    </div>
  );
};
