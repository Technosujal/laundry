// @ts-nocheck
import React from 'react';
import { useCoverageForecast } from '../../hooks/useCoverageForecast';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CoverageForecast() {
  const { forecast } = useCoverageForecast();

  const statusColors = {
    Healthy: 'bg-green-500',
    Attention: 'bg-amber-500',
    Critical: 'bg-red-500',
  };

  const statusIcons = {
    Healthy: <CheckCircle2 className="w-3 h-3 text-green-600" />,
    Attention: <AlertTriangle className="w-3 h-3 text-amber-600" />,
    Critical: <AlertTriangle className="w-3 h-3 text-red-600" />,
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Coverage and Demand Forecast</h3>
          <p className="text-xs text-gray-500">7-day workforce capacity vs. required staffing</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {forecast.map((day, i) => (
          <div key={i} className="flex flex-col p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-teal-200 transition-colors">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase">{day.dayName}</span>
              {statusIcons[day.status]}
            </div>

            <div className="flex flex-col items-center justify-center mb-3">
              <span className="text-lg font-bold text-gray-900">
                {Math.round((day.available / day.required) * 100)}%
              </span>
              <span className="text-[9px] font-medium text-gray-500">{day.available}/{day.required} Staff</span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3 overflow-hidden">
              <div
                className={`h-full rounded-full ${statusColors[day.status]}`}
                style={{ width: `${Math.min(100, (day.available / day.required) * 100)}%` }}
              />
            </div>

            <div className="text-center">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                day.status === 'Healthy' ? 'bg-green-100 text-green-700' :
                day.status === 'Attention' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                {day.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Gap Explanations */}
      <div className="mt-6 space-y-2">
        {forecast.filter(d => d.gap > 0).map((day, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-red-50/50 border border-red-100">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-red-900">{day.dayName}: {day.gap}-person gap</span>
                <Link to="/workforce/shift-coverage" className="text-xs text-red-700 font-bold hover:underline">Review Coverage →</Link>
              </div>
              <p className="text-[11px] text-red-700 mt-0.5">{day.explanation}</p>
            </div>
          </div>
        ))}
        {forecast.every(d => d.gap === 0) && (
          <div className="text-center p-4 text-xs text-gray-400 italic">
            All upcoming shifts are fully covered.
          </div>
        )}
      </div>
    </div>
  );
}
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
