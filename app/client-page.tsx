'use client';

import React from 'react';
import { HomeScreen } from '@/components/HomeScreen';
import { LeaderboardScreen } from '@/components/LeaderboardScreen';
import { SinglePlayScreen } from '@/components/SinglePlayScreen';
import { MultiPlayScreen } from '@/components/MultiPlayScreen';
import { SignInForm, SignUpForm } from '@/components/AuthForm';
import { UserSettings } from '@/components/UserSettings';
import { UserStatsScreen } from '@/components/UserStatsScreen';
import { useGameStore } from '@/store/gameStore';
import { Difficulty } from '@/types/typing';

/**
 * ページルーティング管理（クライアント側）
 */
interface ClientPageProps {
    appVersion: string;
}

export const ClientPage: React.FC<ClientPageProps> = ({ appVersion }) => {
    const { currentScreen, setScreen, setDifficulty, setGameDurationMinutes } = useGameStore();
    const [showDifficultySelectOnHome, setShowDifficultySelectOnHome] = React.useState(false);

    const handleSelectSinglePlay = (difficulty: Difficulty, minutes: number) => {
        setDifficulty(difficulty);
        setGameDurationMinutes(minutes);
        setShowDifficultySelectOnHome(false);
        setScreen('single');
    };

    const handleSelectMultiPlay = () => {
        setScreen('multi');
    };

    const handleSelectLeaderboard = () => {
        setScreen('leaderboard');
    };

    const handleBackToHome = () => {
        setShowDifficultySelectOnHome(false);
        setScreen('home');
    };

    const handleBackToDifficultySelect = () => {
        setShowDifficultySelectOnHome(true);
        setScreen('home');
    };

    return (
        <main className="h-dvh overflow-hidden">
            {currentScreen === 'home' && (
                <HomeScreen
                    onSelectSinglePlay={handleSelectSinglePlay}
                    onSelectMultiPlay={handleSelectMultiPlay}
                    onSelectLeaderboard={handleSelectLeaderboard}
                    onSelectSignIn={() => setScreen('auth-signin')}
                    onSelectSignUp={() => setScreen('auth-signup')}
                    onSelectSettings={() => setScreen('user-settings')}
                    onSelectStats={() => setScreen('user-stats')}
                    appVersion={appVersion}
                    initialShowDifficultySelect={showDifficultySelectOnHome}
                    onExitDifficultySelect={() => setShowDifficultySelectOnHome(false)}
                />
            )}

            {currentScreen === 'single' && (
                <SinglePlayScreen
                    onBackToHome={handleBackToHome}
                    onBackToDifficultySelect={handleBackToDifficultySelect}
                />
            )}

            {currentScreen === 'multi' && <MultiPlayScreen onBackToHome={handleBackToHome} />}

            {currentScreen === 'leaderboard' && <LeaderboardScreen onBackToHome={handleBackToHome} />}

            {currentScreen === 'auth-signin' && (
                <div className="min-h-screen flex items-center justify-center p-4">
                    <SignInForm onCancel={() => setScreen('home')} onSwitchToSignUp={() => setScreen('auth-signup')} />
                </div>
            )}

            {currentScreen === 'auth-signup' && (
                <div className="min-h-screen flex items-center justify-center p-4">
                    <SignUpForm onCancel={() => setScreen('home')} onSwitchToSignIn={() => setScreen('auth-signin')} />
                </div>
            )}

            {currentScreen === 'user-settings' && (
                <div className="min-h-screen flex items-center justify-center p-4">
                    <UserSettings onCancel={() => setScreen('home')} />
                </div>
            )}

            {currentScreen === 'user-stats' && (
                <div className="min-h-screen flex items-center justify-center p-4 overflow-y-auto">
                    <UserStatsScreen onCancel={() => setScreen('home')} />
                </div>
            )}
        </main>
    );
};
