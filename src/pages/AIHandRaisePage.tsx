import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Hand, Layers } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { ASSETS } from '../data/seedData';
import { StatusBadge } from '../components/ui/StatusBadge';

export function AIHandRaisePage() {
  const { handRaiseEvents, setHandRaiseEvents, addNotification, addHistoryLog, pushToast } = usePlatform();
  const [holding, setHolding] = useState(false);
  const [holdElapsed, setHoldElapsed] = useState(0);
  const triggeredForHoldRef = useRef(false);

  useEffect(() => {
    if (!holding) {
      setHoldElapsed(0);
      triggeredForHoldRef.current = false;
      return;
    }
    const timer = setInterval(() => {
      setHoldElapsed((prev) => {
        const next = Number((prev + 0.2).toFixed(1));
        if (next >= 4.0 && !triggeredForHoldRef.current) {
          triggeredForHoldRef.current = true;
          const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
          setHandRaiseEvents((list) => [
            {
              id: `hr-${Date.now()}`,
              timestamp: ts,
              studentName: 'Sadia Afrin',
              seatLabel: 'Row 2 · Seat B1',
              holdDurationSec: 4.0,
              confidence: 96.4,
              acknowledged: false,
            },
            ...list,
          ]);
          addNotification('Hand Raised', 'LOW', 'Hand-Raise Event (4s Confirmed)', 'Sadia Afrin (Row 2 · Seat B1) held hand raised ≥ 4s.');
          addHistoryLog('Hand-Raise Events', 'Sadia Afrin', 'CONFIRMED', 'Continuous hand raise >= 4.0s triggered single notification');
          pushToast({ type: 'info', title: 'Hand-Raise Confirmed (4.0s)', description: 'Teacher notified. Duplicate alerts suppressed for continuous hold.' });
        }
        return next;
      });
    }, 200);
    return () => clearInterval(timer);
  }, [holding, setHandRaiseEvents, addNotification, addHistoryLog, pushToast]);

  const ackEvent = (id: string) => {
    setHandRaiseEvents((prev) => prev.map((e) => (e.id === id ? { ...e, acknowledged: true } : e)));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">AI Hand-Raise Detection</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Custom-trained hand-raise classifier · 4-second continuous hold rule · Automatic duplicate suppression
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHolding((h) => !h)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              holding ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {holding ? 'Lower Simulated Hand' : 'Simulate Continuous Hand Raise (4s Rule)'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Classroom Preview + 4s Rule Progress */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">Live Classroom Vision Preview</h2>
            <StatusBadge
              status={holdElapsed >= 4 ? 'SUCCESS' : holding ? 'WARNING' : 'ONLINE'}
              label={holdElapsed >= 4 ? 'HAND RAISED CONFIRMED' : holding ? `HOLDING (${holdElapsed.toFixed(1)}s / 4.0s)` : 'MONITORING'}
            />
          </div>

          <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <img
              src={ASSETS.roomCam}
              alt="Classroom AI Hand-Raise Detection View"
              referrerPolicy="no-referrer"
              className="w-full h-72 object-cover"
            />
            <div
              style={{ left: '61%', top: '38%', width: '16%', height: '34%' }}
              className={`absolute border-2 rounded ${
                holdElapsed >= 4 ? 'border-emerald-400 bg-emerald-500/15' : 'border-blue-400 bg-blue-500/10'
              }`}
            >
              <span className="px-1.5 py-0.5 bg-slate-950/85 text-white text-[10px] font-mono block truncate">
                Row 2 · Seat B1 · Sadia (96.4%)
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold flex items-center gap-1.5">
                <Hand className="w-4 h-4 text-blue-600" />
                <span>4-Second Continuous Hold Debounce Timer</span>
              </span>
              <span className="font-mono font-bold tabular-nums">
                {holdElapsed.toFixed(1)}s / 4.0s {holdElapsed >= 4 ? '(Duplicate Suppressed)' : ''}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${holdElapsed >= 4 ? 'bg-emerald-600' : 'bg-blue-600'}`}
                style={{ width: `${Math.min(100, (holdElapsed / 4) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Custom AI Model Information & Confusion Matrix */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>AI Model & Dataset</span>
            </h2>
            <StatusBadge status="ACTIVE" label="Trained" />
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Classifier</span>
              <span className="font-semibold">Custom MobileNetV2-Tiny</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Raised Hand Images</span>
              <span className="font-mono font-semibold tabular-nums">142 images (≥100 req.)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">No Raised Hand Images</span>
              <span className="font-mono font-semibold tabular-nums">158 images (≥100 req.)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Held-Out Test Split</span>
              <span className="font-mono font-semibold tabular-nums">20% (60 images)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Held-Out Accuracy</span>
              <span className="font-mono font-bold text-emerald-600 tabular-nums">95.0%</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Avg Prediction Time</span>
              <span className="font-mono font-semibold tabular-nums">34 ms / frame</span>
            </div>
          </div>

          {/* 2x2 Confusion Matrix */}
          <div>
            <p className="text-xs font-semibold mb-2">Held-Out Confusion Matrix (n = 60)</p>
            <div className="grid grid-cols-3 gap-1 text-center text-[11px]">
              <div />
              <div className="font-semibold text-slate-500 py-1">Pred: Raised</div>
              <div className="font-semibold text-slate-500 py-1">Pred: None</div>
              <div className="font-semibold text-slate-500 flex items-center justify-end pr-2">Actual: Raised</div>
              <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-mono font-bold">TP: 27</div>
              <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-mono font-bold">FN: 1</div>
              <div className="font-semibold text-slate-500 flex items-center justify-end pr-2">Actual: None</div>
              <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-mono font-bold">FP: 2</div>
              <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-mono font-bold">TN: 30</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hand-Raise Event History */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <h2 className="font-display text-base font-semibold mb-4">Hand-Raise Event History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="text-left pb-2.5">Detection Time</th>
                <th className="text-left pb-2.5">Student / Seat</th>
                <th className="text-right pb-2.5">Hold Duration</th>
                <th className="text-right pb-2.5">Confidence</th>
                <th className="text-left pb-2.5">Teacher Notification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {handRaiseEvents.map((ev) => (
                <tr key={ev.id}>
                  <td className="py-3 font-mono text-xs tabular-nums">{ev.timestamp}</td>
                  <td className="py-3 text-xs font-semibold">{ev.studentName} · {ev.seatLabel}</td>
                  <td className="py-3 text-right font-mono text-xs tabular-nums">{ev.holdDurationSec.toFixed(1)}s</td>
                  <td className="py-3 text-right font-mono text-xs tabular-nums">{ev.confidence}%</td>
                  <td className="py-3">
                    {ev.acknowledged ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledged
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => ackEvent(ev.id)}
                        className="px-2.5 py-1 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                      >
                        Acknowledge
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
