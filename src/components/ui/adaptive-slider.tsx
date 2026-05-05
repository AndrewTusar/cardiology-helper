"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

interface AdaptiveSliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  fastStep?: number;
  slowStep?: number;
}

const AdaptiveSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  AdaptiveSliderProps
>(({ className, fastStep = 1, slowStep = 0.1, onValueChange, step, ...props }, ref) => {
  const [lastPosition, setLastPosition] = React.useState<number | null>(null);
  const [lastTime, setLastTime] = React.useState<number | null>(null);
  const [currentStep, setCurrentStep] = React.useState(slowStep);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const handlePointerDown = () => {
    setLastPosition(null);
    setLastTime(null);
  };

  const handleValueChange = (value: number[]) => {
    const now = Date.now();
    const currentPos = value[0];

    if (lastPosition !== null && lastTime !== null) {
      const timeDiff = now - lastTime;
      const posDiff = Math.abs(currentPos - lastPosition);

      // Если движение быстро (менее 50ms между изменениями), используем большой шаг
      if (timeDiff < 50 && posDiff > slowStep) {
        setCurrentStep(fastStep);
      } else {
        setCurrentStep(slowStep);
      }
    }

    setLastPosition(currentPos);
    setLastTime(now);

    // Сбросить шаг через 500ms неактивности
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setCurrentStep(slowStep);
      setLastPosition(null);
      setLastTime(null);
    }, 500);

    onValueChange?.(value);
  };

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      step={currentStep}
      onValueChange={handleValueChange}
      onPointerDown={handlePointerDown}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  );
});

AdaptiveSlider.displayName = "AdaptiveSlider";

export { AdaptiveSlider };
