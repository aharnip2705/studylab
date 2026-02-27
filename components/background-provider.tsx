"use client";

import { useEffect, useState } from "react";
import { getBgSettings } from "./background-settings";

const FLUID_CLASSES: Record<string, string> = {
  "blue-violet": "custom-bg-fluid-blue-violet",
  "emerald-teal": "custom-bg-fluid-emerald-teal",
  "amber-rose": "custom-bg-fluid-amber-rose",
  "violet-fuchsia": "custom-bg-fluid-violet-fuchsia",
  "slate-indigo": "custom-bg-fluid-slate-indigo",
};

const DEFAULT_FLUID = "custom-bg-fluid-blue-violet";

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [style, setStyle] = useState<React.CSSProperties | null>(null);
  const [fluidClass, setFluidClass] = useState<string>(DEFAULT_FLUID);
  const [opacity, setOpacity] = useState(1);
  const [blur, setBlur] = useState(0);
  const [isFluid, setIsFluid] = useState(true);

  useEffect(() => {
    function apply() {
      const s = getBgSettings();
      const op = (s?.opacity ?? 100) / 100;
      const bl = s?.blur ?? 0;
      setOpacity(op);
      setBlur(bl);

      if (s && s.type === "none") {
        setStyle(null);
        setIsFluid(false);
        setFluidClass("");
        document.documentElement.removeAttribute("data-custom-bg");
        return;
      }

      document.documentElement.setAttribute("data-custom-bg", "true");

      if (s?.type === "fluid") {
        setIsFluid(true);
        const variant = (s.value as string) || "blue-violet";
        setFluidClass(FLUID_CLASSES[variant] || FLUID_CLASSES["blue-violet"]);
        setStyle(null);
        return;
      }
      if (s?.type === "solid" && s.value) {
        setIsFluid(false);
        setFluidClass("");
        setStyle({ background: s.value });
        return;
      }
      if (s?.type === "image" && s.value) {
        setIsFluid(false);
        setFluidClass("");
        setStyle({
          backgroundImage: `url(${s.value})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        });
        return;
      }

      // Varsayılan tema: ayar yoksa veya hiç kaydedilmemişse akışkan mavi-mor
      setIsFluid(true);
      setFluidClass(FLUID_CLASSES["blue-violet"]);
      setStyle(null);
    }
    apply();
    window.addEventListener("bg-settings-change", apply);
    return () => {
      window.removeEventListener("bg-settings-change", apply);
      document.documentElement.removeAttribute("data-custom-bg");
    };
  }, []);

  // Her zaman tema katmanını render et (varsayılan veya özel)
  const showLayer = style || fluidClass;
  if (!showLayer) return <>{children}</>;

  return (
    <div className="relative min-h-screen" data-custom-bg-wrap="true">
      <div
        className={`fixed inset-0 z-0 ${isFluid ? fluidClass : ""}`}
        style={
          isFluid
            ? { opacity, filter: blur ? `blur(${blur}px)` : undefined }
            : {
                ...style,
                opacity,
                filter: blur ? `blur(${blur}px)` : undefined,
              }
        }
        aria-hidden
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
