// src/pages/MapPage.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default icon issue with Leaflet
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Set up default Leaflet icon
let DefaultIcon = L.icon({
    iconUrl,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Component to change map view when coordinates update
const ChangeMapView = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
        if (coords) {
            map.setView(coords, 14); // Set map view to new coordinates with zoom level 14
        }
    }, [coords, map]);
    return null;
};

// Component to handle map events like marker clicks for routing
const MapEvents = ({ onRestaurantSelect }) => {
    const map = useMap();

    // Attach click event listeners to markers dynamically
    useEffect(() => {
        // This effect runs whenever the map instance changes or onRestaurantSelect changes
        // It's a placeholder for more complex marker interaction if needed
    }, [map, onRestaurantSelect]);

    return null;
};

const MapPage = () => {
    const [position, setPosition] = useState(null); // User's current location [latitude, longitude]
    const [error, setError] = useState(null); // Error message for location or API issues
    const [restaurants, setRestaurants] = useState([]); // List of restaurants fetched from API
    const [loadingRestaurants, setLoadingRestaurants] = useState(false); // Loading state for restaurant API call
    const [loadingLocation, setLoadingLocation] = useState(true); // Loading state for user location
    const [route, setRoute] = useState(null); // Stores the coordinates for the walking route
    const [selectedRestaurant, setSelectedRestaurant] = useState(null); // Stores the currently selected restaurant for routing
    const [loadingRoute, setLoadingRoute] = useState(false); // Loading state for route fetching

    // Ref to prevent multiple initial API calls on mount
    const hasFetchedInitialRestaurants = useRef(false);

    // Function to get user's current location
    const getUserLocation = useCallback(() => {
        setLoadingLocation(true);
        setError(null);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPosition([pos.coords.latitude, pos.coords.longitude]);
                    setLoadingLocation(false);
                },
                (err) => {
                    console.error("Geolocation error:", err);
                    setError('Location access denied. Defaulting to Kathmandu. Please enable location services for accurate results.');
                    setPosition([27.7172, 85.324]); // Default to Kathmandu, Nepal
                    setLoadingLocation(false);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Options for better accuracy
            );
        } else {
            setError('Geolocation is not supported by your browser. Defaulting to Kathmandu.');
            setPosition([27.7172, 85.324]); // Default to Kathmandu, Nepal
            setLoadingLocation(false);
        }
    }, []);

    // Effect to get user's current location on component mount
    useEffect(() => {
        getUserLocation();
    }, [getUserLocation]);

    // Function to fetch restaurants using Overpass API
    const fetchRestaurants = useCallback(async (latitude, longitude) => {
        setLoadingRestaurants(true);
        setRestaurants([]); // Clear previous restaurants
        setError(null); // Clear previous errors

        try {
            // Overpass QL query to find restaurants and fast food places within 2km radius
            const overpassQuery = `
                [out:json];
                (
                  node["amenity"~"restaurant|fast_food"](around:2000,${latitude},${longitude});
                  way["amenity"~"restaurant|fast_food"](around:2000,${latitude},${longitude});
                );
                out center;
            `;

            const response = await fetch("https://overpass-api.de/api/interpreter", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `data=${encodeURIComponent(overpassQuery)}`
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Overpass API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log("Overpass API Response:", data); // Log the full response for debugging

            const fetchedRestaurants = data.elements.map(el => {
                // For ways, 'center' provides the coordinates. For nodes, 'lat'/'lon' are direct.
                const lat = el.lat || (el.center ? el.center.lat : null);
                const lon = el.lon || (el.center ? el.center.lon : null);
                const name = el.tags ? (el.tags.name || el.tags.cuisine || 'Unnamed Restaurant') : 'Unnamed Restaurant';

                return {
                    id: el.id,
                    name: name,
                    latitude: lat,
                    longitude: lon,
                    type: el.type, // 'node' or 'way'
                    tags: el.tags // Include all tags for more info if needed
                };
            }).filter(res => res.latitude !== null && res.longitude !== null); // Filter out entries without valid coords

            setRestaurants(fetchedRestaurants);
            if (fetchedRestaurants.length === 0) {
                setError("No restaurants found near your location from OpenStreetMap. Try moving the map or searching a different area.");
            }
        } catch (apiError) {
            setError(`Error fetching restaurants: ${apiError.message}. This might be due to API rate limits or network issues.`);
            console.error("Overpass API call error:", apiError);
        } finally {
            setLoadingRestaurants(false);
        }
    }, []); // Empty dependency array for useCallback

    // Effect to fetch restaurants when user's position is available or changes
    useEffect(() => {
        if (position && !hasFetchedInitialRestaurants.current) {
            hasFetchedInitialRestaurants.current = true; // Mark as fetched to prevent re-fetching on initial render
            fetchRestaurants(position[0], position[1]);
        } else if (position && hasFetchedInitialRestaurants.current) {
            // Re-fetch if position changes after initial load
            fetchRestaurants(position[0], position[1]);
        }
    }, [position, fetchRestaurants]); // Re-run when position or fetchRestaurants (due to useCallback) changes

    // Function to fetch walking route using OSRM API
    const fetchRoute = useCallback(async (startLat, startLng, endLat, endLng) => {
        setLoadingRoute(true);
        setRoute(null); // Clear previous route
        setError(null);

        try {
            // OSRM uses [longitude, latitude] order
            const osrmUrl = `https://router.project-osrm.org/route/v1/walking/${startLng},${startLat};${endLng},${endLat}?geometries=geojson&overview=full`;
            const response = await fetch(osrmUrl);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`OSRM API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                const geojsonRoute = data.routes[0].geometry;
                // Convert GeoJSON coordinates (LngLat) to Leaflet's LatLng format
                const leafletRoute = geojsonRoute.coordinates.map(coord => [coord[1], coord[0]]);
                setRoute(leafletRoute);
            } else {
                setError("Could not find a walking route to this restaurant.");
            }
        } catch (routeError) {
            setError(`Error fetching route: ${routeError.message}. This might be due to OSRM rate limits.`);
            console.error("OSRM API call error:", routeError);
        } finally {
            setLoadingRoute(false);
        }
    }, []);

    // Handle restaurant marker click for routing
    const handleRestaurantClick = (restaurant) => {
        if (position) {
            setSelectedRestaurant(restaurant);
            fetchRoute(position[0], position[1], restaurant.latitude, restaurant.longitude);
        } else {
            setError("Your location is not available to calculate a route.");
        }
    };

    // Clear the displayed route
    const clearRoute = () => {
        setRoute(null);
        setSelectedRestaurant(null);
        setError(null); // Clear any route-related errors
    };

    return (
        <div className="min-h-screen bg-yellow-50 p-4 flex flex-col items-center">
            <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Nearby Food Map</h1>

            {/* Loading and Error Messages */}
            {(loadingLocation || loadingRestaurants || loadingRoute) && (
                <div className="flex flex-col items-center justify-center text-gray-600 mb-4">
                    <svg className="animate-spin h-10 w-10 text-orange-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p>
                        {loadingLocation ? "Getting your location..." :
                            loadingRestaurants ? "Finding restaurants..." :
                                loadingRoute ? "Calculating walking route..." : ""}
                    </p>
                </div>
            )}

            {error && (
                <p className="text-red-600 text-center mt-4 p-2 bg-red-100 rounded-md">{error}</p>
            )}

            {/* Map Container */}
            {position ? (
                <MapContainer
                    center={position}
                    zoom={14}
                    style={{ flexGrow: 1, width: '100%', maxWidth: '1000px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    className="z-0"
                >
                    <ChangeMapView coords={position} />
                    <MapEvents onRestaurantSelect={handleRestaurantClick} /> {/* Pass handler to MapEvents */}
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Marker for user's current location */}
                    <Marker position={position}>
                        <Popup>Your Location</Popup>
                    </Marker>

                    {/* Markers for fetched restaurants */}
                    {restaurants.map((res) => (
                        <Marker
                            position={[res.latitude, res.longitude]}
                            key={res.id} // Use unique ID from OSM for key
                            eventHandlers={{
                                click: () => handleRestaurantClick(res),
                            }}
                        >
                            <Popup>
                                <b>{res.name}</b>
                                <br />
                                <button
                                    onClick={() => handleRestaurantClick(res)}
                                    className="mt-2 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200"
                                >
                                    Show Walking Route
                                </button>
                            </Popup>
                        </Marker>
                    ))}

                    {/* Display walking route if available */}
                    {route && (
                        <>
                            <Polyline positions={route} color="blue" weight={5} opacity={0.7} dashArray="10, 10" />
                            {selectedRestaurant && (
                                <Popup position={selectedRestaurant ? [selectedRestaurant.latitude, selectedRestaurant.longitude] : position}>
                                    <div className="text font-semibold">
                                        Route to <span className="font-bold text-xl">{selectedRestaurant.name}</span>
                                    </div>
                                    <br />
                                    <button
                                        onClick={clearRoute}
                                        className="mt-2 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-200"
                                    >
                                        Clear Route
                                    </button>
                                </Popup>

                            )}
                        </>
                    )}
                </MapContainer>
            ) : (
                !loadingLocation && <p className="text-center text-gray-600">Map not available without location.</p>
            )}

            {/* Clear Route Button outside map */}
            {route && (
                <button
                    onClick={clearRoute}
                    className="mt-4 px-6 py-2 bg-red-500 text-white font-bold rounded-lg shadow-lg hover:bg-red-600 transition duration-300 transform hover:scale-105"
                >
                    Clear Walking Route
                </button>
            )}
        </div>
    );
};

export default MapPage;
