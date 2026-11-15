"use client";

/**
 * AIConcierge — Floating chat widget (Production)
 *
 * • Quick action buttons that send real messages
 * • Retry on failure
 * • Recommendation cards with image + deep link
 * • WhatsApp handoff with prefilled context
 * • Session ID persistence (localStorage)
 * • Conversation ID persistence across page navigations
 * • Desktop and mobile responsive
 * • Keyboard: Enter to send, Shift+Enter for newline
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  ChevronDown,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Clock,
  ExternalLink,
  LayoutGrid,
} from "lucide-react";
import { TextoComLinks } from "./TextoComLinks";

// ── Types ──────────────────────────────────────────────────────────────────
type Lang = "pt" | "en" | "es";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
  failedMessage?: string;
}

interface Recommendation {
  type: string;
  id: string;
  title: string;
  slug: string;
  destination: string;
  duration: string;
  publishedPrice: string;
  url: string;
  image?: string;
  summary?: string;
}

// ── Translations ───────────────────────────────────────────────────────────
const T = {
  pt: {
    title: "Concierge NeoSenses",
    subtitle: "Curadoria de jornadas com propósito",
    placeholder: "Conte o que você gostaria de viver...",
    welcome:
      "Olá, é um prazer receber você por aqui. Sou o Concierge NeoSenses. Vou ajudar você a encontrar uma jornada que faça sentido para o que deseja viver, com cuidado em cada escolha. O que gostaria de encontrar nesta próxima viagem? ✨",
    error:
      "Não consegui responder agora. Você pode tentar novamente ou falar diretamente com nossa equipe.",
    whatsapp: "Falar com a equipe",
    newChat: "Nova conversa",
    retry: "Tentar novamente",
    thinking: "Pensando",
    menu: "Menu",
    menuAberto: "Fechar menu",
    menuTitulo: "Por onde começar",
    quickActions: [
      "Quero encontrar uma jornada para o meu momento",
      "Tenho um destino em mente",
      "Busco descanso e reconexão",
      "Quero conhecer as próximas saídas",
      "Sou facilitador(a) e quero levar um grupo",
    ],
  },
  en: {
    title: "NeoSenses Concierge",
    subtitle: "Purposeful journey curation",
    placeholder: "Tell me what you would like to experience...",
    welcome:
      "Hello, it is a pleasure to welcome you. I'm the NeoSenses Concierge. I can help you find a journey that feels right for what you would like to experience, with care in every detail. What would you love this next trip to hold for you? ✨",
    error:
      "I couldn't respond right now. You can try again or speak directly with our team.",
    whatsapp: "Talk to the team",
    newChat: "New conversation",
    retry: "Try again",
    thinking: "Thinking",
    menu: "Menu",
    menuAberto: "Close menu",
    menuTitulo: "Where to start",
    quickActions: [
      "Help me find a journey for this moment",
      "I have a destination in mind",
      "I am looking for rest and reconnection",
      "Show me upcoming departures",
      "I lead groups and want to partner",
    ],
  },
  es: {
    title: "Concierge NeoSenses",
    subtitle: "Curaduría de viajes con propósito",
    placeholder: "Cuéntame qué te gustaría vivir...",
    welcome:
      "Hola, es un placer recibirte. Soy el Concierge de NeoSenses. Te ayudaré a encontrar un viaje que tenga sentido para lo que deseas vivir, cuidando cada detalle. ¿Qué te gustaría encontrar en este próximo viaje? ✨",
    error:
      "No pude responder ahora. Puedes intentar de nuevo o hablar directamente con nuestro equipo.",
    whatsapp: "Hablar con el equipo",
    newChat: "Nueva conversación",
    retry: "Intentar de nuevo",
    thinking: "Pensando",
    menu: "Menú",
    menuAberto: "Cerrar menú",
    menuTitulo: "Por dónde empezar",
    quickActions: [
      "Quiero encontrar un viaje para este momento",
      "Tengo un destino en mente",
      "Busco descanso y reconexión",
      "Quiero conocer las próximas salidas",
      "Llevo grupos y quiero colaborar",
    ],
  },
} as const;

// ── Session persistence ────────────────────────────────────────────────────
function getSessionId(): string {
  if (typeof window === "undefined") return "";
  const key = "neosenses_session_id";
  let id = localStorage.getItem(key);
  if (id) return id;
  id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(key, id);
  return id;
}

function getStoredConversationId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("neosenses_conv_id");
}

function storeConversationId(id: string) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("neosenses_conv_id", id);
  }
}

function clearStoredConversationId() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("neosenses_conv_id");
  }
}

// ── WhatsApp ───────────────────────────────────────────────────────────────
const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5511947188319";
const WHATSAPP_LOGO = "https://cdn.openart.ai/openart-uploads/production/attachment-transfers/71002963de651937ea88f0d55262ace69cc14e88cdb8087ad5417178b9f75d65.webp";

function buildWhatsAppUrl(context?: string): string {
  const base = `https://wa.me/${WA_NUMBER}`;
  if (context) {
    return `${base}?text=${encodeURIComponent(context)}`;
  }
  return base;
}

// ── Component ──────────────────────────────────────────────────────────────
export function AIConcierge() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(getStoredConversationId);
  const [lang, setLang] = useState<Lang>("pt");
  const [showSettings, setShowSettings] = useState(false);
  const [sessionId] = useState(getSessionId);
  const [menuAberto, setMenuAberto] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const t = T[lang];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, recommendations]);

  useEffect(() => {
    if (isOpen) setTimeout(() => textareaRef.current?.focus(), 120);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setIsOpen(false);
      document.getElementById("ai-concierge-toggle")?.focus();
    };

    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [isOpen]);

  const mensagensVisiveis: Message[] =
    messages.length === 0 ? [{ role: "assistant", content: t.welcome }] : messages;

  const startNewConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setRecommendations([]);
    clearStoredConversationId();
    setInput("");
    setMenuAberto(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + "px";
    }
  }, []);

  const sendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || loading) return;

      const userMsg = messageText.trim();
      setInput("");
      setRecommendations([]);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
      setLoading(true);

      try {
        const res = await fetch("/api/concierge/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMsg,
            conversationId,
            sessionId,
            language: lang,
            sourcePage: typeof window !== "undefined" ? window.location.pathname : "/",
          }),
        });

        const data = await res.json();

        if (!data.success) {
          setRecommendations([]);
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: data.error || t.error,
              isError: true,
              failedMessage: userMsg,
            },
          ]);
          return;
        }

        if (data.conversationId) {
          setConversationId(data.conversationId);
          storeConversationId(data.conversationId);
        }

        setMessages((prev) => [
          ...prev,
          {
            id: data.message?.id,
            role: "assistant",
            content: data.message?.content || "...",
          },
        ]);

        setRecommendations(Array.isArray(data.recommendations) ? data.recommendations : []);
      } catch (err) {
        console.error("[Concierge] Network error:", err);
        setRecommendations([]);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: t.error,
            isError: true,
            failedMessage: userMsg,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, conversationId, sessionId, lang, t]
  );

  const handleRetry = useCallback(
    (failedMessage: string) => {
      setMessages((prev) => prev.filter((m) => m.failedMessage !== failedMessage || !m.isError));
      setMessages((prev) => {
        const lastUserIdx = prev.map((m) => m.content).lastIndexOf(failedMessage);
        if (lastUserIdx >= 0) {
          return prev.filter((_, i) => i !== lastUserIdx);
        }
        return prev;
      });
      sendMessage(failedMessage);
    },
    [sendMessage]
  );

  const getWhatsAppUrl = useCallback(() => {
    if (messages.length <= 1) return buildWhatsAppUrl();

    const recentMsgs = messages.slice(-4);
    const context = recentMsgs
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .join(". ");

    const prefill =
      lang === "pt"
        ? `Olá, conversei com o Concierge NeoSenses e gostaria de ajuda. Contexto: ${context.slice(0, 200)}`
        : lang === "en"
        ? `Hello, I chatted with the NeoSenses Concierge and would like help. Context: ${context.slice(0, 200)}`
        : `Hola, hablé con el Concierge de NeoSenses y me gustaría ayuda. Contexto: ${context.slice(0, 200)}`;

    return buildWhatsAppUrl(prefill);
  }, [messages, lang]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
      }
    },
    [sendMessage, input]
  );

  const hasConversation = messages.some((m) => m.role === "user");

  return (
    <>
      <motion.button
        id="ai-concierge-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-secondary-600 hover:bg-secondary-700 text-white shadow-lg shadow-secondary-500/30 transition-transform hover:scale-110 active:scale-95"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2, type: "spring", stiffness: 260, damping: 20 }}
        aria-label={isOpen ? "Fechar concierge" : "Abrir Concierge NeoSenses"}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              <Sparkles className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
        {!isOpen && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary-300 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-secondary-400" />
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-label={t.title}
            aria-modal="true"
            id="ai-concierge-panel"
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.94 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            // A altura sai do espaço livre entre o cabeçalho do site (72 px) e os
            // botões flutuantes (176 px do rodapé). Antes era `100dvh - 120px`
            // com o painel a 176 px do rodapé: em janela baixa o topo passava
            // da borda da tela e o título do chat ficava escondido.
            className="fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-overlay max-sm:inset-x-3 max-sm:bottom-24 max-sm:top-24 sm:bottom-44 sm:right-6 sm:h-[min(600px,calc(100dvh-16.5rem))] sm:w-[min(400px,calc(100vw-24px))]"
          >
            <div className="flex shrink-0 items-center gap-3 border-b border-border bg-gradient-to-r from-primary-700 to-primary-600 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                <Sparkles className="h-4 w-4 text-secondary-300" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-white">{t.title}</h3>
                <p className="text-xs text-white/60">{t.subtitle}</p>
              </div>

              <button
                onClick={() => setShowSettings((v) => !v)}
                className="flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-xs text-white/70 transition hover:bg-white/20"
              >
                {lang.toUpperCase()}
                <ChevronDown className={`h-3 w-3 transition-transform ${showSettings ? "rotate-180" : ""}`} />
              </button>

              <button
                onClick={startNewConversation}
                className="flex shrink-0 items-center justify-center rounded-full bg-white/10 p-1.5 text-white/70 transition hover:bg-white/20"
                title={t.newChat}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>

            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="shrink-0 overflow-hidden border-b border-border bg-warm-gray"
                >
                  <div className="flex gap-1 p-2">
                    {(["pt", "en", "es"] as Lang[]).map((l) => (
                      <button
                        key={l}
                        onClick={() => {
                          setLang(l);
                          setShowSettings(false);
                        }}
                        className={`flex-1 rounded px-2 py-1.5 text-xs font-medium transition ${
                          lang === l
                            ? "bg-primary-700 text-white"
                            : "bg-white text-text-primary hover:bg-primary-50"
                        }`}
                      >
                        {l === "pt" ? "Português" : l === "en" ? "English" : "Español"}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
              {loading
                ? t.thinking
                : mensagensVisiveis[mensagensVisiveis.length - 1]?.role === "assistant"
                ? mensagensVisiveis[mensagensVisiveis.length - 1]?.content
                : ""}
            </p>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {mensagensVisiveis.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "rounded-br-md bg-primary-700 text-white"
                          : msg.isError
                          ? "rounded-bl-md border border-amber-200 bg-amber-50 text-amber-900"
                          : "rounded-bl-md bg-warm-gray text-text-primary"
                      }`}
                    >
                      {msg.isError && (
                        <AlertTriangle className="mb-1 inline-block h-3.5 w-3.5 text-amber-500" />
                      )}{" "}
                      <TextoComLinks texto={msg.content} numeroWhatsApp={WA_NUMBER} />
                    </div>

                    {msg.isError && msg.failedMessage && (
                      <div className="mt-1.5 flex gap-2">
                        <button
                          onClick={() => handleRetry(msg.failedMessage!)}
                          className="flex items-center gap-1 rounded-lg bg-primary-700 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-800"
                          disabled={loading}
                        >
                          <RefreshCw className="h-3 w-3" />
                          {t.retry}
                        </button>
                        <a
                          href={getWhatsAppUrl()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-lg bg-[var(--color-whatsapp)] px-3 py-1.5 text-xs font-medium text-[#0b2e18] transition hover:bg-[var(--color-whatsapp-hover)]"
                        >
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/95">
                            <img src={WHATSAPP_LOGO} alt="" aria-hidden="true" className="h-3 w-3 object-contain" />
                          </span>
                          {t.whatsapp}
                        </a>
                      </div>
                    )}
                  </motion.div>
                ))}

                {loading && (
                  <div className="flex items-start justify-start">
                    <div className="rounded-2xl rounded-bl-md bg-warm-gray px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                          <span className="h-2 w-2 animate-bounce rounded-full bg-text-muted/40" style={{ animationDelay: "0ms" }} />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-text-muted/40" style={{ animationDelay: "150ms" }} />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-text-muted/40" style={{ animationDelay: "300ms" }} />
                        </div>
                        <span className="text-xs text-text-muted/60">{t.thinking}…</span>
                      </div>
                    </div>
                  </div>
                )}

                {(!hasConversation || menuAberto) && !loading && (
                  <div className="mt-2">
                    {menuAberto && hasConversation && (
                      <p className="mb-1.5 text-[11px] uppercase tracking-wide text-text-muted">
                        {t.menuTitulo}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {t.quickActions.map((action) => (
                        <button
                          key={action}
                          onClick={() => {
                            setMenuAberto(false);
                            sendMessage(action);
                          }}
                          className="rounded-full border border-border bg-white px-3 py-1.5 text-xs text-text-primary shadow-sm transition hover:border-secondary-400 hover:bg-secondary-50 active:scale-95"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {recommendations.length > 0 && !loading && (
                  <div className="mt-2 space-y-2">
                    {recommendations.map((rec) => (
                      <a
                        key={`${rec.id}-${rec.slug}`}
                        href={rec.url}
                        className="group flex min-h-[92px] overflow-hidden rounded-xl border border-border bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-secondary-400 hover:shadow-md"
                      >
                        {rec.image ? (
                          <div
                            className="w-24 shrink-0 bg-cover bg-center"
                            style={{ backgroundImage: `url("${rec.image.replace(/"/g, "%22")}")` }}
                            aria-hidden="true"
                          />
                        ) : (
                          <div className="flex w-24 shrink-0 items-center justify-center bg-secondary-50 text-secondary-500">
                            <Sparkles className="h-5 w-5" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1 px-3 py-2.5">
                          <div className="flex items-start gap-2">
                            <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-text-primary">
                              {rec.title}
                            </p>
                            <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted/50 transition group-hover:text-secondary-600" />
                          </div>

                          {rec.summary && (
                            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-text-muted">
                              {rec.summary}
                            </p>
                          )}

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-text-muted">
                            {rec.destination && (
                              <span className="flex items-center gap-0.5">
                                <MapPin className="h-3 w-3" />
                                {rec.destination}
                              </span>
                            )}
                            {rec.duration && (
                              <span className="flex items-center gap-0.5">
                                <Clock className="h-3 w-3" />
                                {rec.duration}
                              </span>
                            )}
                            {rec.publishedPrice && (
                              <span className="font-medium text-primary-700">{rec.publishedPrice}</span>
                            )}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="shrink-0 border-t border-border bg-warm-gray/50 px-4 py-2">
              <div className="flex gap-2">
                {hasConversation && (
                  <button
                    type="button"
                    onClick={() => setMenuAberto((v) => !v)}
                    aria-expanded={menuAberto}
                    className={`flex shrink-0 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm transition active:scale-95 ${
                      menuAberto
                        ? "border-secondary-400 bg-secondary-50 text-secondary-700"
                        : "border-border bg-white text-text-primary hover:border-secondary-400"
                    }`}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    {menuAberto ? t.menuAberto : t.menu}
                  </button>
                )}

                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-whatsapp)] px-3 py-2 text-xs font-semibold text-[#0b2e18] shadow-sm transition hover:bg-[var(--color-whatsapp-hover)] active:scale-95"
                  id="concierge-whatsapp-link"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/95 shadow-sm">
                    <img src={WHATSAPP_LOGO} alt="" aria-hidden="true" className="h-4 w-4 object-contain" />
                  </span>
                  {t.whatsapp}
                  <ExternalLink className="h-3 w-3 opacity-70" />
                </a>
              </div>
            </div>

            <div className="shrink-0 border-t border-border p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(input);
                }}
                className="flex items-end gap-2"
              >
                <textarea
                  id="concierge-input"
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t.placeholder}
                  rows={1}
                  className="flex-1 resize-none rounded-2xl border border-border bg-warm-white px-4 py-2.5 text-sm leading-snug transition-colors focus:border-secondary-500 focus:outline-none disabled:opacity-50"
                  disabled={loading}
                  maxLength={1500}
                  autoComplete="off"
                  style={{ maxHeight: "100px" }}
                />
                <button
                  id="concierge-send-button"
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-500 text-white shadow-sm transition-all hover:bg-secondary-600 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Enviar"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
