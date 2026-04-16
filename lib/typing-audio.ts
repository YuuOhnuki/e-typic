type TypingSoundKind = 'key' | 'error';

interface TypingSoundPlayer {
    playKey: () => void;
    playError: () => void;
}

const createTone = (context: AudioContext, kind: TypingSoundKind) => {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const filterNode = context.createBiquadFilter();

    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(context.destination);

    const now = context.currentTime;

    if (kind === 'key') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(760, now);
        oscillator.frequency.exponentialRampToValueAtTime(620, now + 0.045);
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(2200, now);
        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.exponentialRampToValueAtTime(0.022, now + 0.008);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
    } else {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(220, now);
        oscillator.frequency.exponentialRampToValueAtTime(145, now + 0.08);
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(900, now);
        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.exponentialRampToValueAtTime(0.028, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    }

    oscillator.start(now);
    oscillator.stop(now + (kind === 'key' ? 0.05 : 0.1));
};

export const createTypingSoundPlayer = (): TypingSoundPlayer => {
    let audioContext: AudioContext | null = null;

    const getContext = () => {
        if (typeof window === 'undefined') return null;
        if (!audioContext) {
            const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!AudioContextClass) return null;
            audioContext = new AudioContextClass();
        }
        return audioContext;
    };

    const play = (kind: TypingSoundKind) => {
        const context = getContext();
        if (!context) return;

        if (context.state === 'suspended') {
            void context.resume();
        }

        try {
            createTone(context, kind);
        } catch {
            // 音声再生に失敗しても入力操作は継続する。
        }
    };

    return {
        playKey: () => play('key'),
        playError: () => play('error'),
    };
};