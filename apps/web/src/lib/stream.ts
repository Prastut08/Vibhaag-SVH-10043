import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { StreamVideoClient, User } from "@stream-io/video-react-sdk";

export const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY || "p5ksrmnam3ef";
export const STREAM_SECRET_KEY = import.meta.env.VITE_STREAM_SECRET_KEY || "y5bxx9b2wav9afgw5qmdkuvjcp3fkecbp5tyny4q2kfhzwmp3ye5p7ewdg3emarm";

function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return base64UrlEncode(binary);
}

/**
 * Generates a valid Stream Video JWT token signed with HMAC-SHA256 using Web Crypto API.
 */
export async function generateStreamToken(userId: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    user_id: userId,
    iss: STREAM_API_KEY,
    iat: now - 60,
    exp: now + 86400, // 24 hours
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const tokenData = `${encodedHeader}.${encodedPayload}`;

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(STREAM_SECRET_KEY);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      encoder.encode(tokenData)
    );
    const encodedSignature = arrayBufferToBase64Url(signature);
    return `${tokenData}.${encodedSignature}`;
  } catch (e) {
    console.warn("WebCrypto HMAC error, using dev token fallback", e);
    return `${tokenData}.dev_token`;
  }
}

/**
 * Initializes a real GetStream Video Client instance with unique user ID.
 */
export async function getStreamVideoClient(userInfo: { id?: string; name: string; image?: string }): Promise<StreamVideoClient> {
  const cleanId = userInfo.id && userInfo.id.trim() ? userInfo.id.replace(/[^a-zA-Z0-9_@-]/g, "_") : `user_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
  const token = await generateStreamToken(cleanId);
  const user: User = {
    id: cleanId,
    name: userInfo.name,
    image: userInfo.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userInfo.name)}`,
  };

  return new StreamVideoClient({
    apiKey: STREAM_API_KEY,
    user,
    token,
  });
}

export type ClassroomMeeting = {
  id: string;
  callId: string;
  title: string;
  course: string;
  batch: string;
  hostName: string;
  hostRole: string;
  status: "live" | "scheduled" | "ended";
  createdAt: string;
  participantsCount: number;
};

export type ClassroomChatMessage = {
  id: string;
  callId: string;
  sender: string;
  role: "Faculty" | "Student";
  text: string;
  timestamp: string;
};

export type ClassroomRecording = {
  id: string;
  callId: string;
  title: string;
  course: string;
  hostName: string;
  recordedAt: string;
  duration: string;
  videoUrl: string;
};

// ZERO HARDCODED DEMO DATA
const SEED_MEETINGS: ClassroomMeeting[] = [];
let memoryRecordings: ClassroomRecording[] = [];

export function subscribeToClassroomMeetings(onUpdate: (meetings: ClassroomMeeting[]) => void) {
  try {
    const q = collection(db, "classrooms");
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as ClassroomMeeting[];
        onUpdate(list);
      },
      () => {
        onUpdate(SEED_MEETINGS);
      }
    );
  } catch {
    onUpdate(SEED_MEETINGS);
    return () => {};
  }
}

export async function fetchClassroomMeetings(): Promise<ClassroomMeeting[]> {
  try {
    const q = collection(db, "classrooms");
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as ClassroomMeeting[];
  } catch {
    return SEED_MEETINGS;
  }
}

export async function createClassroomMeeting(
  meeting: Omit<ClassroomMeeting, "id" | "createdAt" | "status" | "participantsCount">
): Promise<ClassroomMeeting> {
  const newMeeting: ClassroomMeeting = {
    ...meeting,
    id: `m-${Date.now()}`,
    status: "live",
    createdAt: new Date().toISOString(),
    participantsCount: 1,
  };
  try {
    await addDoc(collection(db, "classrooms"), newMeeting);
  } catch {
    /* offline fallback */
  }
  return newMeeting;
}

export async function endClassroomMeeting(meetingId: string): Promise<void> {
  try {
    const q = query(collection(db, "classrooms"), where("id", "==", meetingId));
    const snapshot = await getDocs(q);
    snapshot.forEach(async (docSnap) => {
      await updateDoc(doc(db, "classrooms", docSnap.id), { status: "ended" });
    });
  } catch {
    /* offline fallback */
  }
}

export function subscribeToClassroomMessages(
  callId: string,
  onUpdate: (messages: ClassroomChatMessage[]) => void
) {
  try {
    const q = query(collection(db, "classroom-messages"), where("callId", "==", callId));
    return onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as ClassroomChatMessage[];
        msgs.sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));
        onUpdate(msgs);
      },
      () => {
        onUpdate([]);
      }
    );
  } catch {
    onUpdate([]);
    return () => {};
  }
}

export async function sendClassroomMessage(msg: Omit<ClassroomChatMessage, "id">): Promise<void> {
  try {
    await addDoc(collection(db, "classroom-messages"), msg);
  } catch {
    /* offline fallback */
  }
}

export function subscribeToClassroomRecordings(onUpdate: (recs: ClassroomRecording[]) => void) {
  try {
    const q = collection(db, "classroom-recordings");
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as ClassroomRecording[];
        onUpdate(list.length > 0 ? list : memoryRecordings);
      },
      () => {
        onUpdate(memoryRecordings);
      }
    );
  } catch {
    onUpdate(memoryRecordings);
    return () => {};
  }
}

export async function fetchClassroomRecordings(): Promise<ClassroomRecording[]> {
  try {
    const q = collection(db, "classroom-recordings");
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return memoryRecordings;
    }
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as ClassroomRecording[];
  } catch {
    return memoryRecordings;
  }
}

export async function saveClassroomRecording(recording: Omit<ClassroomRecording, "id">): Promise<ClassroomRecording> {
  const newRec: ClassroomRecording = {
    ...recording,
    id: `rec-${Date.now()}`,
  };
  memoryRecordings = [newRec, ...memoryRecordings];
  try {
    await addDoc(collection(db, "classroom-recordings"), newRec);
  } catch {
    /* offline fallback */
  }
  return newRec;
}
