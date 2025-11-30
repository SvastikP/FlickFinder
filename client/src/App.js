import React, { useState } from 'react';
import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import Home from "./pages/Home";
import Genres from "./pages/genres";
import WebNavbar from './components/WebNavbar';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';


const API_BASE = 'http://localhost:4000'; 

export default function App() {
  return (
    <Router>
      <WebNavbar />
      <Routes>
        <Route path='/' element={<Home />}/>
        <Route path='/genres' element={<Genres />}/>
      </Routes>
    </Router>
  );

}