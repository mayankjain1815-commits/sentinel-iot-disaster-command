import { useState } from 'react';
import { Navigation, MapPin, AlertTriangle } from 'lucide-react';

export function EvacuationPanel() {
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);

  const getEvacuationRoute = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`/api/evacuation/emergency-directions?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
          const data = await res.json();
          if (data.ok) setRoute(data.data);
        } catch (e) {
          console.error(e);
        }
        setLoading(false);
      },
      () => { alert('Location required for evacuation route'); setLoading(false); }
    );
  };

  return (
    <div className="evacuation-panel" style={{ background: 'linear-gradient(135deg, rgba(234,170,0,0.2), rgba(58,15,52,0.5))', padding: '1.5rem', borderRadius: '12px', border: '2px solid #EAAA00' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#EAAA00', margin: '0 0 1rem 0' }}>
        <AlertTriangle size={24} /> EVACUATION - SAFEST ROUTE
      </h3>
      <button onClick={getEvacuationRoute} disabled={loading} style={{ width: '100%', padding: '0.75rem', background: '#EAAA00', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
        {loading ? 'FINDING SAFEST ROUTE...' : 'GET SAFEST EVACUATION ROUTE'}
      </button>
      
      {route && (
        <div style={{ marginTop: '1rem' }}>
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={16} /> To: {route.safestShelter.name}</p>
          <p>ETA: {route.estimatedTime}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
            <a href={route.directions.googleMaps} target="_blank" rel="noopener" style={{ padding: '0.5rem', background: '#4285F4', color: 'white', textDecoration: 'none', textAlign: 'center', borderRadius: '6px' }}>
              <Navigation size={14} /> Open in Google Maps
            </a>
            <a href={route.directions.appleMaps} target="_blank" rel="noopener" style={{ padding: '0.5rem', background: '#000', color: 'white', textDecoration: 'none', textAlign: 'center', borderRadius: '6px' }}>
              <Navigation size={14} /> Open in Apple Maps
            </a>
            <a href={route.directions.waze} target="_blank" rel="noopener" style={{ padding: '0.5rem', background: '#33CCFF', color: 'white', textDecoration: 'none', textAlign: 'center', borderRadius: '6px' }}>
              <Navigation size={14} /> Open in Waze
            </a>
          </div>
          <ul style={{ marginTop: '0.75rem', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
            {route.instructions.map((i, idx) => <li key={idx}>{i}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
