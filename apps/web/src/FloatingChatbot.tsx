import React, { useState, useRef, useEffect } from "react";
import { X, Send, Bot, Sparkles, RefreshCw } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
}

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";

const SYSTEM_PROMPT = `You are Vibhaag Assistant, an AI helper for the Vibhaag College Management System. You answer questions strictly and exclusively about the Vibhaag platform (such as course registration/FFCS, timetable schedules, attendance tracking, faculty leave requests, classroom streams, library study materials, session feedback, student/teacher/admin login, and portal features). If a user asks about anything unrelated to the Vibhaag platform or college management system (such as general trivia, sports, movies, cooking, history, external homework, coding benchmarks, etc.), politely decline by saying: "I am only designed to assist with questions related to the Vibhaag platform and campus portal services." Keep your answers clear, concise, and helpful.`;

const SUGGESTED_QUESTIONS = [
  "How do I register for FFCS courses?",
  "Where can I check my attendance?",
  "How do I apply for leave?",
  "How to access lecture notes in Library?",
];

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "👋 Hi! I'm the Vibhaag Campus Assistant. Ask me any doubts or questions about navigating and using the Vibhaag platform!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  async function handleSendMessage(textToSend?: string) {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        }));

      // Dynamic discovery of active Qwen models on Groq + fallback Qwen candidates
      let qwenModels: string[] = [];
      try {
        const modelsRes = await fetch("https://api.groq.com/openai/v1/models", {
          headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
        });
        if (modelsRes.ok) {
          const modelsData = await modelsRes.json();
          qwenModels = (modelsData.data || [])
            .map((m: any) => m.id)
            .filter((id: string) => id.toLowerCase().includes("qwen"));
        }
      } catch (e) {
        console.warn("Failed to fetch Groq models list:", e);
      }

      const CANDIDATE_QWEN_MODELS = Array.from(
        new Set([
          ...qwenModels,
          "qwen-qwq-32b",
          "deepseek-r1-distill-qwen-32b",
          "qwen-2.5-72b-instruct",
          "qwen2.5-72b-instruct",
        ])
      );

      let responseData: any = null;
      let lastErrorMessage = "";

      for (const modelName of CANDIDATE_QWEN_MODELS) {
        try {
          const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${GROQ_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: modelName,
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...history,
                { role: "user", content: query },
              ],
              temperature: 0.3,
              max_tokens: 450,
            }),
          });

          if (res.ok) {
            responseData = await res.json();
            console.log(`Successfully connected using Qwen model: ${modelName}`);
            break;
          } else {
            const errData = await res.json().catch(() => ({}));
            lastErrorMessage = errData.error?.message || `HTTP ${res.status}`;
            console.warn(`Groq Qwen model ${modelName} returned status ${res.status}:`, lastErrorMessage);
          }
        } catch (e: any) {
          console.warn(`Request attempt failed for Qwen model ${modelName}:`, e);
        }
      }

      if (!responseData) {
        throw new Error(lastErrorMessage || "All Qwen model endpoints returned an error.");
      }

      const botReply =
        responseData.choices?.[0]?.message?.content ||
        "I'm sorry, I couldn't process your request right now. Please try again.";

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: botReply,
        },
      ]);
    } catch (err: unknown) {
      console.error("Chatbot API error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: "Sorry, I'm having trouble connecting right now. Please check your connection and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="floating-chatbot-wrapper">
      {/* Floating Chat Trigger Button */}
      {!isOpen && (
        <button
          className="chatbot-trigger-btn"
          onClick={() => setIsOpen(true)}
          title="Ask Vibhaag AI Assistant"
        >
          <img src="/Chatbot.png" alt="Vibhaag Assistant" className="chatbot-avatar-img" />
          <span className="chatbot-trigger-badge"><Sparkles size={12} /> AI Help</span>
        </button>
      )}

      {/* Floating Chat Modal Box */}
      {isOpen && (
        <div className="chatbot-modal-box fade-in">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <img src="/Chatbot.png" alt="Vibhaag AI" className="chatbot-header-img" />
              <div>
                <h4>Vibhaag AI Assistant</h4>
                <p>Qwen 2.5 • Website Doubts</p>
              </div>
            </div>
            <button className="chatbot-close-btn" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          {/* Messages Body */}
          <div className="chatbot-body">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chatbot-message-bubble ${msg.sender === "user" ? "user-bubble" : "bot-bubble"}`}
              >
                {msg.sender === "bot" && (
                  <div className="bot-avatar-tag">
                    <Bot size={13} />
                  </div>
                )}
                <div className="message-content">{msg.text}</div>
              </div>
            ))}

            {loading && (
              <div className="chatbot-message-bubble bot-bubble loading-bubble">
                <div className="bot-avatar-tag">
                  <RefreshCw size={13} className="spin-icon" />
                </div>
                <div className="message-content">Thinking...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length < 3 && !loading && (
            <div className="chatbot-quick-prompts">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button key={idx} className="quick-prompt-btn" onClick={() => handleSendMessage(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="chatbot-input-form"
          >
            <input
              type="text"
              placeholder="Ask a doubt about Vibhaag..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={!input.trim() || loading} className="chatbot-send-btn">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
