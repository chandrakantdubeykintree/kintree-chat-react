import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const CustomOTPInput = React.forwardRef(
  (
    {
      length = 4,
      onChange,
      onBlur,
      value: controlledValue,
      name = "",
      disabled = false,
      autoFocus = true,
      className,
      error,
      onlyNumbers = true,
      ...props
    },
    ref
  ) => {
    const { t } = useTranslation();
    const [otp, setOtp] = useState(new Array(length).fill(""));
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const inputRefs = useRef([]);

    useEffect(() => {
      inputRefs.current = inputRefs.current.slice(0, length);
    }, [length]);

    // Update OTP display when controlled value changes
    useEffect(() => {
      if (controlledValue) {
        const otpArray = controlledValue.split("").slice(0, length);
        setOtp([...otpArray, ...new Array(length - otpArray.length).fill("")]);
      } else {
        setOtp(new Array(length).fill(""));
      }
    }, [controlledValue, length]);

    const handleChange = (e, index) => {
      const newValue = e.target.value;
      if (newValue.length > 1) return;

      if (onlyNumbers && !/^\d*$/.test(newValue)) return;

      const newOtp = [...otp];
      newOtp[index] = newValue;
      setOtp(newOtp);

      const otpString = newOtp.join("");
      if (onChange) {
        const syntheticEvent = {
          target: {
            name,
            value: otpString,
          },
        };
        onChange(syntheticEvent);
      }

      if (newValue && index < length - 1) {
        inputRefs.current[index + 1].focus();
      }
    };

    const handleKeyDown = (e, index) => {
      if (e.key === "Backspace") {
        if (!otp[index] && index > 0) {
          inputRefs.current[index - 1].focus();
        }
      }
    };

    const handlePaste = (e) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData("text/plain").slice(0, length);

      if (onlyNumbers && !/^\d+$/.test(pastedData)) return;

      const newOtp = [
        ...pastedData.split(""),
        ...new Array(length - pastedData.length).fill(""),
      ];
      setOtp(newOtp);

      if (onChange) {
        const syntheticEvent = {
          target: {
            name,
            value: pastedData,
          },
        };
        onChange(syntheticEvent);
      }

      const focusIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[focusIndex].focus();
    };

    return (
      <div className="space-y-2">
        <div className={cn("flex gap-2 justify-center", className)}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              pattern="\d*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onFocus={() => setFocusedIndex(index)}
              onBlur={(e) => {
                setFocusedIndex(-1);
                if (index === length - 1 && onBlur) {
                  onBlur(e);
                }
              }}
              onPaste={handlePaste}
              disabled={disabled}
              autoFocus={autoFocus && index === 0}
              className={cn(
                // Base styles
                "w-10 h-10 rounded-full text-center text-lg",
                "border-2 border-primary",
                "bg-background text-foreground",
                // Focus styles
                "focus:outline-none focus:ring-[0.5] focus:ring-primary focus:ring-offset-0",
                "focus:border-primary",
                // Hover styles
                "hover:border-primary/80",
                // Disabled styles
                "disabled:opacity-50 disabled:cursor-not-allowed",
                // Transition
                "transition-all duration-200",
                // Error styles
                error &&
                  "!border-destructive focus:!border-destructive focus:!ring-destructive",
                // Active/Filled styles
                digit && "border-primary/90 bg-primary/5",
                // Additional animation for focused state
                focusedIndex === index && "scale-105"
              )}
              aria-label={t("otp.digit", { digit: index + 1 })}
            />
          ))}
        </div>

        {/* Hidden input for React Hook Form */}
        <input
          type="text"
          ref={ref}
          name={name}
          onChange={onChange}
          onBlur={onBlur}
          value={controlledValue || ""}
          style={{ display: "none" }}
          {...props}
        />

        {error && (
          <p className="text-sm text-destructive text-center">
            {typeof error === "string" ? error : t(error.message)}
          </p>
        )}
      </div>
    );
  }
);

CustomOTPInput.displayName = "CustomOTPInput";

export { CustomOTPInput };
