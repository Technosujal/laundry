// @ts-nocheck
import React from 'react';
import { X, Calendar, Clock, MapPin, User, Info, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CalendarEvent } from './WorkforceCalendar';

interface CalendarEventDrawerProps {
  event: CalendarEvent | null;
  onClose: () => void;
}

export default function CalendarEventDrawer({ event, onClose }: CalendarEventDrawerProps) {
  if (!event) return null;

  const getDetailedLink = () => {
    switch (event.type) {
      case 'leave': return { path: '/workforce/leave', label: 'View Leave & Time Off' };
      case 'shift': return { path: '/workforce/shift-coverage', label: 'View Shift Coverage' };
      case 'exception': return { path: '/workforce/attendance', label: 'View Live Attendance' };
      default: return { path: '/workforce/scheduling', label: 'View Scheduling' };
    }
  };

  const detailedLink = getDetailedLink();

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl animate-slide-in-right p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Event Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto">
          {/* Header Section */}
          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                event.type === 'shift' ? 'bg-teal-200 text-teal-800' :
                event.type === 'leave' ? 'bg-green-200 text-green-800' :
                'bg-red-200 text-red-800'
              }`}>
                {event.type}
              </span>
              <span className="text-xs font-medium text-teal-600">{event.status}</span>
            </div>
            <h3 className="text-lg font-bold text-teal-900">{event.title}</h3>
          </div>

          {/* Detail Grid */}
          <div className="grid grid-cols-1 gap-4">
            <DetailItem icon={User} label="Staff Member" value={event.employee} />
            <div className="grid grid-cols-2 gap-4">
              <DetailItem icon={Calendar} label="Date" value={event.start.toLocaleDateString()} />
              <DetailItem icon={Clock} label="Time" value={`${event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`} />
            </div>
            <DetailItem icon={MapPin} label="Work Area" value={event.workArea || 'General Station'} />
            <DetailItem icon={Info} label="Staffing Impact" value={event.type === 'leave' ? 'Potential Coverage Gap' : 'Scheduled Requirement'} />
          </div>

          {/* Manager Note Placeholder */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Manager Note</h4>
            <p className="text-sm text-gray-600 italic">
              {event.type === 'exception'
                ? 'Attendance exception flagged for review. Please verify with employee.'
                : 'Standard assignment. No special instructions.'}
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <Link
            to={detailedLink.path}
            className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
            onClick={onClose}
          >
            {detailedLink.label} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 text-gray-400">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-gray-400 uppercase">{label}</span>
        <span className="text-sm font-medium text-gray-900">{value}</span>
      </div>
    </div>
  );
}
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
