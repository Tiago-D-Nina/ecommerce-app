import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          variant === "primary"
            ? "bg-primary-600 text-white hover:bg-primary-700"
            : variant === "secondary"
            ? "bg-secondary-100 text-secondary-700 hover:bg-secondary-200"
            : variant === "outline"
            ? "border border-input text-gray-600 hover:bg-accent hover:text-accent-foreground"
            : variant === "ghost"
            ? "hover:bg-accent hover:text-accent-foreground"
            : "",
          size === "sm"
            ? "h-9 px-3 text-sm"
            : size === "md"
            ? "h-10 py-2 px-4"
            : size === "lg"
            ? "h-11 px-8"
            : "",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
