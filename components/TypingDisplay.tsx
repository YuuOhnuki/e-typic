'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { InputState } from '@/types/typing';
import { romajiEngine } from '@/utils/romajiEngine';

interface TypingDisplayProps {
  japanese: string;
  accentColor?: string;
  onProgress?: (state: InputState) => void;
  onComplete?: () => void;
  onError?: (position: number) => void;
}

export const TypingDisplay: React.FC<TypingDisplayProps> = ({
  japanese,
  accentColor = 'emerald-500',
  onProgress,
  onComplete,
  onError,
}) => {
  const [userInput, setUserInput] = useState<string>('');
  const [japaneseIndex, setJapaneseIndex] = useState<number>(0);
  const [correctIndices, setCorrectIndices] = useState<Set<number>>(new Set());
  const [lastError, setLastError] = useState<boolean>(false);
  const [fadeOutIndices, setFadeOutIndices] = useState<Set<number>>(new Set());

  const inputRef = useRef<HTMLInputElement>(null);

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
        const tempInput = newInput;
        const checkResult = romajiEngine.checkInput(japanese, japaneseIndex, tempInput);

        if (checkResult.isCorrect) {
          setCorrectIndices(prev => {
            const newSet = new Set(prev);
            newSet.add(japaneseIndex);
            return newSet;
          });

          const newCurrentIndex = checkResult.nextIndex;
          setJapaneseIndex(newCurrentIndex);
          setLastError(false);
          setUserInput('');

          if (onProgress) {
            onProgress({
              currentIndex: newCurrentIndex,
              correctIndices: Array.from(correctIndices),
              displayText: japanese.substring(0, newCurrentIndex),
              nextCharToType: romajiEngine.getNextCharHint(japanese, newCurrentIndex),
              lastError: false,
            });
          }

          if (newCurrentIndex >= japanese.length) {
            if (onComplete) {
              onComplete();
            }
          }
        } else {
          setLastError(true);
          onError?.(japaneseIndex);
          setUserInput('');
        }
      }
    },
    [japanese, japaneseIndex, userInput, correctIndices, onProgress, onComplete, onError]
  );

  useEffect(() => {
    if (correctIndices.size > fadeOutIndices.size) {
      const newFadeIndices = Array.from(correctIndices)
        .filter(idx => !fadeOutIndices.has(idx))
        .slice(0, 1);

      if (newFadeIndices.length > 0) {
        const timer = setTimeout(() => {
          setFadeOutIndices(prev => {
            const newSet = new Set(prev);
            newSet.add(newFadeIndices[0]);
            return newSet;
          });
        }, 300);

        return () => clearTimeout(timer);
      }
    }
  }, [correctIndices, fadeOutIndices]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const nextCharHint = romajiEngine.getNextCharHint(japanese, japaneseIndex);

  const displayChars = japanese.split('').map((char: string, index: number) => {
    const isCorrect = correctIndices.has(index);
    const willFadeOut = fadeOutIndices.has(index);
    const isCurrent = index === japaneseIndex;

    return {
      char,
      index,
      isCorrect,
      willFadeOut,
      isCurrent,
    };
  });

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 focus-within:outline-none">
      <div className="text-center mb-12">
        <div className="text-4xl md:text-5xl font-light leading-relaxed tracking-wide h-24 flex items-center justify-center">
          {displayChars.map(({ char, index, isCorrect, willFadeOut, isCurrent }) => (
            <span
              key={index}
              className={`inline-block transition-all duration-300 ${
                willFadeOut ? 'opacity-0' : 'opacity-100'
              } ${isCurrent && !isCorrect ? 'font-semibold' : ''} ${
                isCorrect && !willFadeOut ? 'text-gray-400' : ''
              }`}
              style={{
                marginRight: '0.25em',
                color: isCurrent && !isCorrect ? accentColor : undefined,
              }}
            >
              {char}
            </span>
          ))}
        </div>
      </div>

      <div className="text-center mb-8 min-h-12 flex items-center justify-center">
        <div className="text-2xl font-mono tracking-widest text-gray-700">
          {nextCharHint.split('').map((char: string, idx: number) => (
            <span key={idx} className="inline-block mr-1">
              {char}
            </span>
          ))}
        </div>
      </div>

      <div className="text-center mb-8 min-h-8">
        <div
          className={`text-lg font-mono tracking-wider ${
            lastError ? 'text-red-500' : 'text-gray-500'
          }`}
        >
          {userInput || '\u00A0'}
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="text-sm text-gray-500 tabular-nums">
          {japaneseIndex} / {japanese.length}
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${(japaneseIndex / japanese.length) * 100}%`,
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
        className="absolute -left-full pointer-events-none"
        autoFocus
        autoComplete="off"
        spellCheck="false"
      />

      {japaneseIndex >= japanese.length && (
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
