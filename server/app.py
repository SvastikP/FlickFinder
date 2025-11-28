from flask import Flask
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



@app.route('/')
def test():
    return "test"

if __name__ == "__main__":
    app.run(host='0.0.0.0',debug=True, port=4000)