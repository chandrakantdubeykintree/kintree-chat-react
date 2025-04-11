import React from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const CustomInput = React.forwardRef(
  (
    {
      className,
      label,
      icon: Icon,
      error,
      height = "h-10",
      width = "w-full",
      containerClassName,
      ...props
    },
    ref
  ) => {
    const { t } = useTranslation();

    return (
      <div
        className={cn("flex flex-col gap-1.5 rounded-full", containerClassName)}
      >
        {label && (
          <label
            htmlFor={props.id}
            className="text-sm font-medium text-foreground"
          >
            {t(label)}
          </label>
        )}

        <div className={cn("relative flex items-center", width)}>
          {Icon && (
            <div className="absolute left-3 text-muted-foreground">
              <Icon className="h-5 w-5" />
            </div>
          )}

          <input
            ref={ref}
            className={cn(
              // Base styles
              "flex w-full rounded-full border border-primary bg-background px-3 py-2",
              "text-sm ring-offset-background",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              "placeholder:text-muted-foreground",
              // Focus styles
              "focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-0",
              "focus:border-primary",
              // Hover styles
              "hover:border-primary/80",
              // Icon padding
              Icon && "pl-10",
              // Error styles
              error &&
                "!border-destructive focus:!ring-destructive focus:!border-destructive",
              // Additional styles
              height,
              className
            )}
            {...props}
          />
        </div>

        {error && (
          <p className="text-xs text-destructive">{t(error.message)}</p>
        )}
      </div>
    );
  }
);
CustomInput.displayName = "CustomInput";

export { CustomInput };
