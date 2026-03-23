import React, { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import api from "../utils/api";
import { toast } from 'react-toastify';
import {
  Search, MapPin, Navigation, Star, Clock, Phone, AlertCircle,
  CheckCircle, XCircle, Filter, Heart, Share2, ThumbsUp, ThumbsDown,
  RefreshCw, Accessibility, Baby, Droplets, Shield, Users, Wifi,
  CreditCard, IndianRupee, ChevronDown, ChevronUp, X, MessageSquare,
  Flag, ExternalLink, Copy, Sparkles, AlertTriangle, Info, Settings,
  Zap, Award, TrendingUp, Eye, EyeOff
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import "./ToiletFinder.css";

import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color) => L.divIcon({
  className: 'custom-marker',
  html: `<div style="background: ${color}; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

const toiletIcon = createCustomIcon('#3b82f6');
const userIcon = createCustomIcon('#10b981');
const favoriteIcon = createCustomIcon('#f59e0b');

// Karnataka and Metro Cities toilet data
const KARNATAKA_TOILETS = [
  // Bangalore
  { _id: 'blr1', name: 'MG Road Metro Station Toilet', city: 'Bangalore', area: 'MG Road', address: 'MG Road Metro Station, Near Trinity Circle', location: { coordinates: [77.6197, 12.9757] }, rating: 4.5, reviews: 234, facilities: ['Wheelchair Accessible', 'Western & Indian', 'Hand Dryer', 'Baby Changing'], type: 'metro', timings: '5:00 AM - 11:30 PM', contact: '+91 80 2296 5959', price: 'Free', cleanlinessScore: 4.5, crowdLevel: 'moderate', gender: 'both', lastCleaned: '2 hours ago', isOpen: true, verified: true },
  { _id: 'blr2', name: 'Cubbon Park Public Restroom', city: 'Bangalore', area: 'Cubbon Park', address: 'Near Bandstand, Cubbon Park', location: { coordinates: [77.5946, 12.9763] }, rating: 4.2, reviews: 156, facilities: ['Clean', 'Water Available', 'Well Maintained'], type: 'park', timings: '6:00 AM - 8:00 PM', contact: '+91 80 2286 5586', price: 'Free', cleanlinessScore: 4.0, crowdLevel: 'low', gender: 'both', lastCleaned: '4 hours ago', isOpen: true, verified: true },
  { _id: 'blr3', name: 'Indiranagar Public Toilet', city: 'Bangalore', area: 'Indiranagar', address: '100 Feet Road, Indiranagar', location: { coordinates: [77.6408, 12.9784] }, rating: 3.8, reviews: 89, facilities: ['Paid', 'Maintained', 'Separate for M/F'], type: 'public', timings: '24/7', contact: '+91 80 2528 1234', price: '5', cleanlinessScore: 3.5, crowdLevel: 'high', gender: 'both', lastCleaned: '1 hour ago', isOpen: true, verified: true },
  { _id: 'blr4', name: 'Koramangala Forum Mall Restroom', city: 'Bangalore', area: 'Koramangala', address: 'Forum Mall, Koramangala', location: { coordinates: [77.6116, 12.9352] }, rating: 4.7, reviews: 445, facilities: ['Premium', 'Air Conditioned', 'Baby Changing', 'Wheelchair Accessible', 'Sanitary Napkin'], type: 'mall', timings: '10:00 AM - 10:00 PM', contact: '+91 80 4064 0000', price: 'Free', cleanlinessScore: 4.8, crowdLevel: 'moderate', gender: 'both', lastCleaned: '30 mins ago', isOpen: true, verified: true },
  { _id: 'blr5', name: 'Majestic Bus Stand Toilet Block A', city: 'Bangalore', area: 'Majestic', address: 'Kempegowda Bus Station, Platform 1-10', location: { coordinates: [77.5713, 12.9767] }, rating: 3.2, reviews: 178, facilities: ['Basic', 'Paid', 'High Traffic'], type: 'bus_station', timings: '24/7', contact: '+91 80 2287 0068', price: '5', cleanlinessScore: 2.8, crowdLevel: 'very_high', gender: 'both', lastCleaned: '3 hours ago', isOpen: true, verified: true },
  { _id: 'blr6', name: 'Whitefield ITPL Road Toilet', city: 'Bangalore', area: 'Whitefield', address: 'ITPL Main Road, Near Wipro Gate', location: { coordinates: [77.7480, 12.9698] }, rating: 3.9, reviews: 67, facilities: ['Clean', 'Water Available', 'Western Style'], type: 'public', timings: '6:00 AM - 10:00 PM', contact: '+91 80 2845 1234', price: '2', cleanlinessScore: 3.7, crowdLevel: 'low', gender: 'both', lastCleaned: '5 hours ago', isOpen: true, verified: false },
  { _id: 'blr7', name: 'HSR Layout BDA Complex Toilet', city: 'Bangalore', area: 'HSR Layout', address: 'BDA Complex, 27th Main, HSR Layout', location: { coordinates: [77.6368, 12.9116] }, rating: 4.0, reviews: 92, facilities: ['Government Maintained', 'Free', 'Separate for M/F'], type: 'public', timings: '5:00 AM - 11:00 PM', contact: '+91 80 2573 4567', price: 'Free', cleanlinessScore: 3.8, crowdLevel: 'moderate', gender: 'both', lastCleaned: '2 hours ago', isOpen: true, verified: true },
  { _id: 'blr8', name: 'Jayanagar 4th Block Shopping Complex', city: 'Bangalore', area: 'Jayanagar', address: '4th Block Shopping Complex, Jayanagar', location: { coordinates: [77.5820, 12.9308] }, rating: 4.1, reviews: 124, facilities: ['Clean', 'Water Available', 'Well Lit'], type: 'shopping', timings: '8:00 AM - 9:00 PM', contact: '+91 80 2663 8901', price: 'Free', cleanlinessScore: 4.0, crowdLevel: 'moderate', gender: 'both', lastCleaned: '1 hour ago', isOpen: true, verified: true },
  { _id: 'blr9', name: 'Electronic City Phase 1 Tech Park', city: 'Bangalore', area: 'Electronic City', address: 'Infosys Gate 1, Electronic City Phase 1', location: { coordinates: [77.6600, 12.8456] }, rating: 4.6, reviews: 89, facilities: ['Premium', 'Well Maintained', 'Wheelchair Accessible', 'Hand Sanitizer'], type: 'tech_park', timings: '7:00 AM - 9:00 PM', contact: '+91 80 2852 3456', price: 'Free', cleanlinessScore: 4.5, crowdLevel: 'low', gender: 'both', lastCleaned: '1 hour ago', isOpen: true, verified: true },
  { _id: 'blr10', name: 'Lalbagh Botanical Garden Toilet', city: 'Bangalore', area: 'Lalbagh', address: 'Near Glass House, Lalbagh Botanical Garden', location: { coordinates: [77.5855, 12.9507] }, rating: 3.6, reviews: 203, facilities: ['Basic', 'Water Available', 'Garden Location'], type: 'park', timings: '6:00 AM - 7:00 PM', contact: '+91 80 2657 0181', price: '5', cleanlinessScore: 3.2, crowdLevel: 'moderate', gender: 'both', lastCleaned: '4 hours ago', isOpen: true, verified: true },

  // Mysore
  { _id: 'mys1', name: 'Mysore Palace Public Toilet', city: 'Mysore', area: 'Palace Area', address: 'Near Mysore Palace Main Gate', location: { coordinates: [76.6553, 12.3051] }, rating: 3.8, reviews: 312, facilities: ['Heritage Area', 'Maintained', 'Separate for M/F'], type: 'tourist', timings: '6:00 AM - 8:00 PM', contact: '+91 821 242 1051', price: '5', cleanlinessScore: 3.5, crowdLevel: 'high', gender: 'both', lastCleaned: '2 hours ago', isOpen: true, verified: true },
  { _id: 'mys2', name: 'Chamundi Hill Base Restroom', city: 'Mysore', area: 'Chamundi Hill', address: 'Base Station, Chamundi Hill Road', location: { coordinates: [76.6718, 12.2724] }, rating: 3.5, reviews: 87, facilities: ['Basic', 'Water Available'], type: 'tourist', timings: '5:00 AM - 9:00 PM', contact: '+91 821 252 1234', price: '2', cleanlinessScore: 3.0, crowdLevel: 'moderate', gender: 'both', lastCleaned: '3 hours ago', isOpen: true, verified: false },
  { _id: 'mys3', name: 'KSRTC Mysore Bus Stand', city: 'Mysore', area: 'Central', address: 'KSRTC Bus Stand, Mysore', location: { coordinates: [76.6452, 12.3001] }, rating: 3.2, reviews: 145, facilities: ['24/7', 'Paid', 'Basic Amenities'], type: 'bus_station', timings: '24/7', contact: '+91 821 252 0853', price: '5', cleanlinessScore: 2.8, crowdLevel: 'very_high', gender: 'both', lastCleaned: '1 hour ago', isOpen: true, verified: true },

  // Mangalore
  { _id: 'mng1', name: 'Mangalore Central Railway Station', city: 'Mangalore', area: 'Central', address: 'Platform 1, Central Railway Station', location: { coordinates: [74.8423, 12.8698] }, rating: 3.6, reviews: 98, facilities: ['Railway', 'Paid', 'Basic'], type: 'railway', timings: '24/7', contact: '+91 824 242 0000', price: '5', cleanlinessScore: 3.2, crowdLevel: 'high', gender: 'both', lastCleaned: '2 hours ago', isOpen: true, verified: true },
  { _id: 'mng2', name: 'Panambur Beach Toilet', city: 'Mangalore', area: 'Panambur', address: 'Panambur Beach Entrance', location: { coordinates: [74.8080, 12.9292] }, rating: 3.4, reviews: 67, facilities: ['Beach Location', 'Basic', 'Seasonal'], type: 'beach', timings: '6:00 AM - 7:00 PM', contact: '+91 824 245 1234', price: '5', cleanlinessScore: 3.0, crowdLevel: 'moderate', gender: 'both', lastCleaned: '4 hours ago', isOpen: true, verified: false },

  // Hubli-Dharwad
  { _id: 'hub1', name: 'Hubli Railway Station Toilet', city: 'Hubli', area: 'Railway Station', address: 'Hubli Junction Railway Station', location: { coordinates: [75.1239, 15.3647] }, rating: 3.4, reviews: 76, facilities: ['Railway', 'Paid', 'Basic Amenities'], type: 'railway', timings: '24/7', contact: '+91 836 226 2111', price: '5', cleanlinessScore: 3.0, crowdLevel: 'high', gender: 'both', lastCleaned: '2 hours ago', isOpen: true, verified: true },
  { _id: 'hub2', name: 'Unkal Lake Public Toilet', city: 'Hubli', area: 'Unkal', address: 'Near Unkal Lake Garden', location: { coordinates: [75.1047, 15.3789] }, rating: 3.7, reviews: 45, facilities: ['Garden Area', 'Clean', 'Free'], type: 'park', timings: '5:00 AM - 8:00 PM', contact: '+91 836 235 4567', price: 'Free', cleanlinessScore: 3.5, crowdLevel: 'low', gender: 'both', lastCleaned: '3 hours ago', isOpen: true, verified: false },
];

const METRO_CITIES_TOILETS = [
  // Chennai
  { _id: 'chn1', name: 'Chennai Central Railway Station', city: 'Chennai', area: 'Central', address: 'Platform 1-5, Chennai Central', location: { coordinates: [80.2707, 13.0827] }, rating: 3.5, reviews: 456, facilities: ['Railway', 'Paid', 'High Traffic'], type: 'railway', timings: '24/7', contact: '+91 44 2535 3535', price: '5', cleanlinessScore: 3.0, crowdLevel: 'very_high', gender: 'both', lastCleaned: '1 hour ago', isOpen: true, verified: true },
  { _id: 'chn2', name: 'Marina Beach Public Toilet', city: 'Chennai', area: 'Marina Beach', address: 'Near Light House, Marina Beach', location: { coordinates: [80.2838, 13.0499] }, rating: 3.3, reviews: 234, facilities: ['Beach Location', 'Basic', 'Municipal'], type: 'beach', timings: '5:00 AM - 10:00 PM', contact: '+91 44 2536 1234', price: '5', cleanlinessScore: 2.8, crowdLevel: 'high', gender: 'both', lastCleaned: '3 hours ago', isOpen: true, verified: true },
  { _id: 'chn3', name: 'Phoenix Marketcity Chennai', city: 'Chennai', area: 'Velachery', address: 'Phoenix Marketcity, Velachery', location: { coordinates: [80.2209, 12.9941] }, rating: 4.6, reviews: 389, facilities: ['Premium', 'Air Conditioned', 'Baby Changing', 'Wheelchair Accessible'], type: 'mall', timings: '10:00 AM - 10:00 PM', contact: '+91 44 4000 0000', price: 'Free', cleanlinessScore: 4.7, crowdLevel: 'moderate', gender: 'both', lastCleaned: '45 mins ago', isOpen: true, verified: true },
  { _id: 'chn4', name: 'T. Nagar Pondy Bazaar Toilet', city: 'Chennai', area: 'T. Nagar', address: 'Near Pondy Bazaar Bus Stop', location: { coordinates: [80.2339, 13.0418] }, rating: 3.4, reviews: 123, facilities: ['Municipal', 'Paid', 'Basic'], type: 'public', timings: '6:00 AM - 10:00 PM', contact: '+91 44 2434 5678', price: '5', cleanlinessScore: 3.0, crowdLevel: 'high', gender: 'both', lastCleaned: '2 hours ago', isOpen: true, verified: true },

  // Mumbai
  { _id: 'mum1', name: 'CSMT Railway Station Toilet', city: 'Mumbai', area: 'Fort', address: 'Chhatrapati Shivaji Maharaj Terminus', location: { coordinates: [72.8356, 18.9398] }, rating: 3.6, reviews: 678, facilities: ['Heritage Station', 'Paid', '24/7'], type: 'railway', timings: '24/7', contact: '+91 22 2262 2859', price: '5', cleanlinessScore: 3.2, crowdLevel: 'very_high', gender: 'both', lastCleaned: '30 mins ago', isOpen: true, verified: true },
  { _id: 'mum2', name: 'Gateway of India Public Toilet', city: 'Mumbai', area: 'Colaba', address: 'Near Gateway of India, Colaba', location: { coordinates: [72.8347, 18.9220] }, rating: 3.4, reviews: 345, facilities: ['Tourist Area', 'Maintained', 'Paid'], type: 'tourist', timings: '6:00 AM - 10:00 PM', contact: '+91 22 2282 1234', price: '10', cleanlinessScore: 3.0, crowdLevel: 'high', gender: 'both', lastCleaned: '2 hours ago', isOpen: true, verified: true },
  { _id: 'mum3', name: 'Phoenix Palladium Lower Parel', city: 'Mumbai', area: 'Lower Parel', address: 'High Street Phoenix, Lower Parel', location: { coordinates: [72.8277, 18.9948] }, rating: 4.7, reviews: 567, facilities: ['Premium', 'Air Conditioned', 'Luxury', 'Baby Changing'], type: 'mall', timings: '11:00 AM - 11:00 PM', contact: '+91 22 4333 9999', price: 'Free', cleanlinessScore: 4.8, crowdLevel: 'moderate', gender: 'both', lastCleaned: '20 mins ago', isOpen: true, verified: true },
  { _id: 'mum4', name: 'Juhu Beach Municipal Toilet', city: 'Mumbai', area: 'Juhu', address: 'Juhu Beach Promenade', location: { coordinates: [72.8266, 19.0883] }, rating: 3.2, reviews: 234, facilities: ['Beach Area', 'Basic', 'Municipal'], type: 'beach', timings: '5:00 AM - 11:00 PM', contact: '+91 22 2620 5678', price: '5', cleanlinessScore: 2.8, crowdLevel: 'high', gender: 'both', lastCleaned: '3 hours ago', isOpen: true, verified: true },
  { _id: 'mum5', name: 'Bandra Station Skywalk Toilet', city: 'Mumbai', area: 'Bandra', address: 'Bandra Railway Station, West Exit', location: { coordinates: [72.8399, 19.0544] }, rating: 3.8, reviews: 189, facilities: ['Station Area', 'Clean', 'Paid'], type: 'railway', timings: '5:00 AM - 12:00 AM', contact: '+91 22 2642 3456', price: '5', cleanlinessScore: 3.5, crowdLevel: 'high', gender: 'both', lastCleaned: '1 hour ago', isOpen: true, verified: true },

  // Delhi NCR
  { _id: 'del1', name: 'Connaught Place Inner Circle', city: 'Delhi', area: 'Connaught Place', address: 'Block A, Inner Circle, CP', location: { coordinates: [77.2090, 28.6315] }, rating: 3.9, reviews: 456, facilities: ['Central Location', 'Paid', 'Well Maintained'], type: 'public', timings: '24/7', contact: '+91 11 2341 1234', price: '10', cleanlinessScore: 3.5, crowdLevel: 'high', gender: 'both', lastCleaned: '1 hour ago', isOpen: true, verified: true },
  { _id: 'del2', name: 'India Gate Public Restroom', city: 'Delhi', area: 'India Gate', address: 'Near India Gate Lawns, Rajpath', location: { coordinates: [77.2295, 28.6129] }, rating: 3.6, reviews: 567, facilities: ['Tourist Area', 'Government', 'Basic'], type: 'tourist', timings: '6:00 AM - 10:00 PM', contact: '+91 11 2338 5678', price: '5', cleanlinessScore: 3.2, crowdLevel: 'high', gender: 'both', lastCleaned: '2 hours ago', isOpen: true, verified: true },
  { _id: 'del3', name: 'Rajiv Chowk Metro Station', city: 'Delhi', area: 'CP Metro', address: 'Rajiv Chowk Metro Station, Blue Line', location: { coordinates: [77.2190, 28.6328] }, rating: 4.2, reviews: 789, facilities: ['Metro Station', 'Clean', 'Well Maintained', 'Accessible'], type: 'metro', timings: '5:00 AM - 11:30 PM', contact: '+91 11 2341 7910', price: 'Free', cleanlinessScore: 4.0, crowdLevel: 'very_high', gender: 'both', lastCleaned: '30 mins ago', isOpen: true, verified: true },
  { _id: 'del4', name: 'Select Citywalk Saket', city: 'Delhi', area: 'Saket', address: 'Select Citywalk Mall, Saket', location: { coordinates: [77.2195, 28.5285] }, rating: 4.6, reviews: 345, facilities: ['Premium', 'Air Conditioned', 'Baby Changing', 'Wheelchair Accessible'], type: 'mall', timings: '10:00 AM - 10:00 PM', contact: '+91 11 4211 6666', price: 'Free', cleanlinessScore: 4.7, crowdLevel: 'moderate', gender: 'both', lastCleaned: '45 mins ago', isOpen: true, verified: true },
  { _id: 'del5', name: 'New Delhi Railway Station', city: 'Delhi', area: 'Paharganj', address: 'Platform 1, New Delhi Railway Station', location: { coordinates: [77.2219, 28.6425] }, rating: 3.4, reviews: 890, facilities: ['Railway', 'Paid', '24/7', 'High Traffic'], type: 'railway', timings: '24/7', contact: '+91 11 2334 6789', price: '10', cleanlinessScore: 2.8, crowdLevel: 'very_high', gender: 'both', lastCleaned: '1 hour ago', isOpen: true, verified: true },

  // Hyderabad
  { _id: 'hyd1', name: 'Charminar Area Public Toilet', city: 'Hyderabad', area: 'Charminar', address: 'Near Charminar Monument', location: { coordinates: [78.4747, 17.3616] }, rating: 3.5, reviews: 234, facilities: ['Heritage Area', 'Municipal', 'Basic'], type: 'tourist', timings: '6:00 AM - 9:00 PM', contact: '+91 40 2456 1234', price: '5', cleanlinessScore: 3.0, crowdLevel: 'high', gender: 'both', lastCleaned: '2 hours ago', isOpen: true, verified: true },
  { _id: 'hyd2', name: 'HITEC City Metro Station', city: 'Hyderabad', area: 'HITEC City', address: 'HITEC City Metro Station', location: { coordinates: [78.3762, 17.4483] }, rating: 4.3, reviews: 178, facilities: ['Metro Station', 'Clean', 'Modern', 'Accessible'], type: 'metro', timings: '5:30 AM - 11:00 PM', contact: '+91 40 2340 0000', price: 'Free', cleanlinessScore: 4.2, crowdLevel: 'moderate', gender: 'both', lastCleaned: '1 hour ago', isOpen: true, verified: true },
  { _id: 'hyd3', name: 'Inorbit Mall Hyderabad', city: 'Hyderabad', area: 'Madhapur', address: 'Inorbit Mall, Madhapur', location: { coordinates: [78.3877, 17.4357] }, rating: 4.5, reviews: 289, facilities: ['Premium', 'Air Conditioned', 'Baby Changing', 'Family Room'], type: 'mall', timings: '10:00 AM - 10:00 PM', contact: '+91 40 4455 6677', price: 'Free', cleanlinessScore: 4.5, crowdLevel: 'moderate', gender: 'both', lastCleaned: '40 mins ago', isOpen: true, verified: true },

  // Pune
  { _id: 'pun1', name: 'Pune Junction Railway Station', city: 'Pune', area: 'Pune Station', address: 'Platform 1, Pune Junction', location: { coordinates: [73.8743, 18.5284] }, rating: 3.5, reviews: 345, facilities: ['Railway', 'Paid', '24/7'], type: 'railway', timings: '24/7', contact: '+91 20 2612 6575', price: '5', cleanlinessScore: 3.0, crowdLevel: 'very_high', gender: 'both', lastCleaned: '1 hour ago', isOpen: true, verified: true },
  { _id: 'pun2', name: 'Aga Khan Palace Toilet', city: 'Pune', area: 'Nagar Road', address: 'Aga Khan Palace Complex', location: { coordinates: [73.9019, 18.5521] }, rating: 3.8, reviews: 123, facilities: ['Heritage Site', 'Maintained', 'Paid'], type: 'tourist', timings: '9:00 AM - 5:30 PM', contact: '+91 20 2668 0250', price: '5', cleanlinessScore: 3.5, crowdLevel: 'moderate', gender: 'both', lastCleaned: '3 hours ago', isOpen: true, verified: true },
  { _id: 'pun3', name: 'Phoenix Marketcity Pune', city: 'Pune', area: 'Viman Nagar', address: 'Phoenix Marketcity, Viman Nagar', location: { coordinates: [73.9146, 18.5600] }, rating: 4.6, reviews: 267, facilities: ['Premium', 'Air Conditioned', 'Baby Changing', 'Wheelchair Accessible'], type: 'mall', timings: '10:00 AM - 10:00 PM', contact: '+91 20 6728 9999', price: 'Free', cleanlinessScore: 4.7, crowdLevel: 'moderate', gender: 'both', lastCleaned: '30 mins ago', isOpen: true, verified: true },

  // Kolkata
  { _id: 'kol1', name: 'Howrah Railway Station', city: 'Kolkata', area: 'Howrah', address: 'Platform Area, Howrah Junction', location: { coordinates: [88.3426, 22.5839] }, rating: 3.4, reviews: 567, facilities: ['Railway', 'Paid', '24/7', 'High Traffic'], type: 'railway', timings: '24/7', contact: '+91 33 2660 2518', price: '5', cleanlinessScore: 2.8, crowdLevel: 'very_high', gender: 'both', lastCleaned: '1 hour ago', isOpen: true, verified: true },
  { _id: 'kol2', name: 'Victoria Memorial Gardens', city: 'Kolkata', area: 'Maidan', address: 'Victoria Memorial Complex', location: { coordinates: [88.3426, 22.5448] }, rating: 3.7, reviews: 234, facilities: ['Heritage Site', 'Maintained', 'Garden Area'], type: 'tourist', timings: '10:00 AM - 5:00 PM', contact: '+91 33 2223 1890', price: '5', cleanlinessScore: 3.5, crowdLevel: 'moderate', gender: 'both', lastCleaned: '2 hours ago', isOpen: true, verified: true },
  { _id: 'kol3', name: 'South City Mall Kolkata', city: 'Kolkata', area: 'Prince Anwar Shah Road', address: 'South City Mall, Jadavpur', location: { coordinates: [88.3639, 22.5018] }, rating: 4.5, reviews: 189, facilities: ['Premium', 'Air Conditioned', 'Baby Changing', 'Modern'], type: 'mall', timings: '10:00 AM - 10:00 PM', contact: '+91 33 4006 0000', price: 'Free', cleanlinessScore: 4.6, crowdLevel: 'moderate', gender: 'both', lastCleaned: '45 mins ago', isOpen: true, verified: true },
];

const ALL_TOILETS = [...KARNATAKA_TOILETS, ...METRO_CITIES_TOILETS];

const CITIES = ['All Cities', 'Bangalore', 'Mysore', 'Mangalore', 'Hubli', 'Chennai', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Kolkata'];
const TOILET_TYPES = ['All Types', 'metro', 'railway', 'mall', 'public', 'tourist', 'park', 'bus_station', 'beach', 'tech_park', 'shopping'];
const AMENITIES = ['Wheelchair Accessible', 'Baby Changing', 'Western & Indian', 'Air Conditioned', 'Hand Dryer', 'Sanitary Napkin', 'Hand Sanitizer', 'WiFi'];

// Map center change component
function ChangeMapCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  return null;
}

const ToiletFinder = () => {
  const [search, setSearch] = useState("");
  const [toilets, setToilets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([12.9716, 77.5946]); // Bangalore default
  const [selectedToilet, setSelectedToilet] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showReportModal, setShowReportModal] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(null);

  // Filters
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedType, setSelectedType] = useState('All Types');
  const [priceFilter, setPriceFilter] = useState('all'); // 'all', 'free', 'paid'
  const [ratingFilter, setRatingFilter] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [sortBy, setSortBy] = useState('distance'); // 'distance', 'rating', 'cleanliness'
  const [showOpenOnly, setShowOpenOnly] = useState(false);

  // Favorites
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('toiletFavorites');
    return saved ? JSON.parse(saved) : [];
  });

  // Reviews state
  const [userReviews, setUserReviews] = useState(() => {
    const saved = localStorage.getItem('toiletReviews');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    getUserLocation();
    // Load initial toilet data
    console.log('Loading toilet data, total:', ALL_TOILETS.length);
    setToilets(ALL_TOILETS);
  }, []);

  useEffect(() => {
    localStorage.setItem('toiletFavorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('toiletReviews', JSON.stringify(userReviews));
  }, [userReviews]);

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
          console.log('Location access denied, using Bangalore as default');
        }
      );
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getDistanceText = (distance) => {
    return distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`;
  };

  // Filtered and sorted toilets
  const filteredToilets = useMemo(() => {
    console.log('Computing filteredToilets, toilets length:', toilets.length);
    let result = [...toilets];

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(t =>
        t.name?.toLowerCase().includes(searchLower) ||
        t.address?.toLowerCase().includes(searchLower) ||
        t.area?.toLowerCase().includes(searchLower) ||
        t.city?.toLowerCase().includes(searchLower)
      );
    }

    // City filter
    if (selectedCity !== 'All Cities') {
      result = result.filter(t => t.city === selectedCity);
    }

    // Type filter
    if (selectedType !== 'All Types') {
      result = result.filter(t => t.type === selectedType);
    }

    // Price filter
    if (priceFilter === 'free') {
      result = result.filter(t => t.price === 'Free' || t.price === '0');
    } else if (priceFilter === 'paid') {
      result = result.filter(t => t.price !== 'Free' && t.price !== '0');
    }

    // Rating filter
    if (ratingFilter > 0) {
      result = result.filter(t => (t.rating || 0) >= ratingFilter);
    }

    // Amenities filter
    if (selectedAmenities.length > 0) {
      result = result.filter(t =>
        selectedAmenities.every(amenity => t.facilities?.includes(amenity))
      );
    }

    // Open only filter
    if (showOpenOnly) {
      result = result.filter(t => t.isOpen);
    }

    // Calculate distances and sort
    if (userLocation) {
      result = result.map(t => ({
        ...t,
        distance: calculateDistance(
          userLocation.lat,
          userLocation.lng,
          t.location.coordinates[1],
          t.location.coordinates[0]
        )
      }));

      if (sortBy === 'distance') {
        result.sort((a, b) => a.distance - b.distance);
      }
    }

    if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'cleanliness') {
      result.sort((a, b) => (b.cleanlinessScore || 0) - (a.cleanlinessScore || 0));
    }

    console.log('Filtered toilets count:', result.length);
    return result;
  }, [toilets, search, selectedCity, selectedType, priceFilter, ratingFilter, selectedAmenities, showOpenOnly, sortBy, userLocation]);

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const toggleFavorite = (toiletId) => {
    if (favorites.includes(toiletId)) {
      setFavorites(prev => prev.filter(id => id !== toiletId));
      toast.info('Removed from favorites');
    } else {
      setFavorites(prev => [...prev, toiletId]);
      toast.success('Added to favorites');
    }
  };

  const handleGetDirections = (toilet) => {
    const destination = `${toilet.location.coordinates[1]},${toilet.location.coordinates[0]}`;
    const origin = userLocation ? `${userLocation.lat},${userLocation.lng}` : '';
    const url = origin
      ? `https://www.google.com/maps/dir/${origin}/${destination}`
      : `https://www.google.com/maps/search/?api=1&query=${destination}`;
    window.open(url, '_blank');
  };

  const handleShare = async (toilet) => {
    const shareData = {
      title: toilet.name,
      text: `Public Toilet: ${toilet.name}\nAddress: ${toilet.address}\nRating: ${toilet.rating}/5`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        copyToClipboard(toilet);
      }
    } else {
      copyToClipboard(toilet);
    }
  };

  const copyToClipboard = (toilet) => {
    const text = `${toilet.name}\n${toilet.address}\nRating: ${toilet.rating}/5\nTimings: ${toilet.timings}`;
    navigator.clipboard.writeText(text);
    toast.success('Details copied to clipboard!');
  };

  const handleReport = (toiletId, reportType, details) => {
    toast.success('Thank you for your report! We will review it shortly.');
    setShowReportModal(null);
  };

  const handleReview = (toiletId, rating, comment) => {
    setUserReviews(prev => ({
      ...prev,
      [toiletId]: { rating, comment, date: new Date().toISOString() }
    }));
    toast.success('Thank you for your review!');
    setShowReviewModal(null);
  };

  const getCrowdLevelColor = (level) => {
    const colors = {
      'low': '#10b981',
      'moderate': '#f59e0b',
      'high': '#f97316',
      'very_high': '#ef4444'
    };
    return colors[level] || '#6b7280';
  };

  const getCrowdLevelText = (level) => {
    const texts = {
      'low': 'Low Crowd',
      'moderate': 'Moderate',
      'high': 'Busy',
      'very_high': 'Very Busy'
    };
    return texts[level] || 'Unknown';
  };

  const getTypeIcon = (type) => {
    const icons = {
      'metro': 'M',
      'railway': 'R',
      'mall': 'S',
      'public': 'P',
      'tourist': 'T',
      'park': 'G',
      'bus_station': 'B',
      'beach': 'W',
      'tech_park': 'IT',
      'shopping': 'S'
    };
    return icons[type] || 'P';
  };

  const toggleAmenity = (amenity) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const clearFilters = () => {
    setSelectedCity('All Cities');
    setSelectedType('All Types');
    setPriceFilter('all');
    setRatingFilter(0);
    setSelectedAmenities([]);
    setShowOpenOnly(false);
    setSortBy('distance');
    setSearch('');
  };

  const activeFiltersCount = [
    selectedCity !== 'All Cities',
    selectedType !== 'All Types',
    priceFilter !== 'all',
    ratingFilter > 0,
    selectedAmenities.length > 0,
    showOpenOnly
  ].filter(Boolean).length;

  // Report Modal Component
  const ReportModal = ({ toilet, onClose }) => {
    const [reportType, setReportType] = useState('');
    const [details, setDetails] = useState('');

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content report-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3><Flag size={20} /> Report Issue</h3>
            <button className="close-btn" onClick={onClose}><X size={20} /></button>
          </div>
          <div className="modal-body">
            <p className="report-toilet-name">{toilet.name}</p>
            <div className="report-options">
              {['Closed/Not Available', 'Dirty/Unclean', 'No Water', 'Broken Facilities', 'Safety Concern', 'Wrong Location', 'Other'].map(option => (
                <label key={option} className={`report-option ${reportType === option ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="reportType"
                    value={option}
                    checked={reportType === option}
                    onChange={(e) => setReportType(e.target.value)}
                  />
                  {option}
                </label>
              ))}
            </div>
            <textarea
              placeholder="Additional details (optional)"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
            />
            <button
              className="submit-report-btn"
              onClick={() => handleReport(toilet._id, reportType, details)}
              disabled={!reportType}
            >
              Submit Report
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Review Modal Component
  const ReviewModal = ({ toilet, onClose }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const existingReview = userReviews[toilet._id];

    useEffect(() => {
      if (existingReview) {
        setRating(existingReview.rating);
        setComment(existingReview.comment);
      }
    }, [existingReview]);

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content review-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3><MessageSquare size={20} /> Write a Review</h3>
            <button className="close-btn" onClick={onClose}><X size={20} /></button>
          </div>
          <div className="modal-body">
            <p className="review-toilet-name">{toilet.name}</p>
            <div className="rating-input">
              <label>Your Rating</label>
              <div className="stars-input">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    size={28}
                    className={`star-btn ${star <= rating ? 'filled' : ''}`}
                    fill={star <= rating ? '#fbbf24' : 'none'}
                    color={star <= rating ? '#fbbf24' : '#d1d5db'}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
            </div>
            <textarea
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
            <button
              className="submit-review-btn"
              onClick={() => handleReview(toilet._id, rating, comment)}
              disabled={rating === 0}
            >
              {existingReview ? 'Update Review' : 'Submit Review'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Toilet Detail Modal
  const ToiletDetailModal = ({ toilet, onClose }) => (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="detail-header-info">
            <h3>{toilet.name}</h3>
            <p>{toilet.area}, {toilet.city}</p>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="detail-stats">
            <div className="detail-stat">
              <Star size={20} fill="#fbbf24" color="#fbbf24" />
              <span className="stat-value">{toilet.rating}</span>
              <span className="stat-label">Rating ({toilet.reviews} reviews)</span>
            </div>
            <div className="detail-stat">
              <Sparkles size={20} color="#10b981" />
              <span className="stat-value">{toilet.cleanlinessScore}</span>
              <span className="stat-label">Cleanliness</span>
            </div>
            <div className="detail-stat">
              <Users size={20} color={getCrowdLevelColor(toilet.crowdLevel)} />
              <span className="stat-value">{getCrowdLevelText(toilet.crowdLevel)}</span>
              <span className="stat-label">Crowd Level</span>
            </div>
          </div>

          <div className="detail-info-grid">
            <div className="detail-info-item">
              <MapPin size={18} />
              <span>{toilet.address}</span>
            </div>
            <div className="detail-info-item">
              <Clock size={18} />
              <span>{toilet.timings}</span>
            </div>
            <div className="detail-info-item">
              <IndianRupee size={18} />
              <span>{toilet.price === 'Free' ? 'Free Entry' : `Rs. ${toilet.price}`}</span>
            </div>
            {toilet.contact && (
              <div className="detail-info-item">
                <Phone size={18} />
                <a href={`tel:${toilet.contact}`}>{toilet.contact}</a>
              </div>
            )}
            <div className="detail-info-item">
              <RefreshCw size={18} />
              <span>Last cleaned: {toilet.lastCleaned}</span>
            </div>
          </div>

          <div className="detail-facilities">
            <h4>Facilities</h4>
            <div className="facilities-grid">
              {toilet.facilities?.map((facility, idx) => (
                <span key={idx} className="facility-chip">
                  <CheckCircle size={14} />
                  {facility}
                </span>
              ))}
            </div>
          </div>

          {userReviews[toilet._id] && (
            <div className="my-review">
              <h4>Your Review</h4>
              <div className="review-content">
                <div className="review-rating">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill={i < userReviews[toilet._id].rating ? '#fbbf24' : 'none'} color={i < userReviews[toilet._id].rating ? '#fbbf24' : '#d1d5db'} />
                  ))}
                </div>
                <p>{userReviews[toilet._id].comment}</p>
              </div>
            </div>
          )}

          <div className="detail-actions">
            <button className="detail-action-btn primary" onClick={() => handleGetDirections(toilet)}>
              <Navigation size={18} />
              Get Directions
            </button>
            <button className="detail-action-btn" onClick={() => handleShare(toilet)}>
              <Share2 size={18} />
              Share
            </button>
            <button className="detail-action-btn" onClick={() => { onClose(); setShowReviewModal(toilet); }}>
              <MessageSquare size={18} />
              Review
            </button>
            <button className="detail-action-btn warning" onClick={() => { onClose(); setShowReportModal(toilet); }}>
              <Flag size={18} />
              Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );

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
            <p>Find clean and accessible public toilets across Karnataka and major metro cities</p>
          </div>
          <div className="header-stats">
            <div className="header-stat">
              <span className="stat-number">{ALL_TOILETS.length}</span>
              <span className="stat-text">Toilets Listed</span>
            </div>
            <div className="header-stat">
              <span className="stat-number">{CITIES.length - 1}</span>
              <span className="stat-text">Cities Covered</span>
            </div>
          </div>
        </div>

        <div className="search-section">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-group">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search by location, area, or toilet name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" className="clear-search" onClick={() => setSearch('')}>
                  <X size={16} />
                </button>
              )}
            </div>
            <button type="submit" className="search-btn">
              <Search size={18} />
              Search
            </button>
            <button
              type="button"
              className="location-btn"
              onClick={getUserLocation}
            >
              <Navigation size={18} />
              Near Me
            </button>
            <button
              type="button"
              className={`filter-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
              Filters
              {activeFiltersCount > 0 && <span className="filter-count">{activeFiltersCount}</span>}
            </button>
          </form>

          {showFilters && (
            <div className="filters-panel">
              <div className="filters-row">
                <div className="filter-group">
                  <label>City</label>
                  <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
                    {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                  </select>
                </div>
                <div className="filter-group">
                  <label>Type</label>
                  <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                    {TOILET_TYPES.map(type => (
                      <option key={type} value={type}>
                        {type === 'All Types' ? type : type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label>Price</label>
                  <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)}>
                    <option value="all">All</option>
                    <option value="free">Free Only</option>
                    <option value="paid">Paid Only</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Min Rating</label>
                  <select value={ratingFilter} onChange={(e) => setRatingFilter(Number(e.target.value))}>
                    <option value={0}>Any Rating</option>
                    <option value={3}>3+ Stars</option>
                    <option value={3.5}>3.5+ Stars</option>
                    <option value={4}>4+ Stars</option>
                    <option value={4.5}>4.5+ Stars</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Sort By</label>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="distance">Distance</option>
                    <option value="rating">Rating</option>
                    <option value="cleanliness">Cleanliness</option>
                  </select>
                </div>
              </div>

              <div className="amenities-filter">
                <label>Amenities</label>
                <div className="amenities-chips">
                  {AMENITIES.map(amenity => (
                    <button
                      key={amenity}
                      type="button"
                      className={`amenity-chip ${selectedAmenities.includes(amenity) ? 'selected' : ''}`}
                      onClick={() => toggleAmenity(amenity)}
                    >
                      {amenity}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-actions">
                <label className="toggle-filter">
                  <input
                    type="checkbox"
                    checked={showOpenOnly}
                    onChange={(e) => setShowOpenOnly(e.target.checked)}
                  />
                  <span>Show open now only</span>
                </label>
                <button type="button" className="clear-filters-btn" onClick={clearFilters}>
                  <X size={16} />
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="finder-content">
          <div className="map-container">
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: '600px', width: '100%', borderRadius: '16px' }}
            >
              <ChangeMapCenter center={mapCenter} />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
              />

              {userLocation && (
                <>
                  <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                    <Popup>
                      <div className="map-popup user-popup">
                        <strong>Your Location</strong>
                      </div>
                    </Popup>
                  </Marker>
                  <Circle
                    center={[userLocation.lat, userLocation.lng]}
                    radius={2000}
                    pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.1 }}
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
                    icon={favorites.includes(toilet._id) ? favoriteIcon : toiletIcon}
                    eventHandlers={{
                      click: () => setSelectedToilet(toilet)
                    }}
                  >
                    <Popup>
                      <div className="map-popup">
                        <div className="popup-header">
                          <h4>{toilet.name}</h4>
                          {toilet.verified && <CheckCircle size={14} color="#10b981" />}
                        </div>
                        <p className="popup-address">{toilet.address}</p>
                        <div className="popup-meta">
                          <span className="popup-rating">
                            <Star size={14} fill="#fbbf24" color="#fbbf24" />
                            {toilet.rating}
                          </span>
                          <span className={`popup-status ${toilet.isOpen ? 'open' : 'closed'}`}>
                            {toilet.isOpen ? 'Open' : 'Closed'}
                          </span>
                          <span className="popup-price">
                            {toilet.price === 'Free' ? 'Free' : `Rs.${toilet.price}`}
                          </span>
                        </div>
                        <button
                          className="popup-directions-btn"
                          onClick={() => handleGetDirections(toilet)}
                        >
                          <Navigation size={14} />
                          Directions
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          </div>

          <div className="toilets-list">
            <div className="list-header">
              <h3>Found {filteredToilets.length} Public Toilets</h3>
              {favorites.length > 0 && (
                <span className="favorites-count">
                  <Heart size={16} fill="#ef4444" color="#ef4444" />
                  {favorites.length} saved
                </span>
              )}
            </div>

            {filteredToilets.length > 0 ? (
              <div className="toilet-cards">
                {console.log('Rendering', filteredToilets.length, 'toilet cards')}
                {filteredToilets.map((toilet, index) => {
                  if (!toilet) {
                    console.warn('Null toilet at index', index);
                    return null;
                  }
                  return (
                  <div key={toilet._id} className={`toilet-card ${favorites.includes(toilet._id) ? 'favorited' : ''}`}>
                    <div className="toilet-header">
                      <div className="toilet-title">
                        <span className="toilet-type-badge" title={toilet.type}>
                          {getTypeIcon(toilet.type)}
                        </span>
                        <div>
                          <h4>{toilet.name}</h4>
                          <span className="toilet-area">{toilet.area}, {toilet.city}</span>
                        </div>
                      </div>
                      <div className="toilet-header-actions">
                        <button
                          className={`favorite-btn ${favorites.includes(toilet._id) ? 'active' : ''}`}
                          onClick={() => toggleFavorite(toilet._id)}
                          title={favorites.includes(toilet._id) ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Heart size={18} fill={favorites.includes(toilet._id) ? '#ef4444' : 'none'} />
                        </button>
                        <div className="rating">
                          <Star size={16} fill="#fbbf24" color="#fbbf24" />
                          <span>{toilet.rating}</span>
                        </div>
                      </div>
                    </div>

                    <div className="toilet-body">
                      <div className="toilet-quick-info">
                        <span className={`status-badge ${toilet.isOpen ? 'open' : 'closed'}`}>
                          {toilet.isOpen ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          {toilet.isOpen ? 'Open Now' : 'Closed'}
                        </span>
                        <span className="price-badge">
                          {toilet.price === 'Free' ? (
                            <><Sparkles size={12} /> Free</>
                          ) : (
                            <><IndianRupee size={12} /> {toilet.price}</>
                          )}
                        </span>
                        <span
                          className="crowd-badge"
                          style={{ backgroundColor: `${getCrowdLevelColor(toilet.crowdLevel)}20`, color: getCrowdLevelColor(toilet.crowdLevel) }}
                        >
                          <Users size={12} />
                          {getCrowdLevelText(toilet.crowdLevel)}
                        </span>
                      </div>

                      <div className="info-item">
                        <MapPin size={16} />
                        <span>{toilet.address}</span>
                      </div>

                      {toilet.distance !== undefined && (
                        <div className="info-item distance">
                          <Navigation size={16} />
                          <span>{getDistanceText(toilet.distance)} away</span>
                        </div>
                      )}

                      <div className="info-item">
                        <Clock size={16} />
                        <span>{toilet.timings}</span>
                      </div>

                      <div className="cleanliness-bar">
                        <span className="cleanliness-label">
                          <Sparkles size={14} />
                          Cleanliness
                        </span>
                        <div className="bar-container">
                          <div
                            className="bar-fill"
                            style={{ width: `${(toilet.cleanlinessScore / 5) * 100}%` }}
                          />
                        </div>
                        <span className="cleanliness-score">{toilet.cleanlinessScore}/5</span>
                      </div>

                      {toilet.facilities && toilet.facilities.length > 0 && (
                        <div className="facilities">
                          {toilet.facilities.slice(0, 4).map((facility, idx) => (
                            <span key={idx} className="facility-tag">
                              <CheckCircle size={12} />
                              {facility}
                            </span>
                          ))}
                          {toilet.facilities.length > 4 && (
                            <span className="more-facilities">+{toilet.facilities.length - 4}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="toilet-footer">
                      <button className="directions-btn" onClick={() => handleGetDirections(toilet)}>
                        <Navigation size={16} />
                        Directions
                      </button>
                      <button className="action-btn" onClick={() => handleShare(toilet)} title="Share">
                        <Share2 size={16} />
                      </button>
                      <button className="action-btn" onClick={() => setShowReviewModal(toilet)} title="Review">
                        <MessageSquare size={16} />
                      </button>
                      <button className="action-btn details" onClick={() => setSelectedToilet(toilet)} title="Details">
                        <Info size={16} />
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-results">
                <AlertCircle size={48} />
                <h4>No toilets found</h4>
                <p>Try adjusting your search or filters</p>
                <button className="clear-filters-btn" onClick={clearFilters}>
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedToilet && (
        <ToiletDetailModal
          toilet={selectedToilet}
          onClose={() => setSelectedToilet(null)}
        />
      )}

      {showReportModal && (
        <ReportModal
          toilet={showReportModal}
          onClose={() => setShowReportModal(null)}
        />
      )}

      {showReviewModal && (
        <ReviewModal
          toilet={showReviewModal}
          onClose={() => setShowReviewModal(null)}
        />
      )}
    </div>
  );
};

export default ToiletFinder;
