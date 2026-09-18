'use client';

import { useEffect, useRef } from 'react';

interface AudioAlertProps {
  triggerSound: boolean;
  soundEnabled: boolean;
  type?: 'new-order' | 'alert' | 'ready';
  volume?: number;
}

/**
 * Audio Alert Component
 * Plays notification sounds when orders arrive or events occur
 * Respects the sound toggle setting from the kitchen layout
 */

export default function AudioAlert({
  triggerSound = false,
  soundEnabled = true,
  type = 'new-order',
  volume = 0.7,
}: AudioAlertProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (triggerSound && soundEnabled && audioRef.current) {
      audioRef.current.volume = volume;
      // Play the audio
      const playPromise = audioRef.current.play().catch(err => {
        console.log('Audio playback failed (may be due to browser autoplay policy):', err);
      });
    }
  }, [triggerSound, soundEnabled, volume]);

  // Generate data URL for beep sound
  // This is a fallback in case service workers or external audio files are not available
  const getAudioDataUrl = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === 'new-order') {
      // Two tones for new order
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } else if (type === 'alert') {
      // Three quick beeps for alert
      for (let i = 0; i < 3; i++) {
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + i * 0.15);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + i * 0.15);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + i * 0.15 + 0.1);
      }
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.45);
    } else if (type === 'ready') {
      // Ascending tone for order ready
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(900, audioContext.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    }

    return '';
  };

  return (
    <>
      <audio
        ref={audioRef}
        onLoadStart={() => {
          // Audio element ready
        }}
      >
        {/* Using Web Audio API instead of preloaded files for flexibility */}
        Your browser does not support the audio element
      </audio>
    </>
  );
}

/**
 * Manual audio trigger function for scenarios where component re-rendering isn't viable
 */
export function playKitchenSound(type: 'new-order' | 'alert' | 'ready' = 'new-order', volume: number = 0.7) {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === 'new-order') {
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } else if (type === 'alert') {
      for (let i = 0; i < 3; i++) {
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + i * 0.15);
        gainNode.gain.setValueAtTime(volume * 0.65, audioContext.currentTime + i * 0.15);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + i * 0.15 + 0.1);
      }
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.45);
    } else if (type === 'ready') {
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(900, audioContext.currentTime + 0.2);
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    }
  } catch (err) {
    console.log('Audio playback not available:', err);
  }
}
