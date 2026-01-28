
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Delivery, DeliveryStatus } from '../types';

declare const L: any;

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

interface CourierDashboardProps {
  allDeliveries: Delivery[];
  currentUserId: string | number;
  onUpdateStatus: (id: string | number, status: string, courierId?: string | number) => void;
  onRefuseDelivery: (deliveryId: string | number, courierId: string | number) => void;
  onSendMessage: (deliveryId: string | number, text: string) => void;
}

const OrderDistanceCard: React.FC<{ 
  order: Delivery, 
  userLoc: [number, number] | null,
  onAccept: (id: string | number) => void,
  onRefuse: (id: string | number) => void
}> = ({ order, userLoc, onAccept, onRefuse }) => {
  const [info, setInfo] = useState<{ toPickup: string, deliveryTrip: string } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const cardMapRef = useRef<any>(null);

  useEffect(() => {
    const calc = async () => {
      // Usamos coordenadas padrão se não houver no pedido
      const pCoords = order.pickupCoords || [-23.5505, -46.6333];
      const dCoords = order.deliveryCoords || [-23.5555, -46.6383];

      if (!userLoc) return;
      try {
        const r1 = await fetch(`https://router.project-osrm.org/route/v1/driving/${userLoc[1]},${userLoc[0]};${pCoords[1]},${pCoords[0]}`);
        const d1 = await r1.json();
        const r2 = await fetch(`https://router.project-osrm.org/route/v1/driving/${pCoords[1]},${pCoords[0]};${dCoords[1]},${dCoords[0]}`);
        const d2 = await r2.json();

        setInfo({
          toPickup: d1.routes && d1.routes.length > 0 ? (d1.routes[0].distance / 1000).toFixed(1) + ' km' : '?',
          deliveryTrip: d2.routes && d2.routes.length > 0 ? (d2.routes[0].distance / 1000).toFixed(1) + ' km' : '?'
        });
      } catch (e) { console.error("OSRM Error:", e); }
    };
    calc();
  }, [order, userLoc]);

  useEffect(() => {
    const pCoords = order.pickupCoords || [-23.5505, -46.6333];
    const dCoords = order.deliveryCoords || [-23.5555, -46.6383];

    if (mapContainerRef.current && !cardMapRef.current && typeof L !== 'undefined') {
      cardMapRef.current = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(cardMapRef.current);
      const iconA = L.divIcon({ className: 'marker-point', iconSize: [10, 10], html: '<div style="background:#0284C7; width:100%; height:100%; border-radius:50%; border:2px solid white;"></div>' });
      const iconB = L.divIcon({ className: 'marker-point', iconSize: [10, 10], html: '<div style="background:#10B981; width:100%; height:100%; border-radius:50%; border:2px solid white;"></div>' });
      L.marker(pCoords, { icon: iconA }).addTo(cardMapRef.current);
      L.marker(dCoords, { icon: iconB }).addTo(cardMapRef.current);
      
      fetch(`https://router.project-osrm.org/route/v1/driving/${pCoords[1]},${pCoords[0]};${dCoords[1]},${dCoords[0]}?overview=full&geometries=geojson`)
        .then(res => res.json()).then(data => {
          if (data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
            const polyline = L.polyline(coords, { color: '#0284C7', weight: 4, opacity: 0.5 }).addTo(cardMapRef.current);
            cardMapRef.current.fitBounds(polyline.getBounds(), { padding: [15, 15] });
          }
        });
    }
    return () => { if (cardMapRef.current) { cardMapRef.current.remove(); cardMapRef.current = null; } };
  }, [order]);

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm animate-fadeIn overflow-hidden flex flex-col">
      <div ref={mapContainerRef} className="h-36 w-full bg-slate-50 border-b border-slate-50"></div>
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="text-[10px] font-black text-sky-600 uppercase mb-1 tracking-tighter">{order.restaurantName || 'Restaurante'}</p>
            <div className="flex items-baseline gap-2">
               <h4 className="text-3xl font-black text-emerald-600 leading-none">R$ {(order.price || 12).toFixed(2)}</h4>
               <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">TELE</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
               <div className="px-3 py-1 bg-slate-100 rounded-full">
                 <p className="text-[9px] font-bold text-slate-500 uppercase">Mercadoria: R$ {(order.orderValue || 0).toFixed(2)}</p>
               </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onRefuse(order.id)} className="p-4 bg-slate-50 text-slate-400 rounded-2xl active:scale-95 transition-all">✕</button>
            <button onClick={() => onAccept(order.id)} className="px-6 py-4 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase shadow-lg active:scale-95 transition-all">ACEITAR</button>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 flex flex-col gap-1 bg-sky-50 px-4 py-3 rounded-2xl">
            <p className="text-[8px] font-black text-sky-400 uppercase tracking-widest">Até a Loja</p>
            <p className="text-[11px] font-black text-sky-700 uppercase">{info ? info.toPickup : '...'}</p>
          </div>
          <div className="flex-1 flex flex-col gap-1 bg-slate-50 px-4 py-3 rounded-2xl">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">KM da Tele</p>
            <p className="text-[11px] font-black text-slate-700 uppercase">{info ? info.deliveryTrip : '...'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CourierDashboard: React.FC<CourierDashboardProps> = ({ allDeliveries, currentUserId, onUpdateStatus, onRefuseDelivery, onSendMessage }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  
  const mapRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const pickupMarkerRef = useRef<any>(null);
  const deliveryMarkerRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const availableOrdersSorted = useMemo(() => {
    const pendings = allDeliveries.filter(d => (d.status === 'SEARCHING' || d.status === DeliveryStatus.PENDING) && !(d.refusedBy || []).includes(currentUserId));
    if (!userLocation) return pendings;
    return pendings.sort((a, b) => {
      const pA = a.pickupCoords || [-23.5505, -46.6333];
      const pB = b.pickupCoords || [-23.5505, -46.6333];
      const distA = calculateDistance(userLocation[0], userLocation[1], pA[0], pA[1]);
      const distB = calculateDistance(userLocation[0], userLocation[1], pB[0], pB[1]);
      return distA - distB;
    });
  }, [allDeliveries, currentUserId, userLocation]);

  const currentActive = allDeliveries.find(d => d.courierId === currentUserId && (d.status === 'ASSIGNED' || d.status === DeliveryStatus.ACCEPTED || d.status === DeliveryStatus.PICKED_UP));

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newLoc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(newLoc);
        if (mapRef.current) {
          if (!userMarkerRef.current && typeof L !== 'undefined') {
            userMarkerRef.current = L.marker(newLoc, { icon: L.divIcon({ className: 'marker-courier', iconSize: [24, 24], iconAnchor: [12, 12] }), zIndexOffset: 1000 }).addTo(mapRef.current);
          } else if (userMarkerRef.current) userMarkerRef.current.setLatLng(newLoc);
          if (!currentActive) mapRef.current.panTo(newLoc);
        }
      },
      () => console.error("GPS error"),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [currentActive]);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current && typeof L !== 'undefined') {
      mapRef.current = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView([-23.5505, -46.6333], 15);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(mapRef.current);
    }
  }, []);

  useEffect(() => {
    const drawRoute = async () => {
      if (!mapRef.current || typeof L === 'undefined' || !currentActive || !userLocation) {
        if (routeLayerRef.current) mapRef.current.removeLayer(routeLayerRef.current);
        if (pickupMarkerRef.current) mapRef.current.removeLayer(pickupMarkerRef.current);
        if (deliveryMarkerRef.current) mapRef.current.removeLayer(deliveryMarkerRef.current);
        return;
      }
      try {
        const p = currentActive.pickupCoords || [-23.5505, -46.6333];
        const d = currentActive.deliveryCoords || [-23.5555, -46.6383];

        if (pickupMarkerRef.current) mapRef.current.removeLayer(pickupMarkerRef.current);
        if (deliveryMarkerRef.current) mapRef.current.removeLayer(deliveryMarkerRef.current);
        
        const iconA = L.divIcon({ className: 'marker-point', iconSize: [16, 16], html: '<div style="background:#0284C7; width:100%; height:100%; border-radius:50%; border:3px solid white;"></div>' });
        const iconB = L.divIcon({ className: 'marker-point', iconSize: [16, 16], html: '<div style="background:#10B981; width:100%; height:100%; border-radius:50%; border:3px solid white;"></div>' });
        pickupMarkerRef.current = L.marker(p, { icon: iconA }).addTo(mapRef.current);
        deliveryMarkerRef.current = L.marker(d, { icon: iconB }).addTo(mapRef.current);
        
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${userLocation[1]},${userLocation[0]};${p[1]},${p[0]};${d[1]},${d[0]}?overview=full&geometries=geojson`);
        const data = await res.json();
        if (data.routes?.length > 0) {
          if (routeLayerRef.current) mapRef.current.removeLayer(routeLayerRef.current);
          const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
          routeLayerRef.current = L.polyline(coords, { color: '#0284C7', weight: 6, opacity: 0.7 }).addTo(mapRef.current);
          mapRef.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [60, 60] });
        }
      } catch (e) { console.error("Draw route error:", e); }
    };
    drawRoute();
  }, [currentActive, userLocation]);

  return (
    <div className="relative h-[calc(100vh-64px)] overflow-hidden bg-slate-100 flex flex-col">
      <div ref={mapContainerRef} className="absolute inset-0 z-0"></div>
      <div className="relative z-10 p-4">
        <div className="flex justify-between items-center bg-white/90 backdrop-blur-md px-5 py-4 rounded-[2rem] shadow-xl border border-white/50">
          <div><p className="text-[9px] font-black uppercase text-sky-600 tracking-widest mb-0.5">Saldo do Dia</p><h3 className="text-xl font-black text-slate-900 leading-none">R$ {allDeliveries.filter(d => d.courierId === currentUserId && d.status === DeliveryStatus.DELIVERED).reduce((a, b) => a + (b.price || 0), 0).toFixed(2)}</h3></div>
          <button onClick={() => setIsOnline(!isOnline)} className={`px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase shadow-lg transition-all ${isOnline ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'}`}>{isOnline ? 'CONECTADO' : 'OFFLINE'}</button>
        </div>
      </div>
      <div className={`mt-auto relative z-10 bg-white/95 backdrop-blur-2xl rounded-t-[3rem] shadow-2xl transition-all duration-500 ${isSheetExpanded ? 'h-[85%]' : (currentActive ? 'h-[500px]' : 'h-[180px]')}`}>
        <div onClick={() => setIsSheetExpanded(!isSheetExpanded)} className="w-full py-5 flex flex-col items-center cursor-pointer"><div className="w-14 h-1.5 bg-slate-200 rounded-full mb-3"></div><span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{currentActive ? 'ENTREGA EM CURSO' : 'CHAMADAS DISPONÍVEIS'}</span></div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 pt-2 space-y-4">
          {isOnline && !currentActive && availableOrdersSorted.map(order => (
            <OrderDistanceCard key={order.id} order={order} userLoc={userLocation} onAccept={(id) => onUpdateStatus(id, DeliveryStatus.ACCEPTED, currentUserId)} onRefuse={(id) => onRefuseDelivery(id, currentUserId)} />
          ))}
          {currentActive && (
            <div className="space-y-4 animate-slideUp">
              <div className="bg-sky-600 p-8 rounded-[3rem] text-white space-y-6 shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[9px] font-black uppercase text-sky-100 mb-1">{currentActive.status === 'ASSIGNED' || currentActive.status === DeliveryStatus.ACCEPTED ? 'Ir para Coleta' : 'Ir para Entrega'}</p>
                    <h4 className="text-2xl font-black leading-tight">{currentActive.status === 'ASSIGNED' || currentActive.status === DeliveryStatus.ACCEPTED ? currentActive.restaurantName || 'Restaurante' : currentActive.customerName || 'Cliente'}</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black leading-none">R$ {(currentActive.price || 12).toFixed(2)}</p>
                    <p className="text-[8px] font-black uppercase text-sky-100 mt-1 tracking-widest">SUA TELE</p>
                  </div>
                </div>
                <div className="bg-white/10 p-5 rounded-[2rem] border border-white/20 space-y-3">
                  <div className="flex items-start gap-3"><span className="text-lg">{currentActive.status === 'ASSIGNED' || currentActive.status === DeliveryStatus.ACCEPTED ? '🛒' : '🏠'}</span><p className="text-xs font-bold leading-tight line-clamp-2">{currentActive.status === 'ASSIGNED' || currentActive.status === DeliveryStatus.ACCEPTED ? currentActive.pickupAddress : currentActive.deliveryAddress}</p></div>
                </div>
                {currentActive.status === DeliveryStatus.PICKED_UP && (
                  <div className="bg-emerald-500 p-4 rounded-2xl border border-emerald-400 flex justify-between items-center text-white">
                    <p className="text-[9px] font-black uppercase">Receber do Cliente:</p>
                    <p className="text-lg font-black">R$ {(currentActive.orderValue || 0).toFixed(2)}</p>
                  </div>
                )}
                <button onClick={() => onUpdateStatus(currentActive.id, currentActive.status === 'ASSIGNED' || currentActive.status === DeliveryStatus.ACCEPTED ? DeliveryStatus.PICKED_UP : DeliveryStatus.DELIVERED)} className="w-full bg-white text-sky-600 font-black py-6 rounded-[2.5rem] text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all">
                  {currentActive.status === 'ASSIGNED' || currentActive.status === DeliveryStatus.ACCEPTED ? 'MARCAR COMO COLETADO' : 'FINALIZAR ENTREGA'}
                </button>
              </div>
            </div>
          )}
          {isOnline && !currentActive && availableOrdersSorted.length === 0 && (
             <div className="py-20 text-center">
                <div className="text-4xl mb-4 opacity-30">🔍</div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">Aguardando novas chamadas<br/>Seja paciente, a próxima tele já vem!</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
