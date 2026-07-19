import { cn } from "@/lib/cn";
import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, id, children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-ink-800">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            "rounded-xl border border-sun-200 bg-white px-3.5 py-2.5 text-sm text-ink-900",
            "focus:outline-none focus:ring-2 focus:ring-clay-400 focus:border-clay-400",
            error && "border-danger focus:ring-danger",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    );
  },
);

Select.displayName = "Select";
