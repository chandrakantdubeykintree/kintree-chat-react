import React from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react"; // For loading spinner

const CustomButton = React.forwardRef(
  (
    {
      className,
      variant = "default",
      size = "default",
      icon: Icon,
      iconPosition = "left",
      isLoading = false,
      disabled,
      children,
      translationKey,
      type = "button",
      ...props
    },
    ref
  ) => {
    const { t } = useTranslation();

    // Variant styles
    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline:
        "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
    };

    // Size styles
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    };

    // Loading spinner styles
    const LoadingSpinner = () => (
      <Loader2
        className={cn(
          "h-4 w-4 animate-spin",
          iconPosition === "right" ? "ml-2" : "mr-2"
        )}
      />
    );

    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(
          // Base styles
          "inline-flex items-center justify-center rounded-md text-sm font-medium",
          "ring-offset-background transition-colors focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50 rounded-full",
          // Apply variant and size styles
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && iconPosition === "left" && <LoadingSpinner />}
        {!isLoading && Icon && iconPosition === "left" && (
          <Icon className={cn("h-4 w-4", children ? "mr-2" : "")} />
        )}

        {translationKey ? t(translationKey) : children}

        {isLoading && iconPosition === "right" && <LoadingSpinner />}
        {!isLoading && Icon && iconPosition === "right" && (
          <Icon className={cn("h-4 w-4", children ? "ml-2" : "")} />
        )}
      </button>
    );
  }
);

CustomButton.displayName = "CustomButton";

export { CustomButton };
