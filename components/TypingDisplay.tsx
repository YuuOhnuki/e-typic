'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { InputState } from '@/types/typing';
import { romajiEngine } from '@/utils/romajiEngine';

interface TypingDisplayProps {
    japanese: string;
    romaji?: string;
    alternatives?: string[];
    accentColor?: string;
    onProgress?: (state: InputState) => void;
    onComplete?: () => void;
    onError?: (position: number) => void;
}

export const TypingDisplay: React.FC<TypingDisplayProps> = ({
    japanese,
    romaji,
    alternatives = [],
    accentColor = 'emerald',
    onProgress,
    onComplete,
    onError,
}) => {
    const [userInput, setUserInput] = useState<string>('');
    const [romajiIndex, setRomajiIndex] = useState<number>(0);
    const [typedPrefix, setTypedPrefix] = useState<string>('');
    const [japaneseIndex, setJapaneseIndex] = useState<number>(0);
    const [typedHistory, setTypedHistory] = useState<Array<{ char: string; correct: boolean }>>([]);
    const [lastError, setLastError] = useState<boolean>(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const currentRomajiCharRef = useRef<HTMLSpanElement>(null);

    const accentColorMap: Record<string, string> = {
        emerald: '#10b981',
        blue: '#3b82f6',
        green: '#22c55e',
        purple: '#a855f7',
        red: '#ef4444',
    };

    const accentColorHex = accentColorMap[accentColor] || '#10b981';

    const sanitizeRomaji = useCallback((value: string) => {
        return value
            .normalize('NFKC')
            .toLowerCase()
            .replace(/[^a-z0-9\s.,!?'"():;-]/g, '');
    }, []);

    const romajiCandidates = useMemo(
        () => {
            const baseCandidates = Array.from(
                new Set(
                    [romaji, ...alternatives, romajiEngine.toRomaji(japanese)]
                        .map((value) => sanitizeRomaji(value ?? ''))
                        .filter((value) => value.length > 0),
                ),
            );

            return Array.from(
                new Set(
                    baseCandidates.flatMap((candidate) => [
                        candidate,
                        ...romajiEngine.getImeVariantsFromRomaji(candidate).map((value) => sanitizeRomaji(value)),
                    ]),
                ),
            );
        },
        [alternatives, japanese, romaji, sanitizeRomaji],
    );
    const [activeRomajiTarget, setActiveRomajiTarget] = useState<string>(romajiCandidates[0] || '');
    const romajiTarget = activeRomajiTarget || romajiCandidates[0] || '';

    const getJapaneseIndexByRomajiIndex = useCallback(
        (typedRomajiCount: number, targetLength: number) => {
            if (japanese.length === 0 || targetLength === 0) return 0;
            const progress = Math.min(typedRomajiCount / Math.max(targetLength, 1), 1);
            return Math.floor(progress * japanese.length);
        },
        [japanese.length],
    );

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const rawChar = e.target.value.slice(-1);
            const inputChar = sanitizeRomaji(rawChar);
            setUserInput('');

            if (!inputChar) return;

            const nextPrefix = `${typedPrefix}${inputChar}`;
            const matchedCandidates = romajiCandidates.filter((candidate) => candidate.startsWith(nextPrefix));

            if (matchedCandidates.length > 0) {
                const nextTarget = matchedCandidates[0];
                const nextRomajiIndex = nextPrefix.length;
                const nextJapaneseIndex = getJapaneseIndexByRomajiIndex(nextRomajiIndex, nextTarget.length);
                const nextCorrectIndices = Array.from({ length: nextJapaneseIndex }, (_, idx) => idx);

                setActiveRomajiTarget(nextTarget);
                setTypedPrefix(nextPrefix);
                setRomajiIndex(nextRomajiIndex);
                setJapaneseIndex(nextJapaneseIndex);
                setLastError(false);
                setTypedHistory((prev) => [...prev, { char: inputChar, correct: true }]);

                onProgress?.({
                    currentIndex: nextRomajiIndex,
                    correctIndices: nextCorrectIndices,
                    displayText: japanese.substring(0, nextJapaneseIndex),
                    nextCharToType: nextTarget[nextRomajiIndex] || '',
                    lastError: false,
                });

                if (matchedCandidates.some((candidate) => candidate.length === nextPrefix.length)) {
                    onComplete?.();
                }
            } else {
                setTypedHistory((prev) => [...prev, { char: inputChar, correct: false }]);
                setLastError(true);
                onError?.(japaneseIndex);
            }
        },
        [
            japanese,
            japaneseIndex,
            onProgress,
            onComplete,
            onError,
            getJapaneseIndexByRomajiIndex,
            sanitizeRomaji,
            typedPrefix,
            romajiCandidates,
        ],
    );

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // クリック時に input に focus
    const handleContainerClick = () => {
        inputRef.current?.focus();
    };

    const completedRomaji = romajiTarget.substring(0, romajiIndex);

    useEffect(() => {
        currentRomajiCharRef.current?.scrollIntoView({
            behavior: 'smooth',
            inline: 'center',
            block: 'nearest',
        });
    }, [romajiIndex]);

    const displayChars = japanese.split('').map((char: string, index: number) => {
        const isCorrect = index < japaneseIndex;
        const isCurrent = index === japaneseIndex;

        return {
            char,
            index,
            isCorrect,
            isCurrent,
        };
    });

    return (
        <div
            className="w-full max-w-3xl mx-auto px-4 py-8 focus-within:outline-none cursor-text"
            onClick={handleContainerClick}
        >
            <div className="text-center mb-12">
                <div className="w-full text-center text-1xl md:text-2xl border border-gray-200 rounded-xl p-5 md:p-6 bg-gray-50 min-h-28 flex flex-wrap justify-center content-center gap-y-2">
                    {displayChars.map(({ char, index, isCorrect, isCurrent }) => (
                        <span
                            key={index}
                            className={`inline-block transition-all duration-200 px-1 rounded ${
                                isCorrect ? 'bg-gray-200 text-gray-900' : 'text-gray-900'
                            } ${isCurrent && !isCorrect ? 'font-semibold underline underline-offset-8' : ''}`}
                            style={{
                                marginRight: '0.2em',
                                color: isCurrent && !isCorrect ? accentColorHex : undefined,
                            }}
                        >
                            {char}
                        </span>
                    ))}
                </div>
            </div>

            <div className="text-center mb-8 min-h-12 flex flex-col items-center justify-center space-y-3">
                <div className="text-sm text-gray-500 uppercase tracking-[0.25em]">ローマ字全文</div>
                <div className="w-full text-xl md:text-2xl font-mono tracking-wide text-center leading-relaxed break-words">
                    {romajiTarget.split('').map((char: string, idx: number) => {
                        const isCompleted = idx < completedRomaji.length;
                        const isCurrent = idx === completedRomaji.length;

                        return (
                            <span
                                key={idx}
                                ref={isCurrent ? currentRomajiCharRef : null}
                                className={`inline-block mr-1 transition-colors duration-200 ${
                                    isCompleted ? 'text-gray-900' : 'text-gray-400'
                                } ${isCurrent ? 'font-semibold underline underline-offset-4' : ''}
                                }`}
                                style={{ color: isCurrent ? accentColorHex : undefined }}
                            >
                                {char}
                            </span>
                        );
                    })}
                </div>
            </div>

            <div className="text-center mb-8 min-h-10">
                <div className={`text-lg font-mono tracking-wider ${lastError ? 'text-red-500' : 'text-gray-500'}`}>
                    {typedHistory.length > 0 ? (
                        typedHistory.slice(-25).map((item, idx: number) => (
                            <span
                                key={`${item.char}-${idx}`}
                                className={`inline-block mr-1 px-2 py-1 rounded border ${
                                    item.correct
                                        ? 'bg-gray-100 text-gray-700 border-gray-300'
                                        : 'bg-red-50 text-red-600 border-red-200'
                                }`}
                            >
                                {item.char}
                            </span>
                        ))
                    ) : userInput ? (
                        userInput.split('').map((char: string, idx: number) => (
                            <span key={idx} className="inline-block mr-1 px-1 py-0.5 rounded bg-gray-100 text-black">
                                {char}
                            </span>
                        ))
                    ) : (
                        <span className="inline-block opacity-0">_</span>
                    )}
                </div>
            </div>

            <div className="text-center mb-6">
                <div className="text-sm text-gray-500 tabular-nums">
                    {romajiIndex} / {romajiTarget.length}
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                    <div
                        className="h-full transition-all duration-300"
                        style={{
                            width: `${(romajiIndex / Math.max(romajiTarget.length, 1)) * 100}%`,
                            backgroundColor: '#374151',
                        }}
                    />
                </div>
            </div>

            <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={handleInputChange}
                className="fixed -left-[9999px] top-0 h-px w-px opacity-0 pointer-events-none"
                autoFocus
                autoComplete="off"
                spellCheck="false"
            />

            {romajiIndex >= romajiTarget.length && (
                <div className="text-center mt-12">
                    <div className="text-2xl font-light text-gray-800">完了！</div>
                </div>
            )}

            {lastError && (
                <div className="fixed bottom-4 left-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded animate-pulse">
                    誤字。もう一度入力してください。
                </div>
            )}
        </div>
    );
};
