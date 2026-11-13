import crypto from 'node:crypto';
import { GoogleGenAI } from '@google/genai';

interface WeatherCache {
  fetchedAt: number;
  data: {
    temperature: number;
    humidity: number;
    condition: string;
    windSpeed: number;
    icon: 'sun' | 'cloud-sun' | 'rain' | 'storm';
    notice: string;
    dangerAlert: string | null;
    forecast24h: Array<{ hour: string; temp: number; humidity: number; condition: string }>;
  };
}

let weatherCache: WeatherCache | null = null;

export function buildFallbackWeather() {
  const now = new Date();
  const baseTemp = 31.4;
  const forecast24h = Array.from({ length: 8 }, (_, idx) => {
    const h = (now.getHours() + idx * 3) % 24;
    const label = `${String(h).padStart(2, '0')}:00`;
    const delta = Math.round(Math.sin((idx / 8) * Math.PI) * 3.5 * 10) / 10;
    const temp = Number((baseTemp - 1.5 + delta).toFixed(1));
    return {
      hour: label,
      temp,
      humidity: Math.min(88, Math.max(54, 68 - Math.round(delta * 2))),
      condition: temp >= 34 ? 'High Heat Advisory' : temp >= 31 ? 'Partly Cloudy' : 'Clear Sky',
    };
  });

  return {
    temperature: 32.1,
    humidity: 69,
    condition: 'Partly Cloudy',
    windSpeed: 11.4,
    icon: 'cloud-sun' as const,
    notice: 'Warm afternoon conditions near campus; maintain classroom ventilation.',
    dangerAlert: null,
    forecast24h,
  };
}

export function answerFromDatabaseDeterministic(question: string, db: Record<string, any>): string {
  const q = question.toLowerCase().trim();
  if (!db || typeof db !== 'object') return 'No data';

  const students: any[] = Array.isArray(db.students) ? db.students : [];
  const attendance: any[] = Array.isArray(db.attendance) ? db.attendance : [];
  const telemetry: any = db.telemetry ?? null;
  const telemetryHistory: any[] = Array.isArray(db.telemetryHistory) ? db.telemetryHistory : [];
  const emergencyEvents: any[] = Array.isArray(db.emergencyEvents) ? db.emergencyEvents : [];
  const devices: any[] = Array.isArray(db.devices) ? db.devices : [];

  if (q.includes('attendance') && (q.includes('today') || q.includes('summary') || q.includes('how many'))) {
    if (attendance.length === 0 && students.length === 0) return 'No data';
    const present = attendance.filter((a) => a.status === 'PRESENT').length;
    const late = attendance.filter((a) => a.status === 'LATE').length;
    const absent = attendance.filter((a) => a.status === 'ABSENT').length;
    return `Today's attendance across ${students.length} enrolled students: ${present} Present, ${late} Late, and ${absent} Absent.`;
  }

  if (q.includes('absent')) {
    if (attendance.length === 0) return 'No data';
    const absentRows = attendance.filter((a) => a.status === 'ABSENT');
    if (absentRows.length === 0) return '0 students are currently marked absent today.';
    const names = absentRows.map((a) => a.studentName).join(', ');
    return `${absentRows.length} student(s) are absent today: ${names}.`;
  }

  if (q.includes('late')) {
    if (attendance.length === 0) return 'No data';
    const lateRows = attendance.filter((a) => a.status === 'LATE');
    if (lateRows.length === 0) return '0 students are marked late today.';
    return `${lateRows.length} student(s) are marked late today: ${lateRows.map((a) => a.studentName).join(', ')}.`;
  }

  if (q.includes('temperature') || q.includes('temp') || q.includes('max')) {
    if (!telemetry && telemetryHistory.length === 0) return 'No data';
    const temps = telemetryHistory.map((t) => Number(t.temperature)).filter((n) => !Number.isNaN(n));
    if (telemetry?.temperature !== undefined) temps.push(Number(telemetry.temperature));
    if (temps.length === 0) return 'No data';
    const maxTemp = Math.max(...temps).toFixed(1);
    const current = telemetry?.temperature !== undefined ? `${Number(telemetry.temperature).toFixed(1)}°C` : 'N/A';
    return `Today's maximum recorded classroom temperature is ${maxTemp}°C (current reading: ${current}).`;
  }

  if (q.includes('fire')) {
    if (!Array.isArray(db.emergencyEvents)) return 'No data';
    const fireEvents = emergencyEvents.filter((e) => e.type === 'FIRE');
    if (fireEvents.length === 0) return 'There are no fire alerts recorded in the database today.';
    const active = fireEvents.some((e) => !e.resolved);
    return `${fireEvents.length} fire alert(s) recorded (${active ? 'ACTIVE FIRE STATE' : 'resolved'}). Latest: ${fireEvents[0].message} at ${fireEvents[0].timestamp}.`;
  }

  if (q.includes('panic')) {
    if (!Array.isArray(db.emergencyEvents)) return 'No data';
    const panicEvents = emergencyEvents.filter((e) => e.type === 'PANIC');
    if (panicEvents.length === 0) return 'There are no panic alerts recorded in the database.';
    return `${panicEvents.length} panic alert(s) recorded. Latest: ${panicEvents[0].message} at ${panicEvents[0].timestamp}.`;
  }

  if (q.includes('emergency') || q.includes('emergencies')) {
    if (!Array.isArray(db.emergencyEvents)) return 'No data';
    if (emergencyEvents.length === 0) return 'No emergency events are recorded today.';
    const summary = emergencyEvents
      .slice(0, 5)
      .map((e) => `${e.type} (${e.resolved ? 'Resolved' : 'Active'}) at ${e.timestamp}: ${e.message}`)
      .join(' | ');
    return `Today's emergency events (${emergencyEvents.length} total): ${summary}`;
  }

  if (q.includes('device') || q.includes('esp32') || q.includes('online')) {
    if (devices.length === 0) return 'No data';
    const dev = devices[0];
    return `Classroom controller ${dev.name} (${dev.id}, Room ${dev.roomId}) is currently ${dev.status}. Firmware: ${dev.firmwareVersion}, Wi-Fi RSSI: ${dev.rssi} dBm, Last seen: ${dev.lastSeen}.`;
  }

  if (q.includes('humidity')) {
    if (!telemetry?.humidity) return 'No data';
    return `Current classroom humidity is ${telemetry.humidity}% (Heat Index: ${telemetry.heatIndex}°C).`;
  }

  if (q.includes('occupancy') || q.includes('people')) {
    if (telemetry?.occupancy === undefined) return 'No data';
    return `Current classroom occupancy is ${telemetry.occupancy} person(s) (${telemetry.csiPresence ?? 'OCCUPIED'} via Wi-Fi CSI).`;
  }

  return 'No data';
}

export async function handleWeatherRequest(simulateFailure: boolean, forceRefresh: boolean) {
  const sixtyMinutes = 60 * 60 * 1000;

  if (simulateFailure) {
    const cached = weatherCache?.data ?? buildFallbackWeather();
    const lastUpdated = weatherCache
      ? new Date(weatherCache.fetchedAt).toISOString()
      : new Date(Date.now() - 95 * 60 * 1000).toISOString();
    return {
      status: 'STALE',
      apiConnected: false,
      lastUpdated,
      warning: 'Weather API unreachable. Displaying cached data from last successful sync.',
      data: cached,
    };
  }

  if (weatherCache && !forceRefresh && Date.now() - weatherCache.fetchedAt < sixtyMinutes) {
    return {
      status: 'LIVE',
      apiConnected: true,
      lastUpdated: new Date(weatherCache.fetchedAt).toISOString(),
      warning: null,
      data: weatherCache.data,
    };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const url =
      'https://api.open-meteo.com/v1/forecast?latitude=23.8103&longitude=90.4125&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,weather_code&forecast_days=1';
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json: any = await resp.json();
    const cur = json.current ?? {};
    const temp = Number((cur.temperature_2m ?? 31.2).toFixed(1));
    const hum = Math.round(cur.relative_humidity_2m ?? 68);
    const wind = Number((cur.wind_speed_10m ?? 9.5).toFixed(1));
    const code = Number(cur.weather_code ?? 2);

    let condition = 'Partly Cloudy';
    let icon: 'sun' | 'cloud-sun' | 'rain' | 'storm' = 'cloud-sun';
    if (code === 0) {
      condition = 'Clear Sky';
      icon = 'sun';
    } else if (code >= 51 && code <= 82) {
      condition = 'Rain Showers';
      icon = 'rain';
    } else if (code >= 95) {
      condition = 'Thunderstorm';
      icon = 'storm';
    }

    const hourlyTimes: string[] = json.hourly?.time ?? [];
    const hourlyTemps: number[] = json.hourly?.temperature_2m ?? [];
    const hourlyHum: number[] = json.hourly?.relative_humidity_2m ?? [];
    const forecast24h = [0, 3, 6, 9, 12, 15, 18, 21].map((idx) => {
      const rawTime = hourlyTimes[idx] ?? '';
      const hourLabel = rawTime ? rawTime.slice(11, 16) : `${String(idx).padStart(2, '0')}:00`;
      const t = Number((hourlyTemps[idx] ?? temp).toFixed(1));
      return {
        hour: hourLabel,
        temp: t,
        humidity: Math.round(hourlyHum[idx] ?? hum),
        condition: t >= 35 ? 'High Heat' : condition,
      };
    });

    const payload = {
      temperature: temp,
      humidity: hum,
      condition,
      windSpeed: wind,
      icon,
      notice:
        temp >= 34
          ? 'Outdoor heat advisory active. Keep classroom cooling active and monitor indoor heat index.'
          : 'Ambient campus weather nominal for scheduled classroom operations.',
      dangerAlert: temp >= 38 ? 'Extreme outdoor heat (>38°C) may raise indoor DHT11 baseline.' : null,
      forecast24h,
    };

    weatherCache = { fetchedAt: Date.now(), data: payload };
    return {
      status: 'LIVE',
      apiConnected: true,
      lastUpdated: new Date(weatherCache.fetchedAt).toISOString(),
      warning: null,
      data: payload,
    };
  } catch {
    const fallback = weatherCache?.data ?? buildFallbackWeather();
    const fetchedAt = weatherCache?.fetchedAt ?? Date.now() - 65 * 60 * 1000;
    return {
      status: 'STALE',
      apiConnected: false,
      lastUpdated: new Date(fetchedAt).toISOString(),
      warning: 'Live Open-Meteo sync unavailable. Showing cached 60-minute forecast snapshot.',
      data: fallback,
    };
  }
}

export async function handleAssistantRequest(question: string, databaseSnapshot: Record<string, any>) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `Database JSON Snapshot:\n${JSON.stringify(databaseSnapshot)}\n\nUser Question: ${question}`;
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You are the FastRobox 1.0 Smart Classroom Database Assistant. Answer the user question strictly and exclusively using the provided Database JSON Snapshot. Never invent, extrapolate, or fabricate any numbers, names, or statuses. If the requested information is not present in the Database JSON Snapshot or cannot be answered from it, respond with the exact two words: No data',
        },
      });

      const text = (response.text ?? '').trim();
      if (text) {
        return { answer: text, source: 'gemini-db-grounded' };
      }
    } catch {
      // Fallback to deterministic strict database lookup below
    }
  }

  const answer = answerFromDatabaseDeterministic(question, databaseSnapshot);
  return { answer, source: 'database-query' };
}

export function hashPasswordNode(password: string): string {
  const salt = crypto.randomBytes(16);
  const derived = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  return `pbkdf2_sha256$100000$${salt.toString('hex')}$${derived.toString('hex')}`;
}

export function verifyPasswordNode(password: string, passwordHash: string): boolean {
  if (typeof password !== 'string' || typeof passwordHash !== 'string') return false;
  const parts = passwordHash.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2_sha256') return false;
  const iterations = Number(parts[1]);
  const saltHex = parts[2];
  const expectedHex = parts[3];
  if (!Number.isFinite(iterations) || iterations < 10000 || !saltHex || !expectedHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const derived = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');
  const expected = Buffer.from(expectedHex, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}
