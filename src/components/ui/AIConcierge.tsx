"use client";

/**
 * AIConcierge — Floating chat widget (Production)
 *
 * • Quick action buttons that send real messages
 * • Retry on failure
 * • Recommendation cards with links
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
  MessageCircle,
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
  failedMessage?: string; // original message for retry
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
}

// ── Translations ───────────────────────────────────────────────────────────
const T = {
  pt: {
    title: "Concierge NeoSenses",
    subtitle: "Assistente de viagem com IA",
    placeholder: "Digite sua mensagem...",
    welcome:
      "Olá! ✨ Sou o Concierge NeoSenses. Posso ajudar você a encontrar uma experiência, conhecer nossos destinos ou planejar uma jornada. O que você está buscando neste momento?",
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
      "Quero conhecer o Peru",
      "Quero viajar para a Índia",
      "Preciso descansar e me reconectar",
      "Quais são as próximas experiências?",
      "Quero falar com a equipe",
    ],
  },
  en: {
    title: "NeoSenses Concierge",
    subtitle: "AI travel assistant",
    placeholder: "Type your message...",
    welcome:
      "Hello! ✨ I'm the NeoSenses Concierge. I can help you discover an experience, explore our destinations or plan a journey. What are you looking for?",
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
      "I want to visit Peru",
      "Tell me about India experiences",
      "I need rest and reconnection",
      "What are the upcoming experiences?",
      "I want to talk to the team",
    ],
  },
  es: {
    title: "Concierge NeoSenses",
    subtitle: "Asistente de viaje con IA",
    placeholder: "Escribe tu mensaje...",
    welcome:
      "¡Hola! ✨ Soy el Concierge de NeoSenses. Puedo ayudarte a descubrir una experiencia, conocer nuestros destinos o planear un viaje. ¿Qué estás buscando?",
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
      "Quiero conocer Perú",
      "Cuéntame sobre India",
      "Necesito descansar y reconectarme",
      "¿Cuáles son las próximas experiencias?",
      "Quiero hablar con el equipo",
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
  // Retoma a conversa da aba na inicialização, não num efeito: assim navegar
  // entre páginas não perde o fio da conversa nem dispara render em cascata.
  // No servidor a função devolve null, e o id não aparece no HTML — sem risco
  // de divergência na hidratação.
  const [conversationId, setConversationId] = useState<string | null>(getStoredConversationId);
  const [lang, setLang] = useState<Lang>("pt");
  const [showSettings, setShowSettings] = useState(false);
  const [sessionId] = useState(getSessionId);
  // Traz os atalhos de volta no meio da conversa, sem apagar o que já foi
  // dito. Fecha sozinho ao escolher uma opção.
  const [menuAberto, setMenuAberto] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const t = T[lang];

  // ── Scroll to bottom ─────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Foco e teclado ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) setTimeout(() => textareaRef.current?.focus(), 120);
  }, [isOpen]);

  /**
   * Esc fecha o painel e devolve o foco ao botão que o abriu.
   *
   * Sem isso, quem navega por teclado ou leitor de tela entrava no chat e não
   * tinha como sair: o único jeito de fechar era clicar no X, e o foco ficava
   * perdido no fim da página depois.
   */
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

  /**
   * A saudação é derivada, não guardada no estado.
   *
   * Antes ela era gravada em `messages` por dois efeitos — um ao abrir, outro
   * ao trocar de idioma —, o que disparava renderização em cascata e, na troca
   * de idioma, apagava a conversa em andamento junto.
   */
  const mensagensVisiveis: Message[] =
    messages.length === 0 ? [{ role: "assistant", content: t.welcome }] : messages;

  // ── New conversation ─────────────────────────────────────────────────────
  const startNewConversation = useCallback(() => {
    // Lista vazia faz a saudação voltar sozinha, já no idioma atual.
    setMessages([]);
    setConversationId(null);
    setRecommendations([]);
    clearStoredConversationId();
    setInput("");
    // Sem isto o menu ficaria aberto por cima dos atalhos que a conversa
    // nova já mostra sozinha — dois blocos iguais na tela.
    setMenuAberto(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  // ── Auto-resize textarea ─────────────────────────────────────────────────
  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + "px";
    }
  }, []);

  // ── Send message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || loading) return;

      const userMsg = messageText.trim();
      setInput("");
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
          // Error from our API
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

        // Store conversation ID for session persistence
        if (data.conversationId) {
          setConversationId(data.conversationId);
          storeConversationId(data.conversationId);
        }

        // Add assistant message
        setMessages((prev) => [
          ...prev,
          {
            id: data.message?.id,
            role: "assistant",
            content: data.message?.content || "...",
          },
        ]);

        // Update recommendations
        if (data.recommendations?.length > 0) {
          setRecommendations(data.recommendations);
        }
      } catch (err) {
        console.error("[Concierge] Network error:", err);
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

  // ── Retry ────────────────────────────────────────────────────────────────
  const handleRetry = useCallback(
    (failedMessage: string) => {
      // Remove the error message
      setMessages((prev) => prev.filter((m) => m.failedMessage !== failedMessage || !m.isError));
      // Also remove the user's message that failed
      setMessages((prev) => {
        const lastUserIdx = prev.map((m) => m.content).lastIndexOf(failedMessage);
        if (lastUserIdx >= 0) {
          return prev.filter((_, i) => i !== lastUserIdx);
        }
        return prev;
      });
      // Re-send
      sendMessage(failedMessage);
    },
    [sendMessage]
  );

  // ── WhatsApp handoff with context ────────────────────────────────────────
  const getWhatsAppUrl = useCallback(() => {
    if (messages.length <= 1) return buildWhatsAppUrl();

    // Build context from recent conversation
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

  // ── Keyboard handling ────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
      }
    },
    [sendMessage, input]
  );

  // ── Has user sent at least one message? ──────────────────────────────────
  const hasConversation = messages.some((m) => m.role === "user");

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Toggle button ─────────────────────────────────────────────── */}
      <motion.button
        id="ai-concierge-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-secondary-600 hover:bg-secondary-700 text-white shadow-lg shadow-secondary-500/30 transition-transform hover:scale-110 active:scale-95"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2, type: "spring", stiffness: 260, damping: 20 }}
        aria-label={isOpen ? "Fechar concierge" : "Abrir concierge AI"}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.12 }}>
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.12 }}>
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

      {/* ── Chat panel ────────────────────────────────────────────────── */}
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
            className="fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-overlay max-sm:inset-3 max-sm:bottom-20 sm:bottom-44 sm:right-6"
            style={{
              width: "min(400px, calc(100vw - 24px))",
              height: "min(600px, calc(100dvh - 120px))",
            }}
          >
            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="flex shrink-0 items-center gap-3 border-b border-border bg-gradient-to-r from-primary-700 to-primary-600 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                <Sparkles className="h-4 w-4 text-secondary-300" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-white">{t.title}</h3>
                <p className="text-xs text-white/60">{t.subtitle}</p>
              </div>

              {/* Lang toggle */}
              <button
                onClick={() => setShowSettings((v) => !v)}
                className="flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-xs text-white/70 transition hover:bg-white/20"
              >
                {lang.toUpperCase()}
                <ChevronDown className={`h-3 w-3 transition-transform ${showSettings ? "rotate-180" : ""}`} />
              </button>

              {/* Reset */}
              <button
                onClick={startNewConversation}
                className="flex shrink-0 items-center justify-center rounded-full bg-white/10 p-1.5 text-white/70 transition hover:bg-white/20"
                title={t.newChat}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* ── Language picker ──────────────────────────────────────── */}
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
                        onClick={() => { setLang(l); setShowSettings(false); }}
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

            {/* Região viva: o leitor de tela anuncia a resposta quando ela
                chega. Sem isto, a mensagem aparecia na tela e quem não vê
                continuava esperando em silêncio, sem saber que já respondeu. */}
            <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
              {loading
                ? t.thinking
                : mensagensVisiveis[mensagensVisiveis.length - 1]?.role === "assistant"
                ? mensagensVisiveis[mensagensVisiveis.length - 1]?.content
                : ""}
            </p>

            {/* ── Messages ────────────────────────────────────────────── */}
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
                      {/* Antes: {msg.content} cru. O endereço do WhatsApp que
                          o Concierge escreve na resposta ficava como texto
                          morto — no celular, isso encerra a conversa. Só vira
                          link o que é da casa; ver lib/ai/links.ts. */}
                      <TextoComLinks texto={msg.content} numeroWhatsApp={WA_NUMBER} />
                    </div>

                    {/* Error action buttons */}
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
                          <MessageCircle className="h-3 w-3" />
                          {t.whatsapp}
                        </a>
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* Loading */}
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

                {/* Atalhos.
                    Antes só apareciam antes da primeira mensagem e sumiam para
                    sempre. Quem entrava numa linha de conversa e queria voltar
                    ao começo não tinha caminho: ou digitava do zero, ou
                    apagava a conversa inteira em "Nova conversa" — que joga
                    fora o que já foi dito.

                    Agora o botão Menu no rodapé traz de volta, sem perder
                    nada. */}
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

                {/* Recommendation cards */}
                {recommendations.length > 0 && !loading && (
                  <div className="mt-2 space-y-2">
                    {recommendations.map((rec) => (
                      <a
                        key={rec.id}
                        href={rec.url}
                        className="flex items-start gap-3 rounded-xl border border-border bg-white p-3 shadow-sm transition hover:border-secondary-400 hover:shadow"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-text-primary leading-snug">{rec.title}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-text-muted">
                            {rec.destination && (
                              <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{rec.destination}</span>
                            )}
                            {rec.duration && (
                              <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{rec.duration}</span>
                            )}
                            {rec.publishedPrice && (
                              <span className="font-medium text-primary-700">{rec.publishedPrice}</span>
                            )}
                          </div>
                        </div>
                        <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted/50" />
                      </a>
                    ))}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* ── Menu e WhatsApp ─────────────────────────────────────── */}
            <div className="shrink-0 border-t border-border bg-warm-gray/50 px-4 py-2">
              <div className="flex gap-2">
                {/* Só aparece depois que a conversa começou: antes disso os
                    atalhos já estão na tela, e um botão para mostrar o que
                    está visível confunde. */}
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
                  <MessageCircle className="h-3.5 w-3.5" />
                  {t.whatsapp}
                  <ExternalLink className="h-3 w-3 opacity-70" />
                </a>
              </div>
            </div>

            {/* ── Input ───────────────────────────────────────────────── */}
            <div className="shrink-0 border-t border-border p-3">
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
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
