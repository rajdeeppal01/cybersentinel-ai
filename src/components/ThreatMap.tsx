import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { NetworkLog } from './LiveSiemStream';

// Fix Leaflet's default icon issue with React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom animated pulse icon for critical threats
const createPulseIcon = (severity: string) => {
  const color = severity === 'CRITICAL' ? 'var(--neon-red)' : 
                severity === 'HIGH' ? 'var(--neon-orange)' : 
                severity === 'MEDIUM' ? 'var(--neon-yellow)' : 'var(--neon-blue)';
                
  return L.divIcon({
    className: 'custom-pulse-icon',
    html: `<div style="
      width: 15px; 
      height: 15px; 
      background-color: ${color}; 
      border-radius: 50%;
      box-shadow: 0 0 10px ${color}, 0 0 20px ${color};
      border: 2px solid white;
    "></div>`,
    iconSize: [15, 15],
    iconAnchor: [7.5, 7.5]
  });
};

// Component to dynamically re-center map if needed
const MapController = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom());
  }, [center, map]);
  return null;
};

export const ThreatMap: React.FC = () => {
  const [logs, setLogs] = useState<NetworkLog[]>([]);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = process.env.NODE_ENV === 'production' 
      ? `${protocol}//${window.location.host}/siem`
      : 'ws://localhost:4000/siem';
      
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'SIEM_LOG') {
          setLogs(prev => {
            const newLogs = [...prev, message.data];
            if (newLogs.length > 20) newLogs.shift();
            return newLogs;
          });
        }
      } catch (err) {
        console.error('Failed to parse SIEM WS message in ThreatMap', err);
      }
    };
    return () => {
      ws.close();
    };
  }, []);

  const geoLogs = logs.filter(log => log.lat !== undefined && log.lng !== undefined).slice(-10);

  return (
    <div className="threat-map-container" style={{
      height: '100%',
      width: '100%',
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid var(--border-color)',
      position: 'relative'
    }}>
      {/* HUD Overlay */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 1000,
        backgroundColor: 'rgba(10, 10, 15, 0.8)',
        border: '1px solid var(--neon-blue)',
        padding: '10px',
        borderRadius: '4px',
        pointerEvents: 'none'
      }}>
        <h3 className="cyber-font" style={{ color: 'var(--neon-blue)', fontSize: '0.9rem', margin: 0 }}>GLOBAL THREAT SENSOR</h3>
        <p className="mono-font" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '5px 0 0 0' }}>
          ACTIVE VECTORS: {geoLogs.length}
        </p>
      </div>

      <MapContainer 
        center={[20, 0]} 
        zoom={2} 
        style={{ height: '100%', width: '100%', backgroundColor: '#0a0a0f' }}
        attributionControl={false}
      >
        {/* Dark theme tiles to match the cyberpunk aesthetic */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {geoLogs.map((log) => (
          <Marker 
            key={log.id} 
            position={[log.lat!, log.lng!]} 
            icon={createPulseIcon(log.severity)}
          >
            <Popup className="cyber-popup">
              <div style={{ padding: '5px' }}>
                <strong style={{ color: 'var(--neon-red)', display: 'block', marginBottom: '5px' }}>{log.event}</strong>
                <span className="mono-font" style={{ fontSize: '0.8rem', color: '#ccc' }}>Source: {log.source}</span><br />
                <span className="mono-font" style={{ fontSize: '0.7rem', color: '#888' }}>{log.details}</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Inject custom CSS for the popup to match theme */}
      <style>{`
        .cyber-popup .leaflet-popup-content-wrapper {
          background-color: #0a0a0f;
          border: 1px solid var(--neon-red);
          color: white;
          border-radius: 4px;
        }
        .cyber-popup .leaflet-popup-tip {
          background-color: #0a0a0f;
          border: 1px solid var(--neon-red);
        }
      `}</style>
    </div>
  );
};
