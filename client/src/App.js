import React, { useState } from 'react';

export default function App() {
  const [title, setTitle] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/movie/search?title=${encodeURIComponent(title)}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ exists: false, results: [], error: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
      <div>
        <form onSubmit={handleSearch}>
          <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter movie title"
          />
          <button type="submit" disabled={loading}>Search</button>
        </form>

        {loading && <p>Loading...</p>}

        {result && (
            <div>

              <p>{result.exists ? 'Movie(s) found:' : 'No match found.'}</p>
              <ul>
                {result.results.map(r => (
                    <li key={r.id}>{r.original_title} (id: {r.id})</li>
                ))}
              </ul>
              {result.error && <p>Error: {result.error}</p>}
            </div>
        )}
      </div>
  );
}
