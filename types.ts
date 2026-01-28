
export enum DeliveryStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  SEARCHING = 'SEARCHING' // Adicionado para bater com o backend
}

export enum UserRole {
  RESTAURANT = 'RESTAURANT',
  COURIER = 'COURIER',
  UNSELECTED = 'UNSELECTED'
}

export enum AppTab {
  HOME = 'HOME',
  HISTORY = 'HISTORY',
  PROFILE = 'PROFILE'
}

export interface ChatMessage {
  id: string;
  senderId: string | number;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface User {
  id: string | number;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt?: number;
}

export interface AuthSession {
  user: User;
  token: string;
}

export interface Delivery {
  id: string | number;
  restaurantId: string | number;
  restaurantName: string;
  customerName: string;
  customerPhone?: string;
  pickupAddress: string;
  pickupCoords?: [number, number]; // [lat, lon]
  deliveryAddress: string;
  deliveryCoords?: [number, number]; // [lat, lon]
  status: DeliveryStatus | string;
  createdAt: number | string;
  courierId?: string | number;
  refusedBy?: (string | number)[];
  price: number;
  orderValue: number;
  estimatedTime?: string;
  observations?: string;
  messages?: ChatMessage[];
}
