/**
 * Active Word Letter Slot Input & Arcade Virtual Keyboard
 * Single-slot editing model with keyboard navigation (Arrow keys, Esc/Backspace to deselect).
 * On-screen keyboard uses button elements with non-input targets to prevent native mobile keyboard popups.
 * Instant auto-validation on single-letter substitution with inline error messages and flash animations.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Delete, CornerDownLeft, AlertCircle } from 'lucide-react';
import { sound } from '../services/audioEngine';

interface ActiveWordInputProps {
  currentWord: string;
  onAttemptMove: (candidateWord: string) => { valid: boolean; errorMsg?: string };
  disabled?: boolean;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

export const ActiveWordInput: React.FC<ActiveWordInputProps> = ({
  currentWord,
  onAttemptMove,
  disabled = false,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isErrorFlash, setIsErrorFlash] = useState<boolean>(false);
  const [temporaryLetter, setTemporaryLetter] = useState<{ index: number; letter: string } | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const wordLength = currentWord.length;

  const triggerError = useCallback((msg: string) => {
    sound.playInvalidError();
    setErrorMessage(msg);
    setIsErrorFlash(true);

    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }

    errorTimeoutRef.current = setTimeout(() => {
      setIsErrorFlash(false);
      setErrorMessage(null);
      setTemporaryLetter(null);
    }, 1400);
  }, []);

  const handleApplyLetter = useCallback((newChar: string) => {
    if (disabled || selectedSlot === null || selectedSlot < 0 || selectedSlot >= wordLength) {
      return;
    }

    const upperChar = newChar.toUpperCase();
    if (upperChar < 'A' || upperChar > 'Z') return;

    sound.playKeyClick();

    // Check if character is identical to current
    if (currentWord[selectedSlot] === upperChar) {
      triggerError('Same word');
      return;
    }

    // Build candidate word
    const candidate =
      currentWord.slice(0, selectedSlot) + upperChar + currentWord.slice(selectedSlot + 1);

    // Show temporary letter during validation
    setTemporaryLetter({ index: selectedSlot, letter: upperChar });

    // Auto-validate and commit immediately
    const result = onAttemptMove(candidate);
    if (!result.valid) {
      triggerError(result.errorMsg || 'Not a word');
    } else {
      // Valid move!
      setTemporaryLetter(null);
      setErrorMessage(null);
      setIsErrorFlash(false);
      // Keep slot or deselect
      setSelectedSlot(null);
    }
  }, [disabled, selectedSlot, wordLength, currentWord, onAttemptMove, triggerError]);

  // Handle Physical Keyboard Navigation & Typing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;

      // Deselect with Escape
      if (e.key === 'Escape') {
        setSelectedSlot(null);
        setTemporaryLetter(null);
        return;
      }

      // Slot navigation with arrow keys
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedSlot((prev) => {
          if (prev === null) return wordLength - 1;
          return prev > 0 ? prev - 1 : wordLength - 1;
        });
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedSlot((prev) => {
          if (prev === null) return 0;
          return prev < wordLength - 1 ? prev + 1 : 0;
        });
        return;
      }

      // Deselect with Backspace if a slot is selected
      if (e.key === 'Backspace') {
        if (selectedSlot !== null) {
          e.preventDefault();
          setSelectedSlot(null);
          setTemporaryLetter(null);
        }
        return;
      }

      // Letter key input
      if (selectedSlot !== null && e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        handleApplyLetter(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, selectedSlot, wordLength, handleApplyLetter]);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Active Word Letter Slots */}
      <div className="relative mb-3 flex flex-col items-center">
        <div className="text-xs font-mono text-slate-400 mb-2">
          {selectedSlot !== null ? (
            <span className="text-emerald-400 font-semibold">
              Slot {selectedSlot + 1} Selected · Type a letter to swap
            </span>
          ) : (
            <span>Tap any slot to modify a letter</span>
          )}
        </div>

        {/* Letter Slot Row */}
        <div
          className={`flex items-center gap-2 sm:gap-3 p-3 rounded-2xl border transition-all ${
            isErrorFlash
              ? 'border-red-500 bg-red-950/30 shadow-lg shadow-red-950/50'
              : selectedSlot !== null
              ? 'border-emerald-500/60 bg-emerald-950/20 shadow-md shadow-emerald-950/30'
              : 'border-slate-800 bg-slate-900/60'
          }`}
          role="region"
          aria-label="Active word letter slots"
        >
          {currentWord.split('').map((char, index) => {
            const isSelected = selectedSlot === index;
            const displayChar =
              temporaryLetter && temporaryLetter.index === index ? temporaryLetter.letter : char;

            return (
              <button
                key={index}
                type="button"
                inputMode="none"
                onClick={() => {
                  sound.playKeyClick();
                  setSelectedSlot(isSelected ? null : index);
                  setTemporaryLetter(null);
                }}
                disabled={disabled}
                className={`w-12 h-14 sm:w-14 sm:h-16 md:w-16 md:h-18 rounded-xl font-terminal font-bold text-2xl sm:text-3xl flex flex-col items-center justify-center transition-all cursor-pointer relative select-none ${
                  isSelected
                    ? 'border-2 border-emerald-400 bg-emerald-950/90 text-emerald-200 shadow-lg shadow-emerald-500/20 scale-105'
                    : isErrorFlash
                    ? 'border border-red-500/70 bg-slate-900/80 text-red-300'
                    : 'border border-slate-700 bg-slate-900/90 text-slate-100 hover:border-emerald-500/50 hover:bg-slate-800/80'
                }`}
                aria-label={`Letter slot ${index + 1}, currently ${displayChar}, ${
                  isSelected ? 'selected' : 'not selected'
                }`}
              >
                <span>{displayChar}</span>
                {isSelected && (
                  <div className="w-5 h-1 bg-emerald-400 rounded-full mt-0.5 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Inline Specific Error Banner (Red Flash + Text) */}
        <div
          className={`h-6 mt-2 flex items-center justify-center gap-1.5 transition-opacity ${
            errorMessage ? 'opacity-100' : 'opacity-0'
          }`}
          aria-live="assertive"
        >
          {errorMessage && (
            <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-red-400 bg-red-950/70 px-3 py-1 rounded-md border border-red-500/40">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* On-Screen Retro Arcade Keyboard */}
      <div
        className="w-full max-w-lg bg-[#0F172A]/95 p-2 sm:p-3 rounded-2xl border border-slate-800/80 shadow-md flex flex-col items-center gap-1.5"
        role="group"
        aria-label="Arcade Letter Keyboard"
      >
        {KEYBOARD_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="flex items-center justify-center gap-1 sm:gap-1.5 w-full">
            {rowIdx === 2 && (
              <button
                type="button"
                inputMode="none"
                onClick={() => {
                  sound.playKeyClick();
                  setSelectedSlot(null);
                  setTemporaryLetter(null);
                }}
                disabled={disabled || selectedSlot === null}
                className="h-10 sm:h-11 px-2 sm:px-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-100 hover:bg-slate-700 font-mono text-xs flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer min-w-[36px] sm:min-w-[44px]"
                title="Deselect slot"
                aria-label="Deselect slot"
              >
                <CornerDownLeft className="w-3.5 h-3.5" />
              </button>
            )}

            {row.map((letter) => {
              const isSlotActive = selectedSlot !== null;
              return (
                <button
                  key={letter}
                  type="button"
                  inputMode="none"
                  onClick={() => handleApplyLetter(letter)}
                  disabled={disabled || !isSlotActive}
                  className={`h-10 sm:h-11 flex-1 max-w-[40px] sm:max-w-[44px] rounded-lg font-terminal font-bold text-sm sm:text-base border transition-all flex items-center justify-center select-none cursor-pointer ${
                    isSlotActive
                      ? 'bg-slate-800/90 hover:bg-emerald-950/80 hover:border-emerald-500/60 text-slate-100 hover:text-emerald-300 border-slate-700 active:scale-95 shadow-xs'
                      : 'bg-slate-900/60 border-slate-800/70 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                  aria-label={`Letter ${letter}`}
                >
                  {letter}
                </button>
              );
            })}

            {rowIdx === 2 && (
              <button
                type="button"
                inputMode="none"
                onClick={() => {
                  sound.playKeyClick();
                  setSelectedSlot(null);
                  setTemporaryLetter(null);
                }}
                disabled={disabled || selectedSlot === null}
                className="h-10 sm:h-11 px-2 sm:px-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-100 hover:bg-slate-700 font-mono text-xs flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer min-w-[36px] sm:min-w-[44px]"
                title="Clear selection"
                aria-label="Clear selection"
              >
                <Delete className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
