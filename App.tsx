
import React, { useState, useEffect, useCallback } from 'react';
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

  useEffect(() => {
    const savedSession = localStorage.getItem('telego_session');
    if (savedSession) {
      const parsed = JSON.parse(savedSession);
      setSession(parsed);
      fetchProfile(parsed.token);
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
    }
  }, [session, profileInfo, fetchProfile]);

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
        body: { restaurant_id: profileInfo.restaurant_id },
        token: session.token
      });
      fetchDeliveries();
    } catch (err) {
      console.error('Error adding delivery:', err);
    }
  }, [session, profileInfo, fetchDeliveries]);

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
