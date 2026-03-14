import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Shield, MapPin, FileText, Settings, Phone, Hospital, User, Lock, Menu, X, WifiOff, Zap } from 'lucide-react';
import { cn } from './lib/utils';
import { safetyService } from './services/safetyService';

// Types
interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export default function App() {
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [riskLevel, setRiskLevel] = useState<'Safe' | 'Caution' | 'High Risk'>('Safe');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'vault' | 'settings'>('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lowBandwidthMode, setLowBandwidthMode] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const newLoc = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          };
          setLocation(newLoc);
          
          // Update Risk Level
          const level = await safetyService.getRiskLevel(newLoc);
          setRiskLevel(level);
        },
        (err) => console.error('Geolocation error:', err),
        { enableHighAccuracy: !lowBandwidthMode }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [lowBandwidthMode]);


  const handleSOS = async () => {
    setIsSOSActive(true);
    try {
      const battery = await (navigator as any).getBattery?.();
      const batteryLevel = battery ? battery.level * 100 : null;

      await fetch('/api/emergency/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user_123',
          location,
          batteryLevel,
          timestamp: Date.now(),
          lowBandwidth: lowBandwidthMode,
        }),
      });
    } catch (err) {
      console.error('SOS Trigger failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-emerald-100">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-stone-200 z-50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-emerald-600" />
          <span className="font-bold text-xl tracking-tight">GUARDIAN</span>
        </div>
        <div className="flex items-center gap-2">
          {lowBandwidthMode && (
            <div title="Low Bandwidth Mode Active">
              <WifiOff className="w-4 h-4 text-amber-600" />
            </div>
          )}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors"
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-16 bg-white z-40 p-6 flex flex-col gap-6"
          >
            <MenuLink icon={<Shield />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsMenuOpen(false); }} />
            <MenuLink icon={<MapPin />} label="Safety Map" active={activeTab === 'map'} onClick={() => { setActiveTab('map'); setIsMenuOpen(false); }} />
            <MenuLink icon={<Lock />} label="Digital Vault" active={activeTab === 'vault'} onClick={() => { setActiveTab('vault'); setIsMenuOpen(false); }} />
            <MenuLink icon={<Settings />} label="Settings" active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setIsMenuOpen(false); }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pt-20 pb-32 px-4 max-w-md mx-auto">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Status Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "bg-white p-6 rounded-3xl shadow-sm border flex items-center justify-between",
                riskLevel === 'Safe' ? "border-emerald-100" : 
                riskLevel === 'Caution' ? "border-amber-100" : "border-red-100"
              )}
            >
              <div>
                <p className="text-stone-500 text-sm font-medium uppercase tracking-wider">Current Status</p>
                <h2 className={cn(
                  "text-2xl font-bold",
                  riskLevel === 'Safe' ? "text-emerald-600" : 
                  riskLevel === 'Caution' ? "text-amber-600" : "text-red-600"
                )}>
                  {riskLevel === 'Safe' ? 'Safe Zone' : 
                   riskLevel === 'Caution' ? 'Caution Advised' : 'High Risk Area'}
                </h2>
              </div>
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center",
                riskLevel === 'Safe' ? "bg-emerald-100 text-emerald-600" : 
                riskLevel === 'Caution' ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"
              )}>
                <Shield />
              </div>
            </motion.div>

            {/* SOS Button Section */}
            <div className="flex flex-col items-center justify-center py-12">
              <SOSButton isActive={isSOSActive} onClick={handleSOS} onCancel={() => setIsSOSActive(false)} />
              <p className="mt-6 text-stone-400 text-sm text-center max-w-[200px]">
                Hold for 3 seconds to trigger emergency response
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <QuickAction icon={<Phone className="text-blue-600" />} label="Local Police" sub="Call 911" />
              <QuickAction icon={<Hospital className="text-red-600" />} label="Nearest ER" sub="0.8 miles away" />
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Safety Map</h2>
            <div className="aspect-square bg-stone-200 rounded-3xl overflow-hidden relative">
              <div className="absolute inset-0 flex items-center justify-center text-stone-500">
                <div className="text-center">
                  <MapPin className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>Map View Loading...</p>
                </div>
              </div>
              {/* Mock Map Markers */}
              {location && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
                </div>
              )}
            </div>
            <div className="space-y-3">
              <p className="font-medium text-stone-600">Nearby Safe Havens</p>
              <SafeHavenItem name="Central Police Station" distance="0.4 mi" type="Police" />
              <SafeHavenItem name="St. Mary's Hospital" distance="0.8 mi" type="Hospital" />
            </div>
          </div>
        )}

        {activeTab === 'vault' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Digital Vault</h2>
              <button className="p-2 bg-emerald-600 text-white rounded-xl">
                <Lock className="w-5 h-5" />
              </button>
            </div>
            <div className="grid gap-4">
              <VaultItem icon={<FileText />} name="Passport Copy" date="Added 2 days ago" />
              <VaultItem icon={<FileText />} name="Travel Insurance" date="Added 1 week ago" />
              <VaultItem icon={<FileText />} name="Visa Documents" date="Added 2 days ago" />
            </div>
            <button className="w-full py-4 border-2 border-dashed border-stone-200 rounded-2xl text-stone-400 font-medium hover:border-emerald-300 hover:text-emerald-600 transition-all">
              + Add New Document
            </button>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Settings</h2>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                    <Zap size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Low Bandwidth Mode</p>
                    <p className="text-xs text-stone-400">Optimizes for 2G/3G speeds</p>
                  </div>
                </div>
                <button 
                  onClick={() => setLowBandwidthMode(!lowBandwidthMode)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    lowBandwidthMode ? "bg-emerald-600" : "bg-stone-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    lowBandwidthMode ? "left-7" : "left-1"
                  )} />
                </button>
              </div>
              
              <div className="bg-white p-4 rounded-2xl border border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Emergency Contacts</p>
                    <p className="text-xs text-stone-400">Manage 3 primary contacts</p>
                  </div>
                </div>
                <button className="text-blue-600 font-bold text-sm">Edit</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-6 py-4 flex justify-between items-center z-50">
        <NavIcon icon={<Shield />} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <NavIcon icon={<MapPin />} active={activeTab === 'map'} onClick={() => setActiveTab('map')} />
        <NavIcon icon={<Lock />} active={activeTab === 'vault'} onClick={() => setActiveTab('vault')} />
        <NavIcon icon={<Settings />} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
      </div>

      {/* SOS Overlay */}
      <AnimatePresence>
        {isSOSActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-red-600 z-[100] flex flex-col items-center justify-center p-8 text-white text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mb-8"
            >
              <AlertCircle className="w-16 h-16" />
            </motion.div>
            <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter">SOS ACTIVE</h1>
            <p className="text-xl opacity-90 mb-12">Emergency services and contacts have been notified of your location.</p>
            <button 
              onClick={() => setIsSOSActive(false)}
              className="px-8 py-4 bg-white text-red-600 rounded-2xl font-bold text-lg shadow-xl"
            >
              CANCEL EMERGENCY
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SOSButton({ isActive, onClick, onCancel }: { isActive: boolean, onClick: () => void, onCancel: () => void }) {
  const [holdProgress, setHoldProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleStart = () => {
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / 3000) * 100, 100);
      setHoldProgress(progress);
      if (progress === 100) {
        clearInterval(timerRef.current!);
        onClick();
      }
    }, 50);
  };

  const handleEnd = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (holdProgress < 100) setHoldProgress(0);
  };

  return (
    <div className="relative">
      <svg className="w-64 h-64 -rotate-90">
        <circle
          cx="128"
          cy="128"
          r="120"
          className="stroke-stone-200 fill-none"
          strokeWidth="8"
        />
        <motion.circle
          cx="128"
          cy="128"
          r="120"
          className="stroke-red-600 fill-none"
          strokeWidth="8"
          strokeDasharray="754"
          animate={{ strokeDashoffset: 754 - (754 * holdProgress) / 100 }}
          strokeLinecap="round"
        />
      </svg>
      <button
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
        className={cn(
          "absolute inset-4 rounded-full flex flex-col items-center justify-center transition-all duration-300",
          holdProgress > 0 ? "bg-red-600 scale-95" : "bg-red-500 hover:bg-red-600",
          "shadow-[0_20px_50px_rgba(239,68,68,0.3)]"
        )}
      >
        <AlertCircle className="w-16 h-16 text-white mb-2" />
        <span className="text-white font-black text-2xl tracking-tighter uppercase">SOS</span>
      </button>
    </div>
  );
}

function QuickAction({ icon, label, sub }: { icon: React.ReactNode, label: string, sub: string }) {
  return (
    <button className="bg-white p-4 rounded-3xl border border-stone-100 shadow-sm text-left hover:border-stone-200 transition-all">
      <div className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="font-bold text-stone-900">{label}</p>
      <p className="text-xs text-stone-400">{sub}</p>
    </button>
  );
}

function SafeHavenItem({ name, distance, type }: { name: string, distance: string, type: string }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-stone-100 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          type === 'Police' ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"
        )}>
          {type === 'Police' ? <Shield size={20} /> : <Hospital size={20} />}
        </div>
        <div>
          <p className="font-bold text-sm">{name}</p>
          <p className="text-xs text-stone-400">{type}</p>
        </div>
      </div>
      <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2 py-1 rounded-lg">{distance}</span>
    </div>
  );
}

function VaultItem({ icon, name, date }: { icon: React.ReactNode, name: string, date: string }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-stone-100 flex items-center justify-between hover:border-emerald-200 transition-colors cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="font-bold text-sm">{name}</p>
          <p className="text-xs text-stone-400">{date}</p>
        </div>
      </div>
      <Lock className="w-4 h-4 text-stone-300" />
    </div>
  );
}

function NavIcon({ icon, active, onClick }: { icon: React.ReactElement, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-3 rounded-2xl transition-all duration-300",
        active ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-110" : "text-stone-400 hover:bg-stone-50"
      )}
    >
      {React.cloneElement(icon, { size: 24 } as any)}
    </button>
  );
}

function MenuLink({ icon, label, active, onClick }: { icon: React.ReactElement, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 p-4 rounded-2xl transition-all",
        active ? "bg-emerald-50 text-emerald-600" : "hover:bg-stone-50 text-stone-600"
      )}
    >
      {React.cloneElement(icon, { size: 24 } as any)}
      <span className="font-bold text-lg">{label}</span>
    </button>
  );
}

