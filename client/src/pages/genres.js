import React, { useState, useEffect } from 'react';
import {
    Container,
    Row,
    Col,
    ListGroup,
    Card,
    Spinner,
    Alert,
    Button,
    Form
} from 'react-bootstrap';

const API_BASE = 'http://localhost:4000';

function Genres() {
    const [genres, setGenres] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState(null);
    const [movies, setMovies] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingGenres, setLoadingGenres] = useState(true);
    const [loadingMovies, setLoadingMovies] = useState(false);
    const [error, setError] = useState(null);
    const [view, setView] = useState('genres');
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const [onlyRated, setOnlyRated] = useState(false);

    const [sort, setSort] = useState("title");
    const [order, setOrder] = useState("asc");
 
    useEffect(() => {
        fetchGenres();
    }, []);

    async function fetchGenres() {
        setLoadingGenres(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/genres`);
            if (!response.ok) {
                throw new Error(`Failed to fetch genres: ${response.status}`);
            }
            const data = await response.json();
            setGenres(data);
        } catch (err) {
            console.error('Error fetching genres:', err);
            setError(err.message);
        } finally {
            setLoadingGenres(false);
        }
    }

    async function handleGenreClick(genre) {
        setSelectedGenre(genre);
        setLoadingMovies(true);
        setError(null);
        setMovies([]);
        setSearchTerm('');
        setView('movies');

        try {
            const response = await fetch(`${API_BASE}/movies/by-genre?id=${genre.id}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch movies: ${response.status}`);
            }
            const data = await response.json();
            setMovies(data);
        } catch (err) {
            console.error('Error fetching movies by genre:', err);
            setError(err.message);
        } finally {
            setLoadingMovies(false);
        }
    }

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

    function handleBackToGenres() {
        setView('genres');
        setSelectedGenre(null);
        setMovies([]);
        setSearchTerm('');
    }

    function handleBackToMovies() {
        setView('movies');
        setSelectedMovie(null);
    }

   
    function handleSearchChange(e) {
        setSearchTerm(e.target.value);
    }


    function handleRandomMovie() {
        if (movies.length === 0) return;
        
        const randomIndex = Math.floor(Math.random() * movies.length);
        const randomMovie = movies[randomIndex];
        
        handleMovieClick(randomMovie);
    }

    //Helper function for sort
    //Changes the button label of each sort in ASC or DESC order
    //When sort is changed by default sort goes to ASC order
    function getSortButtonLabel(column) {
        if (column === "title") {
            if (sort === "title") {
                if (order === "asc") { //Actively change sort
                    return "A–Z";
                } else {
                    return "Z–A";
                }
            } else {                
                return "A–Z"; //Change back to default view
            }
        }

        if (column === "year") {
            if (sort === "year") {
                if (order === "asc") { //Actively change sort
                    return "Oldest Release";
                } else {
                    return "Newest Release";
                }
            } else {
                return "Newest Release"; //Change back to default view
            }
        }

        if (column === "rating") {
            if (sort === "rating") {
                if (order === "asc") { //Actively change sort
                    return "Lowest Rated";
                } else {
                    return "Highest Rated";
                }
            } else {
                return "Highest Rated"; //Change back to default view
            }
        }

        return column;
    }

    //Helper function for sort
    //Changes between primary and secondary color to distinguish which sort is currently active
    //primary is active, secondary is inactive
    function getSortButtonVariant(column) {
        if (sort === column) {
            return "primary";
        } else {
            return "secondary";
        }
    }

    //Helper function for sort
    //Changes between asc and desc sort for current active sort
    //By default sort is asc and changes back when new sort is active
    function toggleSort(column) {
        if (sort === column) { //Change order for given sort and update values
            let newOrder;
            if (order === "asc") {
                newOrder = "desc";
            } else {
                newOrder = "asc";
            }
            setOrder(newOrder);
            handleSort(column, newOrder);
        } else { //Change to asc for default setting for given sort and update values
            setSort(column);

            let defaultOrder = "asc";
            if (column === "year" || column === "rating") {
                defaultOrder = "desc";
            }

            setOrder(defaultOrder);
            handleSort(column, defaultOrder);
        }
    }

    //Sort function
    //Fetches sorted movies from backend, applies onlyRated and genre filter
    async function handleSort(sort, order) {
        setLoadingMovies(true);
        setError(null);
        setMovies([]);
        setSelectedMovie(null);
        setView("movies");

        try {
            const url = `${API_BASE}/sort-movies?sort=${sort}&order=${order}&onlyRated=${onlyRated}&title=${encodeURIComponent(searchTerm.trim())}&genreId=${selectedGenre.id}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Sort failed with status ${res.status}`);
            const data = await res.json();
            setMovies(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoadingMovies(false);
        }
    }

    const filteredMovies = searchTerm.trim()
        ? movies.filter(movie => 
            (movie.original_title || movie.title || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase()))
        : movies;

    return (
        <Container style={{ padding: '2rem 0', maxWidth: 960 }}>
            <Row className="mb-3">
                <Col>
                    <h1 className="mb-2">Browse Movies by Genre</h1>
                </Col>
            </Row>

            {error && <Alert variant="danger" className="mb-3">Error: {error}</Alert>}

            {view === 'genres' && (
                <>
                    {loadingGenres ? (
                        <div className="mb-3">
                            <Spinner animation="border" role="status" size="sm" className="me-2" />
                            Loading genres...
                        </div>
                    ) : (
                        <>
                            <h2 className="h5 mb-3">Select a genre</h2>
                            <Row xs={1} md={2} lg={3} className="g-4">
                                {genres.map(genre => (
                                    <Col key={genre.id}>
                                        <Card 
                                            className="h-100" 
                                            onClick={() => handleGenreClick(genre)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <Card.Body>
                                                <Card.Title>{genre.name}</Card.Title>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </>
                    )}
                </>
            )}

            {view === 'movies' && selectedGenre && (
                <>
                    <Button variant="primary" onClick={handleBackToGenres} className="mb-3">
                        ← Back to genres
                    </Button>
                    <h2 className="h5 mb-3">Movies in {selectedGenre.name} genre</h2>
                    
                    <Row className="mb-3 g-2 align-items-center">
                        <Col>
                            <Form.Control
                                placeholder="Search movies..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />
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
                        <Col xs="auto">
                            <Button 
                                onClick={handleRandomMovie} 
                                disabled={movies.length === 0}
                                variant="secondary"
                            >
                                Random Movie
                            </Button>
                        </Col>
                    </Row>
                    
                    <div className="mb-3 d-flex gap-2">
                        <Button
                        variant={getSortButtonVariant("title")}
                        onClick={() => toggleSort("title")}
                        >
                        {getSortButtonLabel("title")}
                        </Button>

                        <Button
                        variant={getSortButtonVariant("year")}
                        onClick={() => toggleSort("year")}
                        >
                        {getSortButtonLabel("year")}
                        </Button>

                        <Button
                        variant={getSortButtonVariant("rating")}
                        onClick={() => toggleSort("rating")}
                        >
                        {getSortButtonLabel("rating")}
                        </Button>
                    </div>                        

                    {loadingMovies ? (
                        <div className="mb-3">
                            <Spinner animation="border" role="status" size="sm" className="me-2" />
                            Loading movies...
                        </div>
                    ) : filteredMovies.length > 0 ? (
                        <ListGroup className="mb-3">
                            {filteredMovies.map(movie => (
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
                    ) : (
                        <p>No movies found for this genre.</p>
                    )}
                </>
            )}

            {view === 'details' && (
                <Row>
                    <Col>
                        <Button variant="primary" onClick={handleBackToMovies} className="mb-3">
                            ← Back to movies
                        </Button>

                        {loadingDetails ? (
                            <div className="mb-3">
                                <Spinner animation="border" role="status" size="sm" className="me-2" />
                                Loading movie details...
                            </div>
                        ) : selectedMovie && (
                            <Card>
                                <Card.Body>
                                    <Card.Title>{selectedMovie.original_title || selectedMovie.title || 'Untitled'}</Card.Title>
                                    <Card.Subtitle className="mb-2 text-muted">ID: {selectedMovie.id}</Card.Subtitle>

                                    <Card.Text>
                                        <strong>Release year: </strong>
                                        {selectedMovie.release_date
                                        ? new Date(selectedMovie.release_date).getFullYear()
                                        : 'Unknown release date'}
                                    </Card.Text>

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
                    </Col>
                </Row>
            )}
        </Container>
    );
}

export default Genres;
