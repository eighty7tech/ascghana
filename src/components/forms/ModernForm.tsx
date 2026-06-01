"use client";

import React, { forwardRef, useState } from "react";
import { cn } from "@/components/ui";

const fieldBase =
  "form-modern form-field-control w-full h-11 rounded-lg border px-3.5 text-sm transition-all outline-none disabled:opacity-50";

const fieldStyle: React.CSSProperties = {
  background: "var(--bg-input)",
  borderColor: "var(--border-color)",
  color: "var(--text-primary)",
  fontFamily: "var(--font-body)",
};

function focusHandlers(hasError?: boolean) {
  return {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      e.currentTarget.style.borderColor = hasError ? "#ef4444" : "var(--color-red)";
      e.currentTarget.style.boxShadow = hasError
        ? "0 0 0 3px rgba(239,68,68,0.15)"
        : "0 0 0 3px rgba(239,1,7,0.12)";
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      e.currentTarget.style.borderColor = hasError ? "#ef4444" : "var(--border-color)";
      e.currentTarget.style.boxShadow = "none";
    },
  };
}

export function FormSection({
  title,
  icon,
  description,
  children,
  className,
}: {
  title: string;
  icon?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("form-section-modern rounded-lg p-5 sm:p-6", className)}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <header className="mb-5">
        <h2
          className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-white"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {icon && <i className={`${icon} text-[11px]`} style={{ color: "var(--color-red)" }} />}
          {title}
        </h2>
        {description && (
          <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
            {description}
          </p>
        )}
      </header>
      {children}
    </section>
  );
}

export function FormField({
  label,
  icon,
  required,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  icon?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("form-field-modern space-y-1.5", className)}>
      <label
        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider"
        style={{ color: "var(--text-muted)", fontFamily: "var(--font-heading)" }}
      >
        {icon && <i className={`${icon} text-[10px]`} style={{ color: "var(--color-red)" }} />}
        {label}
        {required && <span style={{ color: "var(--color-red)" }}>*</span>}
      </label>
      {children}
      {error && (
        <p className="text-[11px] flex items-center gap-1" style={{ color: "#ef4444" }}>
          <i className="fa-solid fa-circle-exclamation text-[9px]" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-[11px]" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

export const FormInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }
>(({ className, error, style, ...p }, ref) => (
  <input
    ref={ref}
    className={cn(fieldBase, className)}
    style={{ ...fieldStyle, ...(error ? { borderColor: "#ef4444" } : {}), ...style }}
    {...focusHandlers(error)}
    {...p}
  />
));
FormInput.displayName = "FormInput";

export const FormTextarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }
>(({ className, error, style, ...p }, ref) => (
  <textarea
    ref={ref}
    className={cn(fieldBase, "h-auto min-h-[88px] py-2.5 resize-y", className)}
    style={{ ...fieldStyle, ...(error ? { borderColor: "#ef4444" } : {}), ...style }}
    {...focusHandlers(error)}
    {...p}
  />
));
FormTextarea.displayName = "FormTextarea";

export const FormSelect = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }
>(({ className, error, style, children, ...p }, ref) => (
  <select
    ref={ref}
    className={cn(fieldBase, className)}
    style={{ ...fieldStyle, ...(error ? { borderColor: "#ef4444" } : {}), ...style }}
    {...focusHandlers(error)}
    {...p}
  >
    {children}
  </select>
));
FormSelect.displayName = "FormSelect";

export function FormPasswordInput({
  value,
  onChange,
  placeholder = "Enter password",
  error,
  autoComplete,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: boolean;
  autoComplete?: string;
  className?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className={cn("relative", className)}>
      <FormInput
        type={show ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        error={error}
        className="pr-11"
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors hover:text-white"
        style={{ color: "var(--text-muted)" }}
        tabIndex={-1}
        aria-label={show ? "Hide password" : "Show password"}
      >
        <i className={`fa-solid text-sm ${show ? "fa-eye-slash" : "fa-eye"}`} />
      </button>
    </div>
  );
}

export function FormCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none group">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="w-4 h-4 rounded flex items-center justify-center transition-all flex-shrink-0"
        style={{
          background: checked ? "var(--color-red)" : "transparent",
          border: `1.5px solid ${checked ? "var(--color-red)" : "rgba(255,255,255,0.25)"}`,
        }}
      >
        {checked && <i className="fa-solid fa-check text-[9px] text-white" />}
      </button>
      <span className="text-sm group-hover:text-white/80 transition-colors" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
        {label}
      </span>
    </label>
  );
}

export function FormErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      className="flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm"
      style={{
        background: "rgba(239,1,7,0.12)",
        border: "1px solid rgba(239,1,7,0.3)",
        color: "#ff6b6b",
      }}
      role="alert"
    >
      <i className="fa-solid fa-circle-exclamation flex-shrink-0" />
      {message}
    </div>
  );
}

export function FormGrid({ children, cols = 2, className }: { children: React.ReactNode; cols?: 1 | 2 | 3; className?: string }) {
  const gridClass = cols === 1 ? "grid-cols-1" : cols === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2";
  return <div className={cn("grid gap-4", gridClass, className)}>{children}</div>;
}
