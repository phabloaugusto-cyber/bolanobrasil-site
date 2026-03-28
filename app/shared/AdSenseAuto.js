"use client";

import { useEffect } from "react";

/**
 * AdSense Auto Ads:
 * - Troque pelo seu Publisher ID quando tiver: ca-pub-XXXXXXXXXXXXXXX
 * - Esse script só precisa existir 1x por página (por isso deixei em componente separado).
 */
export default function AdSenseAuto() {
  useEffect(() => {
    const existing = document.querySelector('script[data-adsbygoogle="true"]');
    if (existing) return;

    const s = document.createElement("script");
    s.setAttribute("data-adsbygoogle", "true");
    s.async = true;

    // IMPORTANTE: troque aqui pelo seu ca-pub quando for aprovado
    s.src =
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXX";
    s.crossOrigin = "anonymous";

    document.head.appendChild(s);
  }, []);

  return null;
}
