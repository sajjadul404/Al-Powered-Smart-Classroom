import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CloudRain, CloudSun, RefreshCw, Sun, Zap } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext.jsx';
import { SimpleBarChart, SimpleLineChart } from '../components/ui/Charts.jsx';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';

export function WeatherAnalyticsPage() {
  const { telemetrySeries, attendance, emergencyEvents, config } = usePlatform();
  const [period, setPeriod] = useState('Daily');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadWeather = useCallback(async (failMode, refresh = false) => {
    setLoading(true);
    try {
      const resp = await fetch(`/api/weather?simulateFailure=${failMode}&refresh=${refresh}`);
      const json = await resp.json();
      setWeather(json);
    } catch {
      // Keep last cached weather if fetch completely fails
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeather(simulateFailure);
    const sixtyMinInterval = setInterval(() => loadWeather(simulateFailure, true), 60 * 60 * 1000);
    return () => clearInterval(sixtyMinInterval);
  }, [simulateFailure, loadWeather]);

  const WeatherIcon =
    weather?.data.icon === 'sun'
      ? Sun
      : weather?.data.icon === 'rain'
      ? CloudRain
      : weather?.data.icon === 'storm'
      ? Zap
      : CloudSun;

  const periodAttendance =
    period === 'Daily'
      ? [
          { label: 'Present', value: attendance.filter((a) => a.status === 'PRESENT').length, color: '#16A34A' },
          { label: 'Late', value: attendance.filter((a) => a.status === 'LATE').length, color: '#D97706' },
          { label: 'Absent', value: attendance.filter((a) => a.status === 'ABSENT').length, color: '#DC2626' },
        ]
      : period === 'Weekly'
      ? [
          { label: 'Mon', value: 41, color: '#2563EB' },
          { label: 'Tue', value: 43, color: '#2563EB' },
          { label: 'Wed', value: 39, color: '#2563EB' },
          { label: 'Thu', value: 42, color: '#2563EB' },
          { label: 'Fri', value: 38, color: '#2563EB' },
        ]
      : [
          { label: 'Wk 1', value: 92, color: '#16A34A' },
          { label: 'Wk 2', value: 89, color: '#16A34A' },
          { label: 'Wk 3', value: 94, color: '#16A34A' },
          { label: 'Wk 4', value: 91, color: '#16A34A' },
        ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Weather & Analytics</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            60-minute external weather sync with stale-cache resilience · Daily, weekly & monthly classroom analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSimulateFailure((f) => !f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              simulateFailure
                ? 'bg-amber-600 text-white border-amber-600'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
            }`}
          >
            {simulateFailure ? 'Restore Weather API' : 'Simulate API Failure'}
          </button>
          <button
            type="button"
            onClick={() => loadWeather(simulateFailure, true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Weather</span>
          </button>
        </div>
      </div>

      {/* Weather Stale Warning */}
      {weather?.status === 'STALE' && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200 font-semibold">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{weather.warning}</span>
        </div>
      )}

      {/* Weather Section */}
      {weather && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Campus Weather Sync</span>
              <StatusBadge status={weather.apiConnected ? 'ONLINE' : 'STALE'} label={weather.apiConnected ? 'API Connected' : 'Cached Stale'} />
            </div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
                <WeatherIcon className="w-8 h-8" />
              </div>
              <div>
                <p className="font-mono text-3xl font-bold tabular-nums">{weather.data.temperature}°C</p>
                <p className="text-xs text-slate-500">{weather.data.condition} · Humidity {weather.data.humidity}%</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
              {weather.data.notice}
            </p>
            {weather.data.dangerAlert && (
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 font-semibold">
                {weather.data.dangerAlert}
              </div>
            )}
            <p className="text-[11px] font-mono text-slate-400">
              Last Updated: {new Date(weather.lastUpdated).toLocaleString()} (60m cycle)
            </p>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h2 className="font-display text-base font-semibold mb-4">24-Hour Campus Forecast</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {weather.data.forecast24h.map((slot) => (
                <div key={slot.hour} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                  <p className="font-mono text-slate-500">{slot.hour}</p>
                  <p className="font-mono text-lg font-bold tabular-nums mt-0.5">{slot.temp}°C</p>
                  <p className="text-[11px] text-slate-500">Hum: {slot.humidity}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Section */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <h2 className="font-display text-lg font-bold">Classroom Telemetry & Operational Analytics</h2>
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {['Daily', 'Weekly', 'Monthly'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                period === p ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h3 className="font-display text-sm font-semibold mb-3">Temperature & Humidity Analytics ({period})</h3>
          <SimpleLineChart
            labels={telemetrySeries.map((t) => t.time)}
            series={[
              { name: 'Temp (°C)', color: '#2563EB', values: telemetrySeries.map((t) => t.temperature), unit: '°C' },
              { name: 'Humidity (%)', color: '#16A34A', values: telemetrySeries.map((t) => t.humidity), unit: '%' },
            ]}
            thresholds={[{ label: 'Warn', value: config.tempWarningThreshold, color: '#D97706' }]}
          />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h3 className="font-display text-sm font-semibold mb-3">
            Attendance Analytics ({period === 'Monthly' ? '% Weekly Rate' : `${period} Count`})
          </h3>
          <SimpleBarChart data={periodAttendance} />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h3 className="font-display text-sm font-semibold mb-3">Classroom Occupancy Trend</h3>
          <SimpleLineChart
            labels={telemetrySeries.map((t) => t.time)}
            series={[{ name: 'Occupants', color: '#2563EB', values: telemetrySeries.map((t) => t.occupancy), unit: ' seats' }]}
          />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h3 className="font-display text-sm font-semibold mb-3">Safety Event Summary</h3>
          <SimpleBarChart
            data={[
              { label: 'Fire', value: emergencyEvents.filter((e) => e.type === 'FIRE').length, color: '#DC2626' },
              { label: 'Panic', value: emergencyEvents.filter((e) => e.type === 'PANIC').length, color: '#D97706' },
              { label: 'Temp Danger', value: emergencyEvents.filter((e) => e.type === 'TEMP_DANGER').length, color: '#2563EB' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
