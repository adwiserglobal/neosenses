"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5511947188319";

interface WhatsAppButtonProps {
  message?: string;
}

export function WhatsAppButton({ message }: WhatsAppButtonProps) {
  const url = `https://wa.me/${WHATSAPP_NUMBER}${message ? `?text=${encodeURIComponent(message)}` : ""}`;

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] right-[calc(1.5rem+env(safe-area-inset-right,0px))] z-40 flex h-14 w-14 items-center justify-center rounded-full border border-[#25D366]/20 bg-white shadow-lg transition-transform hover:scale-110 active:scale-95"
      // O link funciona sem JavaScript — é um `href`. Sem a marca, a
      // animação de entrada o esconderia de quem tem menos recurso.
      data-anima=""
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.5, type: "spring", stiffness: 260, damping: 20 }}
      aria-label="Conversar no WhatsApp"
    >
      <MessageCircle className="h-7 w-7 text-[#25D366]" aria-hidden="true" />
    </motion.a>
  );
}
