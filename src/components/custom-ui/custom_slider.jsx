import React from "react";
import { cn } from "@/lib/utils";
import { Slider } from "../ui/slider";

const CustomSlider = React.forwardRef(
  (
    { className, min, max, step, ticks = [], value, onValueChange, ...props },
    ref
  ) => {
    const handleTickClick = (tickValue) => {
      onValueChange([tickValue]);
    };

    // Calculate tick position as percentage
    const getTickPosition = (tickValue) => {
      return ((tickValue - min) / (max - min)) * 100;
    };

    return (
      <div className="relative w-full pt-6 pb-2">
        {/* Ticks */}
        <div className="absolute w-full flex top-0">
          {ticks.map((tick) => (
            <div
              key={tick}
              className="absolute flex flex-col items-center cursor-pointer select-none"
              style={{ left: `${getTickPosition(tick)}%` }}
              onClick={() => handleTickClick(tick)}
            >
              <div className="h-2 w-[1px] bg-gray-300"></div>
              <span className="text-xs text-gray-500 mt-1 transform -translate-x-1/2">
                {tick}
              </span>
            </div>
          ))}
        </div>

        {/* Slider */}
        <Slider
          ref={ref}
          min={min}
          max={max}
          step={step}
          value={value}
          onValueChange={onValueChange}
          className={cn("w-full", className)}
          {...props}
        />
      </div>
    );
  }
);

CustomSlider.displayName = "CustomSlider";

export { CustomSlider };
