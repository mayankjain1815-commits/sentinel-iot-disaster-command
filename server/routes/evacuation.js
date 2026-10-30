import express from 'express';
import { ShelterService } from '../shelters/service.js';

const router = express.Router();
const shelterService = new ShelterService();

router.get('/safe-route', (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ ok: false, error: 'lat and lon required' });
  }
  
  const shelters = shelterService.findNearest(lat, lon);
  const safest = shelters[0] || { id: 'SH-DEF', name: 'Nearest Designated Shelter', lat: lat + 0.01, lon: lon + 0.01, distanceKm: 0.5 };
  
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${safest.lat},${safest.lon}&travelmode=driving`;
  const appleMapsUrl = `http://maps.apple.com/?daddr=${safest.lat},${safest.lon}&dirflg=d`;
  
  const route = shelterService.getRoute(lat, lon, safest);
  
  res.json({ 
    ok: true, 
    data: { 
      currentLocation: { lat, lon },
      safestShelter: safest,
      route,
      directions: {
        googleMaps: googleMapsUrl,
        appleMaps: appleMapsUrl,
        waze: `https://waze.com/ul?ll=${safest.lat},${safest.lon}&navigate=yes`
      }
    } 
  });
});

router.get('/evacuation-zones', (req, res) => {
  res.json({
    ok: true,
    data: [
      { id: 'EZ-1', name: 'Godavari Lowlands', risk: 'severe', evacuationRequired: true, shelters: ['SH-001'] },
      { id: 'EZ-2', name: 'Panchavati Ridge', risk: 'high', evacuationRequired: true, shelters: ['SH-001', 'SH-002'] },
      { id: 'EZ-3', name: 'Darna Spillway', risk: 'moderate', evacuationRequired: false, shelters: ['SH-003'] }
    ]
  });
});

export default router;
