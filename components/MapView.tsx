
import React, { useEffect, useRef } from 'react';
import { LogEntry, AttendanceStatus } from '../types';
import { WORK_SITE_LOCATION } from '../constants';

interface MapViewProps {
  logs: LogEntry[];
  highlightLogId?: string | null;
}

const MapView: React.FC<MapViewProps> = ({ logs, highlightLogId }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    if (mapRef.current && !leafletMap.current) {
      const L = (window as any).L;
      if (!L) return;

      leafletMap.current = L.map(mapRef.current).setView([WORK_SITE_LOCATION.lat, WORK_SITE_LOCATION.lng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(leafletMap.current);

      // Add Work Site Area
      L.circle([WORK_SITE_LOCATION.lat, WORK_SITE_LOCATION.lng], {
        color: '#1e3a8a',
        fillColor: '#1e3a8a',
        fillOpacity: 0.1,
        radius: 500
      }).addTo(leafletMap.current).bindPopup('موقع العمل الرئيسي');
    }

    if (leafletMap.current) {
        const L = (window as any).L;
        
        // Remove existing markers to refresh
        Object.values(markersRef.current).forEach(m => leafletMap.current.removeLayer(m));
        markersRef.current = {};

        logs.forEach(log => {
          const isHighlighted = highlightLogId === log.id;
          const markerColor = log.status === AttendanceStatus.OUT_OF_BOUNDS ? '#ef4444' : '#3b82f6';
          
          const markerIcon = L.divIcon({
            html: `
              <div style="position: relative; width: 30px; height: 30px;">
                <img src="${log.photo}" style="width: 30px; height: 30px; border-radius: 8px; border: 2px solid ${isHighlighted ? '#f59e0b' : 'white'}; object-cover; shadow: 0 4px 6px rgba(0,0,0,0.1); transition: all 0.3s;" />
                <div style="position: absolute; -bottom: 2px; -right: 2px; width: 10px; height: 10px; background: ${markerColor}; border-radius: 50%; border: 1.5px solid white;"></div>
                ${isHighlighted ? '<div style="position: absolute; top: -10px; left: -10px; width: 50px; height: 50px; border: 2px solid #f59e0b; border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>' : ''}
              </div>
            `,
            className: 'custom-div-icon',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });

          const marker = L.marker([log.location.lat, log.location.lng], { icon: markerIcon })
            .addTo(leafletMap.current)
            .bindPopup(`
              <div class="text-right flex flex-col items-center gap-2 p-1" dir="rtl">
                <img src="${log.photo}" class="w-20 h-20 rounded-xl object-cover shadow-sm" />
                <div class="font-bold text-slate-800 text-xs">${log.name}</div>
                <div class="text-[10px] px-2 py-0.5 bg-slate-100 rounded-full font-bold">${log.type === 'IN' ? 'تسجيل دخول' : 'تسجيل خروج'}</div>
                <div class="text-[9px] font-bold text-slate-400 uppercase">${log.timestamp}</div>
                <div class="text-[10px] font-bold ${log.status === AttendanceStatus.OUT_OF_BOUNDS ? 'text-red-500' : 'text-emerald-500'}">${log.status}</div>
              </div>
            `);
          
          markersRef.current[log.id] = marker;

          if (isHighlighted) {
            leafletMap.current.setView([log.location.lat, log.location.lng], 18, { animate: true });
            marker.openPopup();
          }
        });
    }
  }, [logs, highlightLogId]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-inner border border-slate-100">
      <div ref={mapRef} className="w-full h-full" />
      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default MapView;
