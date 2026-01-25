
export enum DeliveryStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
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
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: number;
}

export interface AuthSession {
  user: User;
  token: string;
}

export interface Delivery {
  id: string;
  restaurantId: string;
  restaurantName: string;
  customerName: string;
  customerPhone?: string;
  pickupAddress: string;
  pickupCoords?: [number, number]; // [lat, lon]
  deliveryAddress: string;
  deliveryCoords?: [number, number]; // [lat, lon]
  status: DeliveryStatus;
  createdAt: number;
  courierId?: string;
  refusedBy?: string[];
  price: number;
  orderValue: number;
  estimatedTime?: string;
  observations?: string;
  messages?: ChatMessage[];
}
