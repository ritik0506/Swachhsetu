import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import api from "../utils/api";
import { 
  Search, 
  MapPin, 
  Navigation, 
  Star,
  Clock,
  Phone,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import "./ToiletFinder.css";

// Fix for default marker icons
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ToiletFinder = () => {
  const [search, setSearch] = useState("");
  const [toilets, setToilets] = useState([]);
  const [filteredToilets, setFilteredToilets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([28.7041, 77.1025]); // Delhi

  useEffect(() => {
    getUserLocation();
    fetchToilets();
  }, []);

  useEffect(() => {
    filterToilets();
  }, [search, toilets]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setMapCenter([location.lat, location.lng]);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const fetchToilets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/poi');
      const toiletPOIs = response.data.filter(poi => 
        poi.type && poi.type.toLowerCase().includes('toilet')
      );
      setToilets(toiletPOIs);
      setFilteredToilets(toiletPOIs);
    } catch (error) {
      console.error('Error fetching toilets:', error);
      // Use mock data if backend fails
      const mockToilets = [
        {
          _id: '1',
          name: 'Central Park Public Toilet',
          type: 'toilet',
          address: 'Central Park, Connaught Place',
          location: { coordinates: [77.2090, 28.6139] },
          rating: 4.2,
          facilities: ['Clean', 'Water Available', 'Accessible'],
          timings: '24/7',
          contact: '+91 9876543210'
        },
        {
          _id: '2',
          name: 'India Gate Public Restroom',
          type: 'toilet',
          address: 'India Gate, New Delhi',
          location: { coordinates: [77.2295, 28.6129] },
          rating: 3.8,
          facilities: ['Paid', 'Maintained', 'Separate for M/F'],
          timings: '6:00 AM - 10:00 PM',
          contact: '+91 9876543211'
        },
        {
          _id: '3',
          name: 'Karol Bagh Metro Station Toilet',
          type: 'toilet',
          address: 'Karol Bagh Metro Station',
          location: { coordinates: [77.1914, 28.6517] },
          rating: 4.5,
          facilities: ['Metro Station', 'Free', 'Well Maintained'],
          timings: '5:00 AM - 11:00 PM',
          contact: '+91 9876543212'
        }
      ];
      setToilets(mockToilets);
      setFilteredToilets(mockToilets);
    } finally {
      setLoading(false);
    }
  };

  const filterToilets = () => {
    if (!search.trim()) {
      setFilteredToilets(toilets);
      return;
    }
    
    const filtered = toilets.filter(toilet =>
      toilet.name?.toLowerCase().includes(search.toLowerCase()) ||
      toilet.address?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredToilets(filtered);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    filterToilets();
  };

  if (loading) {
    return (
      <div className="toilet-finder-page">
        <div className="container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Finding nearby toilets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="toilet-finder-page">
      <div className="container">
        <div className="page-header">
          <div className="header-content">
            <h1>
              <MapPin size={32} />
              Public Toilet Finder
            </h1>
            <p>Find clean and accessible public toilets near you</p>
          </div>
        </div>

        <div className="search-section">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-group">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search by location or toilet name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="search-btn">
              Search
            </button>
            <button 
              type="button" 
              className="location-btn"
              onClick={getUserLocation}
            >
              <Navigation size={18} />
              My Location
            </button>
          </form>
        </div>

        <div className="finder-content">
          <div className="map-container">
            <MapContainer 
              center={mapCenter} 
              zoom={13} 
              style={{ height: '600px', width: '100%', borderRadius: '16px' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              
              {userLocation && (
                <>
                  <Marker position={[userLocation.lat, userLocation.lng]}>
                    <Popup>Your Location</Popup>
                  </Marker>
                  <Circle
                    center={[userLocation.lat, userLocation.lng]}
                    radius={1000}
                    pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1 }}
                  />
                </>
              )}

              {filteredToilets.map((toilet) => (
                toilet.location && toilet.location.coordinates && (
                  <Marker
                    key={toilet._id}
                    position={[
                      toilet.location.coordinates[1],
                      toilet.location.coordinates[0]
                    ]}
                  >
                    <Popup>
                      <div className="map-popup">
                        <h4>{toilet.name}</h4>
                        <p>{toilet.address}</p>
                        <div className="popup-rating">
                          <Star size={14} fill="#fbbf24" color="#fbbf24" />
                          {toilet.rating || 'N/A'}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          </div>

          <div className="toilets-list">
            <h3>
              Found {filteredToilets.length} Public Toilets
            </h3>
            {filteredToilets.length > 0 ? (
              <div className="toilet-cards">
                {filteredToilets.map((toilet) => (
                  <div key={toilet._id} className="toilet-card">
                    <div className="toilet-header">
                      <h4>{toilet.name}</h4>
                      <div className="rating">
                        <Star size={16} fill="#fbbf24" color="#fbbf24" />
                        <span>{toilet.rating || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="toilet-body">
                      <div className="info-item">
                        <MapPin size={16} />
                        <span>{toilet.address}</span>
                      </div>

                      {userLocation && toilet.location && toilet.location.coordinates && (
                        <div className="info-item">
                          <Navigation size={16} />
                          <span>
                            {calculateDistance(
                              userLocation.lat,
                              userLocation.lng,
                              toilet.location.coordinates[1],
                              toilet.location.coordinates[0]
                            )} away
                          </span>
                        </div>
                      )}

                      {toilet.timings && (
                        <div className="info-item">
                          <Clock size={16} />
                          <span>{toilet.timings}</span>
                        </div>
                      )}

                      {toilet.contact && (
                        <div className="info-item">
                          <Phone size={16} />
                          <span>{toilet.contact}</span>
                        </div>
                      )}

                      {toilet.facilities && toilet.facilities.length > 0 && (
                        <div className="facilities">
                          {toilet.facilities.map((facility, idx) => (
                            <span key={idx} className="facility-tag">
                              <CheckCircle size={12} />
                              {facility}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="toilet-footer">
                      <button className="directions-btn">
                        <Navigation size={16} />
                        Get Directions
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-results">
                <AlertCircle size={48} />
                <p>No toilets found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToiletFinder;
