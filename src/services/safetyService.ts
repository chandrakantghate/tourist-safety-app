import { UserLocation, ThreatData } from '../types';

class SafetyService {
  private mockThreats: ThreatData[] = [
    {
      id: '1',
      type: 'crime',
      severity: 'high',
      description: 'Recent reports of pickpocketing in this area.',
      location: { latitude: 40.7128, longitude: -74.0060, radius: 500 },
      timestamp: Date.now(),
    },
    {
      id: '2',
      type: 'weather',
      severity: 'medium',
      description: 'Heavy rain expected in the next 2 hours.',
      location: { latitude: 40.7580, longitude: -73.9855, radius: 2000 },
      timestamp: Date.now(),
    }
  ];

  async getNearbyThreats(location: UserLocation): Promise<ThreatData[]> {
    // In a real app, this would fetch from a backend or third-party API
    return this.mockThreats.filter(threat => {
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        threat.location.latitude,
        threat.location.longitude
      );
      return distance <= threat.location.radius;
    });
  }

  async getRiskLevel(location: UserLocation): Promise<'Safe' | 'Caution' | 'High Risk'> {
    const threats = await this.getNearbyThreats(location);
    if (threats.some(t => t.severity === 'high')) return 'High Risk';
    if (threats.length > 0) return 'Caution';
    return 'Safe';
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

export const safetyService = new SafetyService();
