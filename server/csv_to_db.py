import pandas as pd
import sqlite3
from pathlib import Path

DATA_DIR = Path(".")
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