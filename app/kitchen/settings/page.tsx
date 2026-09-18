'use client';

import { useState } from 'react';
import { FiSettings, FiArrowLeft, FiToggleRight, FiToggleLeft } from 'react-icons/fi';
import KitchenLayout from '@/components/kitchen/KitchenLayout';

export default function KitchenSettingsPage() {
  const [settings, setSettings] = useState({
    soundVolume: 70,
    soundEnabled: true,
    autoRefresh: true,
    refreshInterval: 5,
    hideReady: false,
    compactView: false,
    darkMode: true,
    timerAlerts: true,
    lowStockAlerts: true,
  });

  const [showSaved, setShowSaved] = useState(false);

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem('kitchenSettings', JSON.stringify(settings));
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  };

  const handleReset = () => {
    const defaults = {
      soundVolume: 70,
      soundEnabled: true,
      autoRefresh: true,
      refreshInterval: 5,
      hideReady: false,
      compactView: false,
      darkMode: true,
      timerAlerts: true,
      lowStockAlerts: true,
    };
    setSettings(defaults);
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  return (
    <KitchenLayout>
      <div className="p-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center">
              <FiSettings className="text-white" size={20} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Kitchen Settings</h1>
          </div>
          <p className="text-gray-600 text-sm font-medium">Customize your kitchen dashboard</p>
        </div>

        {/* Success Message */}
        {showSaved && (
          <div className="mb-6 p-4 bg-white border border-black rounded-2xl text-black font-medium">
            ✓ Settings saved successfully!
          </div>
        )}

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Sound Settings */}
          <SettingsSection title="Sound & Alerts">
            <SettingToggle
              label="Sound Enabled"
              value={settings.soundEnabled}
              onChange={() => toggleSetting('soundEnabled')}
            />

            <SettingSlider
              label="Sound Volume"
              value={settings.soundVolume}
              onChange={(val) =>
                setSettings({ ...settings, soundVolume: val })
              }
              disabled={!settings.soundEnabled}
            />

            <SettingToggle
              label="Timer Alerts"
              value={settings.timerAlerts}
              onChange={() => toggleSetting('timerAlerts')}
              description="Alert when orders exceed SLA"
            />

            <SettingToggle
              label="Low Stock Alerts"
              value={settings.lowStockAlerts}
              onChange={() => toggleSetting('lowStockAlerts')}
              description="Notify when ingredients are running low"
            />
          </SettingsSection>

          {/* Display Settings */}
          <SettingsSection title="Display">
            <SettingToggle
              label="Auto-Refresh Orders"
              value={settings.autoRefresh}
              onChange={() => toggleSetting('autoRefresh')}
            />

            {settings.autoRefresh && (
              <SettingSlider
                label="Refresh Interval (seconds)"
                value={settings.refreshInterval}
                min={3}
                max={30}
                onChange={(val) =>
                  setSettings({ ...settings, refreshInterval: val })
                }
              />
            )}

            <SettingToggle
              label="Compact View"
              value={settings.compactView}
              onChange={() => toggleSetting('compactView')}
              description="Show fewer details, more orders visible"
            />

            <SettingToggle
              label="Dark Mode"
              value={settings.darkMode}
              onChange={() => toggleSetting('darkMode')}
              description="Easier on the eyes in kitchen"
            />

            <SettingToggle
              label="Hide Completed Orders"
              value={settings.hideReady}
              onChange={() => toggleSetting('hideReady')}
              description="Hide ready orders from main board"
            />
          </SettingsSection>

          {/* Quick Stats */}
          <SettingsSection title="Quick Stats">
            <div className="grid grid-cols-2 gap-4">
              <StatsCard label="Active Orders" value="3" />
              <StatsCard label="Avg Prep Time" value="18m" />
              <StatsCard label="On Time Rate" value="94%" />
              <StatsCard label="High Priority" value="1" />
            </div>
          </SettingsSection>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-black hover:bg-gray-800 text-white font-semibold rounded-2xl transition-colors shadow-md"
            >
              Save Settings
            </button>
            <button
              onClick={handleReset}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-2xl transition-colors"
            >
              Reset to Default
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-white rounded-2xl border border-black">
          <p className="text-black text-sm text-center font-medium">
            Settings are saved locally on this device.
          </p>
        </div>
      </div>
    </KitchenLayout>
  );
}

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-md">
      <h2 className="text-lg font-bold text-gray-900 mb-5">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

interface SettingToggleProps {
  label: string;
  value: boolean;
  onChange: () => void;
  description?: string;
}

function SettingToggle({
  label,
  value,
  onChange,
  description,
}: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors border border-gray-200">
      <div className="flex-1">
        <p className="text-gray-900 font-semibold">{label}</p>
        {description && (
          <p className="text-gray-600 text-xs mt-1.5 font-medium">{description}</p>
        )}
      </div>
      <button
        onClick={onChange}
        className="ml-4 text-2xl transition-colors"
      >
        {value ? (
          <FiToggleRight className="text-black" />
        ) : (
          <FiToggleLeft className="text-gray-300" />
        )}
      </button>
    </div>
  );
}

interface SettingSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

function SettingSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  disabled = false,
}: SettingSliderProps) {
  return (
    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-900 font-semibold">{label}</p>
        <span className={`font-semibold ${disabled ? 'text-gray-400' : 'text-black'}`}>
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        disabled={disabled}
        className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-black disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}

interface StatsCardProps {
  label: string;
  value: string;
}

function StatsCard({ label, value }: StatsCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 text-center border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-gray-600 text-sm mb-2 font-medium">{label}</p>
      <p className="text-2xl font-bold text-black">{value}</p>
    </div>
  );
}
