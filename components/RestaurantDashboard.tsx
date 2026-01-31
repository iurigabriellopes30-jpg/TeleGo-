
import React, { useState, useEffect, useRef } from 'react';
import { Delivery, DeliveryStatus } from '../types';

declare const L: any;

interface RestaurantDashboardProps {
  deliveries: Delivery[];
  onAddDelivery: (delivery: { 
    customerName: string, 
    pickupAddress: string, 
    pickupCoords?: [number, number],
    deliveryAddress: string, 
    deliveryCoords?: [number, number],
    price: number, 
    orderValue: number, 
    observations?: string 
  }) => void;
  onCancelDelivery: (orderId: string | number) => void;
  userName: string;
  currentUserId: string | number;
  onSendMessage: (deliveryId: string | number, text: string) => void;
}

const CAXIAS_BOX = "-51.3500,-29.3500,-50.9500,-28.9500"; 

const RoutePreview: React.FC<{ pickup: [number, number] | undefined, delivery: [number, number] | undefined, onDistanceCalc: (km: number) => void }> = ({ pickup, delivery, onDistanceCalc }) => {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const routeLayerRef = useRef<any>(null);

  useEffect(() => {
    if (containerRef.current && !mapRef.current && typeof L !== 'undefined') {
      mapRef.current = L.map(containerRef.current, { zoomControl: false, attributionControl: false }).setView([-29.16, -51.17], 13);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(mapRef.current);
    }
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !pickup || !delivery) return;

    const draw = async () => {
      if (routeLayerRef.current) mapRef.current.removeLayer(routeLayerRef.current);
      
      try {
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${pickup[1]},${pickup[0]};${delivery[1]},${delivery[0]}?overview=full&geometries=geojson`);
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const distance = data.routes[0].distance / 1000;
          onDistanceCalc(distance);
          const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
          routeLayerRef.current = L.polyline(coords, { color: '#8ecbff', weight: 6, opacity: 0.8 }).addTo(mapRef.current);
          mapRef.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [30, 30] });
          
          const iconA = L.divIcon({ className: 'marker-point', iconSize: [12, 12], html: '<div style="background:#0284C7; width:100%; height:100%; border-radius:50%; border:2px solid white;"></div>' });
          const iconB = L.divIcon({ className: 'marker-point', iconSize: [12, 12], html: '<div style="background:#10B981; width:100%; height:100%; border-radius:50%; border:2px solid white;"></div>' });
          L.marker(pickup, { icon: iconA }).addTo(mapRef.current);
          L.marker(delivery, { icon: iconB }).addTo(mapRef.current);
        }
      } catch (e) { console.error("OSRM Form Error:", e); }
    };
    draw();
  }, [pickup, delivery]);

  return <div ref={containerRef} className="h-44 w-full rounded-[2.5rem] bg-slate-100 border border-slate-200 overflow-hidden mb-4 shadow-inner"></div>;
};

const AddressInput: React.FC<{
  label: string;
  value: string;
  onChange: (val: string, coords?: [number, number]) => void;
  placeholder: string;
  numberValue: string;
  onNumberChange: (val: string) => void;
}> = ({ label, value, onChange, placeholder, numberValue, onNumberChange }) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceTimerRef = useRef<number | null>(null);
  
  const fetchSuggestions = async (query: string) => {
    if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    if (query.length < 3) { setSuggestions([]); return; }

    debounceTimerRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", Brasil")}&countrycodes=br&limit=5&viewbox=${CAXIAS_BOX}&bounded=1`, {
          headers: { 'Accept-Language': 'pt-BR' }
        });
        const data = await res.json();
        setSuggestions(data.map((item: any) => ({ 
          display: item.display_name.split(',')[0], 
          details: item.display_name.split(',').slice(1, 3).join(','), 
          coords: [parseFloat(item.lat), parseFloat(item.lon)] 
        })));
      } catch (e) { console.error("Nominatim Error:", e);
      } finally { setLoading(false); }
    }, 800);
  };

  return (
    <div className="space-y-1">
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-[3]">
          <input 
            type="text" 
            className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none border border-transparent focus:ring-2 focus:ring-[#8ecbff] transition-all" 
            placeholder={placeholder} 
            value={value} 
            onChange={(e) => { onChange(e.target.value); fetchSuggestions(e.target.value); setShowSuggestions(true); }} 
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 300)} 
          />
          {showSuggestions && (suggestions.length > 0 || loading) && (
            <div className="absolute z-[70] left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto no-scrollbar">
              {loading && <div className="p-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Buscando...</div>}
              {!loading && suggestions.map((s, i) => (
                <button key={i} type="button" onClick={() => { onChange(s.display, s.coords); setShowSuggestions(false); setSuggestions([]); }} className="w-full text-left px-5 py-4 border-b border-slate-50 last:border-none hover:bg-sky-50 transition-colors">
                  <p className="text-[11px] font-black text-slate-800">{s.display}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase truncate">{s.details}</p>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1">
          <input type="text" className="w-full px-4 py-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none border border-transparent text-center focus:ring-2 focus:ring-[#8ecbff]" placeholder="Nº" value={numberValue} onChange={(e) => onNumberChange(e.target.value)} />
        </div>
      </div>
    </div>
 export const RestaurantDashboard: React.FC<RestaurantDashboardProps> = ({ 
  deliveries, 
  onAddDelivery, 
  onCancelDelivery,
  userName, 
  currentUserId,
  onSendMessage
}) => {
  const [customerName, setCustomerName] = useState('');
  const [pickupAddress, setPickupAddress] = useState('Sua Loja');
  const [pickupNumber, setPickupNumber] = useState('123');
  const [pickupCoords, setPickupCoords] = useState<[number, number] | undefined>(undefined);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNumber, setDeliveryNumber] = useState('');
  const [deliveryCoords, setDeliveryCoords] = useState<[number, number] | undefined>(undefined);
  const [priceTele, setPriceTele] = useState<number>(12.00);
  const [valueOrder, setValueOrder] = useState<number>(0.00);
  const [observations, setObservations] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [calculatedKm, setCalculatedKm] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !pickupAddress || !deliveryAddress) return;
    onAddDelivery({ 
      customerName, 
      pickupAddress: `${pickupAddress}, ${pickupNumber}`, 
      pickupCoords,
      deliveryAddress: `${deliveryAddress}, ${deliveryNumber}`, 
      deliveryCoords,
      price: Number(priceTele), 
      orderValue: Number(valueOrder), 
      observations 
    });
    setCustomerName(''); setDeliveryAddress(''); setDeliveryNumber(''); setObservations(''); setValueOrder(0); setPriceTele(12.00); setIsFormOpen(false);
    setPickupCoords(undefined); setDeliveryCoords(undefined); setCalculatedKm(0);
  };

  return (
    <div className="px-6 py-6 space-y-6 animate-fadeIn pb-32">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-[900] text-slate-900 tracking-tight">{userName}</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Status do Restaurante</p>
        </div>
        <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-[9px] font-black border border-emerald-100">ONLINE</div>
      </div>

      <button onClick={() => setIsFormOpen(true)} className="w-full bg-[#0f1419] p-6 rounded-[2.5rem] text-white shadow-2xl flex items-center justify-between active:scale-95 transition-all group">
        <span className="text-[10px] font-black uppercase tracking-widest ml-2">Solicitar Nova Coleta</span>
        <div className="bg-[#8ecbff] p-3 rounded-2xl group-hover:rotate-90 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f1419" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </div>
      </button>

      {isFormOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/30 backdrop-blur-md flex items-end justify-center" onClick={() => setIsFormOpen(false)}>
          <div className="bg-white w-full max-w-[500px] rounded-t-[3.5rem] p-10 space-y-6 animate-slideUp relative max-h-[90vh] overflow-y-auto no-scrollbar shadow-[-20px_0_60px_rgba(0,0,0,0.1)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-[900] text-slate-900 tracking-tight">Nova Entrega</h3>
              <button onClick={() => setIsFormOpen(false)} className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <AddressInput label="Local da Coleta" value={pickupAddress} onChange={(val, coords) => { setPickupAddress(val); if(coords) setPickupCoords(coords); }} numberValue={pickupNumber} onNumberChange={setPickupNumber} placeholder="Endereço da Loja" />
                <AddressInput label="Endereço de Entrega" value={deliveryAddress} onChange={(val, coords) => { setDeliveryAddress(val); if(coords) setDeliveryCoords(coords); }} numberValue={deliveryNumber} onNumberChange={setDeliveryNumber} placeholder="Endereço do Cliente" />
              </div>
              
              {pickupCoords && deliveryCoords && (
                <div className="space-y-4 animate-fadeIn">
                  <RoutePreview pickup={pickupCoords} delivery={deliveryCoords} onDistanceCalc={setCalculatedKm} />
                  <div className="flex justify-between items-center bg-[#0f1419] p-5 rounded-[1.8rem] shadow-xl border border-slate-800">
                    <div>
                      <p className="text-[8px] font-black text-[#8ecbff] uppercase tracking-widest mb-0.5">Distância Prevista</p>
                      <p className="text-lg font-black text-white">{calculatedKm.toFixed(1)} km</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Tempo Previsto</p>
                       <p className="text-sm font-black text-white">~{Math.round(calculatedKm * 3 + 5)} min</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Dados do Cliente</label>
                <input type="text" placeholder="Nome do Cliente" className="w-full px-6 py-5 bg-slate-50 rounded-[1.8rem] text-sm font-bold outline-none border border-transparent focus:ring-2 focus:ring-[#8ecbff]" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-emerald-500 uppercase tracking-widest ml-1">Valor do Pedido R$</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="w-full px-6 py-5 bg-emerald-50 rounded-[1.8rem] text-sm font-black text-emerald-700 outline-none border border-transparent focus:ring-2 focus:ring-emerald-500" 
                    placeholder="0,00" 
                    value={valueOrder}
                    onChange={(e) => setValueOrder(parseFloat(e.target.value) || 0)} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-[#8ecbff] uppercase tracking-widest ml-1">Valor da Tele R$</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="w-full px-6 py-5 bg-slate-50 rounded-[1.8rem] text-sm font-black text-slate-800 outline-none border border-transparent focus:ring-2 focus:ring-[#8ecbff]" 
                    value={priceTele}
                    onChange={(e) => setPriceTele(parseFloat(e.target.value) || 0)} 
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações</label>
                <textarea placeholder="Levar troco, instruções, etc..." className="w-full px-6 py-5 bg-slate-50 rounded-[1.8rem] text-sm font-bold outline-none border border-transparent focus:ring-2 focus:ring-[#8ecbff] min-h-[80px]" value={observations} onChange={(e) => setObservations(e.target.value)} />
              </div>

              <button type="submit" className="w-full bg-[#0f1419] text-white font-black py-6 rounded-[2rem] shadow-2xl uppercase text-[10px] tracking-[0.2em] mt-2 active:scale-95 transition-all">CONFIRMAR SOLICITAÇÃO</button>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Entregas Ativas</h3>
        {deliveries.filter(d => d.status !== DeliveryStatus.DELIVERED && d.status !== DeliveryStatus.CANCELLED).map((delivery) => (
          <div key={delivery.id} className="bg-white p-7 rounded-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.03)] border border-slate-50 space-y-5 animate-fadeIn hover:border-[#8ecbff]/30 transition-colors">
             <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-[900] text-slate-900 text-lg leading-none mb-1">{delivery.customerName || 'Pedido #' + delivery.id}</h4>
                  <div className="flex items-center gap-1 text-slate-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <p className="text-[10px] truncate w-40 font-bold">{delivery.deliveryAddress || 'Endereço não informado'}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="text-right">
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">TELE</p>
                    <p className="text-sm font-black text-[#8ecbff]">R$ {(delivery.price || 0).toFixed(2)}</p>
                  </div>
                  <div className="text-right pl-3 border-l border-slate-100">
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">PEDIDO</p>
                    <p className="text-sm font-black text-slate-400">R$ {(delivery.orderValue || 0).toFixed(2)}</p>
                  </div>
                </div>
             </div>

             <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[1.5rem]">
               <div className="flex items-center gap-3">
                 <div className={`w-2.5 h-2.5 rounded-full ${delivery.status === 'SEARCHING' || delivery.status === DeliveryStatus.PENDING ? 'bg-amber-400 animate-pulse' : 'bg-[#8ecbff] shadow-[0_0_8px_#8ecbff]'}`}></div>
                 <div className="flex flex-col">
                   <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest leading-tight">
                     {delivery.status === 'SEARCHING' || delivery.status === DeliveryStatus.PENDING ? 'Aguardando Motoboy' :
                      delivery.status === 'ASSIGNED' || delivery.status === DeliveryStatus.ACCEPTED ? 'Motoboy aceitou' :
                      delivery.status === 'PICKED_UP' ? 'Coletado' : 'Em trânsito'}
                   </p>
                   {delivery.status === 'SEARCHING' && (
                     <p className="text-[8px] font-bold text-amber-500 uppercase">
                       Buscando há {Math.max(1, Math.floor((Date.now() - (delivery.createdAt ? new Date(delivery.createdAt).getTime() : Date.now())) / 60000))} min...
                     </p>
                   )}
                 </div>
               </div>
               <div className="flex flex-col items-end">
                 <span className="text-[8px] font-black text-slate-300 uppercase">
                   {delivery.createdAt ? new Date(delivery.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                 </span>
               </div>
             </div>

             <div className="flex gap-2">
                <button 
                  onClick={() => onCancelDelivery(delivery.id)}
                  className="flex-1 py-3 bg-red-50 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  Cancelar Pedido
                </button>
                {delivery.status === 'ASSIGNED' && (
                  <button className="flex-1 py-3 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-colors">
                    Ver Chat
                  </button>
                )}
             </div>
          </div>
        ))}
        {deliveries.filter(d => d.status !== DeliveryStatus.DELIVERED && d.status !== DeliveryStatus.CANCELLED).length === 0 && (
          <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sem entregas em andamento</p>
          </div>
        )}
      </div>
    </div>
  );
};
