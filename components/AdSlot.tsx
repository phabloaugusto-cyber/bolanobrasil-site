"use client";

import React, { useEffect } from "react";

type AdSlotProps = {
  /** Nome lógico do espaço (ex: top, middle, bottom, sidebar, homeTop, etc.) */
  slot?: string;
  /** Se quiser forçar o layout (altura mínima etc.) */
  minHeight?: number;
  /** Classe opcional */
  className?: string;
  /** Estilo opcional */
  style?: React.CSSProperties;
  /** Texto opcional no placeholder */
  label?: string;
};

/**
 * AdSlot:
 * - Enquanto o AdSense não estiver ativo: mostra um placeholder bonito (não quebra layout).
 * - Quando você ativar AdSense: você só troca o conteúdo interno (ins/adsbygoogle).
 */
export default function AdSlot({
  slot = "generic",
  minHeight,
  className,
  style,
  label,
}: AdSlotProps) {
  // Se no futuro você colocar AdSense aqui, esse efeito pode acionar adsbygoogle:
  useEffect(() => {
    // Não faz nada por enquanto para não quebrar.
    // Quando ativar AdSense, a gente liga isso com segurança.
  }, []);

  const preset = getPreset(slot);

  const finalMinHeight =
    typeof minHeight === "number" ? minHeight : preset.minHeight;

  const text =
    label ||
    preset.label ||
    `ESPAÇO PARA ANÚNCIO (${slot.toUpperCase()})`;

  return (
    <div
      className={className}
      style={{
        width: "100%",
        border: "1px dashed rgba(255,255,255,0.20)",
        borderRadius: 12,
        background: "rgba(255,255,255,0.03)",
        color: "rgba(255,255,255,0.70)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "14px 12px",
        minHeight: finalMinHeight,
        letterSpacing: 0.2,
        ...style,
      }}
      aria-label={`Ad slot ${slot}`}
      role="region"
    >
      <div style={{ lineHeight: 1.35 }}>
        <div style={{ fontWeight: 700, color: "rgba(255,255,255,0.82)" }}>
          {text}
        </div>
        <div style={{ fontSize: 12, marginTop: 6, opacity: 0.85 }}>
          {preset.hint}
        </div>
      </div>
    </div>
  );
}

function getPreset(slotRaw: string) {
  const slot = (slotRaw || "").toLowerCase().trim();

  // Presets “bonitos” só pra manter consistência visual
  if (slot.includes("sidebar")) {
    return {
      minHeight: 600,
      label: "ESPAÇO PARA ANÚNCIO (SIDEBAR)",
      hint: "300×600 / 160×600 (desktop) • responsivo",
    };
  }
  if (slot.includes("top") || slot.includes("header")) {
    return {
      minHeight: 90,
      label: "ESPAÇO PARA ANÚNCIO (TOP)",
      hint: "728×90 (desktop) • responsivo",
    };
  }
  if (slot.includes("bottom") || slot.includes("footer")) {
    return {
      minHeight: 90,
      label: "ESPAÇO PARA ANÚNCIO (BOTTOM)",
      hint: "responsivo • pode ser âncora no mobile",
    };
  }
  if (slot.includes("middle") || slot.includes("incontent")) {
    return {
      minHeight: 120,
      label: "ESPAÇO PARA ANÚNCIO (MEIO DO CONTEÚDO)",
      hint: "in-article responsivo (bom para posts)",
    };
  }

  return {
    minHeight: 120,
    label: "ESPAÇO PARA ANÚNCIO",
    hint: "responsivo",
  };
}
