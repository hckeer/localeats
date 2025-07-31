
import './App.css'
import AboutUs from "./components/AboutUs.jsx";
import Contact from "./components/Contact.jsx";
import Dashboard from "./components/Dashboard.jsx";
import HomePage from "./components/HomePage.jsx";
import InputField from "./components/InputField.jsx";
import LandingPage from "./components/LandingPage.jsx";
import MapPage from "./components/MapPage.jsx";
import FoodSearchPage from "./components/FoodSearchPage.jsx"

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';




function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
