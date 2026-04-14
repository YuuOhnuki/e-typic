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
    alternatives,
    accentColor = 'emerald',
    onProgress,
    onComplete,
    onError,
}) => {
    const [userInput, setUserInput] = useState<string>('');
    const [typedRomaji, setTypedRomaji] = useState<string>('');
    const [japaneseProgress, setJapaneseProgress] = useState<number>(0);
    const [typedHistory, setTypedHistory] = useState<Array<{ char: string; correct: boolean }>>([]);
    const [lastError, setLastError] = useState<boolean>(false);

    const inputRef = useRef<HTMLInputElement>(null);

    const accentColorMap: Record<string, string> = {
        emerald: '#10b981',
        blue: '#3b82f6',
        green: '#22c55e',
        purple: '#a855f7',
        red: '#ef4444',
    };

    const accentColorHex = accentColorMap[accentColor] || '#10b981';

    const targetText = romaji && romaji.trim() ? romaji.trim() : romajiEngine.toRomaji(japanese);
    const hasExplicitRomaji = Boolean(romaji && romaji.trim());
    const romajiCandidates = useMemo(() => {
        const canonicalSources = [targetText, ...(alternatives ?? []).filter(Boolean)];
        const candidateSet = new Set<string>();
        for (const source of canonicalSources) {
            const normalized = source.trim();
            if (!normalized) continue;
            candidateSet.add(normalized);
            romajiEngine.getImeVariantsFromRomaji(normalized).forEach((variant) => candidateSet.add(variant));
        }
        return Array.from(candidateSet).sort((a, b) => a.length - b.length);
    }, [alternatives, targetText]);
    const pickCandidateForPrefix = useCallback(
        (prefix: string): string | null => {
            const matches = romajiCandidates.filter((candidate) => candidate.startsWith(prefix));
            if (matches.length === 0) return null;
            const exact = matches.find((candidate) => candidate === prefix);
            if (exact) return exact;
            return matches[0];
        },
        [romajiCandidates],
    );

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newInput = e.target.value;
            const previousLength = userInput.length;
            const newLength = newInput.length;

            if (newLength < previousLength) {
                setUserInput(newInput);
                return;
            }

            if (newLength === previousLength + 1) {
                const inputChar = newInput[newInput.length - 1] ?? '';
                const nextTyped = `${typedRomaji}${inputChar}`;
                const matchedCandidate = pickCandidateForPrefix(nextTyped);
                const hasPrefixMatch = matchedCandidate !== null;
                const hasExactMatch = matchedCandidate === nextTyped;

                if (hasPrefixMatch) {
                    setTypedHistory((prev) => [...prev, { char: inputChar, correct: true }]);
                    const activeCandidateLength = matchedCandidate?.length ?? targetText.length;
                    const nextJapaneseIndex = hasExplicitRomaji
                        ? Math.floor((nextTyped.length / Math.max(activeCandidateLength, 1)) * japanese.length)
                        : romajiEngine.analyzeFullInput(japanese, nextTyped).japaneseIndex;
                    const nextCorrectIndices: number[] = [];
                    for (let index = 0; index < nextJapaneseIndex; index += 1) {
                        nextCorrectIndices.push(index);
                    }
                    setJapaneseProgress(nextJapaneseIndex);
                    setTypedRomaji(nextTyped);
                    onProgress?.({
                        currentIndex: nextJapaneseIndex,
                        correctIndices: nextCorrectIndices,
                        displayText: nextTyped,
                        nextCharToType: matchedCandidate?.[nextTyped.length] ?? '',
                        lastError: false,
                    });
                    setLastError(false);
                    setUserInput('');

                    if (hasExactMatch) {
                        onComplete?.();
                    }
                } else {
                    setTypedHistory((prev) => [...prev, { char: inputChar, correct: false }]);
                    setLastError(true);
                    onError?.(japaneseProgress);
                    setUserInput('');
                }
            }
        },
        [
            hasExplicitRomaji,
            japanese,
            japaneseProgress,
            onComplete,
            onError,
            onProgress,
            pickCandidateForPrefix,
            targetText.length,
            typedRomaji,
            userInput,
        ],
    );

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // クリック時に input に focus
    const handleContainerClick = () => {
        inputRef.current?.focus();
    };

    const romajiTarget = pickCandidateForPrefix(typedRomaji) ?? targetText;
    const completedRomaji = typedRomaji;

    const displayChars = japanese.split('').map((char: string, index: number) => {
        const isCorrect = index < japaneseProgress;
        const isCurrent = index === japaneseProgress;

        return {
            char,
            index,
            isCorrect,
            isCurrent,
        };
    });

    return (
        <div
            className="w-full max-w-2xl mx-auto px-4 py-8 focus-within:outline-none cursor-text"
            onClick={handleContainerClick}
        >
            <div className="text-center mb-12">
                <div className="text-3xl md:text-4xl font-light leading-relaxed tracking-wide min-h-24 break-words whitespace-pre-wrap">
                    {displayChars.map(({ char, index, isCorrect, isCurrent }) => (
                        <span
                            key={index}
                            className={`inline-block transition-all duration-200 px-1 rounded ${
                                isCorrect ? 'bg-emerald-50 text-gray-900' : 'text-gray-900'
                            } ${isCurrent && !isCorrect ? 'font-semibold underline underline-offset-8' : ''}`}
                            style={{
                                marginRight: '0.25em',
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
                <div className="text-2xl font-mono tracking-widest text-gray-700 break-words">
                    {romajiTarget.split('').map((char: string, idx: number) => {
                        const isCompleted = idx < completedRomaji.length;
                        const isCurrent = idx === completedRomaji.length;

                        return (
                            <span
                                key={idx}
                                className={`inline-block mr-1 transition-colors duration-200 px-0.5 rounded ${
                                    isCompleted ? 'bg-emerald-50 text-gray-900' : 'text-gray-800'
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
                        typedHistory.slice(-20).map((item, idx: number) => (
                            <span
                                key={`${item.char}-${idx}`}
                                className={`inline-block mr-1 px-2 py-1 rounded border ${
                                    item.correct
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
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
                    {typedRomaji.length} / {targetText.length}
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                    <div
                        className="h-full transition-all duration-300"
                        style={{
                            width: `${(typedRomaji.length / Math.max(romajiTarget.length, 1)) * 100}%`,
                            backgroundColor: accentColor,
                        }}
                    />
                </div>
            </div>

            <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={handleInputChange}
                className="absolute -left-[9999px] h-px w-px opacity-0 pointer-events-none"
                autoFocus
                autoComplete="off"
                spellCheck="false"
            />

            {typedRomaji.length >= romajiTarget.length && (
                <div className="text-center mt-12">
                    <div className="text-2xl font-light" style={{ color: accentColor }}>
                        完了！
                    </div>
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
