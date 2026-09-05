import { useEffect, useState } from "react";

type Classroom = {
  _id: string;
  name: string;
  capacity: number;
  available: boolean;
};

export default function FacultyClassroomPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setClassrooms([
        { _id: "1", name: "Room 101", capacity: 60, available: true },
        { _id: "2", name: "Room 102", capacity: 45, available: false },
        { _id: "3", name: "Lab A", capacity: 30, available: true },
        { _id: "4", name: "Lab B", capacity: 30, available: true },
        { _id: "5", name: "Auditorium", capacity: 200, available: true },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="hero">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "28px" }}>🏫</span>
            <h2 style={{ margin: 0 }}>Classroom Manager</h2>
          </div>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            View and manage classroom availability and bookings.
          </p>
        </div>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
          ⏳ Loading classrooms…
        </div>
      )}

      {!loading && (
        <div className="grid">
          {classrooms.map((room) => (
            <div key={room._id} className="card" style={{ textAlign: "center" }}>
              <h3 style={{ margin: "0 0 8px" }}>{room.name}</h3>
              <div className="kpi" style={{ color: room.available ? "var(--accent-2)" : "#b91c1c" }}>
                {room.available ? "Available" : "Occupied"}
              </div>
              <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>Capacity: {room.capacity}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
