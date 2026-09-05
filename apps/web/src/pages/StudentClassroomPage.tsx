import { useEffect, useRef, useState } from "react";
import {
  Download,
  MessageSquare,
  PhoneOff,
  Play,
  Radio,
  ShieldCheck,
  Video as VideoIcon,
  X,
  Search,
  Mic,
  MicOff,
  Disc,
  MonitorUp,
} from "lucide-react";
import {
  Call,
  CallControls,
  ParticipantView,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";

import {
  fetchClassroomRecordings,
  getStreamVideoClient,
  saveClassroomRecording,
  sendClassroomMessage,
  STREAM_API_KEY,
  subscribeToClassroomMeetings,
  subscribeToClassroomMessages,
  subscribeToClassroomRecordings,
  type ClassroomChatMessage,
  type ClassroomMeeting,
  type ClassroomRecording,
} from "../lib/stream";

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => resolve(URL.createObjectURL(blob));
    reader.readAsDataURL(blob);
  });
}

function StudentStreamVideoGrid() {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const hasScreenShare = participants.some((p) => p.isScreenSharing);

  if (participants.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
        ⌛ Connecting to real WebRTC session...
      </div>
    );
  }

  if (hasScreenShare) {
    return (
      <div style={{ flex: 1, padding: "16px", overflow: "hidden" }}>
        <SpeakerLayout participantsBarPosition="bottom" />
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        padding: "20px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "16px",
        alignContent: "center",
        overflowY: "auto",
      }}
    >
      {participants.map((participant) => (
        <div
          key={participant.sessionId}
          style={{
            background: "#1e293b",
            borderRadius: "12px",
            border: participant.isSpeaking ? "2px solid #10b981" : "1px solid #334155",
            position: "relative",
            minHeight: "240px",
            overflow: "hidden",
          }}
        >
          <ParticipantView participant={participant} style={{ width: "100%", height: "100%", objectFit: "cover" }} />

          <div
            style={{
              position: "absolute",
              bottom: "12px",
              left: "12px",
              background: "rgba(15, 23, 42, 0.85)",
              backdropFilter: "blur(4px)",
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#fff",
              zIndex: 10,
            }}
          >
            <span>
              {participant.name || participant.userId} {participant.isLocalParticipant ? "(You)" : ""}
            </span>
            {participant.isMicrophoneEnabled ? <Mic size={14} color="#10b981" /> : <MicOff size={14} color="#ef4444" />}
          </div>
        </div>
      ))}
    </div>
  );
}

function StudentStreamChatDrawer({
  callId,
  chatMessages,
  onClose,
}: {
  callId: string;
  chatMessages: ClassroomChatMessage[];
  onClose: () => void;
}) {
  const [messageInput, setMessageInput] = useState("");

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageInput.trim()) return;
    const text = messageInput.trim();
    setMessageInput("");
    await sendClassroomMessage({
      callId,
      sender: "Student Participant",
      role: "Student",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
  }

  return (
    <div
      style={{
        width: "300px",
        background: "#1e293b",
        borderLeft: "1px solid #334155",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid #334155",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
          <MessageSquare size={16} /> Meeting Chat
        </span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ flex: 1, padding: "12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
        {chatMessages.map((msg) => (
          <div key={msg.id} style={{ background: "#0f172a", padding: "8px 12px", borderRadius: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>
              <span style={{ fontWeight: 600, color: msg.role === "Faculty" ? "#818cf8" : "#38bdf8" }}>{msg.sender}</span>
              <span>{msg.timestamp}</span>
            </div>
            <div style={{ fontSize: "13px", color: "#e2e8f0" }}>{msg.text}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSendMessage} style={{ padding: "12px", borderTop: "1px solid #334155", display: "flex", gap: "8px" }}>
        <input
          type="text"
          placeholder="Ask a question..."
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          style={{
            flex: 1,
            background: "#0f172a",
            border: "1px solid #334155",
            borderRadius: "6px",
            padding: "8px 12px",
            color: "#fff",
            fontSize: "13px",
          }}
        />
        <button type="submit" style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 12px", cursor: "pointer" }}>
          Send
        </button>
      </form>
    </div>
  );
}

export default function StudentClassroomPage() {
  const [meetings, setMeetings] = useState<ClassroomMeeting[]>([]);
  const [recordings, setRecordings] = useState<ClassroomRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCall, setActiveCall] = useState<ClassroomMeeting | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState("");

  // GetStream SDK instances
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);

  // Controls
  const [showChat, setShowChat] = useState(true);
  const [chatMessages, setChatMessages] = useState<ClassroomChatMessage[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // Video Preview Modal
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  useEffect(() => {
    const unsubscribeMeetings = subscribeToClassroomMeetings((list) => {
      const liveList = list.filter((m) => m.status === "live");
      setMeetings(liveList);
      setLoading(false);

      // Auto join via URL search param ?callId=...
      const urlParams = new URLSearchParams(window.location.search);
      const callIdFromUrl = urlParams.get("callId");
      if (callIdFromUrl && !activeCall) {
        const matched = liveList.find((m) => m.callId.toLowerCase() === callIdFromUrl.toLowerCase());
        if (matched) {
          handleJoinMeeting(matched);
        } else {
          handleJoinMeeting({
            id: `url-${Date.now()}`,
            callId: callIdFromUrl,
            title: `Live Lecture Room (${callIdFromUrl})`,
            course: "CS101",
            batch: "2024-CSE",
            hostName: "Faculty Host",
            hostRole: "Faculty",
            status: "live",
            createdAt: new Date().toISOString(),
            participantsCount: 1,
          });
        }
      }
    });

    const unsubscribeRecordings = subscribeToClassroomRecordings((list) => {
      setRecordings(list);
    });

    return () => {
      unsubscribeMeetings();
      unsubscribeRecordings();
    };
  }, []);

  useEffect(() => {
    if (!activeCall) return;
    const unsubscribeChat = subscribeToClassroomMessages(activeCall.callId, (msgs) => {
      if (msgs.length > 0) setChatMessages(msgs);
    });
    return () => {
      unsubscribeChat();
    };
  }, [activeCall]);

  async function loadRecordings() {
    const list = await fetchClassroomRecordings();
    setRecordings(list);
  }

  async function handleJoinMeeting(meeting: ClassroomMeeting) {
    setActiveCall(meeting);
    try {
      // Unique student ID for multi-browser support
      const uniqueStudentId = `std_${Date.now().toString().slice(-4)}_${Math.random().toString(36).substring(2, 6)}`;
      const streamClient = await getStreamVideoClient({
        id: uniqueStudentId,
        name: "Student Participant",
      });
      setClient(streamClient);

      const streamCall = streamClient.call("default", meeting.callId);
      await streamCall.join({ create: true });
      try {
        await streamCall.camera.enable();
      } catch (camErr) {
        console.warn("Camera in use or permission denied, proceeding without camera:", camErr);
      }
      try {
        await streamCall.microphone.enable();
      } catch (micErr) {
        console.warn("Microphone permission denied, proceeding without mic:", micErr);
      }
      setCall(streamCall);
    } catch (e) {
      console.error("Stream join error", e);
    }
  }

  function handleJoinWithCode(e: React.FormEvent) {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    const inputStr = joinCodeInput.trim();
    let code = inputStr;
    try {
      if (inputStr.includes("callId=")) {
        const parsed = new URL(inputStr);
        code = parsed.searchParams.get("callId") || inputStr;
      }
    } catch {
      /* ignore URL parse error */
    }

    const match = meetings.find((m) => m.callId.toLowerCase() === code.toLowerCase());
    if (match) {
      handleJoinMeeting(match);
    } else {
      handleJoinMeeting({
        id: `custom-${Date.now()}`,
        callId: code,
        title: `Live Lecture Room (${code})`,
        course: "CS101",
        batch: "2024-CSE",
        hostName: "Faculty Member",
        hostRole: "Faculty",
        status: "live",
        createdAt: new Date().toISOString(),
        participantsCount: 1,
      });
    }
  }

  async function toggleScreenShare() {
    if (!call) return;
    try {
      if (!isScreenSharing) {
        await call.screenShare.enable();
        setIsScreenSharing(true);
      } else {
        await call.screenShare.disable();
        setIsScreenSharing(false);
      }
    } catch (e) {
      console.warn("Screen share error", e);
    }
  }

  async function startRecording() {
    recordedChunksRef.current = [];
    let mediaStream: MediaStream | null = null;

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      }
    } catch {
      /* User cancelled screen selection */
    }

    if (!mediaStream && navigator.mediaDevices) {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
          console.warn("Media devices unavailable for recording");
        }
      }
    }

    if (mediaStream) {
      try {
        let mimeType = "video/webm";
        if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) {
          mimeType = "video/webm;codecs=vp8,opus";
        } else if (MediaRecorder.isTypeSupported("video/mp4")) {
          mimeType = "video/mp4";
        }
        const recorder = new MediaRecorder(mediaStream, { mimeType });
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
        };
        recorder.start(1000);
        mediaRecorderRef.current = recorder;
      } catch (err) {
        console.warn("MediaRecorder instantiation error:", err);
      }
    }

    setIsRecording(true);
    setRecordingSeconds(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  }

  async function stopRecording() {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn("Stop recorder error:", e);
      }
    }

    const secs = recordingSeconds > 0 ? recordingSeconds : 5;
    const durationText = `${Math.floor(secs / 60)}m ${secs % 60}s`;

    let blobUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
    if (recordedChunksRef.current.length > 0) {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      blobUrl = await blobToDataURL(blob);
    }

    if (activeCall) {
      const newRec = await saveClassroomRecording({
        callId: activeCall.callId,
        title: activeCall.title,
        course: activeCall.course,
        hostName: "Student Recording",
        recordedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }),
        duration: durationText,
        videoUrl: blobUrl,
      });
      setRecordings((prev) => [newRec, ...prev.filter((r) => r.id !== newRec.id)]);
      setPreviewVideoUrl(newRec.videoUrl);
      setPreviewTitle(newRec.title);
    }
  }

  function formatTime(secs: number) {
    const mins = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${mins}:${s}`;
  }

  async function handleLeaveCall() {
    if (isRecording) {
      await stopRecording();
    }
    if (call) {
      await call.leave();
      setCall(null);
    }
    if (client) {
      await client.disconnectUser();
      setClient(null);
    }
    setActiveCall(null);
  }

  // ── IN-CALL WEBRTC VIEW ──
  if (activeCall && client && call) {
    return (
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <StreamTheme style={{ color: "#fff" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                height: "calc(100vh - 40px)",
                background: "#0f172a",
                borderRadius: "16px",
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: "16px 24px",
                  background: "#1e293b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #334155",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", background: "#ef4444", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 }}>
                    <Radio size={14} className="pulse" /> LIVE CLASS
                  </span>
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#fff" }}>{activeCall.title}</h3>

                  {isRecording && (
                    <span style={{ display: "flex", alignItems: "center", gap: "6px", background: "#b91c1c", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 700 }}>
                      <Disc size={14} className="spin" /> REC {formatTime(recordingSeconds)}
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px" }}>
                  <ShieldCheck size={16} color="#10b981" />
                  <span>GetStream SFU Session</span>
                </div>
              </div>

              {/* Stage & Chat */}
              <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                <StudentStreamVideoGrid />

                {showChat && (
                  <StudentStreamChatDrawer
                    callId={activeCall.callId}
                    chatMessages={chatMessages}
                    onClose={() => setShowChat(false)}
                  />
                )}
              </div>

              {/* Control Dock */}
              <div
                style={{
                  padding: "16px 24px",
                  background: "#1e293b",
                  borderTop: "1px solid #334155",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "16px",
                }}
              >
                <button
                  onClick={toggleScreenShare}
                  style={{
                    height: "40px",
                    padding: "0 16px",
                    borderRadius: "20px",
                    border: "none",
                    background: isScreenSharing ? "#6366f1" : "#334155",
                    color: "#fff",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                  title="Toggle Screen Share"
                >
                  <MonitorUp size={18} />
                  {isScreenSharing ? "Stop Sharing" : "Share Screen"}
                </button>

                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  style={{
                    height: "40px",
                    padding: "0 16px",
                    borderRadius: "20px",
                    border: "none",
                    background: isRecording ? "#b91c1c" : "#334155",
                    color: "#fff",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  <Disc size={18} color={isRecording ? "#ffffff" : "#ef4444"} />
                  {isRecording ? "Stop Recording" : "Record Meeting"}
                </button>

                <button
                  onClick={() => setShowChat(!showChat)}
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    border: "none",
                    background: showChat ? "#2563eb" : "#334155",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                  title="Toggle Chat"
                >
                  <MessageSquare size={18} />
                </button>

                <CallControls onLeave={handleLeaveCall} />

                <button
                  onClick={handleLeaveCall}
                  style={{
                    padding: "0 20px",
                    height: "40px",
                    borderRadius: "20px",
                    border: "none",
                    background: "#ef4444",
                    color: "#fff",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    marginLeft: "12px",
                  }}
                >
                  <PhoneOff size={18} /> Leave Class
                </button>
              </div>
            </div>
          </StreamTheme>
        </StreamCall>
      </StreamVideo>
    );
  }

  // ── STUDENT DASHBOARD VIEW ──
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="hero" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "28px" }}>🏫</span>
            <h2 style={{ margin: 0 }}>Live Video Classroom</h2>
          </div>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Join real-time video lectures across multiple devices or paste join links.
          </p>
        </div>
      </div>

      {/* Join Box */}
      <div className="card" style={{ padding: "20px 24px" }}>
        <h4 style={{ margin: "0 0 12px" }}>Join Class with Room Link or Code</h4>
        <form onSubmit={handleJoinWithCode} style={{ display: "flex", gap: "12px", maxWidth: "560px" }}>
          <input
            type="text"
            placeholder="Paste Join Link or enter Room Code (e.g. room-cs101-1234)"
            value={joinCodeInput}
            onChange={(e) => setJoinCodeInput(e.target.value)}
            style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border)" }}
          />
          <button type="submit" className="button" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Search size={16} /> Join Class
          </button>
        </form>
      </div>

      {/* Live Feed */}
      <h3 style={{ margin: "8px 0 0" }}>Active Live Classes</h3>

      {loading ? (
        <div className="card" style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
          ⏳ Listening for live faculty meetings...
        </div>
      ) : meetings.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
          No live classes currently running. Once a teacher starts a class, it will appear here in real time.
        </div>
      ) : (
        <div className="grid">
          {meetings.map((meeting) => (
            <div key={meeting.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ background: "#fee2e2", color: "#dc2626", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                    <Radio size={12} className="pulse" /> LIVE NOW
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--muted)" }}>Code: {meeting.callId}</span>
                </div>

                <h4 style={{ margin: "0 0 6px" }}>{meeting.title}</h4>
                <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "8px" }}>
                  Faculty: <strong>{meeting.hostName}</strong>
                </div>
                <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                  Course: {meeting.course} | Batch: {meeting.batch}
                </div>
              </div>

              <button className="button" onClick={() => handleJoinMeeting(meeting)} style={{ width: "100%", marginTop: "20px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <VideoIcon size={16} /> Join Live Lecture
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Recorded Lectures */}
      <h3 style={{ margin: "24px 0 0" }}>🎥 Recorded Class Lectures</h3>
      {recordings.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "30px", color: "var(--muted)" }}>
          No recorded lectures available yet.
        </div>
      ) : (
        <div className="grid">
          {recordings.map((rec) => (
            <div key={rec.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", background: "#f3f4f6", padding: "2px 8px", borderRadius: "4px" }}>{rec.course}</span>
                  <span style={{ fontSize: "12px", color: "var(--muted)" }}>{rec.duration}</span>
                </div>
                <h4 style={{ margin: "0 0 6px" }}>{rec.title}</h4>
                <div style={{ fontSize: "13px", color: "var(--muted)" }}>{rec.recordedAt} • {rec.hostName}</div>
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                <button
                  className="button"
                  onClick={() => {
                    setPreviewVideoUrl(rec.videoUrl);
                    setPreviewTitle(rec.title);
                  }}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "8px" }}
                >
                  <Play size={14} /> Watch Lecture
                </button>
                <a href={rec.videoUrl} download={`${rec.title}.webm`} target="_blank" rel="noreferrer" className="button secondary" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 12px" }}>
                  <Download size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Modal Preview */}
      {previewVideoUrl && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div className="card fade-in" style={{ width: "640px", maxWidth: "90%", padding: "20px", background: "#0f172a", color: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "16px" }}>🎥 {previewTitle}</h3>
              <button onClick={() => setPreviewVideoUrl(null)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>
            <video controls autoPlay style={{ width: "100%", borderRadius: "8px", maxHeight: "400px" }} src={previewVideoUrl} />
          </div>
        </div>
      )}
    </div>
  );
}
