import React, { useState } from 'react';
import {
    Container,
    Row,
    Col,
    Form,
    InputGroup,
    Button,
    ListGroup,
    Card,
    Spinner,
    Alert
} from 'react-bootstrap';

const API_BASE = 'http://localhost:4000';

function Home() {
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

    // Perform a search. If onlyRated is set, request rated movies from the server.
    async function handleSearch(e) {
        e.preventDefault();
        if (!title.trim() && !onlyRated) return;

        setLoadingSearch(true);
        setError(null);
        setResults([]);
        setSelectedMovie(null);
        setView('search');

        try {
            let url;
            if (onlyRated) {
                url = `${API_BASE}/rated-movies` + (title.trim() ? `?title=${encodeURIComponent(title.trim())}` : '');
            } else {
                url = `${API_BASE}/movie/search?title=${encodeURIComponent(title.trim())}`;
            }

            const res = await fetch(url);
            if (!res.ok) throw new Error(`Search failed with status ${res.status}`);
            const data = await res.json();
            let items = normalizeResults(data);

            // If server returned all rated movies without filtering, apply a client-side filter.
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

    // Load all movies that have been rated.
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

    // Load details (overview and average rating) for a selected movie.
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
        <Container style={{ padding: '2rem 0', maxWidth: 960 }}>
            <Row className="mb-3">
                <Col>
                    <h1 className="mb-2">Movie Info Right At Your Fingertips...</h1>
                </Col>
            </Row>

            {view === 'search' && (
                <>
                    <Form onSubmit={handleSearch} className="mb-3">
                        <Row className="g-2 align-items-center">
                            <Col xs>
                                <InputGroup>
                                    <Form.Control
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder="Enter movie title"
                                    />
                                </InputGroup>
                            </Col>

                            <Col xs="auto" className="d-flex align-items-center">
                                <Form.Check
                                    type="checkbox"
                                    id="onlyRatedCheck"
                                    label="Only rated"
                                    checked={onlyRated}
                                    onChange={e => setOnlyRated(e.target.checked)}
                                    className="me-2"
                                />
                            </Col>

                            <Col xs="auto" className="d-flex gap-2">
                                <Button type="submit" variant='secondary' disabled={loadingSearch}>
                                    {loadingSearch ? (
                                        <>
                                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Searching…
                                        </>
                                    ) : (
                                        'Search'
                                    )}
                                </Button>

                                <Button variant="primary" onClick={handleLoadRatedMovies} disabled={loadingSearch}>
                                    Load Rated Movies
                                </Button>
                            </Col>
                        </Row>
                    </Form>

                    {error && <Alert variant="danger" className="mb-3">Error: {error}</Alert>}

                    {loadingSearch && (
                        <div className="mb-3">
                            <Spinner animation="border" role="status" size="sm" className="me-2" />
                            Searching for movies…
                        </div>
                    )}

                    {!loadingSearch && results.length > 0 && (
                        <>
                            <h2 className="h5">Results</h2>
                            <ListGroup className="mb-3">
                                {results.map(movie => (
                                    <ListGroup.Item
                                        key={movie.id}
                                        action
                                        onClick={() => handleMovieClick(movie)}
                                        className="d-flex justify-content-between align-items-start"
                                    >
                                        <div>
                                            <strong>{movie.original_title || movie.title}</strong>
                                        </div>
                                        <small className="text-muted">ID: {movie.id}</small>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </>
                    )}

                    {!loadingSearch && !results.length && (
                        <p>No results yet. Try searching for a movie title.</p>
                    )}
                </>
            )}

            {view === 'details' && (
                <Row>
                    <Col>
                        <Button variant="primary" onClick={handleBackToSearch} className="mb-3">
                            ← Back to search
                        </Button>

                        {error && <Alert variant="danger" className="mb-3">Error: {error}</Alert>}

                        {loadingDetails && (
                            <div className="mb-3">
                                <Spinner animation="border" role="status" size="sm" className="me-2" />
                                Loading movie details…
                            </div>
                        )}

                        {!loadingDetails && selectedMovie && (
                            <Card>
                                <Card.Body>
                                    <Card.Title>{selectedMovie.original_title || selectedMovie.title || 'Untitled'}</Card.Title>
                                    <Card.Subtitle className="mb-2 text-muted">ID: {selectedMovie.id}</Card.Subtitle>

                                    <Card.Text>
                                        <strong>Average rating: </strong>
                                        {selectedMovie.average_rating !== undefined && selectedMovie.average_rating !== null
                                            ? Number.isFinite(selectedMovie.average_rating)
                                                ? selectedMovie.average_rating.toFixed(2)
                                                : selectedMovie.average_rating
                                            : 'No rating available'}
                                    </Card.Text>

                                    <Card.Text>
                                        <strong>Overview: </strong>
                                        {selectedMovie.overview || 'No overview available.'}
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        )}

                        {!loadingDetails && !selectedMovie && !error && (
                            <p>Select a movie from the results (go back) to see details.</p>
                        )}
                    </Col>
                </Row>
            )}
        </Container>
    );
}

export default Home;
