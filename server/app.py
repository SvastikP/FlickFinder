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
    print("Done")

createDB()
app = Flask(__name__)
CORS(app)

DB_PATH = Path(__file__).parent / "movies.db"

@app.route('/')
def get_movies():
    conn = sqlite3.connect("movies.db")
    df = pd.read_sql_query("SELECT original_title FROM movies_metadata LIMIT 10", conn)
    conn.close()
    return df.to_json(orient="records")

@app.route('/movie/search')
def search_movies():
    title = request.args.get('title', '').strip()
    if not title:
        return jsonify({"exists": False, "results": []})
    conn = sqlite3.connect(DB_PATH)

    # checks if a movie exists in movie.db with case sensitive
    query = "SELECT id, original_title FROM movies_metadata WHERE lower(original_title) LIKE ? LIMIT 20"
    param = f"%{title.lower()}%"

    cur = conn.execute(query, (param,))
    # sends to frontend a list of movies that match the title
    rows = [{"id": r[0], "original_title": r[1]} for r in cur.fetchall()]
    conn.close()
    return jsonify({"exists": len(rows) > 0, "results": rows})



if __name__ == "__main__":
    app.run(host='0.0.0.0',debug=True, port=4000)