// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  CalendarClock,
  Clock,
  ShieldCheck,
  AlertCircle,
  FileText,
  UserPlus,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  GraduationCap,
  Calendar,
} from 'lucide-react';
import ModuleLandingHeader from '../../components/landing/ModuleLandingHeader';
import SummaryMetricCard from '../../components/landing/SummaryMetricCard';
import WorkforceCommandCenter from '../../components/workforce/WorkforceCommandCenter';
import ScheduleAbsencePreview from '../../components/workforce/ScheduleAbsencePreview';
import { useWorkforceHome } from '../../hooks/useWorkforceHome';
import type { CriticalEvent } from '../../types/workforce';

export default function WorkforceLanding() {
  const {
    metrics,
    pendingActions,
    upcomingAwarenessEvents,
  } = useWorkforceHome();
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      <ModuleLandingHeader
        title="Workforce Management"
        description="Comprehensive labor operations: Live attendance roster, 7-day schedule outlook, exception resolution, and compliance approvals."
        moduleName="People & Labor"
      />

      {/* 1. Top Operational Workforce Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <SummaryMetricCard
          label="Active Team"
          value={metrics.activeTeam}
          icon={Users}
          color="teal"
        />
        <SummaryMetricCard
          label="On Shift"
          value={metrics.onShift}
          icon={Clock}
          color="teal"
        />
        <SummaryMetricCard
          label="On Leave"
          value={metrics.onLeave}
          icon={CalendarClock}
          color="amber"
        />
        <SummaryMetricCard
          label="Open Shifts"
          value={metrics.openShifts}
          icon={ShieldCheck}
          color={metrics.openShifts > 0 ? 'red' : 'teal'}
        />
        <SummaryMetricCard
          label="Pending Leave"
          value={metrics.pendingLeave}
          icon={CalendarClock}
          color={metrics.pendingLeave > 0 ? 'amber' : 'teal'}
        />
        <SummaryMetricCard
          label="Exceptions"
          value={metrics.exceptions}
          icon={AlertCircle}
          color={metrics.exceptions > 0 ? 'red' : 'teal'}
        />
      </div>

      {/* 4. Live Roster & Staffing Position */}
      <WorkforceCommandCenter />

      {/* 5. 7-Day Schedule Outlook & Absence Breakdown */}
      <ScheduleAbsencePreview />

      {/* 6. Pending Approvals & Upcoming Awareness Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Actions & Queue */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900">Pending Operational Queue</h2>
                <p className="text-xs text-gray-500 mt-0.5">Approval requests, shift fills, and compliance acknowledgements</p>
              </div>
              <span className="text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full">
                Active Queue
              </span>
            </div>

            <div className="space-y-2.5">
              {pendingActions.map((action) => {
                const getIcon = () => {
                  switch (action.iconName) {
                    case 'CalendarClock':
                      return CalendarClock;
                    case 'FileText':
                      return FileText;
                    case 'UserPlus':
                      return UserPlus;
                    case 'ShieldAlert':
                      return ShieldAlert;
                    default:
                      return CheckCircle2;
                  }
                };
                const Icon = getIcon();

                return (
                  <button
                    key={action.id}
                    onClick={() => navigate(action.destination)}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-teal-300 hover:bg-teal-50/20 transition-all group text-left"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-gray-100 text-gray-600 group-hover:bg-teal-100 group-hover:text-teal-700 transition-colors shrink-0 mt-0.5">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900 group-hover:text-teal-900">
                            {action.label}
                          </span>
                          {action.urgentCount > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
                              {action.urgentCount} urgent
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{action.operationalImpact}</p>
                        <span className="text-[11px] font-medium text-amber-700 block mt-1">
                          {action.oldestWaiting}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 pl-2">
                      <span className="text-xs font-extrabold bg-gray-100 group-hover:bg-teal-100 group-hover:text-teal-800 text-gray-700 px-2.5 py-1 rounded-full">
                        {action.count}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upcoming Forward Awareness Events */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900">Upcoming Awareness & Schedules</h2>
                <p className="text-xs text-gray-500 mt-0.5">Forward look: upcoming leaves, certifications, and shift transitions</p>
              </div>
              <Link
                to="/workforce/calendar"
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1"
              >
                Calendar <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingAwarenessEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/50 hover:bg-white transition-all group flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-teal-50 text-teal-700 group-hover:bg-teal-100 shrink-0 mt-0.5">
                      {evt.eventType === 'Training' ? (
                        <GraduationCap className="w-4 h-4" />
                      ) : evt.eventType === 'Onboarding' ? (
                        <UserPlus className="w-4 h-4" />
                      ) : (
                        <Calendar className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">{evt.title}</span>
                        <span className="text-[10px] font-semibold bg-gray-200/70 text-gray-700 px-1.5 py-0.5 rounded">
                          {evt.eventType}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-1">{evt.operationalEffect}</p>
                      <div className="text-[11px] text-gray-400">
                        {evt.employeeName} • {evt.dateStr} • {evt.shift}
                      </div>
                    </div>
                  </div>

                  <Link
                    to={evt.actionUrl}
                    className="p-1.5 text-gray-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors shrink-0"
                    title="View details"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 text-center">
            <Link
              to="/workforce/scheduling"
              className="text-xs font-bold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1.5"
            >
              Open Full Monthly Shift Planning Roster <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
