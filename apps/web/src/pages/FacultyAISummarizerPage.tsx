import { useState } from "react";
import { createAISummary, fetchAISummaries, type AISummary } from "../lib/api";

export default function FacultyAISummarizerPage() {
  const [text, setText] = useState("");
  const [summaries, setSummaries] = useState<AISummary[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const summaryText = `Summary: ${text.length > 100 ? text.slice(0, 100) + "…" : text}`;
      const newSummary = await createAISummary({ inputText: text, summary: summaryText });
      setSummaries((prev) => [newSummary, ...prev]);
      setText("");
    } finally {
      setLoading(false);
    }
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

      {summaries.length > 0 && (
        <div className="card">
          <h3 style={{ margin: "0 0 12px" }}>Recent Summaries</h3>
          {summaries.map((s) => (
            <div key={s._id} style={{ marginBottom: "12px", paddingBottom: "12px", borderBottom: "1px solid var(--line)" }}>
              <p style={{ margin: "0 0 4px", color: "var(--muted)", fontSize: "12px" }}>{new Date(s.createdAt).toLocaleString()}</p>
              <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{s.summary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
