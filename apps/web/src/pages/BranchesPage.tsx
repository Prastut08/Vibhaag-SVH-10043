import { useEffect, useState } from "react";
import { fetchAdminBranches, createBranch, updateBranch, deleteBranch } from "../lib/api";

interface Branch {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt?: string;
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminBranches();
      setBranches(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load branches";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const resetForm = () => {
    setName("");
    setCode("");
    setDescription("");
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!name.trim() || !code.trim()) {
      setError("Branch Name and Branch Code are required.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await updateBranch(editingId, { name, code, description });
        setSuccessMsg(`Branch '${code.toUpperCase()}' updated successfully.`);
      } else {
        await createBranch({ name, code, description });
        setSuccessMsg(`Branch '${code.toUpperCase()}' created successfully.`);
      }
      resetForm();
      await loadBranches();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Operation failed";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingId(branch.id);
    setName(branch.name);
    setCode(branch.code);
    setDescription(branch.description || "");
    setError(null);
    setSuccessMsg(null);
  };

  const handleDelete = async (id: string, branchName: string) => {
    if (!window.confirm(`Are you sure you want to delete branch "${branchName}"?`)) return;
    setError(null);
    setSuccessMsg(null);

    try {
      await deleteBranch(id);
      setSuccessMsg(`Branch "${branchName}" deleted successfully.`);
      await loadBranches();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete branch";
      setError(msg);
    }
  };

  return (
    <>
      <section className="hero">
        <div>
          <span className="badge">Campus Structure</span>
          <h2>Branches Management</h2>
          <p>Define academic branches, departments, and specializations across campus.</p>
        </div>
      </section>

      {error ? <div className="notice" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5" }}>{error}</div> : null}
      {successMsg ? <div className="notice" style={{ background: "#ecfdf5", color: "#059669", border: "1px solid #6ee7b7" }}>{successMsg}</div> : null}

      {/* Add / Edit Branch Form */}
      <div className="card">
        <h3>{editingId ? "Edit Branch" : "Add New Branch"}</h3>
        <form onSubmit={handleSubmit} className="form-grid">
          <label className="input">
            Branch Name *
            <input
              type="text"
              placeholder="e.g. Computer Science & Engineering"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label className="input">
            Branch Code *
            <input
              type="text"
              placeholder="e.g. CSE"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </label>

          <label className="input">
            Description
            <input
              type="text"
              placeholder="Optional notes or details"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <div className="button-group" style={{ marginTop: "auto" }}>
            <button className="button" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : editingId ? "Update Branch" : "Create Branch"}
            </button>
            {editingId ? (
              <button className="button secondary" type="button" onClick={resetForm}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </div>

      {/* Branches Table */}
      <div className="card">
        <div className="section-title">
          <h3>Existing Branches</h3>
          <span className="badge">{branches.length} Total</span>
        </div>

        {loading ? (
          <p>Loading branches...</p>
        ) : branches.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No branches created yet. Add your first branch above.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Branch Name</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b) => (
                  <tr key={b.id}>
                    <td data-label="Code">
                      <strong style={{ background: "var(--bg-2)", padding: "2px 6px", borderRadius: "6px" }}>
                        {b.code}
                      </strong>
                    </td>
                    <td data-label="Branch Name">{b.name}</td>
                    <td data-label="Description">{b.description || "--"}</td>
                    <td data-label="Actions">
                      <div className="button-group">
                        <button
                          className="button secondary"
                          style={{ padding: "4px 10px", fontSize: "13px" }}
                          onClick={() => handleEdit(b)}
                        >
                          Edit
                        </button>
                        <button
                          className="button"
                          style={{ padding: "4px 10px", fontSize: "13px", background: "#dc2626" }}
                          onClick={() => handleDelete(b.id, b.name)}
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
