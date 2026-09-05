import { useEffect, useState } from "react";
import {
  fetchAdminStudents,
  fetchAdminBranches,
  createStudentAccount,
  updateStudent,
  deleteStudent,
} from "../lib/api";

interface Student {
  uid: string;
  enrollmentNumber: string;
  name: string;
  email: string;
  branch?: string;
  semester?: string;
  createdAt?: string;
}

interface Branch {
  id: string;
  name: string;
  code: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [lastCreatedCredentials, setLastCreatedCredentials] = useState<{
    email: string;
    password: string;
    enrollmentNumber: string;
  } | null>(null);

  // Form state
  const [enrollmentNumber, setEnrollmentNumber] = useState("");
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("1");
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, branchesData] = await Promise.all([
        fetchAdminStudents(),
        fetchAdminBranches().catch(() => []),
      ]);
      setStudents(studentsData);
      setBranches(branchesData);
      if (branchesData.length > 0 && !branch) {
        setBranch(branchesData[0].code);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load student data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setEnrollmentNumber("");
    setName("");
    setBranch(branches.length > 0 ? branches[0].code : "");
    setSemester("1");
    setEditingUid(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLastCreatedCredentials(null);

    if (!name.trim()) {
      setError("Student Name is required.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingUid) {
        await updateStudent(editingUid, { name, branch, semester });
        setSuccessMsg(`Student profile updated successfully.`);
        resetForm();
        await loadData();
      } else {
        if (!enrollmentNumber.trim()) {
          setError("Enrollment Number is required to create a new student account.");
          setSubmitting(false);
          return;
        }

        const res = await createStudentAccount({
          enrollmentNumber,
          name,
          branch,
          semester,
        });

        setSuccessMsg(`Student account created for ${name}.`);
        if (res.credentials) {
          setLastCreatedCredentials({
            email: res.credentials.email,
            password: res.credentials.password,
            enrollmentNumber: res.credentials.enrollmentNumber,
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

  const handleEdit = (student: Student) => {
    setEditingUid(student.uid);
    setName(student.name);
    setEnrollmentNumber(student.enrollmentNumber);
    setBranch(student.branch || "");
    setSemester(student.semester || "1");
    setError(null);
    setSuccessMsg(null);
    setLastCreatedCredentials(null);
  };

  const handleDelete = async (uid: string, studentName: string) => {
    if (!window.confirm(`Are you sure you want to delete student account for "${studentName}"?`)) return;
    setError(null);
    setSuccessMsg(null);

    try {
      await deleteStudent(uid);
      setSuccessMsg(`Student account for "${studentName}" deleted.`);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete student";
      setError(msg);
    }
  };

  return (
    <>
      <section className="hero">
        <div>
          <span className="badge">Student Directory</span>
          <h2>Students Management</h2>
          <p>Provision student accounts, manage enrollments, and update branch assignments.</p>
        </div>
      </section>

      {error ? <div className="notice" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5" }}>{error}</div> : null}
      {successMsg ? <div className="notice" style={{ background: "#ecfdf5", color: "#059669", border: "1px solid #6ee7b7" }}>{successMsg}</div> : null}

      {lastCreatedCredentials ? (
        <div className="card" style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
          <h3 style={{ color: "#166534" }}>🎉 Account Generated Successfully</h3>
          <p style={{ color: "#15803d", marginBottom: "8px" }}>Provide these login credentials to the student:</p>
          <div style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "10px", border: "1px solid #cbd5e1" }}>
            <div><strong>Enrollment No:</strong> {lastCreatedCredentials.enrollmentNumber}</div>
            <div><strong>Generated Email:</strong> {lastCreatedCredentials.email}</div>
            <div><strong>Default Password:</strong> <code>{lastCreatedCredentials.password}</code></div>
          </div>
        </div>
      ) : null}

      {/* Provision / Edit Form */}
      <div className="card">
        <h3>{editingUid ? "Edit Student Profile" : "Provision New Student Account"}</h3>
        <form onSubmit={handleSubmit} className="form-grid">
          {!editingUid ? (
            <label className="input">
              Enrollment Number *
              <input
                type="text"
                placeholder="e.g. 23BCS1001"
                value={enrollmentNumber}
                onChange={(e) => setEnrollmentNumber(e.target.value)}
                required
              />
            </label>
          ) : (
            <label className="input">
              Enrollment Number (Read Only)
              <input type="text" value={enrollmentNumber} disabled style={{ opacity: 0.7 }} />
            </label>
          )}

          <label className="input">
            Student Full Name *
            <input
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label className="input">
            Branch
            {branches.length > 0 ? (
              <select value={branch} onChange={(e) => setBranch(e.target.value)}>
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
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
              />
            )}
          </label>

          <label className="input">
            Semester
            <select value={semester} onChange={(e) => setSemester(e.target.value)}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={String(sem)}>
                  Semester {sem}
                </option>
              ))}
            </select>
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

      {/* Student List */}
      <div className="card">
        <div className="section-title">
          <h3>Enrolled Students</h3>
          <span className="badge">{students.length} Total</span>
        </div>

        {loading ? (
          <p>Loading student directory...</p>
        ) : students.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No students provisioned yet. Create a student account above.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Enrollment No</th>
                  <th>Name</th>
                  <th>Generated Email</th>
                  <th>Branch</th>
                  <th>Semester</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.uid}>
                    <td data-label="Enrollment No">
                      <strong style={{ background: "var(--bg-2)", padding: "2px 6px", borderRadius: "6px" }}>
                        {s.enrollmentNumber}
                      </strong>
                    </td>
                    <td data-label="Name">{s.name}</td>
                    <td data-label="Generated Email">{s.email}</td>
                    <td data-label="Branch">{s.branch || "--"}</td>
                    <td data-label="Semester">{s.semester ? `Sem ${s.semester}` : "--"}</td>
                    <td data-label="Actions">
                      <div className="button-group">
                        <button
                          className="button secondary"
                          style={{ padding: "4px 10px", fontSize: "13px" }}
                          onClick={() => handleEdit(s)}
                        >
                          Edit
                        </button>
                        <button
                          className="button"
                          style={{ padding: "4px 10px", fontSize: "13px", background: "#dc2626" }}
                          onClick={() => handleDelete(s.uid, s.name)}
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
