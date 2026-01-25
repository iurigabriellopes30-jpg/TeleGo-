
import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, Delivery, DeliveryStatus, AppTab, User, AuthSession, ChatMessage } from './types';
import { Layout } from './components/Layout';
import { RestaurantDashboard } from './components/RestaurantDashboard';
import { CourierDashboard } from './components/CourierDashboard';
import { LandingPage } from './components/LandingPage';
import { HistoryScreen } from './components/HistoryScreen';
import { ProfileScreen } from './components/ProfileScreen';

const MAX_DELIVERY_TIME = 15 * 60 * 1000; 
const USERS_DB_KEY = 'telego_users_db';

const App: React.FC = () => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HOME);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const seedTestData = () => {
    const existingUsers = localStorage.getItem(USERS_DB_KEY);
    if (!existingUsers) {
      const testUsers = [
        { id: 'u_rest_1', name: 'Pizzaria Toscana', email: 'restaurante@teste.com', password: '123', role: UserRole.RESTAURANT, createdAt: Date.now() },
        { id: 'u_cour_1', name: 'João Entregas', email: 'motoboy@teste.com', password: '123', role: UserRole.COURIER, createdAt: Date.now() }
      ];
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(testUsers));
    }
  };

  useEffect(() => {
    seedTestData();
    const savedSession = localStorage.getItem('telego_session');
    const savedDeliveries = localStorage.getItem('telego_deliveries');
    if (savedSession) setSession(JSON.parse(savedSession));
    if (savedDeliveries) setDeliveries(JSON.parse(savedDeliveries));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const checkExpiration = () => {
      const now = Date.now();
      let changed = false;
      const updatedDeliveries = deliveries.map(d => {
        if (d.status === DeliveryStatus.PENDING && (now - d.createdAt) > MAX_DELIVERY_TIME) {
          changed = true;
          return { ...d, status: DeliveryStatus.EXPIRED };
        }
        return d;
      });
      if (changed) setDeliveries(updatedDeliveries);
    };
    const interval = setInterval(checkExpiration, 10000);
    return () => clearInterval(interval);
  }, [deliveries]);

  useEffect(() => {
    if (session) localStorage.setItem('telego_session', JSON.stringify(session));
    else localStorage.removeItem('telego_session');
    localStorage.setItem('telego_deliveries', JSON.stringify(deliveries));
  }, [session, deliveries]);

  const handleUpdateUser = useCallback((updatedUser: User) => {
    setSession(prev => prev ? { ...prev, user: updatedUser } : null);
  }, []);

  const addDelivery = useCallback((newDelivery: Omit<Delivery, 'id' | 'createdAt' | 'status' | 'restaurantId' | 'restaurantName' | 'messages'>) => {
    if (!session) return;
    const delivery: Delivery = {
      ...newDelivery,
      id: `order_${Date.now()}`,
      restaurantId: session.user.id,
      restaurantName: session.user.name,
      createdAt: Date.now(),
      status: DeliveryStatus.PENDING,
      refusedBy: [],
      messages: []
    };
    setDeliveries(prev => [delivery, ...prev]);
  }, [session]);

  const updateDeliveryStatus = useCallback((id: string, status: DeliveryStatus, courierId?: string) => {
    setDeliveries(prev => prev.map(d => {
      if (d.id === id && status === DeliveryStatus.ACCEPTED && d.status !== DeliveryStatus.PENDING) return d;
      return d.id === id ? { ...d, status, courierId: courierId || d.courierId } : d;
    }));
  }, []);

  const refuseDelivery = useCallback((deliveryId: string, courierId: string) => {
    setDeliveries(prev => prev.map(d => d.id === deliveryId ? { ...d, refusedBy: [...(d.refusedBy || []), courierId] } : d));
  }, []);

  const handleSendMessage = useCallback((deliveryId: string, text: string) => {
    if (!session) return;
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: session.user.id,
      senderName: session.user.name,
      text,
      timestamp: Date.now()
    };
    setDeliveries(prev => prev.map(d => d.id === deliveryId ? { ...d, messages: [...(d.messages || []), newMessage] } : d));
  }, [session]);

  const handleLogout = () => {
    setSession(null);
    setActiveTab(AppTab.HOME);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-[#8ecbff] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const renderHomeContent = () => {
    if (!session) return null;
    if (session.user.role === UserRole.RESTAURANT) {
      return (
        <RestaurantDashboard 
          deliveries={deliveries.filter(d => d.restaurantId === session.user.id)} 
          onAddDelivery={addDelivery} 
          userName={session.user.name}
          currentUserId={session.user.id}
          onSendMessage={handleSendMessage}
        />
      );
    }
    return (
      <CourierDashboard 
        allDeliveries={deliveries}
        currentUserId={session.user.id}
        onUpdateStatus={updateDeliveryStatus}
        onRefuseDelivery={refuseDelivery}
        onSendMessage={handleSendMessage}
      />
    );
  };

  const renderMainContent = () => {
    if (!session) return <LandingPage onAuthSuccess={setSession} />;
    switch (activeTab) {
      case AppTab.HISTORY:
        return <HistoryScreen role={session.user.role} deliveries={deliveries} currentUserId={session.user.id} />;
      case AppTab.PROFILE:
        return (
          <ProfileScreen 
            user={session.user} 
            onLogout={handleLogout} 
            onUpdateUser={handleUpdateUser}
            stats={{
              total: deliveries.filter(d => session.user.role === UserRole.RESTAURANT ? d.restaurantId === session.user.id : d.courierId === session.user.id).length,
              delivered: deliveries.filter(d => (session.user.role === UserRole.RESTAURANT ? d.restaurantId === session.user.id : d.courierId === session.user.id) && d.status === DeliveryStatus.DELIVERED).length
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
