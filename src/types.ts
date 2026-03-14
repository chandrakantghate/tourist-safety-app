export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

export interface ThreatData {
  id: string;
  type: 'crime' | 'weather' | 'disaster' | 'health';
  severity: 'low' | 'medium' | 'high';
  description: string;
  location: {
    latitude: number;
    longitude: number;
    radius: number; // in meters
  };
  timestamp: number;
}

export interface SOSAlert {
  id: string;
  userId: string;
  location: UserLocation;
  batteryLevel: number;
  status: 'active' | 'resolved';
  timestamp: number;
}
