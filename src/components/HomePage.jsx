import React from 'react';
import { Link } from 'react-router-dom';  // Move import here


import AboutUs from "./AboutUs.jsx";
import FoodSearchPage from "./FoodSearchPage.jsx";

import Dashboard from "./Dashboard.jsx";


const HomePage = () => {


    // Suppose you receive a user prop or get from context to decide
    // const user = null; // example: no user logged in, change as needed

    return (
        <div className="w-screen h-screen overflow-hidden font-inter relative bg-white">
            <main className="flex flex-col md:flex-row w-screen h-screen overflow-hidden">
                <section className="relative flex-1 bg-[#8B6B6B] flex items-center justify-center p-8 md:p-16">
                    <h1 className="text-white text-4xl md:text-6xl lg:text-7xl font-bold text-center md:text-left leading-tight rounded-md">
                        Make a<br /> <span className="text-yellow-500">customer</span>,
                    </h1>
                </section>

                <section className="relative flex-1 flex flex-col md:flex-row items-center justify-center overflow-hidden">
                    <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-pink-200 z-0 rounded-bl-full md:rounded-bl-[100px]"></div>
                    <div className="absolute top-0 right-0 w-1/4 h-1/3 bg-orange-200 z-10 rounded-bl-full md:rounded-bl-[80px]"></div>
                    <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-pink-200 z-0 rounded-tr-full md:rounded-tr-[100px]"></div>
                    <div className="absolute bottom-0 left-0 w-1/4 h-1/3 bg-orange-200 z-10 rounded-tr-full md:rounded-tr-[80px]"></div>
                    <div className="absolute inset-0 bg-white opacity-50 z-20"></div>

                    <div className="relative z-30 flex flex-col md:flex-row items-center justify-center w-full h-full p-4 md:p-8">
                        <div className="w-full md:w-1/2 flex justify-center items-center">
                            <img
                                src="https://img.freepik.com/free-photo/delicious-food-table_23-2150857814.jpg?semt=ais_hybrid&w=740"
                                alt="Shopping cart with products"
                                className="w-full h-auto max-w-lg md:max-w-xl lg:max-w-2xl object-contain rounded-lg shadow-lg"
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x400/D3D3D3/000000?text=Image+Error'; }}
                            />
                        </div>

                        <div className="w-full md:w-1/2 flex items-center justify-center p-4 bg-[#B0D9B1] md:bg-transparent rounded-md md:rounded-none">
                            <h1 className="mt-80 text-gray-800 text-4xl md:text-6xl lg:text-7xl font-bold text-center md:text-left leading-tight rounded-md">
                                not<br />a<br /> <span className="text-yellow-500">sale</span>.
                            </h1>
                        </div>
                    </div>
                </section>
            </main>

            <nav className="fixed top-0 left-0 right-0 z-30 py-2 md:py-3 px-4 md:px-6 flex justify-end items-center text-sm md:text-base bg-gradient-to-r from-blue-100 via-white to-pink-100 backdrop-blur-md shadow-sm">
                <ul className="flex space-x-4 md:space-x-8 text-gray-800 font-semibold">
                    <li><Link to="/" className="hover:text-gray-600 rounded-md p-1">Home</Link></li>
                    <Link to="/about" className="hover:text-gray-600 p-1 rounded-md">About Us</Link>

                    {/*<li><a href="#" className="hover:text-gray-600 rounded-md p-1">Services</a></li>*/}
                    <Link to="/contact" className="hover:text-gray-600 p-1 rounded-md">Contact Us</Link>
                    <Link to="/dashboard" className="hover:text-gray-600 p-1 rounded-md">Dashboard</Link>




                </ul>
            </nav>

            <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 z-40">
                <h2 className="text-white text-2xl md:text-4xl lg:text-5xl font-bold rounded-md shadow-[0_0_20px_yellow] bg-gray-900 p-4 w-fit">
                    local<span className="text-orange-200"> eats </span>
                </h2>
            </div>
            <FoodSearchPage/>
        </div>



    );
};

export default HomePage;
