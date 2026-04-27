# Movie Project# 480-Movie-Project
Video Demo: https://www.youtube.com/watch?v=JyH9EDbqxFg

FlickFinder is a full‑stack movie search application that allows users to browse and filter films by title, genre, and rating through a clean and
responsive interface. The project was built using React and Bootstrap on the frontend and a Flask + SQLite backend, with a relational schema
designed to support fast search and filtering operations.

How to Run
To run FlickFinder locally, start both the Flask backend and the React frontend. The backend provides movie data and sorting/filtering logic, while the frontend displays the UI.

1. Clone the repository
Code
git clone https://github.com/SvastikP/FlickFinder.git
cd FlickFinder
2. Set up and run the backend (Flask + SQLite)
Navigate to the backend folder:

Code
cd backend
Install dependencies:

Code
pip install -r requirements.txt
Start the Flask server:

Code
python app.py
The backend will run on:

Code
http://localhost:5000
3. Set up and run the frontend (React)
Open a second terminal and navigate to the frontend folder:

Code
cd frontend
Install dependencies:

Code
npm install
Start the React development server:

Code
npm start
The frontend will run on:

Code
http://localhost:3000
4. Use the application
Once both servers are running, open your browser and visit:

http://localhost:3000

You can now browse movies, filter by genre, sort by rating or release year, and test the full functionality of the app.
