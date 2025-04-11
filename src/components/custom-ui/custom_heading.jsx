import React from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const CustomHeading = React.forwardRef(
  (
    {
      className,
      variant = "default",
      level = "h1",
      weight = "bold",
      align = "left",
      translationKey,
      children,
      ...props
    },
    ref
  ) => {
    const { t } = useTranslation();

    const variants = {
      default: "text-foreground",
      muted: "text-muted-foreground",
      primary: "text-primary",
      destructive: "text-destructive",
    };

    const levels = {
      h1: "text-4xl lg:text-5xl",
      h2: "text-3xl lg:text-4xl",
      h3: "text-2xl lg:text-3xl",
      h4: "text-xl lg:text-2xl",
      h5: "text-lg lg:text-xl",
      h6: "text-base lg:text-lg",
    };

    const weights = {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
      extrabold: "font-extrabold",
    };

    const alignments = {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    };

    const Component = level;

    return (
      <Component
        ref={ref}
        className={cn(
          "tracking-tight",
          variants[variant],
          levels[level],
          weights[weight],
          alignments[align],
          className
        )}
        {...props}
      >
        {translationKey ? t(translationKey) : children}
      </Component>
    );
  }
);

CustomHeading.displayName = "CustomHeading";

export { CustomHeading };
