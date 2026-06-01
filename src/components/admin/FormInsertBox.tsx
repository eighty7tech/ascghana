"use client";

import { cn } from "@/components/ui";

export function FormInsertBox({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("insert-box form-panel-modern", className)}>
      {title && (
        <h3 className="form-label mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>
          {title}
        </h3>
      )}
      {description && (
        <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
          {description}
        </p>
      )}
      {children}
    </div>
  );
}

export function FormGroup({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("form-group", className)}>
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}
