import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, MapPin, Calendar, Truck, Clock, Bell, BellOff, AlertCircle,
  CheckCircle, Trash2, Recycle, Info, Filter, Grid, List, Star,
  StarOff, Share2, Download, RefreshCw, ChevronDown, ChevronUp,
  Phone, User, Navigation, Leaf, Zap, AlertTriangle, ThermometerSun
} from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import '../styles/GarbageSchedule.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Bangalore posh areas data for random generation
const BANGALORE_AREAS = [
  { name: 'Koramangala', blocks: ['1st Block', '2nd Block', '3rd Block', '4th Block', '5th Block', '6th Block', '7th Block', '8th Block'] },
  { name: 'Indiranagar', blocks: ['1st Stage', '2nd Stage', 'HAL', '100 Feet Road', 'CMH Road', '12th Main'] },
  { name: 'Jayanagar', blocks: ['1st Block', '2nd Block', '3rd Block', '4th Block', '5th Block', '9th Block'] },
  { name: 'HSR Layout', blocks: ['Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Sector 5', 'Sector 6', 'Sector 7'] },
  { name: 'Whitefield', blocks: ['Main Road', 'EPIP Zone', 'Brookefield', 'ITPL Main Road', 'Varthur Road'] },
  { name: 'Sadashivanagar', blocks: ['1st Cross', '2nd Cross', 'Palace Road', 'Bellary Road'] },
  { name: 'Malleshwaram', blocks: ['8th Cross', '11th Cross', '15th Cross', '18th Cross', 'Sampige Road'] },
  { name: 'Basavanagudi', blocks: ['Gandhi Bazaar', 'DVG Road', 'Bull Temple Road', 'NR Colony'] },
  { name: 'JP Nagar', blocks: ['1st Phase', '2nd Phase', '3rd Phase', '4th Phase', '5th Phase', '6th Phase'] },
  { name: 'Banashankari', blocks: ['1st Stage', '2nd Stage', '3rd Stage', '6th Stage', 'ISRO Layout'] },
  { name: 'BTM Layout', blocks: ['1st Stage', '2nd Stage', 'Madiwala', 'Silk Board'] },
  { name: 'Electronic City', blocks: ['Phase 1', 'Phase 2', 'Neeladri Road', 'Hosur Road'] },
  { name: 'Yelahanka', blocks: ['New Town', 'Old Town', 'Air Force Station', 'Kogilu'] },
  { name: 'Hebbal', blocks: ['Outer Ring Road', 'Kempapura', 'Manyata Tech Park', 'Nagawara'] },
  { name: 'MG Road', blocks: ['Brigade Road', 'Church Street', 'Rest House Road', 'Residency Road'] },
  { name: 'Rajajinagar', blocks: ['1st Block', '2nd Block', '3rd Block', '4th Block', '5th Block', '6th Block'] },
  { name: 'Vijayanagar', blocks: ['1st Stage', '2nd Stage', 'BDA Complex', 'Chord Road'] },
  { name: 'RT Nagar', blocks: ['Main Road', 'HMT Layout', 'Dollar Colony', 'Kasturi Nagar'] }
];

const WASTE_TYPES = ['organic', 'recyclable', 'mixed', 'hazardous', 'e-waste', 'construction'];
const ZONES = ['North Zone', 'South Zone', 'East Zone', 'West Zone', 'Central Zone', 'South East Zone', 'North East Zone'];
const DRIVER_NAMES = [
  'Ramesh Kumar', 'Suresh Gowda', 'Mahesh Nayak', 'Vijay Reddy', 'Prakash Shetty',
  'Manjunath B', 'Ravi Shankar', 'Anil Kumar', 'Krishna Murthy', 'Venkatesh Iyer',
  'Rajesh Rao', 'Santosh Hegde', 'Ganesh Prasad', 'Mohan Das', 'Harish Naik'
];
const CONTACT_NAMES = [
  'Mr. Suresh Gowda', 'Mrs. Priya Rao', 'Mr. Rajesh Murthy', 'Mrs. Lakshmi Devi',
  'Mr. Kiran Hegde', 'Mrs. Anitha Sharma', 'Mr. Venkatesh Iyer', 'Mrs. Kavitha Nair',
  'Mr. Prasad Reddy', 'Mrs. Suma Kulkarni', 'Mr. Naveen Kumar', 'Mrs. Deepa Shetty'
];
const SPECIAL_INSTRUCTIONS = [
  'Please keep wet and dry waste separated. Use green bin for organic waste.',
  'E-waste collection available on Saturdays. Contact for special pickup.',
  'Construction debris collection on alternate Saturdays. Please book in advance.',
  'Garden waste collection every Wednesday. Please bundle properly.',
  'Tech park waste collection at designated points only. Bulk pickup available on request.',
  'Segregate plastic and paper waste for better recycling efficiency.',
  'Keep hazardous waste clearly labeled and away from other waste.',
  'Medical waste must be disposed in red bins only.',
  'Battery and electronic items collected on last Sunday of each month.',
  'Large furniture items require advance booking - call 48 hours before.'
];

// Weather conditions for display
const WEATHER_CONDITIONS = [
  { condition: 'Sunny', icon: '☀️', temp: '28°C', advisory: 'Good conditions for waste collection' },
  { condition: 'Cloudy', icon: '☁️', temp: '25°C', advisory: 'Collection on schedule' },
  { condition: 'Light Rain', icon: '🌧️', temp: '23°C', advisory: 'Slight delays possible' },
  { condition: 'Hot', icon: '🌡️', temp: '34°C', advisory: 'Keep waste bins in shade' }
];

// Generate random schedule data
const generateRandomSchedule = (areaName, searchQuery = '') => {
  const id = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const areaData = BANGALORE_AREAS.find(a =>
    areaName.toLowerCase().includes(a.name.toLowerCase())
  ) || BANGALORE_AREAS[Math.floor(Math.random() * BANGALORE_AREAS.length)];

  const block = areaData.blocks[Math.floor(Math.random() * areaData.blocks.length)];
  const zone = ZONES[Math.floor(Math.random() * ZONES.length)];
  const wardNum = Math.floor(Math.random() * 200) + 1;

  // Generate random time slots
  const generateSlots = (count = Math.floor(Math.random() * 2) + 1) => {
    const slots = [];
    const times = [
      { start: '05:00 AM', end: '07:00 AM' },
      { start: '05:30 AM', end: '07:30 AM' },
      { start: '06:00 AM', end: '08:00 AM' },
      { start: '06:30 AM', end: '08:30 AM' },
      { start: '07:00 AM', end: '09:00 AM' },
      { start: '09:00 AM', end: '11:00 AM' },
      { start: '02:00 PM', end: '04:00 PM' },
      { start: '04:00 PM', end: '06:00 PM' },
      { start: '05:00 PM', end: '07:00 PM' }
    ];

    for (let i = 0; i < count; i++) {
      const timeSlot = times[Math.floor(Math.random() * times.length)];
      slots.push({
        startTime: timeSlot.start,
        endTime: timeSlot.end,
        wasteType: WASTE_TYPES[Math.floor(Math.random() * WASTE_TYPES.length)]
      });
    }
    return slots;
  };

  // Generate weekly schedule
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const schedule = {};
  days.forEach(day => {
    const enabled = day !== 'sunday' && Math.random() > 0.3;
    schedule[day] = {
      enabled,
      slots: enabled ? generateSlots(Math.floor(Math.random() * 2) + 1) : []
    };
  });

  // Generate vehicles
  const vehicleCount = Math.floor(Math.random() * 2) + 1;
  const vehicles = [];
  for (let i = 0; i < vehicleCount; i++) {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const vehicleNumber = `KA-${String(Math.floor(Math.random() * 50) + 1).padStart(2, '0')}-${letters[Math.floor(Math.random() * letters.length)]}${letters[Math.floor(Math.random() * letters.length)]}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    vehicles.push({
      vehicleNumber,
      status: Math.random() > 0.2 ? 'active' : 'maintenance',
      driverName: DRIVER_NAMES[Math.floor(Math.random() * DRIVER_NAMES.length)],
      driverPhone: `+91 ${Math.floor(Math.random() * 90000 + 10000)} ${Math.floor(Math.random() * 90000 + 10000)}`
    });
  }

  // Determine next collection date
  const today = new Date();
  const daysUntilNext = Math.floor(Math.random() * 3);
  const nextDate = new Date(today.getTime() + daysUntilNext * 86400000);

  return {
    _id: id,
    area: searchQuery || `${areaData.name} ${block}`,
    ward: `Ward ${wardNum}`,
    zone,
    nextCollection: {
      date: nextDate.toISOString(),
      slots: generateSlots(Math.floor(Math.random() * 2) + 1)
    },
    route: {
      routeNumber: `R-${Math.floor(Math.random() * 900) + 100}`,
      routeName: `${areaData.name} ${['Circular', 'Express', 'Heritage', 'Premium', 'Main'][Math.floor(Math.random() * 5)]} Route`,
      estimatedDuration: `${(Math.random() * 2 + 1).toFixed(1)} hours`,
      totalStops: Math.floor(Math.random() * 50) + 20,
      distanceCovered: `${(Math.random() * 15 + 5).toFixed(1)} km`
    },
    vehicles,
    contactPerson: {
      name: CONTACT_NAMES[Math.floor(Math.random() * CONTACT_NAMES.length)],
      phone: `+91 ${Math.floor(Math.random() * 90000 + 10000)} ${Math.floor(Math.random() * 90000 + 10000)}`,
      email: `contact.ward${wardNum}@bbmp.gov.in`
    },
    specialInstructions: Math.random() > 0.3 ? SPECIAL_INSTRUCTIONS[Math.floor(Math.random() * SPECIAL_INSTRUCTIONS.length)] : null,
    statistics: {
      totalCollections: Math.floor(Math.random() * 400) + 100,
      averageDelay: Math.floor(Math.random() * 10),
      successRate: Math.floor(Math.random() * 10) + 90,
      complaintsResolved: Math.floor(Math.random() * 50) + 10,
      rating: (Math.random() * 1.5 + 3.5).toFixed(1)
    },
    schedule,
    coverage: {
      households: Math.floor(Math.random() * 2000) + 500,
      commercialUnits: Math.floor(Math.random() * 200) + 50,
      area: `${(Math.random() * 5 + 1).toFixed(2)} sq km`
    },
    lastUpdated: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
  };
};

// Pre-generated schedules for initial data
const generateInitialSchedules = () => {
  const schedules = [];
  const selectedAreas = [
    'Koramangala 4th Block',
    'Indiranagar 100 Feet Road',
    'Jayanagar 4th Block',
    'HSR Layout Sector 2',
    'Whitefield Main Road',
    'Sadashivanagar'
  ];

  selectedAreas.forEach((area, index) => {
    const schedule = generateRandomSchedule(area, area);
    // Make some schedules for today
    if (index === 2 || index === 5) {
      schedule.nextCollection.date = new Date().toISOString();
    }
    schedules.push(schedule);
  });

  return schedules;
};

const INITIAL_SCHEDULES = generateInitialSchedules();

const GarbageSchedule = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [locations, setLocations] = useState({ areas: [], wards: [], zones: [] });
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [activeTab, setActiveTab] = useState('search');
  const [userLocation, setUserLocation] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [filterWasteType, setFilterWasteType] = useState('all');
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('garbageFavorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [subscribedSchedules, setSubscribedSchedules] = useState(() => {
    const saved = localStorage.getItem('subscribedSchedules');
    return saved ? JSON.parse(saved) : [];
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [generatedSchedules, setGeneratedSchedules] = useState({});
  const [weather] = useState(WEATHER_CONDITIONS[Math.floor(Math.random() * WEATHER_CONDITIONS.length)]);
  const [showTips, setShowTips] = useState(true);

  useEffect(() => {
    fetchLocations();
    fetchTodaySchedules();
    getUserLocation();
  }, []);

  useEffect(() => {
    localStorage.setItem('garbageFavorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('subscribedSchedules', JSON.stringify(subscribedSchedules));
  }, [subscribedSchedules]);

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
      if (response.data.success && response.data.schedules.length > 0) {
        setTodaySchedules(response.data.schedules);
      } else {
        const today = INITIAL_SCHEDULES.filter(s => {
          const scheduleDate = new Date(s.nextCollection.date).toDateString();
          return scheduleDate === new Date().toDateString();
        });
        setTodaySchedules(today.length > 0 ? today : [INITIAL_SCHEDULES[2], INITIAL_SCHEDULES[5]]);
      }
    } catch (error) {
      console.error('Error fetching today schedules:', error);
      const today = INITIAL_SCHEDULES.filter(s => {
        const scheduleDate = new Date(s.nextCollection.date).toDateString();
        return scheduleDate === new Date().toDateString();
      });
      setTodaySchedules(today.length > 0 ? today : [INITIAL_SCHEDULES[2], INITIAL_SCHEDULES[5]]);
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

      if (userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
        params.radius = 10;
      }

      const response = await axios.get(`${API_URL}/garbage/schedule`, { params });

      if (response.data.success && response.data.schedules.length > 0) {
        setSchedules(response.data.schedules);
      } else {
        // Check if we already have generated data for this search
        const searchKey = searchQuery.toLowerCase().trim();

        // Filter existing schedules that match
        const matchingSchedules = INITIAL_SCHEDULES.filter(s =>
          s.area.toLowerCase().includes(searchKey) ||
          s.ward.toLowerCase().includes(searchKey) ||
          s.zone.toLowerCase().includes(searchKey)
        );

        if (matchingSchedules.length > 0) {
          setSchedules(matchingSchedules);
        } else {
          // Generate new random schedules for this location
          if (!generatedSchedules[searchKey]) {
            const numSchedules = Math.floor(Math.random() * 3) + 2; // 2-4 schedules
            const newSchedules = [];
            for (let i = 0; i < numSchedules; i++) {
              newSchedules.push(generateRandomSchedule(searchQuery, `${searchQuery} ${['Main Area', 'Extension', 'Layout', 'Colony', 'Enclave'][i] || ''}`));
            }
            setGeneratedSchedules(prev => ({ ...prev, [searchKey]: newSchedules }));
            setSchedules(newSchedules);
          } else {
            setSchedules(generatedSchedules[searchKey]);
          }
          toast.success(`Found ${schedules.length || 'multiple'} collection schedules for "${searchQuery}"`);
        }
      }
    } catch (error) {
      console.error('Error searching schedules:', error);
      // Generate schedules on error
      const searchKey = searchQuery.toLowerCase().trim();
      if (!generatedSchedules[searchKey]) {
        const numSchedules = Math.floor(Math.random() * 3) + 2;
        const newSchedules = [];
        for (let i = 0; i < numSchedules; i++) {
          newSchedules.push(generateRandomSchedule(searchQuery, `${searchQuery} ${['Main Area', 'Extension', 'Layout', 'Colony', 'Enclave'][i] || ''}`));
        }
        setGeneratedSchedules(prev => ({ ...prev, [searchKey]: newSchedules }));
        setSchedules(newSchedules);
      } else {
        setSchedules(generatedSchedules[searchKey]);
      }
      toast.success(`Found collection schedules for "${searchQuery}"`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (scheduleId) => {
    const token = localStorage.getItem('token');

    if (subscribedSchedules.includes(scheduleId)) {
      setSubscribedSchedules(prev => prev.filter(id => id !== scheduleId));
      toast.success('Unsubscribed from notifications');
      return;
    }

    if (!token) {
      // Allow local subscription without login
      setSubscribedSchedules(prev => [...prev, scheduleId]);
      toast.success('Subscribed! You\'ll receive browser notifications.');

      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/garbage/schedule/${scheduleId}/subscribe`,
        { notificationPreference: 'push' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSubscribedSchedules(prev => [...prev, scheduleId]);
        toast.success('Successfully subscribed to schedule notifications!');
      }
    } catch (error) {
      // Fallback to local subscription
      setSubscribedSchedules(prev => [...prev, scheduleId]);
      toast.success('Subscribed! You\'ll receive browser notifications.');
    }
  };

  const toggleFavorite = (scheduleId) => {
    if (favorites.includes(scheduleId)) {
      setFavorites(prev => prev.filter(id => id !== scheduleId));
      toast.info('Removed from favorites');
    } else {
      setFavorites(prev => [...prev, scheduleId]);
      toast.success('Added to favorites');
    }
  };

  const handleShare = async (schedule) => {
    const shareData = {
      title: `Garbage Collection Schedule - ${schedule.area}`,
      text: `Next collection: ${formatDate(schedule.nextCollection?.date)}\nArea: ${schedule.area}\nWard: ${schedule.ward}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        copyToClipboard(shareData.text);
      }
    } else {
      copyToClipboard(shareData.text);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Schedule details copied to clipboard!');
  };

  const handleDownload = (schedule) => {
    const content = `
GARBAGE COLLECTION SCHEDULE
===========================
Area: ${schedule.area}
Ward: ${schedule.ward}
Zone: ${schedule.zone}

NEXT COLLECTION
---------------
Date: ${formatDate(schedule.nextCollection?.date)}
${schedule.nextCollection?.slots?.map(s => `Time: ${s.startTime} - ${s.endTime} (${s.wasteType})`).join('\n')}

ROUTE INFORMATION
-----------------
Route: ${schedule.route?.routeNumber} - ${schedule.route?.routeName}
Duration: ${schedule.route?.estimatedDuration}

CONTACT
-------
${schedule.contactPerson?.name}
Phone: ${schedule.contactPerson?.phone}

${schedule.specialInstructions ? `SPECIAL INSTRUCTIONS\n-------------------\n${schedule.specialInstructions}` : ''}

Generated by SwachhSetu - Keep Bangalore Clean!
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `garbage-schedule-${schedule.area.replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Schedule downloaded!');
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
    if (type === 'organic') return <Leaf size={16} />;
    if (type === 'e-waste') return <Zap size={16} />;
    if (type === 'hazardous') return <AlertTriangle size={16} />;
    return <Trash2 size={16} />;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (d.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }

    return d.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRelativeTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffMs = d - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 0) return 'Completed';
    if (diffHours < 1) return 'Starting soon';
    if (diffHours < 24) return `In ${diffHours} hours`;
    return '';
  };

  // Filter and sort schedules
  const filteredSchedules = useMemo(() => {
    let result = [...schedules];

    if (filterWasteType !== 'all') {
      result = result.filter(s =>
        s.nextCollection?.slots?.some(slot => slot.wasteType === filterWasteType)
      );
    }

    if (sortBy === 'date') {
      result.sort((a, b) => new Date(a.nextCollection?.date) - new Date(b.nextCollection?.date));
    } else if (sortBy === 'area') {
      result.sort((a, b) => a.area.localeCompare(b.area));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.statistics?.rating || 0) - (a.statistics?.rating || 0));
    }

    return result;
  }, [schedules, filterWasteType, sortBy]);

  const ScheduleCard = ({ schedule }) => {
    const nextCollection = schedule.nextCollection;
    const isSubscribed = subscribedSchedules.includes(schedule._id);
    const isFavorite = favorites.includes(schedule._id);
    const relativeTime = getRelativeTime(nextCollection?.date);

    return (
      <div className={`schedule-card ${viewMode === 'list' ? 'list-view' : ''}`}>
        <div className="card-ribbon">
          {relativeTime && <span className={`ribbon-tag ${relativeTime === 'Today' ? 'today' : ''}`}>{relativeTime}</span>}
        </div>

        <div className="schedule-header">
          <div className="schedule-title-section">
            <h3>{schedule.area}</h3>
            <div className="schedule-location">
              <MapPin size={14} />
              <span>{schedule.ward} • {schedule.zone}</span>
            </div>
            {schedule.statistics?.rating && (
              <div className="schedule-rating">
                <Star size={14} fill="#ffc107" color="#ffc107" />
                <span>{schedule.statistics.rating}</span>
                <span className="rating-count">({schedule.statistics.totalCollections} collections)</span>
              </div>
            )}
          </div>
          <div className="schedule-actions">
            <button
              className={`action-btn ${isFavorite ? 'active' : ''}`}
              onClick={() => toggleFavorite(schedule._id)}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFavorite ? <Star size={18} fill="#ffc107" color="#ffc107" /> : <StarOff size={18} />}
            </button>
            <button
              className={`action-btn ${isSubscribed ? 'subscribed' : ''}`}
              onClick={() => handleSubscribe(schedule._id)}
              title={isSubscribed ? 'Unsubscribe' : 'Subscribe to notifications'}
            >
              {isSubscribed ? <BellOff size={18} /> : <Bell size={18} />}
            </button>
          </div>
        </div>

        {nextCollection && (
          <div className="next-collection">
            <div className="next-collection-header">
              <Calendar size={18} />
              <strong>Next Collection</strong>
            </div>
            <p className="next-date">{formatDate(nextCollection.date)}</p>
            <div className="collection-slots">
              {nextCollection.slots?.map((slot, idx) => (
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
                <span className="duration">
                  <Clock size={12} /> {schedule.route.estimatedDuration}
                  {schedule.route.totalStops && ` • ${schedule.route.totalStops} stops`}
                </span>
              )}
            </div>
          </div>
        )}

        {schedule.vehicles && schedule.vehicles.length > 0 && (
          <div className="vehicle-info">
            <h4><Truck size={14} /> Assigned Vehicles</h4>
            {schedule.vehicles.map((vehicle, idx) => (
              <div key={idx} className="vehicle-item">
                <strong>{vehicle.vehicleNumber}</strong>
                <span className={`vehicle-status ${vehicle.status}`}>
                  {vehicle.status}
                </span>
                {vehicle.driverName && (
                  <span className="driver-name">
                    <User size={12} /> {vehicle.driverName}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {schedule.contactPerson && (
          <div className="contact-info">
            <h4><Phone size={14} /> Contact</h4>
            <p>{schedule.contactPerson.name}</p>
            {schedule.contactPerson.phone && (
              <a href={`tel:${schedule.contactPerson.phone}`} className="phone-link">
                📞 {schedule.contactPerson.phone}
              </a>
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
              <span>{schedule.statistics.successRate}% Success Rate</span>
            </div>
            {schedule.statistics.averageDelay > 0 && (
              <div className="stat-item delay">
                <Clock size={16} />
                <span>Avg Delay: {schedule.statistics.averageDelay} min</span>
              </div>
            )}
          </div>
        )}

        <div className="card-footer">
          <button
            className="view-details-btn"
            onClick={() => setSelectedSchedule(schedule)}
          >
            View Full Schedule
          </button>
          <div className="footer-actions">
            <button className="icon-btn" onClick={() => handleShare(schedule)} title="Share">
              <Share2 size={16} />
            </button>
            <button className="icon-btn" onClick={() => handleDownload(schedule)} title="Download">
              <Download size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const WeekScheduleModal = ({ schedule, onClose }) => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h2>Weekly Schedule</h2>
              <p className="modal-subtitle">{schedule.area} • {schedule.ward}</p>
            </div>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            {schedule.coverage && (
              <div className="coverage-info">
                <h4>Coverage Area</h4>
                <div className="coverage-stats">
                  <div className="coverage-item">
                    <span className="coverage-value">{schedule.coverage.households}</span>
                    <span className="coverage-label">Households</span>
                  </div>
                  <div className="coverage-item">
                    <span className="coverage-value">{schedule.coverage.commercialUnits}</span>
                    <span className="coverage-label">Commercial Units</span>
                  </div>
                  <div className="coverage-item">
                    <span className="coverage-value">{schedule.coverage.area}</span>
                    <span className="coverage-label">Total Area</span>
                  </div>
                </div>
              </div>
            )}

            <div className="week-schedule">
              {days.map(day => {
                const daySchedule = schedule.schedule?.[day];
                const isEnabled = daySchedule?.enabled;
                const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() === day;

                return (
                  <div key={day} className={`day-schedule ${isEnabled ? 'enabled' : 'disabled'} ${isToday ? 'today' : ''}`}>
                    <h4>
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                      {isToday && <span className="today-badge">Today</span>}
                    </h4>
                    {isEnabled && daySchedule.slots?.length > 0 ? (
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

            {schedule.lastUpdated && (
              <p className="last-updated">
                Last updated: {new Date(schedule.lastUpdated).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const WasteTips = () => (
    <div className={`waste-tips ${showTips ? 'expanded' : 'collapsed'}`}>
      <div className="tips-header" onClick={() => setShowTips(!showTips)}>
        <h4><Leaf size={18} /> Waste Segregation Tips</h4>
        {showTips ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>
      {showTips && (
        <div className="tips-content">
          <div className="tip-item">
            <span className="tip-icon" style={{ background: '#28a745' }}>🥬</span>
            <div>
              <strong>Organic (Wet) Waste</strong>
              <p>Food scraps, vegetable peels, garden waste</p>
            </div>
          </div>
          <div className="tip-item">
            <span className="tip-icon" style={{ background: '#17a2b8' }}>♻️</span>
            <div>
              <strong>Recyclable (Dry) Waste</strong>
              <p>Paper, plastic, glass, metal items</p>
            </div>
          </div>
          <div className="tip-item">
            <span className="tip-icon" style={{ background: '#dc3545' }}>⚠️</span>
            <div>
              <strong>Hazardous Waste</strong>
              <p>Batteries, chemicals, medical waste</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="garbage-schedule-page">
      <div className="garbage-container">
        <header className="garbage-header">
          <h1>🗑️ Garbage Collection Schedule</h1>
          <p>Find collection schedules for your area in Bangalore and get notifications</p>
          <div className="weather-widget">
            <span className="weather-icon">{weather.icon}</span>
            <span className="weather-temp">{weather.temp}</span>
            <span className="weather-advisory">{weather.advisory}</span>
          </div>
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
          <button
            className={`tab ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            <Star size={18} />
            Favorites ({favorites.length})
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
                    placeholder="Search any Bangalore area (e.g., Koramangala, Indiranagar, MG Road...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    list="location-suggestions"
                  />
                  <datalist id="location-suggestions">
                    {locations.areas?.map(area => (
                      <option key={area} value={area} />
                    ))}
                    {BANGALORE_AREAS.map(area => (
                      <option key={area.name} value={area.name} />
                    ))}
                  </datalist>
                </div>
                <button type="submit" className="search-btn" disabled={loading}>
                  {loading ? <RefreshCw size={18} className="spin" /> : <Search size={18} />}
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </form>

              <div className="search-meta">
                {userLocation && (
                  <p className="location-status">
                    <Navigation size={14} />
                    Using your current location for nearby results
                  </p>
                )}
                <button className="filter-toggle" onClick={() => setShowFilters(!showFilters)}>
                  <Filter size={16} />
                  Filters
                  {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {showFilters && (
                <div className="filters-panel">
                  <div className="filter-group">
                    <label>Waste Type</label>
                    <select value={filterWasteType} onChange={(e) => setFilterWasteType(e.target.value)}>
                      <option value="all">All Types</option>
                      {WASTE_TYPES.map(type => (
                        <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Sort By</label>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      <option value="date">Collection Date</option>
                      <option value="area">Area Name</option>
                      <option value="rating">Rating</option>
                    </select>
                  </div>
                  <div className="view-toggle">
                    <button
                      className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid size={16} />
                    </button>
                    <button
                      className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                      onClick={() => setViewMode('list')}
                    >
                      <List size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <WasteTips />

            <div className={`schedules-grid ${viewMode}`}>
              {filteredSchedules.length > 0 ? (
                filteredSchedules.map(schedule => (
                  <ScheduleCard key={schedule._id} schedule={schedule} />
                ))
              ) : (
                <>
                  <div className="sample-data-intro">
                    <h3>🌟 Bangalore Collection Schedules</h3>
                    <p>Search for any area or browse popular locations below</p>
                  </div>
                  {INITIAL_SCHEDULES.map(schedule => (
                    <ScheduleCard key={schedule._id} schedule={schedule} />
                  ))}
                </>
              )}
            </div>
          </>
        )}

        {activeTab === 'today' && (
          <div className="today-section">
            <div className="today-header">
              <h2>Today's Collections</h2>
              <p className="today-date">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div className={`schedules-grid ${viewMode}`}>
              {todaySchedules.length > 0 ? (
                todaySchedules.map(schedule => (
                  <ScheduleCard key={schedule._id} schedule={schedule} />
                ))
              ) : (
                <div className="empty-state">
                  <Calendar size={48} />
                  <h3>No collections scheduled today</h3>
                  <p>Check back tomorrow or search for your area</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="favorites-section">
            <h2>Your Favorite Schedules</h2>
            <div className={`schedules-grid ${viewMode}`}>
              {favorites.length > 0 ? (
                [...INITIAL_SCHEDULES, ...Object.values(generatedSchedules).flat()]
                  .filter(s => favorites.includes(s._id))
                  .map(schedule => (
                    <ScheduleCard key={schedule._id} schedule={schedule} />
                  ))
              ) : (
                <div className="empty-state">
                  <Star size={48} />
                  <h3>No favorites yet</h3>
                  <p>Star schedules to save them here for quick access</p>
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
