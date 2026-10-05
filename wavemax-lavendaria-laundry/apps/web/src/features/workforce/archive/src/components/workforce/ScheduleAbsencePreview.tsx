// @ts-nocheck
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarClock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sun,
  Sunset,
  Moon,
  User,
  ShieldAlert,
  Calendar,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { useWorkforceHome } from '../../hooks/useWorkforceHome';
import type { ScheduleDayDetail, DayActivity } from '../../types/workforce';

export default function ScheduleAbsencePreview() {
  const { scheduleDays } = useWorkforceHome();
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  const selectedDay: ScheduleDayDetail | undefined = scheduleDays[selectedDayIndex] || scheduleDays[0];

  // Group activities of the selected day by period
  const morningActivities = selectedDay?.activities.filter(a => a.period === 'Morning') || [];
  const afternoonActivities = selectedDay?.activities.filter(a => a.period === 'Afternoon') || [];
  const eveningActivities = selectedDay?.activities.filter(a => a.period === 'Evening') || [];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-gray-900">Schedule & Absence 7-Day Outlook</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Click any day below to inspect station roster, shift allocations, approved time-off, and coverage gaps
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/workforce/scheduling"
            className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 hover:underline"
          >
            Schedule Planner <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            to="/workforce/calendar"
            className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 hover:underline"
          >
            Full Calendar <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 7-Day Clickable Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {scheduleDays.map((day, idx) => {
          const isSelected = idx === selectedDayIndex;
          const isCritical = day.status === 'Critical';
          const isAttention = day.status === 'Attention';

          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedDayIndex(idx)}
              className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'border-teal-600 ring-2 ring-teal-500/20 bg-teal-50/20 shadow-xs'
                  : 'border-gray-200 bg-white hover:border-teal-300 hover:bg-gray-50/50'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-1.5">
                  <div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                      {day.dayName}
                    </span>
                    <span className={`text-sm font-bold ${isSelected ? 'text-teal-950' : 'text-gray-800'}`}>
                      {day.dateStr}
                    </span>
                  </div>
                  {day.isToday && (
                    <span className="text-[9px] font-bold uppercase tracking-tight bg-teal-600 text-white px-1.5 py-0.5 rounded-sm">
                      Today
                    </span>
                  )}
                </div>

                <div className="space-y-1 my-2.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-500">Req / Sched</span>
                    <span className="font-bold text-gray-800">{day.required} / {day.scheduled}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-500">Available</span>
                    <span className="font-semibold text-emerald-700">{day.available}</span>
                  </div>
                  {day.approvedLeave > 0 && (
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-amber-700">On Leave</span>
                      <span className="font-semibold text-amber-800">{day.approvedLeave}</span>
                    </div>
                  )}
                  {day.openShifts > 0 && (
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-rose-700 font-semibold">Open</span>
                      <span className="font-bold text-rose-800">{day.openShifts}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className={`text-center text-[10px] font-bold py-1 rounded-md mb-1.5 ${
                  isCritical
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : isAttention
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {day.status}
                </div>
                <p className="text-[10px] text-gray-500 truncate leading-tight" title={day.topEvent}>
                  {day.topEvent}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected-Day Detailed Activity Panel */}
      {selectedDay && (
        <div className="bg-gray-50/80 rounded-2xl border border-gray-200 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-600 text-white rounded-xl shadow-xs">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900">
                    {selectedDay.dayName}, {selectedDay.dateStr} — Operational Day Roster
                  </h3>
                  {selectedDay.isToday && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200">
                      Active Shift Day
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Target: {selectedDay.required} associates • Scheduled: {selectedDay.scheduled} • Available: {selectedDay.available} • Gaps: {selectedDay.openShifts}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/workforce/shift-coverage"
                className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-white border border-gray-300 rounded-lg hover:border-teal-400 hover:bg-teal-50 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                Fill Openings
              </Link>
              <Link
                to="/workforce/scheduling"
                className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
              >
                Edit Day Schedule
              </Link>
            </div>
          </div>

          {/* Activity Columns: Morning, Afternoon, Evening */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Morning */}
            <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-2xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-gray-900">Morning Shift (06:00 – 14:00)</span>
                </div>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                  {morningActivities.length}
                </span>
              </div>
              <div className="space-y-2">
                {morningActivities.length > 0 ? (
                  morningActivities.map(act => <ActivityCard key={act.id} activity={act} />)
                ) : (
                  <p className="text-xs text-gray-400 italic py-2 text-center">No morning shifts scheduled</p>
                )}
              </div>
            </div>

            {/* Afternoon */}
            <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-2xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Sunset className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-bold text-gray-900">Afternoon Shift (14:00 – 18:00)</span>
                </div>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                  {afternoonActivities.length}
                </span>
              </div>
              <div className="space-y-2">
                {afternoonActivities.length > 0 ? (
                  afternoonActivities.map(act => <ActivityCard key={act.id} activity={act} />)
                ) : (
                  <p className="text-xs text-gray-400 italic py-2 text-center">No afternoon shifts scheduled</p>
                )}
              </div>
            </div>

            {/* Evening */}
            <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-2xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold text-gray-900">Evening Shift (18:00 – 22:00)</span>
                </div>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                  {eveningActivities.length}
                </span>
              </div>
              <div className="space-y-2">
                {eveningActivities.length > 0 ? (
                  eveningActivities.map(act => <ActivityCard key={act.id} activity={act} />)
                ) : (
                  <p className="text-xs text-gray-400 italic py-2 text-center">No evening shifts scheduled</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityCard({ activity }: { activity: DayActivity }) {
  const isOpenShift = activity.type === 'open_shift';
  const isLeave = activity.type === 'leave';

  return (
    <div
      className={`p-2.5 rounded-lg border text-xs transition-colors flex flex-col justify-between gap-1.5 ${
        isOpenShift
          ? 'bg-rose-50/50 border-rose-200'
          : isLeave
          ? 'bg-amber-50/50 border-amber-200'
          : 'bg-gray-50/60 border-gray-200 hover:bg-gray-100/50'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 truncate flex items-center gap-1.5">
            {isOpenShift ? (
              <span className="text-rose-700 font-bold flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                {activity.title}
              </span>
            ) : isLeave ? (
              <span className="text-amber-800 font-semibold flex items-center gap-1">
                <CalendarClock className="w-3 h-3 text-amber-600 shrink-0" />
                {activity.title}
              </span>
            ) : (
              <span className="text-gray-900">{activity.title}</span>
            )}
          </div>
          <div className="text-[11px] text-gray-600 flex items-center gap-1 mt-0.5">
            <User className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="font-medium text-gray-700 truncate">{activity.employeeName}</span>
          </div>
        </div>
        <span
          className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${
            isOpenShift
              ? 'bg-rose-200 text-rose-800'
              : isLeave
              ? 'bg-amber-200 text-amber-800'
              : activity.status.includes('Conflict') || activity.status.includes('OT')
              ? 'bg-amber-100 text-amber-800'
              : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {activity.status}
        </span>
      </div>

      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-100">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-gray-400" />
          {activity.timeRange}
        </span>
        {activity.actionUrl && (
          <Link
            to={activity.actionUrl}
            className="text-teal-600 hover:text-teal-800 font-semibold inline-flex items-center gap-0.5 hover:underline"
          >
            Manage <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
