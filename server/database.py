import os
from dotenv import load_dotenv


load_dotenv()



def get_connection():
    import sqlite3
    DB_PATH = os.getenv("DB_PATH", "movies.db")
    conn = sqlite3.connect(DB_PATH)
    return conn



#TODO: Implement the functions to help with queries
def get_top_rated_movies():
    return


def get_movie_details(movie_id):
    return

def search_movies_by_title(title):
    return