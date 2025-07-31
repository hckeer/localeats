import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
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

// Component to change map view when coordinates update (used within MapContainer)
const ChangeMapView = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
        if (coords) {
            map.setView(coords, 14); // Set map view to new coordinates with zoom level 14
        }
    }, [coords, map]);
    return null;
};

// Utility function to calculate distance between two lat/lon points (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance; // Return raw distance for sorting
};

// Main App component (unchanged from your provided code)
export default function App() {
    const [currentPage, setCurrentPage] = useState('restaurants');

    const navigateTo = (page) => {
        setCurrentPage(page);
    };

    return (
        <div className="min-h-screen flex flex-col">
            {currentPage === 'restaurants' && <RestaurantsPage />}
        </div>
    );
}

// RestaurantsPage Component
function RestaurantsPage() {
    const [foodSearchTerm, setFoodSearchTerm] = useState('');
    const [locationSearchTerm, setLocationSearchTerm] = useState('');
    const [nearestRestaurants, setNearestRestaurants] = useState([]);
    const [userLocation, setUserLocation] = useState(null); // { latitude, longitude }
    const [searchLocation, setSearchLocation] = useState(null); // { latitude, longitude } - for explicit location search
    const [loadingLocation, setLoadingLocation] = useState(true);
    const [errorLocation, setErrorLocation] = useState(null);
    const [loadingRestaurants, setLoadingRestaurants] = useState(false);
    const [noRestaurantsFound, setNoRestaurantsFound] = useState(false);

    // Map and Route specific states
    const [selectedRestaurantForMap, setSelectedRestaurantForMap] = useState(null); // Restaurant object for map marker
    const [routeCoordinates, setRouteCoordinates] = useState(null); // Array of [lat, lng] for Polyline
    const [loadingRoute, setLoadingRoute] = useState(false);

    // Refs for geolocation watch and search debouncing
    const watchIdRef = useRef(null);
    const searchTimeoutRef = useRef(null);

    // 1. Geocode Location Function (using Nominatim API)
    const geocodeLocation = useCallback(async (locationName) => {
        if (!locationName || locationName.toLowerCase() === 'my current location') {
            return userLocation; // If "my current location" or empty, use user's geo-located position
        }

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=1`);
            if (!response.ok) {
                throw new Error(`Nominatim API error: ${response.status}`);
            }
            const data = await response.json();
            if (data && data.length > 0) {
                return {
                    latitude: parseFloat(data[0].lat),
                    longitude: parseFloat(data[0].lon)
                };
            }
            return null; // No results found for the location name
        } catch (err) {
            console.error("Geocoding error:", err);
            setErrorLocation(`Could not find coordinates for "${locationName}".`);
            return null;
        }
    }, [userLocation]); // Depends on userLocation to potentially return it

    // 2. Fetch Restaurants Function (using Overpass API)
    const fetchNearestRestaurants = useCallback(async (lat, lon, foodQuery = '') => {
        if (!lat || !lon) {
            if (!errorLocation) {
                setErrorLocation("No valid location to search restaurants.");
            }
            setNearestRestaurants([]);
            setNoRestaurantsFound(true);
            setLoadingRestaurants(false);
            return;
        }

        setLoadingRestaurants(true);
        setNoRestaurantsFound(false);
        setErrorLocation(null); // Clear previous errors

        try {
            let query = `
                [out:json][timeout:25];
                (
                  node["amenity"~"restaurant|fast_food"](around:2000,${lat},${lon});
                  way["amenity"~"restaurant|fast_food"](around:2000,${lat},${lon});
                );
                out center;
            `;

            if (foodQuery) {
                // Add a regex filter for name or cuisine. 'i' for case-insensitive.
                query = `
                    [out:json][timeout:25];
                    (
                      node["amenity"~"restaurant|fast_food"]["name"~"${foodQuery}",i](around:2000,${lat},${lon});
                      node["amenity"~"restaurant|fast_food"]["cuisine"~"${foodQuery}",i](around:2000,${lat},${lon});
                      way["amenity"~"restaurant|fast_food"]["name"~"${foodQuery}",i](around:2000,${lat},${lon});
                      way["amenity"~"restaurant|fast_food"]["cuisine"~"${foodQuery}",i](around:2000,${lat},${lon});
                    );
                    out center;
                `;
            }

            const response = await fetch("https://overpass-api.de/api/interpreter", {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `data=${encodeURIComponent(query)}`
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Overpass API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            let fetchedRestaurants = data.elements.map(el => {
                const restaurantLat = el.lat || (el.center ? el.center.lat : null);
                const restaurantLon = el.lon || (el.center ? el.center.lon : null);
                const name = el.tags ? (el.tags.name || el.tags.cuisine || 'Unnamed Restaurant') : 'Unnamed Restaurant';

                const distance = (restaurantLat && restaurantLon && lat && lon)
                    ? calculateDistance(lat, lon, restaurantLat, restaurantLon)
                    : Infinity; // Use Infinity for sorting if coords are missing

                return {
                    id: el.id,
                    name: name,
                    cuisine: el.tags?.cuisine || 'Various',
                    distance: distance, // Store raw distance for sorting
                    latitude: restaurantLat,
                    longitude: restaurantLon,
                    imageUrl: `https://placehold.co/150x100/FFD700/000000?text=${name.split(' ').map(n => n[0]).join('')}`
                };
            }).filter(res => res.latitude !== null && res.longitude !== null);

            // Sort by distance and take the top 10
            fetchedRestaurants.sort((a, b) => a.distance - b.distance);
            const top10Restaurants = fetchedRestaurants.slice(0, 10);

            // Format distance for display after slicing
            top10Restaurants.forEach(res => {
                res.displayDistance = res.distance.toFixed(2) + ' km';
            });

            setNearestRestaurants(top10Restaurants);
            if (top10Restaurants.length === 0) {
                setNoRestaurantsFound(true);
            } else {
                setNoRestaurantsFound(false);
            }

        } catch (apiError) {
            setErrorLocation(`Error fetching restaurants: ${apiError.message}. This might be due to API rate limits or network issues.`);
            console.error("Overpass API call error:", apiError);
            setNoRestaurantsFound(true);
        } finally {
            setLoadingRestaurants(false);
        }
    }, []);

    // 3. Effect for Real-time Geolocation (watchPosition)
    useEffect(() => {
        setLoadingLocation(true);
        setErrorLocation(null);

        if (navigator.geolocation) {
            watchIdRef.current = navigator.geolocation.watchPosition(
                (position) => {
                    setUserLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                    setLoadingLocation(false);
                },
                (error) => {
                    console.error("Geolocation watch error:", error);
                    setErrorLocation(`Location access denied or unavailable: ${error.message}. Defaulting to Kathmandu.`);
                    setUserLocation({ latitude: 27.7172, longitude: 85.324 }); // Default to Kathmandu
                    setLoadingLocation(false);
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
        } else {
            setErrorLocation("Geolocation is not supported by your browser. Defaulting to Kathmandu.");
            setUserLocation({ latitude: 27.7172, longitude: 85.324 }); // Default to Kathmandu
            setLoadingLocation(false);
        }

        return () => {
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    // 4. Effect to trigger restaurant fetch based on location and search terms
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(async () => {
            let targetLocation = userLocation;

            if (locationSearchTerm) {
                if (locationSearchTerm.toLowerCase() === 'my current location' && userLocation) {
                    targetLocation = userLocation;
                } else {
                    setLoadingRestaurants(true);
                    const geocoded = await geocodeLocation(locationSearchTerm);
                    if (geocoded) {
                        targetLocation = geocoded;
                        setSearchLocation(geocoded);
                    } else {
                        targetLocation = userLocation;
                        setErrorLocation("Could not find specified location. Showing restaurants near your current location or default.");
                    }
                    setLoadingRestaurants(false);
                }
            } else {
                setSearchLocation(null);
            }

            if (targetLocation) {
                fetchNearestRestaurants(targetLocation.latitude, targetLocation.longitude, foodSearchTerm);
            } else if (!loadingLocation) {
                setNoRestaurantsFound(true);
                setErrorLocation("Please provide a location or enable geolocation to find restaurants.");
            }
        }, 500);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [userLocation, foodSearchTerm, locationSearchTerm, fetchNearestRestaurants, geocodeLocation, loadingLocation]);

    // 5. Fetch Walking Route Function (OSRM API)
    const fetchRoute = useCallback(async (startLat, startLng, endLat, endLng) => {
        setLoadingRoute(true);
        setRouteCoordinates(null); // Clear previous route
        setErrorLocation(null); // Clear any previous errors

        try {
            const osrmUrl = `https://router.project-osrm.org/route/v1/walking/${startLng},${startLat};${endLng},${endLat}?geometries=geojson&overview=full`;
            const response = await fetch(osrmUrl);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`OSRM API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                const geojsonRoute = data.routes[0].geometry;
                const leafletRoute = geojsonRoute.coordinates.map(coord => [coord[1], coord[0]]);
                setRouteCoordinates(leafletRoute);
            } else {
                setErrorLocation("Could not find a walking route to this restaurant.");
            }
        } catch (routeError) {
            setErrorLocation(`Error fetching route: ${routeError.message}. This might be due to OSRM rate limits.`);
            console.error("OSRM API call error:", routeError);
        } finally {
            setLoadingRoute(false);
        }
    }, []);

    // Handle restaurant card click to show route on map
    const handleShowRouteOnMap = (restaurant) => {
        if (userLocation) {
            setSelectedRestaurantForMap(restaurant);
            fetchRoute(userLocation.latitude, userLocation.longitude, restaurant.latitude, restaurant.longitude);
        } else {
            setErrorLocation("Your current location is not available to calculate a route.");
        }
    };

    // Clear the displayed route and selected restaurant
    const clearRouteAndSelection = () => {
        setRouteCoordinates(null);
        setSelectedRestaurantForMap(null);
        setErrorLocation(null); // Clear any route-related errors
    };


    // Handle food search input change
    const handleFoodSearchChange = (event) => {
        setFoodSearchTerm(event.target.value);
    };

    // Handle location search input change
    const handleLocationSearchChange = (event) => {
        setLocationSearchTerm(event.target.value);
    };

    // Handle explicit search button click (will trigger useEffect due to state changes)
    const handleSearch = () => {
        // This button primarily serves to provide a visual cue; the debounce in useEffect
        // will handle the actual data fetching based on state changes.
    };

    const currentMapCenter = searchLocation || userLocation || [27.7172, 85.324]; // Default to Kathmandu if no location

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4"
             style={{
                 background: 'linear-gradient(to bottom, #FFFACD, #FFDAB9)', // Light yellow to light orange
             }}>
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 hover:scale-105">
                <h2 className="text-4xl font-extrabold text-gray-800 mb-8 text-center">Find Your Next Meal</h2>

                {/* Search Section */}
                <div className="mb-8 space-y-4">
                    <div className="flex flex-col gap-4 w-full">
                        <input
                            type="text"
                            placeholder="Search for food (e.g., Pizza, Italian)"
                            className="p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-lg"
                            value={foodSearchTerm}
                            onChange={handleFoodSearchChange}
                        />
                        <input
                            type="text"
                            placeholder="Location (e.g., Kathmandu, my current location)"
                            className="p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-lg"
                            value={locationSearchTerm}
                            onChange={handleLocationSearchChange}
                            disabled={loadingLocation}
                        />
                    </div>

                    <button
                        onClick={handleSearch}
                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-4 rounded-lg shadow-lg hover:from-yellow-600 hover:to-orange-600 transition duration-300 transform hover:scale-105 text-xl"
                    >
                        Search Restaurants
                    </button>
                </div>

                {/* Location Status */}
                {loadingLocation && (
                    <p className="text-center text-gray-600 mb-4 flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Getting your current location...
                    </p>
                )}
                {errorLocation && (
                    <p className="text-center text-red-500 mb-4">Error: {errorLocation}</p>
                )}
                {userLocation && !loadingLocation && !searchLocation && (
                    <p className="text-center text-green-600 mb-4">
                        Showing results near your current location: Latitude {userLocation.latitude.toFixed(4)}, Longitude {userLocation.longitude.toFixed(4)}
                    </p>
                )}
                {searchLocation && !loadingLocation && (
                    <p className="text-center text-blue-600 mb-4">
                        Showing results near searched location: Latitude {searchLocation.latitude.toFixed(4)}, Longitude {searchLocation.longitude.toFixed(4)}
                    </p>
                )}

                {/* Nearest Restaurants Section */}
                <h3 className="text-3xl font-bold text-gray-800 mb-6 text-center">Nearest Restaurants</h3>

                {loadingRestaurants ? (
                    <div className="text-center text-gray-600 flex flex-col items-center justify-center">
                        <svg className="animate-spin h-10 w-10 text-orange-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p>Finding delicious restaurants near you...</p>
                    </div>
                ) : noRestaurantsFound ? (
                    <p className="text-center text-gray-600 text-lg">No restaurants found matching your criteria. Try a different search!</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {nearestRestaurants.map((restaurant) => (
                            <div key={restaurant.id} className="bg-gray-50 p-6 rounded-xl shadow-md flex flex-col items-center text-center transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                                <img
                                    src={restaurant.imageUrl}
                                    alt={restaurant.name}
                                    className="w-32 h-32 object-cover rounded-full mb-4 border-4 border-yellow-400"
                                    onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/128x128/FFD700/000000?text=${restaurant.name.split(' ').map(n => n[0]).join('')}`; }}
                                />
                                <h4 className="text-xl font-semibold text-gray-900 mb-2">{restaurant.name}</h4>
                                <p className="text-gray-700 mb-1">{restaurant.cuisine}</p>
                                <p className="text-gray-600 text-sm mb-2">{restaurant.displayDistance}</p>
                                <div className="flex items-center text-yellow-500 mb-3">
                                    <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.683-1.538 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.783.565-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.929 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"></path></svg>
                                    <span className="font-bold">N/A</span>
                                </div>
                                <button
                                    onClick={() => handleShowRouteOnMap(restaurant)}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200 text-sm"
                                >
                                    Show Route on Map
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Map Section */}
            <div className="mt-8 w-full max-w-2xl bg-white p-4 rounded-xl shadow-2xl">
                <h3 className="text-3xl font-bold text-gray-800 mb-6 text-center">Restaurant Map</h3>
                {(loadingLocation || loadingRoute) ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-600">
                        <svg className="animate-spin h-10 w-10 text-orange-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p>{loadingLocation ? "Waiting for your location..." : "Calculating route..."}</p>
                    </div>
                ) : (
                    <MapContainer
                        center={currentMapCenter ? [currentMapCenter.latitude, currentMapCenter.longitude] : [27.7172, 85.324]}
                        zoom={14}
                        style={{ height: '50vh', width: '100%', borderRadius: '8px', border: '1px solid #ddd' }}
                        className="z-0"
                    >
                        <ChangeMapView coords={currentMapCenter ? [currentMapCenter.latitude, currentMapCenter.longitude] : null} />
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* User Location Marker */}
                        {userLocation && (
                            <Marker position={[userLocation.latitude, userLocation.longitude]}>
                                <Popup>Your Current Location</Popup>
                            </Marker>
                        )}

                        {/* Selected Restaurant Marker */}
                        {selectedRestaurantForMap && (
                            <Marker position={[selectedRestaurantForMap.latitude, selectedRestaurantForMap.longitude]}>
                                <Popup>
                                    <b>{selectedRestaurantForMap.name}</b>
                                    <br />
                                    <button
                                        onClick={clearRouteAndSelection}
                                        className="mt-2 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-200"
                                    >
                                        Clear Route
                                    </button>
                                </Popup>
                            </Marker>
                        )}

                        {/* Walking Route Polyline */}
                        {routeCoordinates && (
                            <Polyline positions={routeCoordinates} color="blue" weight={5} opacity={0.7} dashArray="10, 10" />
                        )}
                    </MapContainer>
                )}
                {selectedRestaurantForMap && !loadingRoute && (
                    <div className="text-center mt-4">
                        <p className="text-gray-700">Route displayed to: <span className="font-semibold">{selectedRestaurantForMap.name}</span></p>
                        <button
                            onClick={clearRouteAndSelection}
                            className="mt-2 px-4 py-2 bg-red-500 text-white font-bold rounded-lg shadow-lg hover:bg-red-600 transition duration-300 transform hover:scale-105"
                        >
                            Clear Route
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
