import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, Play, Pause, RotateCcw, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";

type TimerMode = "exercise" | "rest";

export default function WorkoutTimer() {
  const [exerciseTime, setExerciseTime] = useState(30);
  const [restTime, setRestTime] = useState(15);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<TimerMode>("exercise");
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [workoutTime, setWorkoutTime] = useState(new Date().toTimeString().split(' ')[0].substring(0, 5));
  const [waterCount, setWaterCount] = useState(0);
  const timerRef = useRef<number | null>(null);
  const alertSound = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio for alert
  useEffect(() => {
    // Initialize audio for timer alert
    alertSound.current = new Audio('https://assets.coderrocketfuel.com/pomodoro-times-up.mp3');
    
    // Pre-load the audio file
    if (alertSound.current) {
      alertSound.current.load();
    }
    
    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Toggle timer start/pause
  const toggleTimer = () => {
    if (isRunning) {
      // Pause timer
      clearInterval(timerRef.current!);
      setIsRunning(false);
    } else {
      // Start timer
      // Initialize timer if not already running
      if (timeRemaining === 0) {
        setTimerMode("exercise");
        setTimeRemaining(exerciseTime);
      }
      
      setIsRunning(true);
      
      timerRef.current = window.setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Play alert sound when timer ends
            if (alertSound.current) {
              // Reset sound to beginning and play
              alertSound.current.currentTime = 0;
              alertSound.current.play().catch(e => console.log("Audio play failed:", e));
            }
            
            // Switch between exercise and rest
            const newMode = timerMode === "exercise" ? "rest" : "exercise";
            setTimerMode(newMode);
            
            // Set new time based on mode
            return newMode === "exercise" ? exerciseTime : restTime;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  // Reset timer
  const resetTimer = () => {
    clearInterval(timerRef.current!);
    setIsRunning(false);
    setTimeRemaining(0);
    setTimerMode("exercise");
  };

  // Increment water count
  const incrementWaterCount = () => {
    setWaterCount(prev => prev + 1);
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress for the SVG circle
  const calculateProgress = () => {
    const totalTime = timerMode === "exercise" ? exerciseTime : restTime;
    if (totalTime === 0) return 283;
    return 283 - ((timeRemaining / totalTime) * 283);
  };

  return (
    <Card className="bg-white w-full max-w-[500px] mx-auto">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold text-center mb-6">Cronômetro de Treino</h2>
        
        {/* Datetime Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <Label htmlFor="workout-date" className="block text-sm font-medium mb-1">
              Data do treino:
            </Label>
            <Input 
              id="workout-date"
              type="date" 
              value={workoutDate} 
              onChange={(e) => setWorkoutDate(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <Label htmlFor="workout-time" className="block text-sm font-medium mb-1">
              Hora do treino:
            </Label>
            <Input 
              id="workout-time"
              type="time" 
              value={workoutTime} 
              onChange={(e) => setWorkoutTime(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        
        {/* Timer Circle */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div 
            className={`relative w-64 h-64 rounded-full p-3 border-4 ${
              timerMode === "exercise" ? "border-red-500" : "border-green-500"
            }`}
          >
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="none" 
                stroke="#E5E7EB" 
                strokeWidth="8"
              />
              <circle 
                className="transition-all duration-1000"
                cx="50" 
                cy="50" 
                r="45" 
                fill="none" 
                stroke={timerMode === "exercise" ? "#ef4444" : "#10b981"}
                strokeWidth="8"
                strokeDasharray="283"
                strokeDashoffset={calculateProgress()}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span 
                className={cn(
                  "text-6xl font-bold",
                  timerMode === "exercise" ? "text-red-500" : "text-green-500"
                )}
              >
                {formatTime(timeRemaining)}
              </span>
              <span className={cn(
                "text-lg font-medium mt-2",
                timerMode === "exercise" ? "text-red-500" : "text-green-500"
              )}>
                {timerMode === "exercise" ? "Exercício" : "Descanso"}
              </span>
            </div>
          </div>
        </div>
        
        {/* Timer Controls - Exercise and Rest Times Side by Side */}
        <div className="flex flex-col space-y-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Tempo de Exercício */}
            <div className={`p-4 rounded-lg border-2 ${timerMode === "exercise" ? "border-red-500" : "border-gray-200"}`}>
              <Label htmlFor="exercise-time" className="block text-sm font-medium mb-2 text-center">
                Tempo de exercício
              </Label>
              <div className="flex items-center justify-between">
                <Button 
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 rounded-full"
                  onClick={() => setExerciseTime(prev => Math.max(5, prev - 5))}
                  disabled={isRunning}
                >
                  -
                </Button>
                
                <div className="text-2xl font-bold">{exerciseTime}s</div>
                
                <Button 
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 rounded-full"
                  onClick={() => setExerciseTime(prev => Math.min(300, prev + 5))}
                  disabled={isRunning}
                >
                  +
                </Button>
              </div>
            </div>
            
            {/* Tempo de Descanso */}
            <div className={`p-4 rounded-lg border-2 ${timerMode === "rest" ? "border-green-500" : "border-gray-200"}`}>
              <Label htmlFor="rest-time" className="block text-sm font-medium mb-2 text-center">
                Tempo de descanso
              </Label>
              <div className="flex items-center justify-between">
                <Button 
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 rounded-full"
                  onClick={() => setRestTime(prev => Math.max(5, prev - 5))}
                  disabled={isRunning}
                >
                  -
                </Button>
                
                <div className="text-2xl font-bold">{restTime}s</div>
                
                <Button 
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 rounded-full"
                  onClick={() => setRestTime(prev => Math.min(180, prev + 5))}
                  disabled={isRunning}
                >
                  +
                </Button>
              </div>
            </div>
          </div>
          
          {/* Player Controls Row */}
          <div className="flex items-center justify-center gap-6 mt-6">
            {/* Reset Button with Black Border */}
            <Button 
              variant="outline"
              size="icon"
              className="w-12 h-12 rounded-full border-2 border-black bg-transparent"
              onClick={resetTimer}
            >
              <RotateCcw className="h-5 w-5 text-black" />
            </Button>
            
            {/* Spotify Style Play/Pause Button */}
            <Button 
              className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90 text-white"
              onClick={toggleTimer}
            >
              {isRunning ? (
                <Pause className="h-8 w-8" />
              ) : (
                <Play className="h-8 w-8 ml-1" />
              )}
            </Button>
            
            {/* Water Counter Button with Black Symbol */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                size="icon"
                className="w-12 h-12 rounded-full border-2 border-black bg-transparent"
                onClick={incrementWaterCount}
              >
                <Droplets className="h-5 w-5 text-black" />
              </Button>
              <div className="text-lg font-semibold">{waterCount}</div>
            </div>
          </div>
          
          <Alert className="bg-blue-50 border-blue-200">
            <InfoIcon className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Como usar:</AlertTitle>
            <AlertDescription className="text-blue-700">
              <ol className="list-disc pl-5 space-y-1 text-sm">
                <li>Defina a data e hora do seu treino</li>
                <li>Ajuste os tempos de exercício e descanso</li>
                <li>Clique no botão de play para iniciar</li>
                <li>Use o botão de água para registrar sua hidratação</li>
                <li>O cronômetro ficará vermelho durante exercício e verde no descanso</li>
              </ol>
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}
