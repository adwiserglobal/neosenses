"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

/**
 * Camada visual do botão flutuante do Concierge.
 *
 * O painel e toda a lógica do chat continuam em AIConcierge. Este componente
 * só substitui visualmente o botão original, acionando o mesmo toggle por
 * baixo. Assim a mudança do avatar não interfere em conversa, estado ou API.
 */
export function ConciergeMonkLauncher() {
  const [open, setOpen] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const nativeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const nativeButton = document.getElementById("ai-concierge-toggle") as HTMLButtonElement | null;
    nativeButtonRef.current = nativeButton;
    if (!nativeButton) return;

    const sync = () => setOpen(nativeButton.getAttribute("aria-expanded") === "true");
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(nativeButton, {
      attributes: true,
      attributeFilter: ["aria-expanded"],
    });

    return () => observer.disconnect();
  }, []);

  // O AIConcierge devolve o foco ao toggle original quando fecha por Escape.
  // Como ele está visualmente oculto, trazemos o foco de volta ao novo botão.
  useEffect(() => {
    if (!open) return;

    const restoreFocus = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      window.setTimeout(() => launcherRef.current?.focus(), 0);
    };

    document.addEventListener("keydown", restoreFocus);
    return () => document.removeEventListener("keydown", restoreFocus);
  }, [open]);

  return (
    <>
      {/* Mantém toda a lógica do toggle original, escondendo apenas sua UI. */}
      <style>{`#ai-concierge-toggle { display: none !important; }`}</style>

      <motion.button
        ref={launcherRef}
        type="button"
        onClick={() => nativeButtonRef.current?.click()}
        className="group fixed bottom-24 right-5 z-40 grid h-[76px] w-[76px] place-items-center rounded-full border border-white/45 bg-white/15 p-0 shadow-[0_16px_42px_rgba(8,37,31,0.28),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-2xl transition-[transform,border-color,box-shadow] duration-300 hover:scale-[1.055] hover:border-white/70 hover:shadow-[0_20px_52px_rgba(8,37,31,0.34),0_0_28px_rgba(196,151,58,0.22),inset_0_1px_0_rgba(255,255,255,0.82)] active:scale-[0.97] sm:right-6"
        initial={{ scale: 0.72, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 1.25, type: "spring", stiffness: 260, damping: 20 }}
        aria-label={open ? "Fechar Concierge NeoSenses" : "Abrir Concierge NeoSenses"}
        aria-expanded={open}
        aria-controls="ai-concierge-panel"
      >
        {/* Halo suave da marca atrás do vidro. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[7px] rounded-full bg-[radial-gradient(circle,rgba(205,163,69,0.24)_0%,rgba(205,163,69,0.08)_45%,transparent_72%)] opacity-80 blur-[2px] transition-opacity duration-300 group-hover:opacity-100"
        />

        {/* Corpo liquid-glass: brilho superior + profundidade verde sutil. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[3px] rounded-full border border-white/25 bg-[radial-gradient(circle_at_30%_18%,rgba(255,255,255,0.42),rgba(255,255,255,0.13)_43%,rgba(24,74,62,0.18)_100%)] shadow-[inset_0_-10px_22px_rgba(17,63,52,0.12)]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-[15px] top-[10px] h-[13px] w-[29px] -rotate-[18deg] rounded-full bg-white/45 blur-[5px]"
        />

        <img
          src="/images/concierge-monk.gif"
          alt=""
          aria-hidden="true"
          draggable={false}
          className="pointer-events-none relative z-10 h-[68px] w-[68px] select-none object-contain drop-shadow-[0_7px_9px_rgba(12,42,34,0.22)]"
        />

        {open ? (
          <motion.span
            initial={{ scale: 0.65, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            aria-hidden="true"
            className="absolute -right-1 -top-1 z-20 grid h-6 w-6 place-items-center rounded-full border border-white/65 bg-primary-800/90 text-white shadow-[0_5px_14px_rgba(0,0,0,0.24)] backdrop-blur-xl"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.2} />
          </motion.span>
        ) : (
          <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 z-20 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary-300/70" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full border border-white/65 bg-secondary-400 shadow-[0_2px_8px_rgba(181,135,37,0.45)]" />
          </span>
        )}
      </motion.button>
    </>
  );
}
