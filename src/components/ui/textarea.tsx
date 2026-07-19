import { cn } from "@/lib/cn";
import { forwardRef, type TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-ink-800">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          rows={4}
          className={cn(
            "rounded-xl border border-sun-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400",
            "focus:outline-none focus:ring-2 focus:ring-clay-400 focus:border-clay-400",
            error && "border-danger focus:ring-danger",
            className,
          )}
          {...props}
        />
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
