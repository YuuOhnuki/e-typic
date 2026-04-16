'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
    timeLimit: number;
    elapsedSeconds: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ timeLimit, elapsedSeconds }) => {
    const normalizedElapsed = Math.min(elapsedSeconds, timeLimit);
    const remainingSeconds = Math.max(0, timeLimit - normalizedElapsed);
    const progress = (normalizedElapsed / Math.max(timeLimit, 1)) * 100;
    const isWarning = remainingSeconds < 10;
    const isTimeUp = remainingSeconds === 0;

    return (
        <div className="w-full space-y-2">
            <div className="flex justify-between items-baseline">
                <div className="text-sm font-medium text-muted-foreground">残り時間</div>
                <div
                    className={`text-lg font-mono font-bold tabular-nums ${
                        isWarning ? 'text-red-500 animate-soft-pulse' : 'text-foreground'
                    }`}
                >
                    {String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:
                    {String(remainingSeconds % 60).padStart(2, '0')}
                </div>
            </div>

            <Progress value={progress} className={isWarning ? 'bg-red-500/15' : ''} />

            {isTimeUp && (
                <div className="text-center mt-4">
                    <div className="text-2xl font-light text-red-500">時間切れ</div>
                </div>
            )}
        </div>
    );
};
