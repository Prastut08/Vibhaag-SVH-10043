import { useEffect, useState } from "react";
import {
  createBatch,
  createDepartment,
  createStudentAccount,
  createTeacherAccount,
  fetchBatches,
  fetchDepartments,
  fetchUsers,
} from "../lib/api";

type UserRow = { _id: string; name: string; email: string; role: string; rollNumber?: string | null };
type SelectOption = { _id: string; name: string };

export default function PeoplePage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [departments, setDepartments] = useState<SelectOption[]>([]);
  const [batches, setBatches] = useState<SelectOption[]>([]);

  // Account creation state
  const [accountType, setAccountType] = useState<"student" | "teacher">("student");
  const [name, setName] = useState("");
  const [enrollmentNumber, setEnrollmentNumber] = useState("");
  const [teacherIdentifier, setTeacherIdentifier] = useState("");
  const [branch, setBranch] = useState("Computer Science");
  const [semester, setSemester] = useState("1");
  const [designation, setDesignation] = useState("Assistant Professor");
  const [departmentId, setDepartmentId] = useState("");
  const [batchId, setBatchId] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ email: string; password: string; identifier: string } | null>(null);

  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [batchName, setBatchName] = useState("");
  const [batchYear, setBatchYear] = useState("2026");
  const [batchDepartmentId, setBatchDepartmentId] = useState("");

  useEffect(() => {
    fetchUsers().then(setUsers).catch(() => setUsers([]));
    fetchDepartments().then(setDepartments).catch(() => setDepartments([]));
    fetchBatches().then(setBatches).catch(() => setBatches([]));
  }, []);

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setCredentials(null);

    try {
      if (accountType === "student") {
        if (!enrollmentNumber.trim()) throw new Error("Enrollment Number is required");
        const res = await createStudentAccount({
          enrollmentNumber,
          name,
          branch,
          semester,
          departmentId: departmentId || undefined,
          batchId: batchId || undefined,
        });

        setCredentials({
          identifier: res.credentials.enrollmentNumber,
          email: res.credentials.email,
          password: res.credentials.password,
        });
        setMessage("Student account created successfully.");
      } else {
        if (!teacherIdentifier.trim()) throw new Error("Teacher Identifier is required");
        const res = await createTeacherAccount({
          teacherIdentifier,
          name,
          department: branch,
          designation,
          departmentId: departmentId || undefined,
        });

        setCredentials({
          identifier: res.credentials.teacherIdentifier,
          email: res.credentials.email,
          password: res.credentials.password,
        });
        setMessage("Teacher account created successfully.");
      }

      const updated = await fetchUsers();
      setUsers(updated);
      setName("");
      setEnrollmentNumber("");
      setTeacherIdentifier("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Account creation failed");
    }
  };

  const handleDepartment = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    try {
      await createDepartment(deptName, deptCode);
      const updated = await fetchDepartments();
      setDepartments(updated);
      setDeptName("");
      setDeptCode("");
      setMessage("Department created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Department creation failed");
    }
  };

  const handleBatch = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    try {
      await createBatch(batchName, Number(batchYear), batchDepartmentId);
      const updated = await fetchBatches();
      setBatches(updated);
      setBatchName("");
      setBatchYear("2026");
      setBatchDepartmentId("");
      setMessage("Batch created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Batch creation failed");
    }
  };

  return (
    <div className="grid">
      {/* Admin User Provisioning Card */}
      <div className="card" style={{ gridColumn: "1 / -1" }}>
        <div className="section-title">
          <h3>Provision Student / Teacher Account</h3>
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
          <button
            type="button"
            className={`button ${accountType === "student" ? "" : "secondary"}`}
            onClick={() => { setAccountType("student"); setMessage(null); setCredentials(null); }}
          >
            🎓 Add Student
          </button>
          <button
            type="button"
            className={`button ${accountType === "teacher" ? "" : "secondary"}`}
            onClick={() => { setAccountType("teacher"); setMessage(null); setCredentials(null); }}
          >
            👨‍🏫 Add Teacher
          </button>
        </div>

        <form className="form-grid" onSubmit={handleCreateUser}>
          {accountType === "student" ? (
            <label className="input">
              Enrollment Number
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
              Teacher Identifier
              <input
                type="text"
                placeholder="e.g. T1001"
                value={teacherIdentifier}
                onChange={(e) => setTeacherIdentifier(e.target.value)}
                required
              />
            </label>
          )}

          <label className="input">
            Full Name
            <input
              type="text"
              placeholder={accountType === "student" ? "e.g. Rahul Sharma" : "e.g. Dr. Ananya Roy"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label className="input">
            Branch / Department
            <input
              type="text"
              placeholder="e.g. Computer Science"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            />
          </label>

          {accountType === "student" ? (
            <label className="input">
              Semester
              <input
                type="text"
                placeholder="e.g. 1"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              />
            </label>
          ) : (
            <label className="input">
              Designation
              <input
                type="text"
                placeholder="e.g. Assistant Professor"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
              />
            </label>
          )}

          <button className="button" type="submit" style={{ gridColumn: "1 / -1", marginTop: "8px" }}>
            Provision {accountType === "student" ? "Student" : "Teacher"} Account
          </button>
        </form>

        {credentials && (
          <div className="notice" style={{ marginTop: "16px", background: "#f0fdf4", borderColor: "#86efac", color: "#166534" }}>
            <h4>Generated Login Credentials</h4>
            <p><strong>Identifier:</strong> {credentials.identifier}</p>
            <p><strong>Email:</strong> {credentials.email}</p>
            <p><strong>Initial Password:</strong> {credentials.password}</p>
          </div>
        )}

        {message && !credentials ? <div className="notice" style={{ marginTop: "16px" }}>{message}</div> : null}
      </div>

      {/* Departments & Batches */}
      <div className="card">
        <div className="section-title">
          <h3>Departments & Batches</h3>
        </div>
        <form className="form-grid" onSubmit={handleDepartment}>
          <label className="input">
            Department Name
            <input value={deptName} onChange={(e) => setDeptName(e.target.value)} required />
          </label>
          <label className="input">
            Department Code
            <input value={deptCode} onChange={(e) => setDeptCode(e.target.value)} required />
          </label>
          <button className="button" type="submit">
            Create Department
          </button>
        </form>
        <form className="form-grid" onSubmit={handleBatch} style={{ marginTop: "16px" }}>
          <label className="input">
            Batch Name
            <input value={batchName} onChange={(e) => setBatchName(e.target.value)} required />
          </label>
          <label className="input">
            Batch Year
            <input value={batchYear} onChange={(e) => setBatchYear(e.target.value)} required />
          </label>
          <button className="button secondary" type="submit">
            Create Batch
          </button>
        </form>
      </div>

      {/* Directory */}
      <div className="card">
        <div className="section-title">
          <h3>Directory</h3>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id || u.email}>
                  <td data-label="Name">{u.name}</td>
                  <td data-label="Email">{u.email}</td>
                  <td data-label="Role">{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
