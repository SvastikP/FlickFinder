from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import sqlite3
from pathlib import Path


def createDB():
    DATA_DIR = Path(__file__).parent
    RATINGS_SMALL_CSV = DATA_DIR / "ratings.csv"
    MOVIES_CSV = DATA_DIR / "movies_metadata.csv"
    DB_PATH = DATA_DIR / "movies.db"

    movies = pd.read_csv(MOVIES_CSV)
    ratings = pd.read_csv(RATINGS_SMALL_CSV)

    conn = sqlite3.connect(DB_PATH)

    movies.to_sql("movies_metadata", conn, if_exists="replace", index=False)
    ratings.to_sql("ratings", conn, if_exists="replace", index=False)

    conn.close()
    print("Done creating DB")


createDB()

app = Flask(__name__)
CORS(app)

DB_PATH = Path(__file__).parent / "movies.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@app.route("/")
def get_movies():
    conn = get_connection()
    df = pd.read_sql_query(
        "SELECT id, original_title FROM movies_metadata LIMIT 10", conn
    )
    conn.close()
    return df.to_json(orient="records")


@app.route("/movie/search")
def search_movies():
    title = request.args.get("title", "").strip()
    if not title:
        return jsonify({"exists": False, "results": []})

    conn = get_connection()

    # Case-insensitive title search
    query = """
        SELECT id, original_title
        FROM movies_metadata
        WHERE LOWER(original_title) LIKE ?
        LIMIT 20
    """
    param = f"%{title.lower()}%"

    cur = conn.execute(query, (param,))
    rows = [{"id": r["id"], "original_title": r["original_title"]} for r in cur.fetchall()]
    conn.close()

    return jsonify({"exists": len(rows) > 0, "results": rows})


@app.route("/movie/details")
def movie_details():
    # movie title the user clicked (coming from frontend)
    movie_title = request.args.get("title", "").strip()
    if not movie_title:
        return jsonify({"error": "Missing title parameter"}), 400

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # 1) Get the movie row (id, title, overview) by title
    #    (case-insensitive match on original_title)
    movie_query = """
        SELECT id, original_title, overview
        FROM movies_metadata
        WHERE LOWER(original_title) = LOWER(?)
        LIMIT 1;
    """
    cur.execute(movie_query, (movie_title,))
    movie_row = cur.fetchone()

    if movie_row is None:
        conn.close()
        return jsonify({"error": "Movie not found"}), 404

    movie_id = movie_row["id"]

    # 2) Compute AVG rating for that movie id
    #    This matches your requested logic:
    #    SELECT AVG(rating) FROM ratings
    #    JOIN movies_metadata ON ratings.movieId = movies_metadata.id
    #    WHERE movies_metadata.original_title = ?
    avg_query = """
        SELECT AVG(r.rating) AS average_rating
        FROM ratings r
        JOIN movies_metadata m
          ON r.movieId = m.id
        WHERE LOWER(m.original_title) = LOWER(?);
    """
    cur.execute(avg_query, (movie_title,))
    avg_row = cur.fetchone()
    conn.close()

    average_rating = avg_row["average_rating"] if avg_row and avg_row["average_rating"] is not None else None

    # 3) Build response
    return jsonify({
        "id": movie_row["id"],
        "title": movie_row["original_title"],
        "original_title": movie_row["original_title"],
        "overview": movie_row["overview"],
        "average_rating": average_rating,
    })

@app.route("/rated-movies")
def get_rated_movies():
    conn = get_connection()
    cur = conn.cursor()

    query = """
            SELECT
                m.id,
                m.original_title,
                m.overview,
                AVG(r.rating) AS average_rating,
                COUNT(r.rating) AS rating_count
            FROM movies_metadata m
                     JOIN ratings r
                          ON r.movieId = m.id
            GROUP BY m.id, m.original_title, m.overview
            ORDER BY average_rating DESC \
            """

    cur.execute(query)
    rows = cur.fetchall()
    conn.close()

    results = [
        {
            "id": row["id"],
            "original_title": row["original_title"],
            "overview": row["overview"],
            "average_rating": row["average_rating"],
            "rating_count": row["rating_count"],
        }
        for row in rows
    ]

    return jsonify(results)


conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# total rows from metadent
print("movies_metadata count:", cur.execute("SELECT COUNT(*) FROM movies_metadata").fetchone()[0])
# total rows from ratings
print("ratings count:", cur.execute("SELECT COUNT(*) FROM ratings").fetchone()[0])
# total rows from joined tables
print("joined count (r.movieId = m.id):", cur.execute(
    "SELECT COUNT(*) FROM ratings r JOIN movies_metadata m ON r.movieId = m.id"
).fetchone()[0])

conn.close()


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True, port=4000)