import { Input } from "../ui/input";
import { cn } from "@/lib/utils";

export default function CustomInput({ children, ...props }) {
  return (
    <div className="relative flex items-center">
      <div className="absolute left-4">{props.icon}</div>
      <Input
        {...props}
        className={cn(
          "rounded-full bg-background",
          "flex w-full rounded-full border border-primary bg-background px-3 py-2",
          "text-sm ring-offset-background",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground",
          // Focus styles
          "focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-0",
          "focus:border-primary",
          // Hover styles
          "hover:border-primary/80",
          props.icon && "pl-10",
          props.className
        )}
      />
      {children}
    </div>
  );
}
