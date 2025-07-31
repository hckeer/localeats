import React from 'react';
import HomePage from './HomePage.jsx';
import FoodSearchPage from './FoodSearchPage.jsx';
import MapPage from "./MapPage.jsx";

const LandingPage = () => {
    return (
        <div className="min-h-screen">
            <HomePage />
            <FoodSearchPage />
            <MapPage/>
        </div>
    );
};

export default LandingPage;
