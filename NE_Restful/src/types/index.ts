// User types
export interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}

// Parking types
export interface Parking {
  id: string;
  code: string;
  name: string;
  location: string;
  totalSpaces: number;
  availableSpaces: number;
  chargingFeePerHour: number;
}

export interface ParkingFormData {
  code: string;
  name: string;
  location: string;
  totalSpaces: number;
  chargingFeePerHour: number;
}

// Vehicle types
export interface Vehicle {
  id: string;
  plateNumber: string;
  parkingCode: string;
  parkingName: string;
  entryDateTime: string;
  exitDateTime: string | null;
  chargedAmount: number;
}

export interface VehicleEntryFormData {
  plateNumber: string;
  parkingCode: string;
}

// Report types
export interface ReportSummary {
  totalVehicles: number;
  totalRevenue: number;
}

export interface ReportData {
  vehicles: Vehicle[];
  summary: ReportSummary;
}