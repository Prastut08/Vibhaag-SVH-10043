import { useEffect, useState } from "react";

type LibraryBook = {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  available: boolean;
};

export default function FacultyLibraryPage() {
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setBooks([
        { _id: "1", title: "Clean Code", author: "Robert C. Martin", isbn: "978-0132350884", available: true },
        { _id: "2", title: "Design Patterns", author: "Gang of Four", isbn: "978-0201633610", available: false },
        { _id: "3", title: "Introduction to Algorithms", author: "Cormen et al.", isbn: "978-0262033848", available: true },
        { _id: "4", title: "The Pragmatic Programmer", author: "Hunt & Thomas", isbn: "978-0201616224", available: true },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const filtered = books.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      b.isbn.includes(search)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="hero">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "28px" }}>📚</span>
            <h2 style={{ margin: 0 }}>Library</h2>
          </div>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Browse and manage library resources.
          </p>
        </div>
        <div style={{ minWidth: "240px" }}>
          <label className="input" style={{ marginBottom: 0 }}>
            Search books
            <input
              type="text"
              placeholder="Title, author, or ISBN…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
          ⏳ Loading library…
        </div>
      )}

      {!loading && (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>ISBN</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((book) => (
                  <tr key={book._id}>
                    <td data-label="Title">{book.title}</td>
                    <td data-label="Author">{book.author}</td>
                    <td data-label="ISBN">{book.isbn}</td>
                    <td data-label="Status">
                      <span className={`badge ${book.available ? "badge-success" : "badge-danger"}`}>
                        {book.available ? "Available" : "Checked Out"}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", color: "var(--muted)" }}>
                      No books found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
