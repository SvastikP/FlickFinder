import React, { useState } from 'react';

const API_BASE = 'http://localhost:4000'; // change if your server uses a different port

export default function App() {
  const [title, setTitle] = useState('');
  const [results, setResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [onlyRated, setOnlyRated] = useState(false);
  const [error, setError] = useState(null);

  const [view, setView] = useState('search'); // 'search' or 'details'
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  function normalizeResults(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.results && Array.isArray(data.results)) return data.results;
    return [];
  }

  // 🔍 Search movies by title — respects the "Only rated" toggle
  async function handleSearch(e) {
    e.preventDefault();
    if (!title.trim() && !onlyRated) return; // if empty and not only-rated, do nothing

    setLoadingSearch(true);
    setError(null);
    setResults([]);
    setSelectedMovie(null);
    setView('search');

    try {
      let url;
      if (onlyRated) {
        // ask server for rated movies
        url = `${API_BASE}/rated-movies` + (title.trim() ? `?title=${encodeURIComponent(title.trim())}` : '');
      } else {
        url = `${API_BASE}/movie/search?title=${encodeURIComponent(title.trim())}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Search failed with status ${res.status}`);
      const data = await res.json();
      let items = normalizeResults(data);

      // fallback client-side filter if server returned all rated movies without filtering
      if (onlyRated && title.trim()) {
        const q = title.trim().toLowerCase();
        items = items.filter(m => (m.original_title || m.title || '').toLowerCase().includes(q));
      }

      setResults(items);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoadingSearch(false);
    }
  }

  // load all the movies that have been rated
  async function handleLoadRatedMovies() {
    setOnlyRated(true);
    setLoadingSearch(true);
    setError(null);
    setResults([]);
    setSelectedMovie(null);
    setView('search');

    try {
      const res = await fetch(`${API_BASE}/rated-movies`);
      if (!res.ok) throw new Error(`Failed to load rated movies`);
      const data = await res.json();
      setResults(normalizeResults(data));
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoadingSearch(false);
    }
  }

  // 🎬 When user clicks a movie → load details (overview + avg rating)
  async function handleMovieClick(movie) {
    setLoadingDetails(true);
    setError(null);
    setSelectedMovie(null);

    try {
      const titleParam = encodeURIComponent(movie.original_title || movie.title);
      const res = await fetch(`${API_BASE}/movie/details?title=${titleParam}`);
      if (!res.ok) throw new Error(`Details failed with status ${res.status}`);
      const data = await res.json();
      setSelectedMovie(data);
      setView('details');
    } catch (err) {
      console.error(err);
      setError(err.message);
      setSelectedMovie(null);
    } finally {
      setLoadingDetails(false);
    }
  }

  function handleBackToSearch() {
    setView('search');
    setSelectedMovie(null);
  }
  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        padding: '2rem',
        maxWidth: '960px',
        margin: '0 auto',
      }}
    >
      {/* TITLE (visible on both views) */}
      <h1
        style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          marginBottom: '1.5rem',
        }}
      >
        Movie Search App
      </h1>

      {view === 'search' && (
        <>
          {/* SEARCH BAR ONLY ON STARTING SCREEN */}
          <form
            onSubmit={handleSearch}
            style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}
          >
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter movie title"
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                fontSize: '1rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.5rem' }}>
              <input
                  type="checkbox"
                  checked={onlyRated}
                  onChange={e => setOnlyRated(e.target.checked)}
              />
              <span style={{ fontSize: '0.9rem' }}>Only rated</span>
            </label>
            <button
              type="submit"
              disabled={loadingSearch}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '1rem',
                borderRadius: '4px',
                border: '1px solid #ccc',
                background: '#f5f5f5',
                cursor: loadingSearch ? 'default' : 'pointer',
              }}
            >
              {loadingSearch ? 'Searching…' : 'Search'}
            </button>
          </form>

          {error && (
            <p style={{ color: 'red', marginBottom: '1rem' }}>Error: {error}</p>
          )}

          {/* SEARCH RESULTS LIST */}
          {loadingSearch && <p>Searching for movies…</p>}

          {!loadingSearch && results.length > 0 && (
            <>
              <h2 style={{ fontSize: '1.25rem', margin: '0.5rem 0' }}>
                Results
              </h2>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  border: '1px solid #eee',
                  borderRadius: '4px',
                }}
              >
                {results.map(movie => (
                  <li
                    key={movie.id}
                    onClick={() => handleMovieClick(movie)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                    }}
                  >
                    <strong>{movie.original_title || movie.title}</strong>{' '}
                    <span style={{ color: '#555' }}> (ID: {movie.id})</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {!loadingSearch && !results.length && (
            <p style={{ marginTop: '0.5rem' }}>
              No results yet. Try searching for a movie title.
            </p>
          )}
        </>
      )}

      {view === 'details' && (
        <div>
          <button
            onClick={handleBackToSearch}
            style={{
              marginBottom: '1rem',
              padding: '0.25rem 0.75rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              background: '#f5f5f5',
              cursor: 'pointer',
            }}
          >
            ← Back to search
          </button>

          {error && (
            <p style={{ color: 'red', marginBottom: '1rem' }}>Error: {error}</p>
          )}

          {loadingDetails && <p>Loading movie details…</p>}

          {!loadingDetails && selectedMovie && (
            <div
              style={{
                padding: '1rem',
                border: '1px solid #eee',
                borderRadius: '4px',
                background: '#fafafa',
              }}
            >
              <h2
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 600,
                  marginBottom: '0.25rem',
                }}
              >
                {selectedMovie.original_title ||
                  selectedMovie.title ||
                  'Untitled'}
              </h2>

              <p style={{ marginBottom: '0.5rem', color: '#555' }}>
                ID: {selectedMovie.id}
              </p>

              <p style={{ marginBottom: '0.75rem' }}>
                <strong>Average rating: </strong>
                {selectedMovie.average_rating !== undefined &&
                selectedMovie.average_rating !== null
                  ? Number.isFinite(selectedMovie.average_rating)
                    ? selectedMovie.average_rating.toFixed(2)
                    : selectedMovie.average_rating
                  : 'No rating available'}
              </p>

              <p>
                <strong>Overview: </strong>
                {selectedMovie.overview || 'No overview available.'}
              </p>
            </div>
          )}

          {!loadingDetails && !selectedMovie && !error && (
            <p>Select a movie from the results (go back) to see details.</p>
          )}
        </div>
      )}

      <button
          onClick={handleLoadRatedMovies}
          disabled={loadingSearch}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            borderRadius: '4px',
            border: '1px solid #ccc',
            background: '#e8f0fe',
            cursor: loadingSearch ? 'default' : 'pointer',
            marginLeft: '0.5rem'
          }}
      >
        Load Rated Movies
      </button>
    </div>
  );
}