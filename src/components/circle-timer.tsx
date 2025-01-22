'use client';

import Image from "next/image";
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Play, Pause } from 'lucide-react';

interface CircleProps {
  radius: number;
  color: string;
  dashArray: string;
  isDragging: boolean;
  currentTime: number;
  isSpinning: boolean;
}

interface WheelButtonProps {
  label: string;
  angle: number;
  handleButtonPress: () => void;
  isRunning: boolean;
}

interface TimeState {
  currentTime: number;
  isRunning: boolean;
  isDragging: boolean;
  startAngle: number;
  lastAngle: number;
  centerX: number;
  centerY: number;
  isSpinning: boolean;
}

interface CircleConfig {
  radius: number;
  color: string;
  dashArray: string;
}

const Circle = memo(({ radius, color, dashArray, isDragging, currentTime, isSpinning }: CircleProps) => (
  <circle
    cx="50"
    cy="50"
    r={radius}
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeDasharray={dashArray}
    className="transition-all duration-300"
    style={{
      opacity: isDragging ? 0.8 : 0.6,
      transform: isSpinning ? 'none' : `rotate(${currentTime * 6}deg)`,
      transformOrigin: 'center',
      animation: isSpinning ? 'spin-and-fade 2.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' : 'none',
    }}
  />
));

Circle.displayName = 'Circle';

const WheelButton = memo(({ label, angle, handleButtonPress, isRunning }: WheelButtonProps) => (
  <button
    className={`absolute w-12 h-12 flex items-center justify-center text-sm transition-all duration-300 hover:scale-125 ${
      isRunning ? 'opacity-0 pointer-events-none' : 'opacity-100'
    }`}
    style={{
      left: `${50 + 55 * Math.cos((angle * Math.PI) / 180)}%`,
      top: `${50 + 55 * Math.sin((angle * Math.PI) / 180)}%`,
      transform: 'translate(-50%, -50%)',
      color: "#FFF",
      zIndex: 10
    }}
    onClick={(e) => {
      e.stopPropagation();
      handleButtonPress();
    }}
  >
    {label}
  </button>
));

WheelButton.displayName = 'WheelButton';

const CircleTimer: React.FC = () => {
  const [timeState, setTimeState] = useState<TimeState>({
    currentTime: 60,
    isRunning: false,
    isDragging: false,
    startAngle: 0,
    lastAngle: 0,
    centerX: 0,
    centerY: 0,
    isSpinning: false
  });

  const colors = useMemo(() => ({
    teal: '#4a2480',
    coral: '#c53a9d',
    navy: '#051f39',
    gold: '#ffffff',
    peach: '#ff8e80',
    background: '#FFFFFF'
  }), []);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}m${secs.toString().padStart(2, '0')}s`;
  }, []);

  const adjustTime = useCallback((adjustment: number): void => {
    if (!timeState.isRunning) {
      setTimeState(prev => ({
        ...prev,
        currentTime: Math.max(0, Math.min(3600, prev.currentTime + adjustment))
      }));
    }
  }, [timeState.isRunning]);

  const getAngleFromEvent = useCallback((e: React.MouseEvent | React.TouchEvent, rect: DOMRect) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = clientX - centerX;
    const y = clientY - centerY;
    return { x, y, angle: Math.atan2(y, x), centerX, centerY };
  }, []);

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent): void => {
    if (!timeState.isRunning) {
      e.preventDefault();
      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      const { angle, centerX, centerY } = getAngleFromEvent(e, rect);
      
      setTimeState(prev => ({
        ...prev,
        isDragging: true,
        startAngle: angle,
        lastAngle: angle,
        centerX,
        centerY
      }));
    }
  }, [timeState.isRunning, getAngleFromEvent]);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent): void => {
    if (timeState.isDragging && !timeState.isRunning) {
      e.preventDefault();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const x = clientX - timeState.centerX;
      const y = clientY - timeState.centerY;
      const currentAngle = Math.atan2(y, x);
      
      let deltaAngle = currentAngle - timeState.lastAngle;
      
      if (deltaAngle > Math.PI) {
        deltaAngle -= 2 * Math.PI;
      } else if (deltaAngle < -Math.PI) {
        deltaAngle += 2 * Math.PI;
      }
      
      const sensitivity = 2; // Adjust this value to change wheel sensitivity
      const timeAdjustment = Math.round((deltaAngle * sensitivity) / (Math.PI * 2) * 60);
      
      setTimeState(prev => ({
        ...prev,
        currentTime: Math.max(0, Math.min(3600, prev.currentTime + timeAdjustment)),
        lastAngle: currentAngle
      }));
    }
  }, [timeState.isDragging, timeState.isRunning, timeState.lastAngle, timeState.centerX, timeState.centerY]);

  const handleEnd = useCallback((): void => {
    setTimeState(prev => ({
      ...prev,
      isDragging: false
    }));
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timeState.isRunning && timeState.currentTime > 0) {
      interval = setInterval(() => {
        setTimeState(prev => {
          if (prev.currentTime <= 1) {
            return {
              ...prev,
              currentTime: 0,
              isRunning: false,
              isSpinning: true
            };
          }
          return {
            ...prev,
            currentTime: prev.currentTime - 1
          };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeState.isRunning]);

  useEffect(() => {
    if (timeState.isSpinning) {
      const timeout = setTimeout(() => {
        setTimeState(prev => ({
          ...prev,
          isSpinning: false
        }));
      }, 2500);
      return () => clearTimeout(timeout);
    }
  }, [timeState.isSpinning]);

  const segments = useMemo(() => [
    {
      label: '-',
      angle: 180,
      color: colors.peach,
      handleButtonPress: () => adjustTime(-10)
    },
    {
      label: '+',
      angle: 0,
      color: colors.gold,
      handleButtonPress: () => adjustTime(10)
    },
    {
      label: '▲',
      angle: 270,
      color: colors.teal,
      handleButtonPress: () => adjustTime(60)
    },
    {
      label: '▼',
      angle: 90,
      color: colors.coral,
      handleButtonPress: () => adjustTime(-60)
    }
  ], [colors, adjustTime]);

  const circles: CircleConfig[] = useMemo(() => [
    { radius: 48, color: colors.peach, dashArray: '75 25' },
    { radius: 44, color: colors.gold, dashArray: '65 35' },
    { radius: 40, color: colors.navy, dashArray: '55 45' },
    { radius: 36, color: colors.coral, dashArray: '45 55' },
    { radius: 32, color: colors.teal, dashArray: '35 65' },
  ], [colors]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <style>
        {`
          @keyframes spin-and-fade {
            from {
              transform: rotate(${timeState.currentTime * 6}deg);
            }
            to {
              transform: rotate(${timeState.currentTime * 6 + 2520}deg);
            }
          }
        `}
      </style>
      <Card className="w-88 px-8 py-20 flex items-center justify-center my-8 backdrop-blur-md bg-white/10 border-white/20 rounded-none shadow-2xl relative z-10">
        <div className="relative w-full">
          <svg
            className="w-full"
            viewBox="0 0 100 100"
            style={{ transform: 'rotate(-90deg)' }}
          >
            {/* Background paths */}
            {circles.map((circle, index) => (
              <circle
                key={`bg-${index}`}
                cx="50"
                cy="50"
                r={circle.radius}
                fill="none"
                stroke="#2F485822"
                strokeWidth="1"
                strokeDasharray={circle.dashArray}
              />
            ))}
            
            {/* Animated circles */}
            {circles.map((circle, index) => (
              <Circle
                key={index}
                {...circle}
                isDragging={timeState.isDragging}
                currentTime={timeState.currentTime}
                isSpinning={timeState.isSpinning}
              />
            ))}
          </svg>

          <div
            className="absolute inset-0 touch-none"
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            onTouchCancel={handleEnd}
          >
            {segments.map((segment) => (
              <WheelButton
                key={segment.angle}
                {...segment}
                isRunning={timeState.isRunning}
              />
            ))}

            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="w-32 h-32 rounded-full bg-white/20 shadow-lg flex flex-col items-center justify-center transition-all duration-300"
                style={{ 
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  transform: timeState.isDragging ? 'scale(1.05)' : 'scale(1)'
                }}
              >
                <div className="text-md font-mono" style={{ color: colors.navy }}>
                  {formatTime(timeState.currentTime)}
                </div>
                <button
                  className="mt-2 transition-transform duration-200 hover:scale-125"
                  onClick={() => setTimeState(prev => ({ ...prev, isRunning: !prev.isRunning }))}
                >
                  {timeState.isRunning ? (
                    <Pause className="w-4 h-4" style={{ color: colors.coral }} />
                  ) : (
                    <Play className="w-4 h-4" style={{ color: colors.teal }} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>
      <a
        href="https://www.offekt.com"
        target="_blank"
        className="z-20"
      >
        <Image
            className="dark:invert"
            src="/offekt_logo_20250117@2x.png"
            alt="OFFEKT logo"
            width={88}
            height={27}
            priority
          />      
      </a>  
    </div>
  );
};

export default CircleTimer;