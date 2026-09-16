import type { ComponentProps } from "react";
export function DataSelect({
  label,
  children,
  ...props
}: ComponentProps<"select"> & { label: string }) {
  return (
    <label className="grid min-w-0 gap-1 text-sm">
      <span>{label}</span>
      <select
        {...props}
        className="h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {children}
      </select>
    </label>
  );
}
