import { useState } from "react";

export default function FacultyAISummarizerPage() {
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setSummary(
        `Summary: ${text.length > 100 ? text.slice(0, 100) + "…" : text} — This is a simulated AI-generated summary. Connect this to your backend summarization service for real results.`
      );
      setLoading(false);
    }, 800);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="hero">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "28px" }}>🤖</span>
            <h2 style={{ margin: 0 }}>AI Book Summarizer</h2>
          </div>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Paste text or book excerpts to generate concise summaries.
          </p>
        </div>
      </div>

      <div className="card">
        <label className="input">
          Input Text
          <textarea
            rows={8}
            placeholder="Paste book content or notes here…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ fontFamily: "inherit", resize: "vertical" }}
          />
        </label>
        <button
          className="button"
          onClick={handleSummarize}
          disabled={loading || !text.trim()}
          style={{ marginTop: "12px" }}
        >
          {loading ? "⏳ Summarizing…" : "✨ Summarize"}
        </button>
      </div>

      {summary && (
        <div className="card">
          <h3 style={{ margin: "0 0 12px" }}>Summary</h3>
          <p style={{ margin: 0, color: "var(--muted)", whiteSpace: "pre-wrap" }}>{summary}</p>
        </div>
      )}
    </div>
  );
}
