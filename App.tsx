
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserRole, Delivery, DeliveryStatus, AppTab, User, AuthSession, ChatMessage } from './types';
import { Layout } from './components/Layout';
import { RestaurantDashboard } from './components/RestaurantDashboard';
import { CourierDashboard } from './components/CourierDashboard';
import { LandingPage } from './components/LandingPage';
import { HistoryScreen } from './components/HistoryScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { apiService } from './services/api';

const App: React.FC = () => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HOME);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profileInfo, setProfileInfo] = useState<any>(null);

  const fetchProfile = useCallback(async (token: string) => {
    try {
      const data = await apiService.get('/me', token);
      setProfileInfo(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }, []);

  const fetchDeliveries = useCallback(async () => {
    if (!session || !profileInfo) return;
    try {
      if (session.user.role === UserRole.RESTAURANT && profileInfo.restaurant_id) {
        const data = await apiService.get(`/orders/restaurant/${profileInfo.restaurant_id}`, session.token);
        setDeliveries(data);
      } else if (session.user.role === UserRole.COURIER && profileInfo.courier_id) {
        const assigned = await apiService.get(`/orders/courier/${profileInfo.courier_id}`, session.token);
        const available = await apiService.get(`/orders/available`, session.token);
        // Evitar duplicatas se houver
        const all = [...assigned];
        available.forEach((a: any) => {
          if (!all.find(d => d.id === a.id)) all.push(a);
        });
        setDeliveries(all);
      }
    } catch (err) {
      console.error('Error fetching deliveries:', err);
    }
  }, [session, profileInfo]);

  // WebSocket ref
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const savedSession = localStorage.getItem('telego_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed && parsed.token) {
          setSession(parsed);
          fetchProfile(parsed.token);
        }
      } catch (e) {
        console.error('Error parsing saved session', e);
        localStorage.removeItem('telego_session');
      }
    }
    setIsLoading(false);
  }, [fetchProfile]);

  useEffect(() => {
    if (session) {
      localStorage.setItem('telego_session', JSON.stringify(session));
      if (!profileInfo) fetchProfile(session.token);
    } else {
      localStorage.removeItem('telego_session');
      setProfileInfo(null);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    }
  }, [session, profileInfo, fetchProfile]);

  // WebSocket Connection Logic
  useEffect(() => {
    if (!session || !profileInfo) return;

    const connectWebSocket = () => {
      if (socketRef.current) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const host = apiUrl.replace(/^https?:\/\//, '');
      
      let wsUrl = '';
      if (session.user.role === UserRole.RESTAURANT && profileInfo.restaurant_id) {
        wsUrl = `${protocol}//${host}/ws/restaurant/${profileInfo.restaurant_id}`;
      } else if (session.user.role === UserRole.COURIER && profileInfo.courier_id) {
        wsUrl = `${protocol}//${host}/ws/courier/${profileInfo.courier_id}`;
      }

      if (!wsUrl) return;

      console.log('Connecting to WebSocket:', wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => console.log('✅ WebSocket Connected');
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('📩 WebSocket Message:', data);
        
        if (data.type === 'NEW_ORDER' || data.type === 'ORDER_UPDATE') {
          fetchDeliveries();
          // Som sonoro ou notificação visual poderia ser disparada aqui
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
             new Notification('TeleGo!', { body: data.message || 'Atualização no pedido' });
          }
        }
      };
      ws.onclose = () => {
        console.log('❌ WebSocket Disconnected. Retrying...');
        socketRef.current = null;
        setTimeout(connectWebSocket, 3000);
      };
      ws.onerror = (err) => console.error('WebSocket Error:', err);

      socketRef.current = ws;
    };

    connectWebSocket();

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [session, profileInfo, fetchDeliveries]);

  useEffect(() => {
    if (session && profileInfo) {
      fetchDeliveries();
      const interval = setInterval(fetchDeliveries, 5000);
      return () => clearInterval(interval);
    }
  }, [session, profileInfo, fetchDeliveries]);

  const handleUpdateUser = useCallback((updatedUser: User) => {
    setSession(prev => prev ? { ...prev, user: updatedUser } : null);
  }, []);

  const addDelivery = useCallback(async (newDelivery: any) => {
    if (!session || !profileInfo?.restaurant_id) return;
    try {
      await apiService.post('/orders/', {
        body: { 
          restaurant_id: profileInfo.restaurant_id,
          customer_name: newDelivery.customerName,
          delivery_address: newDelivery.deliveryAddress,
          pickup_address: newDelivery.pickupAddress,
          price: newDelivery.price,
          order_value: newDelivery.orderValue
        },
        token: session.token
      });
      fetchDeliveries();
    } catch (err) {
      console.error('Error creating delivery:', err);
    }
  }, [session, profileInfo, fetchDeliveries]);

  const cancelDelivery = useCallback(async (orderId: string | number) => {
    if (!session) return;
    try {
      await apiService.delete(`/orders/${orderId}`, {
        token: session.token
      });
      fetchDeliveries();
    } catch (err) {
      console.error('Error cancelling delivery:', err);
    }
  }, [session, fetchDeliveries]);

  const updateDeliveryStatus = useCallback(async (id: string | number, status: string, courierId?: string | number) => {
    if (!session) return;
    try {
      if (status === DeliveryStatus.ACCEPTED) {
        await apiService.post(`/orders/${id}/respond?response=true`, { token: session.token });
      } else {
        await apiService.put(`/orders/${id}/status?status=${status}`, { token: session.token });
      }
      fetchDeliveries();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  }, [session, fetchDeliveries]);

  const refuseDelivery = useCallback(async (deliveryId: string | number) => {
    if (!session) return;
    try {
      await apiService.post(`/orders/${deliveryId}/respond?response=false`, { token: session.token });
      fetchDeliveries();
    } catch (err) {
      console.error('Error refusing delivery:', err);
    }
  }, [session, fetchDeliveries]);

  const handleSendMessage = useCallback((deliveryId: string | number, text: string) => {
    console.log('Send message not implemented with backend yet', deliveryId, text);
  }, []);

  const handleLogout = () => {
    setSession(null);
    setActiveTab(AppTab.HOME);
    setDeliveries([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-[#8ecbff] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const renderHomeContent = () => {
    if (!session || !profileInfo) return null;
    if (session.user.role === UserRole.RESTAURANT) {
      return (
        <RestaurantDashboard 
          deliveries={deliveries}
          onAddDelivery={addDelivery} 
          onCancelDelivery={cancelDelivery}
          userName={session.user.name}
          currentUserId={profileInfo.restaurant_id}
          onSendMessage={handleSendMessage}
        />
      );
    }
    return (
      <CourierDashboard 
        allDeliveries={deliveries}
        currentUserId={profileInfo.courier_id}
        onUpdateStatus={updateDeliveryStatus as any}
        onRefuseDelivery={refuseDelivery as any}
        onSendMessage={handleSendMessage}
      />
    );
  };

  const renderMainContent = () => {
    if (!session) return <LandingPage onAuthSuccess={setSession} />;
    switch (activeTab) {
      case AppTab.HISTORY:
        return <HistoryScreen role={session.user.role} deliveries={deliveries} currentUserId={profileInfo?.restaurant_id || profileInfo?.courier_id} />;
      case AppTab.PROFILE:
        return (
          <ProfileScreen 
            user={session.user} 
            onLogout={handleLogout} 
            onUpdateUser={handleUpdateUser}
            stats={{
              total: deliveries.length,
              delivered: deliveries.filter(d => d.status === DeliveryStatus.DELIVERED).length
            }}
          />
        );
      default:
        return renderHomeContent();
    }
  };

  return (
    <Layout role={session?.user.role || UserRole.UNSELECTED} activeTab={activeTab} onNavigate={setActiveTab} onLogout={handleLogout}>
      {renderMainContent()}
    </Layout>
  );
};

export default App;
