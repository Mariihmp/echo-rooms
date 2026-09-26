import React, { useEffect, useState } from 'react';
import { sound } from '../services/sound';

interface WeatherOverlayProps {
  intensity?: 'storm' | 'calm_rain' | 'dawn';
}

export const WeatherOverlay: React.FC<WeatherOverlayProps> = ({ intensity = 'storm' }) => {
  const [lightning, setLightning] = useState(false);

  useEffect(() => {
    if (intensity === 'dawn') return;

    // Trigger intermittent lightning flashes
    const triggerLightning = () => {
      const delay = 15000 + Math.random() * 20000;
      return setTimeout(() => {
        setLightning(true);
        sound.playThunder();

        // Double flicker
        setTimeout(() => setLightning(false), 80);
        setTimeout(() => setLightning(true), 140);
        setTimeout(() => {
          setLightning(false);
          timeoutId = triggerLightning();
        }, 260);
      }, delay);
    };

    let timeoutId = triggerLightning();
    return () => clearTimeout(timeoutId);
  }, [intensity]);

  if (intensity === 'dawn') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-t from-amber-500/10 via-rose-500/5 to-transparent transition-opacity duration-1000" />
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Lightning Flash Overlay */}
      {lightning && (
        <div className="absolute inset-0 bg-teal-100/15 backdrop-brightness-150 transition-opacity duration-75 mix-blend-overlay pointer-events-none" />
      )}

      {/* Atmospheric Falling Rain Streaks */}
      <div className="absolute inset-0 opacity-25 pointer-events-none">
        <svg className="w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="rain-pattern" width="60" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(-15)">
              <line x1="10" y1="0" x2="8" y2="40" stroke="#7dd3fc" strokeWidth="1" strokeOpacity="0.6" strokeDasharray="15 30" />
              <line x1="35" y1="20" x2="33" y2="70" stroke="#a5f3fc" strokeWidth="0.8" strokeOpacity="0.5" strokeDasharray="20 40" />
              <line x1="50" y1="10" x2="48" y2="55" stroke="#bae6fd" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="10 35" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#rain-pattern)" className="animate-rain pointer-events-none" />
        </svg>
      </div>

      <style>{`
        @keyframes rainMove {
          0% { transform: translateY(-120px); }
          100% { transform: translateY(0); }
        }
        .animate-rain {
          animation: rainMove 0.75s linear infinite;
        }
      `}</style>
    </div>
  );
};
