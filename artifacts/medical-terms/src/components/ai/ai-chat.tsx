import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  X, Send, Plus, Trash2, ChevronLeft,
  Bot, Loader2, AlertCircle, Stethoscope,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Conversation { id: number; title: string; createdAt: string; }
interface Message { id: number; conversationId: number; role: 'user' | 'assistant'; content: string; createdAt: string; }

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push(
        <pre key={key++} className="bg-muted rounded-xl p-3 text-xs font-mono overflow-x-auto my-2 leading-relaxed">
          {lang && <span className="text-muted-foreground text-[10px] uppercase tracking-wide block mb-1">{lang}</span>}
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      i++;
      continue;
    }

    // Heading h3
    if (line.startsWith('### ')) {
      nodes.push(<h3 key={key++} className="font-bold text-sm text-foreground mt-3 mb-1">{inlineFormat(line.slice(4))}</h3>);
      i++; continue;
    }
    // Heading h2
    if (line.startsWith('## ')) {
      nodes.push(<h2 key={key++} className="font-bold text-base text-foreground mt-3 mb-1">{inlineFormat(line.slice(3))}</h2>);
      i++; continue;
    }
    // Heading h1
    if (line.startsWith('# ')) {
      nodes.push(<h1 key={key++} className="font-bold text-lg text-foreground mt-3 mb-1">{inlineFormat(line.slice(2))}</h1>);
      i++; continue;
    }

    // Numbered list — collect consecutive items
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      nodes.push(
        <ol key={key++} className="list-decimal list-inside space-y-0.5 my-1.5 text-sm">
          {items.map((it, idx) => <li key={idx} className="leading-relaxed">{inlineFormat(it)}</li>)}
        </ol>
      );
      continue;
    }

    // Unordered list — collect consecutive items
    if (/^[-*•]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*•]\s/, ''));
        i++;
      }
      nodes.push(
        <ul key={key++} className="list-disc list-inside space-y-0.5 my-1.5 text-sm">
          {items.map((it, idx) => <li key={idx} className="leading-relaxed">{inlineFormat(it)}</li>)}
        </ul>
      );
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      nodes.push(<hr key={key++} className="border-border my-3" />);
      i++; continue;
    }

    // Blank line
    if (line.trim() === '') {
      nodes.push(<div key={key++} className="h-2" />);
      i++; continue;
    }

    // Normal paragraph
    nodes.push(<p key={key++} className="text-sm leading-relaxed">{inlineFormat(line)}</p>);
    i++;
  }

  return nodes;
}

function inlineFormat(text: string): React.ReactNode {
  // Split on bold (**), italic (*), inline code (`)
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={k++}>{text.slice(last, m.index)}</span>);
    const token = m[0];
    if (token.startsWith('**')) {
      parts.push(<strong key={k++} className="font-bold">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*')) {
      parts.push(<em key={k++} className="italic">{token.slice(1, -1)}</em>);
    } else {
      parts.push(<code key={k++} className="bg-muted px-1 py-0.5 rounded text-[11px] font-mono">{token.slice(1, -1)}</code>);
    }
    last = m.index + token.length;
  }
  if (last < text.length) parts.push(<span key={k++}>{text.slice(last)}</span>);
  return parts.length > 0 ? parts : text;
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, streaming }: { msg: Message | { role: 'assistant'; content: string; id: -1; conversationId: -1; createdAt: '' }; streaming?: boolean }) {
  const isUser = msg.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mr-2 mt-1">
          <Stethoscope className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
      )}
      <div className={cn(
        'max-w-[82%] rounded-2xl px-4 py-3 shadow-sm',
        isUser
          ? 'bg-primary text-primary-foreground rounded-tr-sm'
          : 'bg-card border border-border rounded-tl-sm'
      )}>
        {isUser ? (
          <p className="text-sm leading-relaxed">{msg.content}</p>
        ) : (
          <div className="prose-sm text-foreground">
            {renderMarkdown(msg.content)}
            {streaming && (
              <span className="inline-block w-1.5 h-4 bg-primary rounded-sm ml-0.5 animate-pulse" />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────

interface ChatPanelProps { onClose: () => void; }

export function ChatPanel({ onClose }: ChatPanelProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    setLoadingConvs(true);
    try {
      const r = await fetch('/api/ai/conversations');
      if (!r.ok) throw new Error();
      const data: Conversation[] = await r.json();
      setConversations(data);
      // Auto-open most recent
      if (data.length > 0 && activeId === null) {
        openConversation(data[0].id);
      }
    } catch {
      setError('Could not load conversations.');
    } finally {
      setLoadingConvs(false);
    }
  }

  async function openConversation(id: number) {
    setActiveId(id);
    setShowSidebar(false);
    setError('');
    try {
      const r = await fetch(`/api/ai/conversations/${id}/messages`);
      if (!r.ok) throw new Error();
      setMessages(await r.json());
    } catch {
      setError('Could not load messages.');
    }
  }

  async function newConversation() {
    try {
      const r = await fetch('/api/ai/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'New Conversation' }) });
      if (!r.ok) throw new Error();
      const conv: Conversation = await r.json();
      setConversations(prev => [conv, ...prev]);
      setActiveId(conv.id);
      setMessages([]);
      setShowSidebar(false);
    } catch {
      setError('Could not create conversation.');
    }
  }

  async function deleteConversation(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    await fetch(`/api/ai/conversations/${id}`, { method: 'DELETE' });
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
    }
  }

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    // Ensure we have an active conversation
    let convId = activeId;
    if (!convId) {
      try {
        const r = await fetch('/api/ai/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'New Conversation' }) });
        const conv: Conversation = await r.json();
        setConversations(prev => [conv, ...prev]);
        convId = conv.id;
        setActiveId(conv.id);
      } catch {
        setError('Could not create conversation.');
        return;
      }
    }

    setInput('');
    setError('');
    setIsStreaming(true);
    setStreamingContent('');

    // Optimistically add user message
    const optimisticMsg: Message = { id: Date.now(), conversationId: convId, role: 'user', content: text, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, optimisticMsg]);

    abortRef.current = new AbortController();

    try {
      const response = await fetch(`/api/ai/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (!payload) continue;
          try {
            const evt = JSON.parse(payload);
            if (evt.error) throw new Error(evt.error);
            if (evt.done) {
              // Reload messages from server to get saved IDs
              const r = await fetch(`/api/ai/conversations/${convId}/messages`);
              const saved: Message[] = await r.json();
              setMessages(saved);
              // Update conversation title in sidebar
              setConversations(prev => prev.map(c =>
                c.id === convId ? { ...c, title: saved.find(m => m.role === 'user')?.content?.slice(0, 60) ?? c.title } : c
              ));
              setStreamingContent('');
              break;
            }
            if (evt.content) {
              accumulated += evt.content;
              setStreamingContent(accumulated);
            }
          } catch (parseErr: any) {
            if (parseErr.message !== 'Unexpected end of JSON input') {
              throw parseErr;
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message ?? 'Something went wrong. Please try again.');
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
    }
  }, [input, isStreaming, activeId]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const activeConv = conversations.find(c => c.id === activeId);
  const showEmpty = !loadingConvs && messages.length === 0 && !isStreaming;

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="absolute inset-0 z-50 bg-background flex flex-col"
    >
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 h-16 border-b border-border bg-background/90 backdrop-blur-md">
        <button
          onClick={() => setShowSidebar(v => !v)}
          className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0"
        >
          <ChevronLeft className={cn('w-4 h-4 text-foreground transition-transform', showSidebar && 'rotate-180')} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Stethoscope className="w-3 h-3 text-primary-foreground" />
            </div>
            <p className="text-sm font-bold truncate">
              {activeConv?.title === 'New Conversation' || !activeConv ? 'MedAI Assistant' : activeConv.title}
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground ml-8">Gemini 2.5 Flash · Medical Edition</p>
        </div>

        <button
          onClick={newConversation}
          className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0"
          title="New conversation"
        >
          <Plus className="w-4 h-4 text-foreground" />
        </button>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0"
        >
          <X className="w-4 h-4 text-foreground" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="absolute inset-y-0 left-0 w-64 z-10 bg-background border-r border-border flex flex-col shadow-xl"
            >
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">History</p>
                <button
                  onClick={newConversation}
                  className="flex items-center gap-1 text-xs font-semibold text-primary"
                >
                  <Plus className="w-3.5 h-3.5" /> New
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                {loadingConvs ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                ) : conversations.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No conversations yet</p>
                ) : (
                  conversations.map(c => (
                    <div
                      key={c.id}
                      onClick={() => openConversation(c.id)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-secondary/60 transition-colors group',
                        activeId === c.id && 'bg-primary/8'
                      )}
                    >
                      <p className={cn(
                        'flex-1 text-sm truncate',
                        activeId === c.id ? 'font-semibold text-primary' : 'text-foreground'
                      )}>
                        {c.title}
                      </p>
                      <button
                        onClick={(e) => deleteConversation(c.id, e)}
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg bg-secondary flex items-center justify-center transition-opacity shrink-0"
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {showEmpty && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-8">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="font-bold text-base">MedAI Assistant</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px] leading-relaxed">
                  Ask me to explain any medical term, condition, or concept.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-[260px]">
                {[
                  "What is tachycardia?",
                  "Explain the renin-angiotensin system",
                  "What are the layers of the heart wall?",
                ].map(q => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); inputRef.current?.focus(); }}
                    className="text-left text-xs font-medium bg-secondary/70 hover:bg-secondary border border-border rounded-xl px-3 py-2 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}

          {isStreaming && streamingContent && (
            <MessageBubble
              msg={{ id: -1, conversationId: -1, role: 'assistant', content: streamingContent, createdAt: '' }}
              streaming
            />
          )}

          {isStreaming && !streamingContent && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Stethoscope className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <div className="flex gap-1 px-3 py-2.5 bg-card border border-border rounded-2xl rounded-tl-sm">
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 text-destructive bg-destructive/8 rounded-2xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs font-medium leading-relaxed">{error}</p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="shrink-0 border-t border-border bg-background px-4 pt-3 pb-safe">
        <div className="flex gap-2 items-end">
          <div className="flex-1 bg-secondary/60 border border-border rounded-2xl px-4 py-3 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about any medical term…"
              rows={1}
              style={{ resize: 'none', maxHeight: 80 }}
              className="w-full bg-transparent text-sm font-medium placeholder:text-muted-foreground/60 focus:outline-none leading-relaxed"
              onInput={e => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 80) + 'px';
              }}
            />
          </div>
          <motion.button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            whileTap={{ scale: 0.92 }}
            className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-40 transition-opacity shadow-sm shrink-0"
          >
            {isStreaming
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </motion.button>
        </div>
        <p className="text-[10px] text-muted-foreground/60 text-center mt-2 pb-1">
          For educational purposes only · Not medical advice
        </p>
      </div>
    </motion.div>
  );
}

// ─── Floating Button ──────────────────────────────────────────────────────────

interface AIChatButtonProps { onClick: () => void; }

export function AIChatButton({ onClick }: AIChatButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      className="fixed bottom-[88px] right-4 z-40 w-13 h-13 flex items-center justify-center"
      style={{ maxWidth: 'none' }}
    >
      <div className="w-12 h-12 rounded-2xl bg-primary shadow-lg flex items-center justify-center relative"
        style={{ boxShadow: '0 4px 16px hsl(183 74% 28% / 0.35)' }}>
        <Stethoscope className="w-5 h-5 text-primary-foreground" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-background" />
      </div>
    </motion.button>
  );
}
