import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Truck, Clock, Bell, BellOff, AlertCircle, CheckCircle, Trash2, Recycle } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import '../styles/GarbageSchedule.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const GarbageSchedule = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [locations, setLocations] = useState({ areas: [], wards: [], zones: [] });
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [activeTab, setActiveTab] = useState('search'); // search, today, subscribed
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    fetchLocations();
    fetchTodaySchedules();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied');
        }
      );
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await axios.get(`${API_URL}/garbage/locations`);
      if (response.data.success) {
        setLocations(response.data.locations);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchTodaySchedules = async () => {
    try {
      const response = await axios.get(`${API_URL}/garbage/today`);
      if (response.data.success) {
        setTodaySchedules(response.data.schedules);
      }
    } catch (error) {
      console.error('Error fetching today schedules:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error('Please enter an area name');
      return;
    }

    setLoading(true);
    try {
      const params = { area: searchQuery };
      
      // Add user location if available
      if (userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
        params.radius = 10; // 10km radius
      }

      const response = await axios.get(`${API_URL}/garbage/schedule`, { params });
      
      if (response.data.success) {
        setSchedules(response.data.schedules);
        if (response.data.schedules.length === 0) {
          toast.info('No schedules found for this area');
        }
      }
    } catch (error) {
      console.error('Error searching schedules:', error);
      toast.error('Failed to fetch schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (scheduleId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to subscribe');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/garbage/schedule/${scheduleId}/subscribe`,
        { notificationPreference: 'push' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Successfully subscribed to schedule notifications!');
        // Refresh schedules
        if (activeTab === 'search') {
          handleSearch({ preventDefault: () => {} });
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to subscribe';
      toast.error(message);
    }
  };

  const handleUnsubscribe = async (scheduleId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.delete(
        `${API_URL}/garbage/schedule/${scheduleId}/subscribe`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Unsubscribed from schedule notifications');
        // Refresh schedules
        if (activeTab === 'search') {
          handleSearch({ preventDefault: () => {} });
        }
      }
    } catch (error) {
      toast.error('Failed to unsubscribe');
    }
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    return time;
  };

  const getWasteTypeColor = (type) => {
    const colors = {
      mixed: '#6c757d',
      organic: '#28a745',
      recyclable: '#17a2b8',
      hazardous: '#dc3545',
      'e-waste': '#ffc107',
      construction: '#fd7e14'
    };
    return colors[type] || '#6c757d';
  };

  const getWasteTypeIcon = (type) => {
    if (type === 'recyclable') return <Recycle size={16} />;
    return <Trash2 size={16} />;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const ScheduleCard = ({ schedule }) => {
    const nextCollection = schedule.nextCollection;
    const isSubscribed = schedule.subscribers?.some(
      sub => sub.userId === localStorage.getItem('userId')
    );

    return (
      <div className="schedule-card">
        <div className="schedule-header">
          <div className="schedule-title-section">
            <h3>{schedule.area}</h3>
            <div className="schedule-location">
              <MapPin size={14} />
              <span>{schedule.ward} • {schedule.zone}</span>
            </div>
          </div>
          <button
            className={`subscribe-btn ${isSubscribed ? 'subscribed' : ''}`}
            onClick={() => isSubscribed ? handleUnsubscribe(schedule._id) : handleSubscribe(schedule._id)}
          >
            {isSubscribed ? <BellOff size={16} /> : <Bell size={16} />}
            {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
          </button>
        </div>

        {nextCollection && (
          <div className="next-collection">
            <div className="next-collection-header">
              <Calendar size={18} />
              <strong>Next Collection</strong>
            </div>
            <p className="next-date">{formatDate(nextCollection.date)}</p>
            <div className="collection-slots">
              {nextCollection.slots.map((slot, idx) => (
                <div key={idx} className="slot-item">
                  <Clock size={14} />
                  <span>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                  <span 
                    className="waste-type-badge"
                    style={{ backgroundColor: getWasteTypeColor(slot.wasteType) }}
                  >
                    {getWasteTypeIcon(slot.wasteType)}
                    {slot.wasteType}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {schedule.route && (
          <div className="route-info">
            <Truck size={16} />
            <div className="route-details">
              <strong>Route {schedule.route.routeNumber}</strong>
              <span>{schedule.route.routeName}</span>
              {schedule.route.estimatedDuration && (
                <span className="duration">Est. Duration: {schedule.route.estimatedDuration}</span>
              )}
            </div>
          </div>
        )}

        {schedule.vehicles && schedule.vehicles.length > 0 && (
          <div className="vehicle-info">
            <h4>Assigned Vehicles:</h4>
            {schedule.vehicles.map((vehicle, idx) => (
              <div key={idx} className="vehicle-item">
                <strong>{vehicle.vehicleNumber}</strong>
                <span className={`vehicle-status ${vehicle.status}`}>
                  {vehicle.status}
                </span>
                {vehicle.driverName && (
                  <span className="driver-name">Driver: {vehicle.driverName}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {schedule.contactPerson && (
          <div className="contact-info">
            <h4>Contact:</h4>
            <p>{schedule.contactPerson.name}</p>
            {schedule.contactPerson.phone && (
              <p>📞 {schedule.contactPerson.phone}</p>
            )}
          </div>
        )}

        {schedule.specialInstructions && (
          <div className="special-instructions">
            <AlertCircle size={16} />
            <p>{schedule.specialInstructions}</p>
          </div>
        )}

        {schedule.statistics && (
          <div className="statistics">
            <div className="stat-item">
              <CheckCircle size={16} />
              <span>{schedule.statistics.totalCollections || 0} Total Collections</span>
            </div>
            {schedule.statistics.averageDelay > 0 && (
              <div className="stat-item delay">
                <Clock size={16} />
                <span>Avg Delay: {schedule.statistics.averageDelay} min</span>
              </div>
            )}
          </div>
        )}

        <button 
          className="view-details-btn"
          onClick={() => setSelectedSchedule(schedule)}
        >
          View Full Schedule
        </button>
      </div>
    );
  };

  const WeekScheduleModal = ({ schedule, onClose }) => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Weekly Schedule - {schedule.area}</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <div className="week-schedule">
              {days.map(day => {
                const daySchedule = schedule.schedule[day];
                const isEnabled = daySchedule?.enabled;
                
                return (
                  <div key={day} className={`day-schedule ${isEnabled ? 'enabled' : 'disabled'}`}>
                    <h4>{day.charAt(0).toUpperCase() + day.slice(1)}</h4>
                    {isEnabled && daySchedule.slots.length > 0 ? (
                      <div className="day-slots">
                        {daySchedule.slots.map((slot, idx) => (
                          <div key={idx} className="slot-detail">
                            <Clock size={14} />
                            <span>{slot.startTime} - {slot.endTime}</span>
                            <span 
                              className="waste-type-badge"
                              style={{ backgroundColor: getWasteTypeColor(slot.wasteType) }}
                            >
                              {getWasteTypeIcon(slot.wasteType)}
                              {slot.wasteType}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-collection">No collection</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="garbage-schedule-page">
      <div className="garbage-container">
        <header className="garbage-header">
          <h1>🗑️ Garbage Collection Schedule</h1>
          <p>Find collection schedules for your area and get notifications</p>
        </header>

        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <Search size={18} />
            Search Area
          </button>
          <button 
            className={`tab ${activeTab === 'today' ? 'active' : ''}`}
            onClick={() => setActiveTab('today')}
          >
            <Calendar size={18} />
            Today's Collection
          </button>
        </div>

        {activeTab === 'search' && (
          <>
            <div className="search-section">
              <form onSubmit={handleSearch} className="search-form">
                <div className="search-input-wrapper">
                  <Search size={20} />
                  <input
                    type="text"
                    placeholder="Enter your area, ward, or zone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    list="location-suggestions"
                  />
                  <datalist id="location-suggestions">
                    {locations.areas.map(area => (
                      <option key={area} value={area} />
                    ))}
                  </datalist>
                </div>
                <button type="submit" className="search-btn" disabled={loading}>
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </form>

              {userLocation && (
                <p className="location-status">
                  <MapPin size={14} />
                  Using your current location for nearby results
                </p>
              )}
            </div>

            <div className="schedules-grid">
              {schedules.length > 0 ? (
                schedules.map(schedule => (
                  <ScheduleCard key={schedule._id} schedule={schedule} />
                ))
              ) : (
                <div className="empty-state">
                  <Truck size={48} />
                  <h3>No schedules found</h3>
                  <p>Try searching for your area, ward, or zone</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'today' && (
          <div className="today-section">
            <h2>Today's Collections</h2>
            <div className="schedules-grid">
              {todaySchedules.length > 0 ? (
                todaySchedules.map(schedule => (
                  <ScheduleCard key={schedule._id} schedule={schedule} />
                ))
              ) : (
                <div className="empty-state">
                  <Calendar size={48} />
                  <h3>No collections today</h3>
                  <p>Check back tomorrow or search for your area</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedSchedule && (
        <WeekScheduleModal 
          schedule={selectedSchedule} 
          onClose={() => setSelectedSchedule(null)} 
        />
      )}
    </div>
  );
};

export default GarbageSchedule;
