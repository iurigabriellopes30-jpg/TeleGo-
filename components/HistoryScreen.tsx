
import React, { useState, useEffect, useRef } from 'react';
import { Delivery, UserRole, DeliveryStatus } from '../types';

declare const L: any;

interface HistoryScreenProps {
  role: UserRole;
  deliveries: Delivery[];
  currentUserId: string;
}

const HistoryDetailModal: React.FC<{ 
  delivery: Delivery, 
  onClose: () => void,
  role: UserRole
}> = ({ delivery, onClose, role }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [mapLoading, setMapLoading] = useState(true);

  const geocode = async (addr: string): Promise<[number, number] | null> => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    } catch (e) { console.error(e); }
    return null;
  };

  useEffect(() => {
    const initMap = async () => {
      if (!mapContainerRef.current || typeof L === 'undefined') return;

      try {
        mapRef.current = L.map(mapContainerRef.current, {
          zoomControl: false, attributionControl: false, dragging: true
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(mapRef.current);

        const p = await geocode(delivery.pickupAddress);
        const d = await geocode(delivery.deliveryAddress);

        if (p && d) {
          const iconA = L.divIcon({ className: 'marker-point', iconSize: [16, 16], html: '<div style="background:#4F46E5; width:100%; height:100%; border-radius:50%; border:3px solid white; box-shadow:0 0 10px rgba(0,0,0,0.1);"></div>' });
          const iconB = L.divIcon({ className: 'marker-point', iconSize: [16, 16], html: '<div style="background:#10B981; width:100%; height:100%; border-radius:50%; border:3px solid white; box-shadow:0 0 10px rgba(0,0,0,0.1);"></div>' });

          L.marker(p, { icon: iconA }).addTo(mapRef.current);
          L.marker(d, { icon: iconB }).addTo(mapRef.current);

          const osrmRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${p[1]},${p[0]};${d[1]},${d[0]}?overview=full&geometries=geojson`);
          const routeData = await osrmRes.json();
          
          if (routeData.routes && routeData.routes.length > 0) {
            const coords = routeData.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
            L.polyline(coords, { color: '#4F46E5', weight: 4, opacity: 0.6, lineJoin: 'round' }).addTo(mapRef.current);
            mapRef.current.fitBounds(L.polyline(coords).getBounds(), { padding: [40, 40] });
          } else {
            mapRef.current.setView(p, 14);
          }
        } else {
          mapRef.current.setView([-23.5505, -46.6333], 12);
        }
      } catch (err) { console.error("History map error:", err); }
      setMapLoading(false);
    };

    initMap();
    return () => { if (mapRef.current) mapRef.current.remove(); };
  }, [delivery]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-md flex items-end justify-center animate-fadeIn">
      <div className="bg-white w-full max-w-[500px] h-[92vh] rounded-t-[3.5rem] shadow-2xl flex flex-col animate-slideUp overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-100">🏁</div>
            <div>
              <h3 className="font-black text-slate-800 leading-none">Resumo da Tele</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {delivery.id.split('_')[1]}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 active:scale-90 transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="relative h-56 w-full bg-slate-50">
            <div ref={mapContainerRef} className="h-full w-full"></div>
            {mapLoading && <div className="absolute inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>}
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-indigo-50/50 p-5 rounded-[2rem] border border-indigo-100/50 shadow-sm">
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Ganhos</p>
                <p className="text-2xl font-black text-indigo-600">R$ {delivery.price.toFixed(2)}</p>
              </div>
              <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100/50 shadow-sm">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Carga</p>
                <p className="text-2xl font-black text-slate-800">R$ {delivery.orderValue.toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-6">
               <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-indigo-600 border-2 border-white shadow-md"></div>
                    <div className="w-0.5 flex-1 bg-slate-100 my-1"></div>
                    <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-md"></div>
                  </div>
                  <div className="flex-1 space-y-6">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{delivery.restaurantName}</p>
                      <p className="text-sm font-bold text-slate-800 leading-tight">{delivery.pickupAddress}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cliente: {delivery.customerName}</p>
                      <p className="text-sm font-bold text-slate-800 leading-tight">{delivery.deliveryAddress}</p>
                    </div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-slate-50 pt-8">
               <div className="text-center">
                  <p className="text-[8px] font-black text-slate-300 uppercase">Data</p>
                  <p className="text-[10px] font-bold text-slate-600">{new Date(delivery.createdAt).toLocaleDateString()}</p>
               </div>
               <div className="text-center">
                  <p className="text-[8px] font-black text-slate-300 uppercase">Hora</p>
                  <p className="text-[10px] font-bold text-slate-600">{new Date(delivery.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
               </div>
               <div className="text-center">
                  <p className="text-[8px] font-black text-slate-300 uppercase">Status</p>
                  <p className="text-[10px] font-black text-emerald-500 uppercase">Sucesso</p>
               </div>
            </div>

            {delivery.observations && (
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Anotações do Pedido</p>
                <p className="text-xs font-bold text-slate-600 leading-relaxed italic opacity-80">"{delivery.observations}"</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 bg-white border-t border-slate-50 shrink-0">
          <button onClick={onClose} className="w-full gradient-primary text-white font-black py-5 rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-indigo-100">Fechar Histórico</button>
        </div>
      </div>
    </div>
  );
};

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ role, deliveries, currentUserId }) => {
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  const historyItems = role === UserRole.RESTAURANT
    ? deliveries.filter(d => d.restaurantId === currentUserId && d.status === DeliveryStatus.DELIVERED)
    : deliveries.filter(d => d.courierId === currentUserId && d.status === DeliveryStatus.DELIVERED);

  return (
    <div className="px-6 py-8 space-y-6 animate-fadeIn pb-24">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Meus Registros</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Histórico Completo de Teles</p>
        </div>
        <div className="text-right">
           <p className="text-xl font-black text-indigo-600 leading-none">{historyItems.length}</p>
           <p className="text-[8px] font-black text-slate-300 uppercase mt-1">Entregas</p>
        </div>
      </header>

      <div className="space-y-4">
        {historyItems.length === 0 ? (
          <div className="text-center py-24 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Aguardando sua primeira entrega</p>
          </div>
        ) : (
          historyItems.map((item) => (
            <div key={item.id} onClick={() => setSelectedDelivery(item)} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50 flex items-center justify-between active:scale-95 transition-all cursor-pointer hover:border-indigo-100">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-[1.5rem] bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shadow-inner">🏍️</div>
                <div>
                  <h4 className="font-black text-slate-900 leading-tight">{item.customerName}</h4>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    {new Date(item.createdAt).toLocaleDateString()} • {role === UserRole.COURIER ? item.restaurantName : 'Motoboy'}
                  </p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <p className="font-black text-indigo-600 text-sm">R$ {item.price.toFixed(2)}</p>
                <div className="flex items-center gap-1 mt-1">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                   <p className="text-[8px] font-black text-slate-300 uppercase">VISTO</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedDelivery && <HistoryDetailModal delivery={selectedDelivery} onClose={() => setSelectedDelivery(null)} role={role} />}
    </div>
  );
};
