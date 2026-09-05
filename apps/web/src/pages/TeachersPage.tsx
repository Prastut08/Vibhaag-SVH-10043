import { useEffect, useState } from "react";
import {
  fetchAdminTeachers,
  fetchAdminBranches,
  createTeacherAccount,
  updateTeacher,
  deleteTeacher,
} from "../lib/api";

interface Teacher {
  uid: string;
  teacherIdentifier: string;
  name: string;
  email: string;
  department?: string;
  designation?: string;
  createdAt?: string;
}

interface Branch {
  id: string;
  name: string;
  code: string;
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [lastCreatedCredentials, setLastCreatedCredentials] = useState<{
    email: string;
    password: string;
    teacherIdentifier: string;
  } | null>(null);

  // Form state
  const [teacherIdentifier, setTeacherIdentifier] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("Assistant Professor");
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [teachersData, branchesData] = await Promise.all([
        fetchAdminTeachers(),
        fetchAdminBranches().catch(() => []),
      ]);
      setTeachers(teachersData);
      setBranches(branchesData);
      if (branchesData.length > 0 && !department) {
        setDepartment(branchesData[0].code);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load teacher data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setTeacherIdentifier("");
    setName("");
    setDepartment(branches.length > 0 ? branches[0].code : "");
    setDesignation("Assistant Professor");
    setEditingUid(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLastCreatedCredentials(null);

    if (!name.trim()) {
      setError("Teacher Name is required.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingUid) {
        await updateTeacher(editingUid, { name, department, designation });
        setSuccessMsg(`Teacher profile updated successfully.`);
        resetForm();
        await loadData();
      } else {
        if (!teacherIdentifier.trim()) {
          setError("Teacher Identifier is required to create a new teacher account.");
          setSubmitting(false);
          return;
        }

        const res = await createTeacherAccount({
          teacherIdentifier,
          name,
          department,
          designation,
        });

        setSuccessMsg(`Teacher account created for ${name}.`);
        if (res.credentials) {
          setLastCreatedCredentials({
            email: res.credentials.email,
            password: res.credentials.password,
            teacherIdentifier: res.credentials.teacherIdentifier,
          });
        }
        resetForm();
        await loadData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Operation failed";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingUid(teacher.uid);
    setName(teacher.name);
    setTeacherIdentifier(teacher.teacherIdentifier);
    setDepartment(teacher.department || "");
    setDesignation(teacher.designation || "Assistant Professor");
    setError(null);
    setSuccessMsg(null);
    setLastCreatedCredentials(null);
  };

  const handleDelete = async (uid: string, teacherName: string) => {
    if (!window.confirm(`Are you sure you want to delete teacher account for "${teacherName}"?`)) return;
    setError(null);
    setSuccessMsg(null);

    try {
      await deleteTeacher(uid);
      setSuccessMsg(`Teacher account for "${teacherName}" deleted.`);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete teacher";
      setError(msg);
    }
  };

  return (
    <>
      <section className="hero">
        <div>
          <span className="badge">Faculty Roster</span>
          <h2>Teachers Management</h2>
          <p>Provision faculty accounts, manage designations, and assign academic departments.</p>
        </div>
      </section>

      {error ? <div className="notice" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5" }}>{error}</div> : null}
      {successMsg ? <div className="notice" style={{ background: "#ecfdf5", color: "#059669", border: "1px solid #6ee7b7" }}>{successMsg}</div> : null}

      {lastCreatedCredentials ? (
        <div className="card" style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
          <h3 style={{ color: "#166534" }}>🎉 Account Generated Successfully</h3>
          <p style={{ color: "#15803d", marginBottom: "8px" }}>Provide these login credentials to the teacher:</p>
          <div style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "10px", border: "1px solid #cbd5e1" }}>
            <div><strong>Teacher ID:</strong> {lastCreatedCredentials.teacherIdentifier}</div>
            <div><strong>Generated Email:</strong> {lastCreatedCredentials.email}</div>
            <div><strong>Default Password:</strong> <code>{lastCreatedCredentials.password}</code></div>
          </div>
        </div>
      ) : null}

      {/* Provision / Edit Form */}
      <div className="card">
        <h3>{editingUid ? "Edit Teacher Profile" : "Provision New Teacher Account"}</h3>
        <form onSubmit={handleSubmit} className="form-grid">
          {!editingUid ? (
            <label className="input">
              Teacher Identifier *
              <input
                type="text"
                placeholder="e.g. T1001"
                value={teacherIdentifier}
                onChange={(e) => setTeacherIdentifier(e.target.value)}
                required
              />
            </label>
          ) : (
            <label className="input">
              Teacher Identifier (Read Only)
              <input type="text" value={teacherIdentifier} disabled style={{ opacity: 0.7 }} />
            </label>
          )}

          <label className="input">
            Teacher Full Name *
            <input
              type="text"
              placeholder="e.g. Dr. Ananya Roy"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label className="input">
            Department / Branch
            {branches.length > 0 ? (
              <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                {branches.map((b) => (
                  <option key={b.id} value={b.code}>
                    {b.code} - {b.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="e.g. CSE"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            )}
          </label>

          <label className="input">
            Designation
            <input
              type="text"
              placeholder="e.g. Associate Professor / HOD"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
            />
          </label>

          <div className="button-group" style={{ marginTop: "auto" }}>
            <button className="button" type="submit" disabled={submitting}>
              {submitting ? "Processing..." : editingUid ? "Update Profile" : "Create Account"}
            </button>
            {editingUid ? (
              <button className="button secondary" type="button" onClick={resetForm}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </div>

      {/* Teachers List */}
      <div className="card">
        <div className="section-title">
          <h3>Faculty Members</h3>
          <span className="badge">{teachers.length} Total</span>
        </div>

        {loading ? (
          <p>Loading faculty roster...</p>
        ) : teachers.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No teachers provisioned yet. Create a teacher account above.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Teacher ID</th>
                  <th>Name</th>
                  <th>Generated Email</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t.uid}>
                    <td data-label="Teacher ID">
                      <strong style={{ background: "var(--bg-2)", padding: "2px 6px", borderRadius: "6px" }}>
                        {t.teacherIdentifier}
                      </strong>
                    </td>
                    <td data-label="Name">{t.name}</td>
                    <td data-label="Generated Email">{t.email}</td>
                    <td data-label="Department">{t.department || "--"}</td>
                    <td data-label="Designation">{t.designation || "--"}</td>
                    <td data-label="Actions">
                      <div className="button-group">
                        <button
                          className="button secondary"
                          style={{ padding: "4px 10px", fontSize: "13px" }}
                          onClick={() => handleEdit(t)}
                        >
                          Edit
                        </button>
                        <button
                          className="button"
                          style={{ padding: "4px 10px", fontSize: "13px", background: "#dc2626" }}
                          onClick={() => handleDelete(t.uid, t.name)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
