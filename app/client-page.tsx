'use client';

import React from 'react';
import { HomeScreen } from '@/components/HomeScreen';
import { SinglePlayScreen } from '@/components/SinglePlayScreen';
import { useGameStore } from '@/store/gameStore';
import { Difficulty } from '@/types/typing';

/**
 * ページルーティング管理（クライアント側）
 */
export const ClientPage: React.FC = () => {
    const { currentScreen, setScreen, setDifficulty, setGameDurationMinutes } = useGameStore();

    const handleSelectSinglePlay = (difficulty: Difficulty, minutes: number) => {
        setDifficulty(difficulty);
        setGameDurationMinutes(minutes);
        setScreen('single');
    };

    const handleSelectMultiPlay = () => {
        setScreen('multi');
    };

    const handleBackToHome = () => {
        setScreen('home');
    };

    return (
        <main className="min-h-screen bg-white">
            {currentScreen === 'home' && (
                <HomeScreen onSelectSinglePlay={handleSelectSinglePlay} onSelectMultiPlay={handleSelectMultiPlay} />
            )}

            {currentScreen === 'single' && <SinglePlayScreen onBackToHome={handleBackToHome} />}

            {currentScreen === 'multi' && (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-light mb-4">マルチプレイ</h2>
                        <p className="text-gray-500 mb-6">準備中です</p>
                        <button
                            onClick={handleBackToHome}
                            className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
                        >
                            ホームに戻る
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
};
