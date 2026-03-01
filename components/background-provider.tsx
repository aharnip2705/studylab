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

function isDarkColor(hex: string): boolean {
  if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex)) return false;
  const m = hex.slice(1).match(hex.length === 4 ? /(.)/g : /(..)/g);
  if (!m) return false;
  const [r, g, b] = m.map((x) => parseInt(x.length === 1 ? x + x : x, 16));
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.4;
}

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
        document.documentElement.removeAttribute("data-bg-dark");
        document.documentElement.removeAttribute("data-bg-light");
        return;
      }

      document.documentElement.setAttribute("data-custom-bg", "true");
      const isDarkBg =
        s?.type === "fluid" ||
        (s?.type === "solid" && s.value && isDarkColor(s.value as string));
      const isLightBg =
        s?.type === "solid" &&
        s.value &&
        typeof s.value === "string" &&
        /^#[0-9A-Fa-f]+$/.test(s.value) &&
        !isDarkColor(s.value);
      if (isDarkBg) {
        document.documentElement.setAttribute("data-bg-dark", "true");
        document.documentElement.removeAttribute("data-bg-light");
      } else if (isLightBg) {
        document.documentElement.setAttribute("data-bg-light", "true");
        document.documentElement.removeAttribute("data-bg-dark");
      } else {
        document.documentElement.removeAttribute("data-bg-dark");
        document.documentElement.removeAttribute("data-bg-light");
      }

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
      document.documentElement.removeAttribute("data-bg-dark");
      document.documentElement.removeAttribute("data-bg-light");
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
