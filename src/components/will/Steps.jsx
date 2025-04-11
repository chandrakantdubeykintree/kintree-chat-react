import { cn } from "@/lib/utils";
import { CheckCircle2, Circle } from "lucide-react";
import { Link } from "react-router";
import { useEffect, useRef } from "react";

export function Steps({ steps, currentStep, willId }) {
  const stepsContainerRef = useRef(null);
  const currentStepRef = useRef(null);

  useEffect(() => {
    if (currentStepRef.current && stepsContainerRef.current) {
      const container = stepsContainerRef.current;
      const element = currentStepRef.current;

      const scrollLeft =
        element.offsetLeft -
        container.offsetWidth / 2 +
        element.offsetWidth / 2;

      container.scrollTo({
        left: scrollLeft,
        behavior: "smooth",
      });
    }
  }, [currentStep]);

  return (
    <div
      ref={stepsContainerRef}
      className="w-full overflow-x-auto no_scrollbar pb-4"
    >
      <div className="flex justify-between gap-1 min-w-max px-4">
        {steps.map((step, index) => {
          const isComplete =
            steps.findIndex((s) => s.id === currentStep) > index;
          const isCurrent = step.id === currentStep;

          return (
            <div
              key={step.id}
              ref={isCurrent ? currentStepRef : null}
              className="flex flex-col items-center relative"
              style={{ minWidth: "120px" }} // Ensure minimum width for each step
            >
              {/* Step circle */}
              <Link
                className={cn(
                  "relative z-10 flex items-center justify-center w-8 h-8 rounded-full",
                  "cursor-auto",
                  "border-2 transition-colors duration-200",
                  isComplete
                    ? "bg-primary border-primary"
                    : isCurrent
                    ? "bg-white border-primary"
                    : "bg-white border-gray-300"
                )}
              >
                {isComplete ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : (
                  <Circle
                    className={cn(
                      "w-5 h-5",
                      isCurrent ? "text-primary" : "text-gray-300"
                    )}
                  />
                )}
              </Link>

              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "absolute top-4 left-[50%] h-[2px]",
                    "bg-gray-200 w-[calc(120px+1rem)] z-0",
                    isComplete &&
                      "before:absolute before:inset-0 before:bg-primary"
                  )}
                  style={{
                    transform: "translateY(-50%)",
                  }}
                />
              )}

              {/* Step title */}
              <span
                className={cn(
                  "mt-2 text-sm font-medium whitespace-nowrap px-2",
                  isCurrent ? "text-primary" : "text-gray-500"
                )}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
