import React from 'react';
import { Lightbulb, Users, Handshake, Rocket } from 'lucide-react'; // Using lucide-react for icons

// Main App component
const AboutUs = () => {
    // Define the timeline items data
    const timelineItems = [
        {
            icon: <Lightbulb className="w-8 h-8 text-blue-500" />,
            title: "Our Vision",
            date: "Early 2023",
            desc: "We envisioned a platform that simplifies access to diverse food options, from local eateries to homemade meals, making fresh food readily available to everyone.",
        },
        {
            icon: <Users className="w-8 h-8 text-indigo-500" />,
            title: "Community Engagement",
            date: "Mid 2023",
            desc: "We started engaging with local communities, surveying food providers and potential customers to understand their needs and challenges in the food delivery ecosystem.",
        },
        {
            icon: <Handshake className="w-8 h-8 text-purple-500" />,
            title: "Partnership Building",
            date: "Late 2023",
            desc: "We forged partnerships with various hotels, street food vendors, and home chefs, building a robust network of food providers committed to quality and diversity.",
        },
        {
            icon: <Rocket className="w-8 h-8 text-cyan-500" />,
            title: "Platform Launch",
            date: "Early 2024",
            desc: "After extensive development and rigorous testing, we proudly launched our platform, bringing our vision to life and connecting food lovers with their next great meal.",
        },
    ];

    return (
        // Main container for the entire page, ensuring the gradient covers the full viewport height
        <div className="min-h-screen bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white py-80 px-80 sm:px-6 lg:px-80 font-inter">
            <div className="max-w-4xl mx-auto text-center">
                {/* Page Title */}
                <h1 className="text-4xl md:text-5xl font-bold mb-6">About Our Platform</h1>
                {/* Introduction Paragraph */}
                <p className="text-lg mb-12 text-gray-100">
                    Our website connects people with fresh, healthy, and diverse food options nearby — whether it's from hotels, street stalls, or home kitchens. Think of it like Indrive, Pathao, or Uber, but for food. Our mission is to bridge the gap between food providers and hungry customers in real-time.
                </p>

                {/* Timeline Section */}
                <div className="relative">
                    {/* Vertical line for the timeline */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-cyan-400"></div>
                    <div className="space-y-16">
                        {timelineItems.map((item, idx) => (
                            <div key={idx} className={`flex flex-col md:flex-row items-center ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                                {/* Timeline item content */}
                                <div className="md:w-1/2 p-6 flex justify-center md:justify-end">
                                    <div className="bg-white text-gray-900 p-6 rounded-xl shadow-lg max-w-xs w-full">
                                        <div className="flex items-center space-x-4 mb-4">
                                            {item.icon} {/* Icon for the timeline item */}
                                            <div>
                                                <h2 className="font-bold text-lg">{item.title}</h2>
                                                <p className="text-sm text-gray-500 italic">{item.date}</p>
                                            </div>
                                        </div>
                                        <p className="text-gray-600 text-sm">{item.desc}</p>
                                    </div>
                                </div>
                                {/* Placeholder for the other side of the timeline on desktop */}
                                <div className="md:w-1/2 p-6"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutUs;
