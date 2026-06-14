import { useRef, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { aiApi, type ChatMessage } from "@/api/ai";
import { chatApi, type ChatConversation } from "@/api/chat";
import { Send, Bot, User, Trash2, Plus, MessageSquare, PanelLeftClose, PanelLeft, Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Markdown from "@/components/ui/Markdown";

const JUMPSTART_PROMPT_KEYS = [
  "reviewMyWeek",
  "helpPlanTomorrow",
  "whatPatterns",
  "checkGoalProgress",
  "motivationBoost",
  "suggestHabit",
  "analyzeJournalMood",
  "howAmIDoing",
] as const;

export default function ChatPage() {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const list = await chatApi.listConversations();
      setConversations(list);
    } catch {
      // silently fail on load
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const loadMessages = async (conversationId: number) => {
    try {
      const records = await chatApi.getMessages(conversationId);
      setMessages(records.map((r) => ({ role: r.role, content: r.content })));
      setActiveConversationId(conversationId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleNewChat = async () => {
    setActiveConversationId(null);
    setMessages([]);
    setError(null);
  };

  const handleSelectConversation = (conv: ChatConversation) => {
    if (conv.id === activeConversationId) return;
    loadMessages(conv.id);
  };

  const handleDeleteConversation = async (id: number) => {
    try {
      await chatApi.deleteConversation(id);
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setMessages([]);
      }
      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleStartRename = (conv: ChatConversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleConfirmRename = async () => {
    if (editingId === null || !editTitle.trim()) return;
    try {
      await chatApi.renameConversation(editingId, editTitle.trim());
      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setEditingId(null);
      setEditTitle("");
    }
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const handleJumpstart = (prompt: string) => {
    if (loading) return;
    setInput(prompt);
    // Use a small timeout so the input state is flushed before handleSend reads it
    setTimeout(() => {
      handleSendText(prompt);
    }, 0);
  };

  const handleSendText = async (text: string) => {
    if (!text || loading) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      // Create conversation on first message if needed
      let convId = activeConversationId;
      if (!convId) {
        const title = text.length > 40 ? text.slice(0, 40) + "..." : text;
        const conv = await chatApi.createConversation(title);
        convId = conv.id;
        setActiveConversationId(convId);
      }

      // Save user message
      await chatApi.saveMessage(convId, "user", text);

      // Get AI response
      const res = await aiApi.chat(updated);
      const assistantMessage: ChatMessage = { role: "assistant", content: res.content };
      setMessages([...updated, assistantMessage]);

      // Save assistant message
      await chatApi.saveMessage(convId, "assistant", res.content);

      // Refresh sidebar
      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    await handleSendText(input.trim());
  };

  const handleClear = async () => {
    if (activeConversationId) {
      await handleDeleteConversation(activeConversationId);
    } else {
      setMessages([]);
      setError(null);
    }
  };

  return (
    <div className="flex h-full -m-4 md:-m-6">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-64 flex-shrink-0 border-r border-border bg-card flex flex-col">
          <div className="flex items-center justify-between px-3 py-3 border-b border-border">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("chat.history")}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleNewChat}
                className="p-1 rounded hover:bg-secondary transition-colors"
                title={t("chat.newChat")}
              >
                <Plus size={16} className="text-muted-foreground" />
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded hover:bg-secondary transition-colors"
                title={t("chat.closeSidebar")}
              >
                <PanelLeftClose size={16} className="text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">{t("chat.noConversations")}</p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    "group flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-border/50 transition-colors",
                    conv.id === activeConversationId
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-secondary/50"
                  )}
                  onClick={() => handleSelectConversation(conv)}
                >
                  <MessageSquare size={14} className="flex-shrink-0 opacity-50" />
                  {editingId === conv.id ? (
                    <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleConfirmRename();
                          if (e.key === "Escape") handleCancelRename();
                        }}
                        className="flex-1 text-xs bg-secondary border border-border rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                        autoFocus
                      />
                      <button onClick={handleConfirmRename} className="p-0.5 hover:text-primary" aria-label={t("chat.confirmRename")}>
                        <Check size={12} />
                      </button>
                      <button onClick={handleCancelRename} className="p-0.5 hover:text-destructive" aria-label={t("chat.cancelRename")}>
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-xs truncate">{conv.title}</span>
                      <div className="hidden group-hover:flex items-center gap-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartRename(conv);
                          }}
                          className="p-0.5 rounded hover:bg-secondary"
                          title={t("chat.rename")}
                        >
                          <Pencil size={11} className="text-muted-foreground" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConversation(conv.id);
                          }}
                          className="p-0.5 rounded hover:bg-destructive/10"
                          title={t("chat.delete")}
                        >
                          <Trash2 size={11} className="text-destructive" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1 rounded hover:bg-secondary transition-colors mr-1"
                title={t("chat.openSidebar")}
              >
                <PanelLeft size={18} className="text-muted-foreground" />
              </button>
            )}
            <Bot size={20} className="text-primary" />
            <div>
              <h2 className="text-base font-semibold">{t("chat.title")}</h2>
              <p className="text-[11px] text-muted-foreground">{t("chat.poweredBy")}</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 size={14} />
              {t("chat.clear")}
            </button>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Bot size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-medium">{t("chat.startConversation")}</p>
              <p className="text-xs mt-1 max-w-xs">
                {t("chat.startConversationHint")}
              </p>
              <div
                className="mt-5 flex gap-2 overflow-x-auto pb-1 max-w-sm w-full justify-center flex-wrap"
                aria-label={t("chat.jumpstartPrompts")}
              >
                {JUMPSTART_PROMPT_KEYS.map((key) => {
                  const prompt = t(`chat.jumpstart.${key}`);
                  return (
                    <button
                      key={key}
                      onClick={() => handleJumpstart(prompt)}
                      className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-secondary border border-border text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors whitespace-nowrap"
                    >
                      {prompt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={14} className="text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border"
                )}
              >
                {msg.role === "assistant" ? (
                  <Markdown>{msg.content}</Markdown>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User size={14} className="text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot size={14} className="text-primary" />
              </div>
              <div className="bg-card border border-border rounded-lg px-3.5 py-2.5">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border bg-card px-4 py-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={t("chat.inputPlaceholder")}
              disabled={loading}
              className="flex-1 bg-secondary text-sm rounded-md border border-border px-3 py-2.5 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-primary text-primary-foreground rounded-md px-3 py-2.5 disabled:opacity-50 hover:opacity-90 transition-opacity"
              aria-label={t("chat.sendMessage")}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
