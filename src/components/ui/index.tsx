/**
 * Arsenal SC Ghana — shadcn/ui Component Library v2.0
 * Built on Radix UI primitives, styled with CSS variables
 * Works in both light (frontend) and dark (admin) contexts
 */
"use client";
import React, { forwardRef } from "react";
import Link from "next/link";
import RichTextEditor from "@/components/RichTextEditor";
import * as RadixDialog       from "@radix-ui/react-dialog";
import * as RadixSelect        from "@radix-ui/react-select";
import * as RadixSwitch        from "@radix-ui/react-switch";
import * as RadixTabs          from "@radix-ui/react-tabs";
import * as RadixProgress      from "@radix-ui/react-progress";
import * as RadixDropdown      from "@radix-ui/react-dropdown-menu";
import * as RadixAvatar        from "@radix-ui/react-avatar";
import * as RadixSeparator     from "@radix-ui/react-separator";
import * as RadixTooltip       from "@radix-ui/react-tooltip";
import * as RadixAccordion     from "@radix-ui/react-accordion";
import * as RadixLabel         from "@radix-ui/react-label";
import * as RadixCheckbox      from "@radix-ui/react-checkbox";
import * as RadixScrollArea    from "@radix-ui/react-scroll-area";
import * as RadixAlertDialog   from "@radix-ui/react-alert-dialog";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

// ── CARD ────────────────────────────────────────────────────────────────────
export const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...p }, ref) => (
    <div ref={ref} className={cn("rounded-md border bg-[var(--bg-card)] shadow-[var(--shadow-card)]", className)}
      style={{ borderColor:"var(--border-color)" }} {...p} />
  )
);
Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...p }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-1 px-5 py-4 border-b", className)}
      style={{ borderColor:"var(--border-color)" }} {...p} />
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...p }, ref) => (
    <h3 ref={ref} className={cn("text-sm font-bold uppercase tracking-wide", className)}
      style={{ fontFamily:"var(--font-heading)", color:"var(--text-primary)" }} {...p} />
  )
);
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...p }, ref) => (
    <p ref={ref} className={cn("text-xs", className)} style={{ color:"var(--text-muted)", fontFamily:"var(--font-body)" }} {...p} />
  )
);
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...p }, ref) => (
    <div ref={ref} className={cn("p-5", className)} {...p} />
  )
);
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...p }, ref) => (
    <div ref={ref} className={cn("flex items-center px-5 py-4 border-t", className)}
      style={{ borderColor:"var(--border-color)" }} {...p} />
  )
);
CardFooter.displayName = "CardFooter";

// ── BUTTON ──────────────────────────────────────────────────────────────────
type BtnVariant = "primary"|"secondary"|"ghost"|"danger"|"gold"|"outline"|"link";
type BtnSize    = "xs"|"sm"|"md"|"lg"|"icon";

const btnVariants: Record<BtnVariant, string> = {
  primary:   "text-white hover:opacity-90",
  secondary: "hover:opacity-80",
  ghost:     "hover:bg-[var(--bg-card-hover)]",
  danger:    "hover:opacity-90",
  gold:      "text-[#1A0A0A] hover:opacity-90",
  outline:   "border hover:bg-[var(--bg-card-hover)]",
  link:      "underline-offset-4 hover:text-[var(--color-red-dark)] h-auto p-0",
};
const btnStyles: Record<BtnVariant, React.CSSProperties> = {
  primary:   { background:"var(--color-red)", color:"#fff", boxShadow:"0 2px 8px rgba(239,1,7,0.22)" },
  secondary: { background:"var(--border-color)", color:"var(--text-secondary)" },
  ghost:     { background:"transparent", color:"var(--text-secondary)" },
  danger:    { background:"rgba(239,68,68,0.08)", color:"#dc2626", border:"1px solid rgba(239,68,68,0.2)" },
  gold:      { background:"linear-gradient(135deg,#C6A84B,#E8C97A)", color:"#1A0A0A", boxShadow:"0 2px 8px rgba(198,168,75,0.22)" },
  outline:   { background:"transparent", color:"var(--color-red)", borderColor:"var(--color-red)" },
  link:      { background:"transparent", color:"var(--color-red)" },
};
const btnSizes: Record<BtnSize, string> = {
  xs:   "h-6  px-2   text-[10px] gap-1",
  sm:   "h-8  px-3   text-xs     gap-1.5",
  md:   "h-10 px-5   text-sm     gap-2",
  lg:   "h-12 px-7   text-sm     gap-2",
  icon: "h-9 w-9",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant; size?: BtnSize;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant="primary", size="md", disabled, style, children, ...p }, ref) => (
    <button ref={ref} disabled={disabled}
      className={cn("inline-flex items-center justify-center font-bold tracking-wide rounded transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed select-none", btnVariants[variant], btnSizes[size], className)}
      style={{ fontFamily:"var(--font-heading)", letterSpacing:"0.05em", ...btnStyles[variant], ...style }}
      {...p}>
      {children}
    </button>
  )
);
Button.displayName = "Button";

// ── INPUT ───────────────────────────────────────────────────────────────────
export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, style, ...p }, ref) => (
    <input ref={ref}
      className={cn("form-modern form-input flex h-11 w-full rounded-md border px-3.5 text-sm transition-all outline-none disabled:opacity-50", className)}
      style={{ background:"var(--bg-input)", borderColor:"var(--border-color)", color:"var(--text-primary)", fontFamily:"var(--font-body)", boxShadow:"inset 0 1px 2px rgba(0,0,0,0.04)", ...style }}
      onFocus={e=>{e.currentTarget.style.borderColor="var(--color-red)";e.currentTarget.style.boxShadow="0 0 0 3px rgba(239,1,7,0.08)";}}
      onBlur={e=>{e.currentTarget.style.borderColor="var(--border-color)";e.currentTarget.style.boxShadow="none";}}
      {...p} />
  )
);
Input.displayName = "Input";

// ── TEXTAREA ────────────────────────────────────────────────────────────────
export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...p }, ref) => (
    <textarea ref={ref}
      className={cn("form-modern form-input flex w-full rounded-md border px-3.5 py-2.5 text-sm transition-all outline-none resize-y min-h-[88px]", className)}
      style={{ background:"var(--bg-input)", borderColor:"var(--border-color)", color:"var(--text-primary)", fontFamily:"var(--font-body)" }}
      onFocus={e=>{e.currentTarget.style.borderColor="var(--color-red)";e.currentTarget.style.boxShadow="0 0 0 3px rgba(239,1,7,0.08)";}}
      onBlur={e=>{e.currentTarget.style.borderColor="var(--border-color)";e.currentTarget.style.boxShadow="none";}}
      {...p} />
  )
);
Textarea.displayName = "Textarea";

// ── LABEL ───────────────────────────────────────────────────────────────────
export const Label = forwardRef<HTMLLabelElement, React.ComponentPropsWithoutRef<typeof RadixLabel.Root>>(
  ({ className, ...p }, ref) => (
    <RadixLabel.Root ref={ref}
      className={cn("block text-xs font-semibold uppercase tracking-wider mb-1.5 leading-none", className)}
      style={{ color:"var(--text-muted)", fontFamily:"var(--font-heading)" }} {...p} />
  )
);
Label.displayName = "Label";


// ── NATIVE SELECT (default, backward-compatible) ────────────────────────────
export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...p }, ref) => (
    <select ref={ref}
      className={cn("flex h-10 w-full rounded border px-3 text-sm outline-none transition-all disabled:opacity-50", className)}
      style={{ background:"var(--bg-input)", borderColor:"var(--border-color)", color:"var(--text-primary)", fontFamily:"var(--font-body)" }}
      onFocus={e=>{e.currentTarget.style.borderColor="var(--color-red)";}}
      onBlur={e=>{e.currentTarget.style.borderColor="var(--border-color)";}}
      {...p}>
      {children}
    </select>
  )
);
Select.displayName = "Select";


// ── SWITCH (Radix) ──────────────────────────────────────────────────
interface SwitchProps {
  checked?: boolean; onCheckedChange?: (v:boolean)=>void;
  onChange?: ((v:boolean)=>void) | (()=>void);
  label?: string; id?: string; disabled?: boolean;
}
export function Switch({ checked, onCheckedChange, onChange, label, id, disabled }: SwitchProps) {
  const handleChange = (v: boolean) => {
    if (onCheckedChange) onCheckedChange(v);
    else if (onChange) {
      if (onChange.length > 0) (onChange as (v:boolean)=>void)(v);
      else (onChange as ()=>void)();
    }
  };
  return (
    <div className="flex items-center gap-3">
      <RadixSwitch.Root checked={checked} onCheckedChange={handleChange} disabled={disabled} id={id}
        className="relative w-11 h-6 rounded-full transition-colors outline-none focus:ring-2 focus:ring-[var(--color-red)]/30 disabled:opacity-40"
        style={{ background: checked ? "var(--color-red)" : "var(--border-color)" }}>
        <RadixSwitch.Thumb
          className="block w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 will-change-transform data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-0.5" />
      </RadixSwitch.Root>
      {label && <label htmlFor={id} className="text-sm cursor-pointer" style={{color:"var(--text-secondary)",fontFamily:"var(--font-body)"}}>{label}</label>}
    </div>
  );
}

// ── CHECKBOX (Radix) ────────────────────────────────────────────────────────
interface CheckboxProps {
  checked?: boolean; onCheckedChange?: (v:boolean)=>void;
  label?: string; id?: string; disabled?: boolean;
}
export function Checkbox({ checked, onCheckedChange, label, id, disabled }: CheckboxProps) {
  return (
    <div className="flex items-center gap-2">
      <RadixCheckbox.Root checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} id={id}
        className="w-4 h-4 rounded border flex items-center justify-center transition-colors outline-none focus:ring-2 focus:ring-[var(--color-red)]/30 disabled:opacity-40"
        style={{ background:checked?"var(--color-red)":"var(--bg-input)", borderColor:checked?"var(--color-red)":"var(--border-color)" }}>
        <RadixCheckbox.Indicator>
          <i className="fa-solid fa-check text-[10px] text-white" />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      {label && <label htmlFor={id} className="text-sm cursor-pointer" style={{color:"var(--text-secondary)"}}>{label}</label>}
    </div>
  );
}

// ── BADGE ───────────────────────────────────────────────────────────────────
type BadgeVariant = "default"|"success"|"warning"|"danger"|"info"|"gold"|"outline"|"red";
const badgeStyles: Record<BadgeVariant, React.CSSProperties> = {
  default:  { background:"var(--border-color)", color:"var(--text-secondary)" },
  success:  { background:"rgba(34,197,94,0.10)", color:"#16a34a" },
  warning:  { background:"rgba(245,158,11,0.10)", color:"#b45309" },
  danger:   { background:"rgba(239,1,7,0.08)", color:"var(--color-red)" },
  info:     { background:"rgba(59,130,246,0.10)", color:"#2563eb" },
  gold:     { background:"rgba(198,168,75,0.12)", color:"var(--color-gold-dark)" },
  outline:  { border:"1px solid var(--border-color)", color:"var(--text-muted)", background:"transparent" },
  red:      { background:"var(--color-red)", color:"#fff" },
};
export function Badge({ className, variant="default", style, children, ...p }: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wide", className)}
      style={{ fontFamily:"var(--font-heading)", ...badgeStyles[variant], ...style }} {...p}>
      {children}
    </span>
  );
}

// ── PROGRESS (Radix) ────────────────────────────────────────────────────────
export function Progress({ value=0, className, color="var(--color-red)" }: { value?: number; className?: string; color?: string }) {
  return (
    <RadixProgress.Root className={cn("relative h-2 w-full overflow-hidden rounded-full", className)}
      style={{ background:"var(--border-color)" }} value={value}>
      <RadixProgress.Indicator className="h-full w-full flex-1 transition-all duration-500"
        style={{ background:color, transform:`translateX(-${100-(Math.min(value,100))}%)` }} />
    </RadixProgress.Root>
  );
}

// ── SEPARATOR ───────────────────────────────────────────────────────────────
export function Separator({ orientation="horizontal", className }: { orientation?: "horizontal"|"vertical"; className?: string }) {
  return (
    <RadixSeparator.Root orientation={orientation}
      className={cn("shrink-0", orientation==="horizontal" ? "h-px w-full" : "h-full w-px", className)}
      style={{ background:"var(--border-color)" }} />
  );
}

// ── TABS (Radix) ─────────────────────────────────────────────────────────────
export const Tabs = RadixTabs.Root;
export function TabsList({ className, ...p }: React.ComponentPropsWithoutRef<typeof RadixTabs.List>) {
  return (
    <RadixTabs.List className={cn("flex border-b", className)} style={{ borderColor:"var(--border-color)" }} {...p} />
  );
}
export function TabsTrigger({ className, ...p }: React.ComponentPropsWithoutRef<typeof RadixTabs.Trigger>) {
  return (
    <RadixTabs.Trigger {...p}
      className={cn("relative px-5 py-3 text-sm font-bold transition-colors whitespace-nowrap outline-none",
        "data-[state=active]:text-[var(--color-red)] data-[state=inactive]:text-[var(--text-muted)]",
        "data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-[var(--color-red)] data-[state=active]:after:content-['']",
        className)}
      style={{ fontFamily:"var(--font-heading)" }} />
  );
}
export function TabsContent({ className, ...p }: React.ComponentPropsWithoutRef<typeof RadixTabs.Content>) {
  return <RadixTabs.Content className={cn("mt-4 outline-none", className)} {...p} />;
}

// Legacy TabBar for existing code
export function TabBar({ tabs, active, onChange }: { tabs:{id:string;label:string;icon?:string;count?:number}[]; active:string; onChange:(id:string)=>void }) {
  return (
    <div className="flex border-b" style={{ borderColor:"var(--border-color)" }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className="relative px-5 py-3 text-sm font-bold transition-colors whitespace-nowrap outline-none"
          style={{ color:active===t.id?"var(--color-red)":"var(--text-muted)", fontFamily:"var(--font-heading)" }}>
          {t.icon && <i className={`${t.icon} mr-1.5 text-xs`} />}
          {t.label}
          {t.count !== undefined && (
            <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded-full font-bold"
              style={{ background:active===t.id?"var(--color-red)":"var(--border-color)", color:active===t.id?"#fff":"var(--text-muted)" }}>
              {t.count}
            </span>
          )}
          {active === t.id && <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background:"var(--color-red)" }} />}
        </button>
      ))}
    </div>
  );
}

// ── ACCORDION (Radix) ───────────────────────────────────────────────────────
export const Accordion = RadixAccordion.Root;
export function AccordionItem({ className, ...p }: React.ComponentPropsWithoutRef<typeof RadixAccordion.Item>) {
  return <RadixAccordion.Item className={cn("border-b", className)} style={{ borderColor:"var(--border-color)" }} {...p} />;
}
export function AccordionTrigger({ className, children, ...p }: React.ComponentPropsWithoutRef<typeof RadixAccordion.Trigger>) {
  return (
    <RadixAccordion.Header>
      <RadixAccordion.Trigger {...p}
        className={cn("flex w-full items-center justify-between py-4 font-bold text-sm transition-all outline-none [&[data-state=open]>i]:rotate-180", className)}
        style={{ color:"var(--text-primary)", fontFamily:"var(--font-heading)" }}>
        {children}
        <i className="fa-solid fa-chevron-down text-[11px] transition-transform duration-200" style={{color:"var(--text-muted)"}} />
      </RadixAccordion.Trigger>
    </RadixAccordion.Header>
  );
}
export function AccordionContent({ className, children, ...p }: React.ComponentPropsWithoutRef<typeof RadixAccordion.Content>) {
  return (
    <RadixAccordion.Content className={cn("overflow-hidden text-sm animate-accordion-down data-[state=closed]:animate-accordion-up", className)} {...p}>
      <div className="pb-4" style={{ color:"var(--text-secondary)" }}>{children}</div>
    </RadixAccordion.Content>
  );
}

// ── DIALOG (Radix) ─── used as Modal ────────────────────────────────────────
interface ModalProps { open: boolean; onClose: ()=>void; title: string; children: React.ReactNode; size?: "sm"|"md"|"lg"|"xl"; description?: string; }
export function Modal({ open, onClose, title, children, size="md", description }: ModalProps) {
  const widths = { sm:"max-w-sm", md:"max-w-lg", lg:"max-w-2xl", xl:"max-w-4xl" };
  return (
    <RadixDialog.Root open={open} onOpenChange={v=>!v&&onClose()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <RadixDialog.Content
          className={cn("fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] rounded-md border shadow-[var(--shadow-lg)] overflow-hidden", widths[size],
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95")}
          style={{ background:"var(--bg-card)", borderColor:"var(--border-color)", maxHeight:"90vh", overflowY:"auto" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor:"var(--border-color)" }}>
            <div>
              <RadixDialog.Title className="font-bold text-base" style={{ fontFamily:"var(--font-display)", color:"var(--text-primary)" }}>{title}</RadixDialog.Title>
              {description && <RadixDialog.Description className="text-xs mt-0.5" style={{ color:"var(--text-muted)" }}>{description}</RadixDialog.Description>}
            </div>
            <RadixDialog.Close asChild>
              <button className="w-8 h-8 rounded flex items-center justify-center transition-colors hover:bg-[var(--bg-card-hover)]" style={{ color:"var(--text-muted)" }}>
                <i className="fa-solid fa-xmark" />
              </button>
            </RadixDialog.Close>
          </div>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

// ── ALERT DIALOG ─────────────────────────────────────────────────────────────
interface AlertDialogProps { open: boolean; onConfirm: ()=>void; onCancel: ()=>void; title: string; description?: string; confirmLabel?: string; }
export function AlertDialog({ open, onConfirm, onCancel, title, description, confirmLabel="Delete" }: AlertDialogProps) {
  return (
    <RadixAlertDialog.Root open={open}>
      <RadixAlertDialog.Portal>
        <RadixAlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <RadixAlertDialog.Content
          className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-w-md rounded-md border p-6 shadow-[var(--shadow-lg)]"
          style={{ background:"var(--bg-card)", borderColor:"var(--border-color)" }}>
          <RadixAlertDialog.Title className="font-bold text-base mb-2" style={{ color:"var(--text-primary)", fontFamily:"var(--font-heading)" }}>{title}</RadixAlertDialog.Title>
          {description && <RadixAlertDialog.Description className="text-sm mb-5" style={{ color:"var(--text-muted)" }}>{description}</RadixAlertDialog.Description>}
          <div className="flex gap-3 justify-end">
            <RadixAlertDialog.Cancel asChild>
              <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
            </RadixAlertDialog.Cancel>
            <RadixAlertDialog.Action asChild>
              <Button variant="danger" size="sm" onClick={onConfirm}>{confirmLabel}</Button>
            </RadixAlertDialog.Action>
          </div>
        </RadixAlertDialog.Content>
      </RadixAlertDialog.Portal>
    </RadixAlertDialog.Root>
  );
}

// ── TOOLTIP (Radix) ─────────────────────────────────────────────────────────
export function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  return (
    <RadixTooltip.Provider>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            className="rounded px-3 py-1.5 text-xs font-medium shadow-md z-50"
            style={{ background:"#1A0A0A", color:"#fff", fontFamily:"var(--font-body)" }}
            sideOffset={4}>
            {content}
            <RadixTooltip.Arrow style={{ fill:"#1A0A0A" }} />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}

// ── DROPDOWN MENU (Radix) ────────────────────────────────────────────────────
export const DropdownMenu       = RadixDropdown.Root;
export const DropdownMenuTrigger = RadixDropdown.Trigger;
export function DropdownMenuContent({ className, children, ...p }: React.ComponentPropsWithoutRef<typeof RadixDropdown.Content>) {
  return (
    <RadixDropdown.Portal>
      <RadixDropdown.Content
        className={cn("z-50 min-w-[160px] overflow-hidden rounded-md border p-1 shadow-[var(--shadow-lg)]", className)}
        style={{ background:"var(--bg-card)", borderColor:"var(--border-color)" }} sideOffset={4} {...p}>
        {children}
      </RadixDropdown.Content>
    </RadixDropdown.Portal>
  );
}
export function DropdownMenuItem({ className, children, ...p }: React.ComponentPropsWithoutRef<typeof RadixDropdown.Item>) {
  return (
    <RadixDropdown.Item
      className={cn("flex items-center gap-2 rounded px-3 py-2 text-sm cursor-pointer outline-none data-[highlighted]:bg-[var(--bg-card-hover)]", className)}
      style={{ color:"var(--text-primary)", fontFamily:"var(--font-body)" }} {...p}>
      {children}
    </RadixDropdown.Item>
  );
}
export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <RadixDropdown.Separator className={cn("my-1 h-px", className)} style={{ background:"var(--border-color)" }} />;
}
export const DropdownMenuLabel = RadixDropdown.Label;

// ── AVATAR (Radix) ──────────────────────────────────────────────────────────
interface AvatarProps { src?: string; fallback: string; size?: number; color?: string; className?: string; }
export function Avatar({ src, fallback, size=36, color="#EF0107", className }: AvatarProps) {
  return (
    <RadixAvatar.Root className={cn("relative inline-flex items-center justify-center overflow-hidden rounded-full select-none", className)}
      style={{ width:size, height:size, background:`${color}18` }}>
      {src && <RadixAvatar.Image src={src} alt={fallback} className="w-full h-full object-cover" />}
      <RadixAvatar.Fallback
        className="flex items-center justify-center font-bold"
        style={{ color, fontFamily:"var(--font-heading)", fontSize:size*0.38 }}>
        {fallback.slice(0,2).toUpperCase()}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
}

// ── SCROLL AREA (Radix) ─────────────────────────────────────────────────────
export function ScrollArea({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <RadixScrollArea.Root className={cn("overflow-hidden", className)} style={style}>
      <RadixScrollArea.Viewport className="w-full h-full">
        {children}
      </RadixScrollArea.Viewport>
      <RadixScrollArea.Scrollbar orientation="vertical" className="flex select-none touch-none p-0.5 w-2 transition-colors">
        <RadixScrollArea.Thumb className="flex-1 rounded-full" style={{ background:"var(--border-color)" }} />
      </RadixScrollArea.Scrollbar>
    </RadixScrollArea.Root>
  );
}

// ── STAT CARD ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon, color="#EF0107", change, up, subvalue, href, light }: { label:string; value:string|number; icon:string; color?:string; change?:string; up?:boolean; subvalue?:string; href?:string; light?:boolean }) {
  const inner = (
    <div className={`stat-card relative overflow-hidden rounded-md border p-5 ${light ? "stat-card-light" : ""} ${href ? "transition-transform hover:-translate-y-0.5 cursor-pointer" : ""}`} style={{ background: light ? "#EEEEEE" : "var(--bg-card)", borderColor:"var(--border-color)", boxShadow:"var(--shadow-card)", borderTop:`2px solid ${color}` }}>
      <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-40"
        style={{ background:`radial-gradient(circle at top right, ${color}20 0%, transparent 65%)` }} />
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color:"var(--text-muted)", fontFamily:"var(--font-heading)" }}>{label}</p>
        <div className="w-9 h-9 rounded flex items-center justify-center" style={{ background:`${color}12` }}>
          <i className={`${icon} text-sm`} style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-black mb-0.5" style={{ fontFamily:"var(--font-display)", color:"var(--text-primary)" }}>{value}</p>
      {subvalue && <p className="text-xs" style={{ color:"var(--text-muted)" }}>{subvalue}</p>}
      {change && (
        <p className="text-xs mt-1 flex items-center gap-1" style={{ color:up?"#16a34a":"var(--text-muted)" }}>
          {up !== undefined && <i className={`fa-solid ${up?"fa-arrow-trend-up":"fa-circle-dot"} text-[9px]`} />}
          {change}
        </p>
      )}
    </div>
  );
  if (href) return <Link href={href} className="block no-underline">{inner}</Link>;
  return inner;
}

// ── DATA TABLE ────────────────────────────────────────────────────────────────
export function Table({ children, className }: { children:React.ReactNode; className?:string }) {
  return <div className={cn("w-full overflow-x-auto", className)}><table className="w-full border-collapse">{children}</table></div>;
}
export function Thead({ children }: { children: React.ReactNode }) {
  return <thead><tr style={{ background:"var(--bg-card-alt)", borderBottom:`1px solid var(--border-color)` }}>{children}</tr></thead>;
}
export function Th({ children, className, ...p }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider whitespace-nowrap", className)} style={{ color:"var(--text-muted)", fontFamily:"var(--font-heading)" }} {...p}>{children}</th>;
}
export function Tbody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}
export function Tr({ children, className, onClick, style }: { children:React.ReactNode; className?:string; onClick?:()=>void; style?:React.CSSProperties }) {
  return (
    <tr onClick={onClick}
      style={{ borderColor:"var(--border-color)", ...style }}
      className={cn("border-b transition-colors", onClick&&"cursor-pointer", className)}
      onMouseEnter={e=>{ if(onClick)(e.currentTarget as HTMLElement).style.background="var(--bg-card-hover)"; }}
      onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.background="transparent"; }}>
      {children}
    </tr>
  );
}
export function Td({ children, className, ...p }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3 text-sm", className)} style={{ color:"var(--text-secondary)" }} {...p}>{children}</td>;
}

// ── FORM GROUP ────────────────────────────────────────────────────────────────
export function FormGroup({ label, icon, children, hint, className }: { label:string; icon?:string; children:React.ReactNode; hint?:string; className?:string }) {
  return (
    <div className={cn("form-group", className)}>
      <Label>{icon && <i className={`${icon} mr-1.5 text-[10px]`} style={{ color:"var(--color-red)" }} />}{label}</Label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="text-[11px] mt-1.5" style={{ color:"var(--text-muted)", fontFamily:"var(--font-body)" }}>{hint}</p>}
    </div>
  );
}

/** Rich text for long-form admin / content fields */
export function RichTextField({
  value,
  onChange,
  placeholder,
  minHeight = 200,
  maxLength,
  readOnly,
  className,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxLength?: number;
  readOnly?: boolean;
  className?: string;
}) {
  return (
    <RichTextEditor
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      minHeight={minHeight}
      maxLength={maxLength}
      readOnly={readOnly}
      className={cn("form-rte", className)}
    />
  );
}

// ── EMPTY STATE ────────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, desc, action }: { icon:string; title:string; desc?:string; action?:React.ReactNode }) {
  return (
    <div className="py-16 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5" style={{ background:"var(--border-color)" }}>
        <i className={`${icon} text-xl`} style={{ color:"var(--text-muted)" }} />
      </div>
      <p className="font-bold text-base mb-1" style={{ color:"var(--text-primary)", fontFamily:"var(--font-heading)" }}>{title}</p>
      {desc && <p className="text-sm mb-5 max-w-xs mx-auto" style={{ color:"var(--text-muted)" }}>{desc}</p>}
      {action}
    </div>
  );
}

// ── SEARCH INPUT ──────────────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder="Search..." }: { value:string; onChange:(v:string)=>void; placeholder?:string }) {
  return (
    <div className="relative flex-1 min-w-[180px]">
      <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style={{ color:"var(--text-muted)" }} />
      <Input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="pl-8" />
    </div>
  );
}

// ── ALERT ─────────────────────────────────────────────────────────────────────
type AlertVariant = "info"|"success"|"warning"|"error";
const alertStyles: Record<AlertVariant,{bg:string;border:string;icon:string;color:string}> = {
  info:    { bg:"rgba(59,130,246,0.06)",  border:"rgba(59,130,246,0.20)",  icon:"fa-solid fa-circle-info",         color:"#2563eb" },
  success: { bg:"rgba(34,197,94,0.06)",   border:"rgba(34,197,94,0.20)",   icon:"fa-solid fa-circle-check",        color:"#16a34a" },
  warning: { bg:"rgba(245,158,11,0.06)",  border:"rgba(245,158,11,0.20)",  icon:"fa-solid fa-triangle-exclamation",color:"#b45309" },
  error:   { bg:"rgba(239,1,7,0.06)",     border:"rgba(239,1,7,0.20)",     icon:"fa-solid fa-circle-exclamation",  color:"var(--color-red)" },
};
export function Alert({ variant="info", title, children }: { variant?: AlertVariant; title?: string; children: React.ReactNode }) {
  const s = alertStyles[variant];
  return (
    <div className="flex gap-3 p-4 rounded" style={{ background:s.bg, border:`1px solid ${s.border}` }}>
      <i className={`${s.icon} mt-0.5 flex-shrink-0 text-sm`} style={{ color:s.color }} />
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-bold mb-0.5" style={{ color:s.color, fontFamily:"var(--font-heading)" }}>{title}</p>}
        <div className="text-sm leading-relaxed" style={{ color:"var(--text-secondary)" }}>{children}</div>
      </div>
    </div>
  );
}

// ── PAGE HEADER (admin) ───────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }: { title:string; subtitle?:string; actions?:React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <span className="section-red-line" />
        <h1 className="text-2xl font-black" style={{ fontFamily:"var(--font-display)", color:"var(--text-primary)" }}>{title}</h1>
        {subtitle && <p className="text-sm mt-0.5" style={{ color:"var(--text-muted)" }}>{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
