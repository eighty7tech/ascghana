"use client";
import { useApp } from "@/context/AppContext";
export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { settings } = useApp();
  if ((settings as any).maintenanceMode) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0508" }}>
        <div className="text-center px-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(239,1,7,0.15)", border: "2px solid rgba(239,1,7,0.3)" }}>
            <i className="fa-solid fa-wrench text-2xl" style={{ color: "#EF0107" }} />
          </div>
          <h1 className="text-3xl font-black text-white mb-3" style={{ fontFamily: "var(--font-display)" }}>UNDER MAINTENANCE</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            {(settings as any).maintenanceMessage || "We'll be back shortly. Victoria Concordia Crescit."}
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
