'use client';

import React from 'react';
import { GameResult } from '@/types/typing';

interface ResultCardProps {
  result: GameResult;
  accentColor?: string;
  onRestart?: () => void;
  onBackToMenu?: () => void;
}

/**
 * ゲーム結果表示コンポーネント
 * 統計情報（KPM、正解率、誤字率等）を表示
 */
export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  accentColor = 'emerald-500',
  onRestart,
  onBackToMenu,
}) => {
  // 数値を見やすくフォーマット
  const formatNumber = (num: number, decimals: number = 2): string => {
    return Number(num.toFixed(decimals)).toString();
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white border border-gray-200 rounded-lg p-8 space-y-8">
        {/* ヘッダー */}
        <div className="text-center space-y-2 border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-light">結果</h1>
          <div className="text-sm text-gray-500">難易度: {result.difficulty}</div>
        </div>

        {/* 主要な統計情報 */}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {/* KPM */}
          <div className="space-y-1">
            <div className="text-sm text-gray-500 uppercase tracking-wide">KPM</div>
            <div className={`text-3xl font-light text-${accentColor}`}>
              {formatNumber(result.kpm, 1)}
            </div>
            <div className="text-xs text-gray-400">キー/分</div>
          </div>

          {/* 正解率 */}
          <div className="space-y-1">
            <div className="text-sm text-gray-500 uppercase tracking-wide">正解率</div>
            <div className={`text-3xl font-light text-${accentColor}`}>
              {formatNumber(result.correctRate)}%
            </div>
            <div className="text-xs text-gray-400">精度</div>
          </div>

          {/* 総入力数 */}
          <div className="space-y-1">
            <div className="text-sm text-gray-500 uppercase tracking-wide">入力数</div>
            <div className="text-3xl font-light text-gray-700">
              {result.totalInputCount}
            </div>
            <div className="text-xs text-gray-400">文字</div>
          </div>

          {/* 誤字数 */}
          <div className="space-y-1">
            <div className="text-sm text-gray-500 uppercase tracking-wide">誤字</div>
            <div className="text-3xl font-light text-red-500">{result.errorCount}</div>
            <div className="text-xs text-gray-400">個</div>
          </div>
        </div>

        {/* 詳細統計 */}
        <div className="space-y-4 border-t border-gray-200 pt-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">正解文字数</span>
              <span className="font-mono text-lg font-semibold text-gray-800">
                {result.correctCount}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">誤字率</span>
              <span className="font-mono text-lg font-semibold text-red-500">
                {formatNumber(result.errorRate)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">所要時間</span>
              <span className="font-mono text-lg font-semibold text-gray-800">
                {formatNumber(result.totalTime / 1000, 1)}秒
              </span>
            </div>
          </div>
        </div>

        {/* プレイヤー情報（マルチプレイの場合） */}
        {result.rank && (
          <div className="space-y-2 border-t border-gray-200 pt-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">プレイヤー</span>
              <span className="font-semibold text-gray-800">{result.playerName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">ランク</span>
              <span className={`font-bold text-lg text-${accentColor}`}>{result.rank}/n</span>
            </div>
          </div>
        )}

        {/* アクションボタン */}
        <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-6">
          <button
            onClick={onRestart}
            className={`py-3 px-4 rounded-lg font-medium text-white bg-${accentColor} hover:opacity-90 transition-opacity`}
          >
            もう一度プレイ
          </button>
          <button
            onClick={onBackToMenu}
            className="py-3 px-4 rounded-lg font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            メニューに戻る
          </button>
        </div>
      </div>
    </div>
  );
};
