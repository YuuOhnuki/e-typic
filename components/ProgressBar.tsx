'use client';

import React, { useState, useEffect } from 'react';

interface ProgressBarProps {
  timeLimit: number; // 秒単位
  isRunning: boolean; // タイマーが実行中か
  accentColor?: string; // アクセントカラー
  onTimeUp?: () => void; // 時間切れコールバック
}

/**
 * 制限時間を視覚化するプログレスバーコンポーネント
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  timeLimit,
  isRunning,
  accentColor = 'emerald-500',
  onTimeUp,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimeUp, setIsTimeUp] = useState<boolean>(false);

  /**
   * タイマー管理
   */
  useEffect(() => {
    if (!isRunning || isTimeUp) return;

    const interval = setInterval(() => {
      setElapsedSeconds(prev => {
        const newTime = prev + 1;
        if (newTime >= timeLimit) {
          setIsTimeUp(true);
          onTimeUp?.();
          return timeLimit;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLimit, isTimeUp, onTimeUp]);

  /**
   * リセット機能
   */
  const reset = React.useCallback(() => {
    setElapsedSeconds(0);
    setIsTimeUp(false);
  }, []);

  const remainingSeconds = Math.max(0, timeLimit - elapsedSeconds);
  const progress = (elapsedSeconds / timeLimit) * 100;
  const isWarning = remainingSeconds < 10;

  // レセット用リファレンスを公開（親から呼び出し可能にする）
  React.useImperativeHandle(React.useRef(reset), () => reset, [reset]);

  return (
    <div className="w-full space-y-2">
      {/* タイマー表示 */}
      <div className="flex justify-between items-center">
        <div className="text-sm font-medium text-gray-600">残り時間</div>
        <div
          className={`text-lg font-mono font-bold tabular-nums ${
            isWarning ? 'text-red-500' : 'text-gray-700'
          }`}
        >
          {String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:
          {String(remainingSeconds % 60).padStart(2, '0')}
        </div>
      </div>

      {/* プログレスバー */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`${isWarning ? 'bg-red-500' : `bg-${accentColor}`} h-full transition-all duration-300 ease-linear`}
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      {/* タイムアップ警告 */}
      {isTimeUp && (
        <div className="text-center mt-4">
          <div className="text-2xl font-light text-red-500">時間切れ</div>
        </div>
      )}
    </div>
  );
};
