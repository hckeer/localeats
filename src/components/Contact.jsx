import React from 'react';
import photo from "../../../foohunt/src/assets/150716566.jpeg"

const Contact = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 px-6 py-12 text-gray-800 font-sans">
            <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-blue-800 mb-6">
                    Contact Me
                </h1>
                <p className="text-lg text-gray-600 mb-12">
                    Feel free to reach out through any of the following methods.
                </p>

                <div className="flex flex-col md:flex-row items-center justify-center gap-12">
                    {/* Contact Info */}
                    <div className="text-left space-y-4 text-lg">
                        <p>
                            <span className="font-semibold text-gray-700">Name:</span>{' '}
                            Aayam Sharma Neupane
                        </p>
                        <p>
                            <span className="font-semibold text-gray-700">Phone:</span>{' '}
                            <a href="tel:+9779826797474" className="text-blue-600 hover:underline">
                                +977 9826797474
                            </a>
                        </p>
                        <p>
                            <span className="font-semibold text-gray-700">Email:</span>{' '}
                            <a href="mailto:aayam.neupane1@gmail.com" className="text-blue-600 hover:underline">
                                aayam.neupane1@gmail.com
                            </a>
                        </p>
                    </div>

                    {/* Profile Picture */}
                    <div className="relative">
                        <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-white shadow-lg relative z-10">
                            <img
                                src={photo}
                                alt="Aayam Sharma Neupane"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-200 via-pink-300 to-purple-200 blur-xl opacity-50 z-0" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
