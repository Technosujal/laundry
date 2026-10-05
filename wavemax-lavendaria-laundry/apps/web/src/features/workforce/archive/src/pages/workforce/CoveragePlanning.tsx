// @ts-nocheck
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Users,
  Calendar,
  Clock,
  ShieldAlert,
  Filter,
  RefreshCcw,
  UserCheck,
  Zap
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useCoverageForecast } from '../../hooks/useCoverageForecast';

export default function CoveragePlanning() {
  const { schedules, leaveRequests, employeeDirectory } = useAppContext();
  const { forecast } = useCoverageForecast();
  const [selectedLocation, setSelectedLocation] = useState('loc-1');
  const [selectedArea, setSelectedArea] = useState('All');

  const workAreas = [
    'All',
    'Front Counter',
    'WDF Intake',
    'Washing',
    'Drying',
    'Folding',
    'Quality Check',
    'Pickup and Delivery',
    'Store Management',
  ];

  // Summary Calculations
  const totalRequired = forecast.reduce((sum, d) => sum + d.required, 0);
  const totalScheduled = forecast.reduce((sum, d) => sum + d.scheduled, 0);
  const totalAvailable = forecast.reduce((sum, d) => sum + d.available, 0);
  const totalGap = totalRequired - totalAvailable;
  const openShifts = schedules.filter(s => s.isOpen).length;
  const approvedLeave = leaveRequests.filter(l => l.status === 'Approved').length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coverage Planning</h1>
          <p className="text-sm text-gray-500 mt-1">Analyze workforce capacity, identify gaps, and plan staffing adjustments.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              className="text-xs font-medium bg-transparent focus:outline-none"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="loc-1">Springfield Hub</option>
              <option value="loc-2">Riverside Center</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
            <select
              className="text-xs font-medium bg-transparent focus:outline-none"
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
            >
              {workAreas.map(area => <option key={area} value={area}>{area}</option>)}
            </select>
          </div>
          <button className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors" title="Recalculate">
            <RefreshCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <SummaryTile label="Required" value={totalRequired} icon={Users} />
        <SummaryTile label="Scheduled" value={totalScheduled} icon={Calendar} />
        <SummaryTile label="Available" value={totalAvailable} icon={UserCheck} color="teal" />
        <SummaryTile label="Total Gap" value={totalGap} icon={ShieldAlert} color="red" />
        <SummaryTile label="Open Shifts" value={openShifts} icon={Clock} color="purple" />
        <SummaryTile label="On Leave" value={approvedLeave} icon={AlertTriangle} color="amber" />
        <SummaryTile label="Demand" value="High" icon={Zap} />
      </div>

      {/* Main Gap Analysis View */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Detailed Coverage Gaps</h3>
          <span className="text-xs text-gray-500">Next 7 Days</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-6 py-3">Date & Shift</th>
                <th className="px-6 py-3">Work Area</th>
                <th className="px-6 py-3">Required</th>
                <th className="px-6 py-3">Available</th>
                <th className="px-6 py-3">Gap</th>
                <th className="px-6 py-3">Cause & Impact</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {forecast.filter(d => d.gap > 0).map((day, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{day.dayName}</div>
                    <div className="text-gray-500 text-[10px]">{day.date.toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-700">{selectedArea === 'All' ? 'Mixed Stations' : selectedArea}</span>
                  </td>
                  <td className="px-6 py-4 font-medium">{day.required}</td>
                  <td className="px-6 py-4 font-medium text-teal-600">{day.available}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-[10px]">
                      -{day.gap}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <div className="text-gray-900 font-medium">{day.explanation}</div>
                    <div className="text-gray-500 text-[10px]">Potential impact: Missed delivery targets</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to="/workforce/shift-coverage"
                      className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-800 font-bold hover:underline"
                    >
                      Resolve <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
              {forecast.every(d => d.gap === 0) && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">
                    No staffing gaps detected for the current period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryTile({ label, value, icon: Icon, color = 'slate' }: { label: string; value: string | number; icon: any; color?: string }) {
  const colors = {
    slate: 'text-gray-900 border-gray-200',
    teal: 'text-teal-600 border-teal-200 bg-teal-50/30',
    red: 'text-red-600 border-red-200 bg-red-50/30',
    amber: 'text-amber-600 border-amber-200 bg-amber-50/30',
    purple: 'text-purple-600 border-purple-200 bg-purple-50/30',
  };

  return (
    <div className={`p-4 rounded-xl border bg-white shadow-xs ${colors[color as keyof typeof colors]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase text-gray-500">{label}</span>
        <Icon className="w-3.5 h-3.5 opacity-60" />
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
