import React from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const CustomText = React.forwardRef(
  (
    {
      className,
      variant = "default",
      size = "default",
      weight = "normal",
      align = "left",
      truncate,
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
      success: "text-success-foreground",
      destructive: "text-destructive",
    };

    const sizes = {
      xs: "text-xs",
      sm: "text-sm",
      default: "text-base",
      lg: "text-lg",
      xl: "text-xl",
    };

    const weights = {
      light: "font-light",
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    };

    const alignments = {
      left: "text-left",
      center: "text-center",
      right: "text-right",
      justify: "text-justify",
    };

    return (
      <p
        ref={ref}
        className={cn(
          variants[variant],
          sizes[size],
          weights[weight],
          alignments[align],
          truncate && "truncate",
          className
        )}
        {...props}
      >
        {translationKey ? t(translationKey) : children}
      </p>
    );
  }
);

CustomText.displayName = "CustomText";

export { CustomText };
