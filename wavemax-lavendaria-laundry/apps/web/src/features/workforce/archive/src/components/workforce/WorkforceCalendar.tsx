// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Filter, Calendar as CalendarIcon, List, LayoutGrid } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export type CalendarEventType = 'shift' | 'leave' | 'event' | 'exception';
export type CalendarView = 'month' | 'week' | 'agenda';

export interface CalendarEvent {
  id: string;
  title: string;
  type: CalendarEventType;
  start: Date;
  end: Date;
  employee: string;
  status: 'published' | 'approved' | 'pending' | 'exception';
  workArea?: string;
}

interface WorkforceCalendarProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

const WORK_AREAS = [
  'Front Counter',
  'WDF Intake',
  'Washing',
  'Drying',
  'Folding',
  'Quality Check',
  'Pickup and Delivery',
  'Store Management',
];

export default function WorkforceCalendar({ events, onEventClick }: WorkforceCalendarProps) {
  const { currentUser } = useAppContext();
  const [view, setView] = useState<CalendarView>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterWorkArea, setFilterWorkArea] = useState<string>('All');

  const eventTones = {
    shift: 'bg-teal-100 text-teal-700 border-teal-200',
    leave: 'bg-green-100 text-green-700 border-green-200',
    event: 'bg-blue-100 text-blue-700 border-blue-200',
    exception: 'bg-red-100 text-red-700 border-red-200',
  };

  const filteredEvents = useMemo(() => {
    return events.filter(e => filterWorkArea === 'All' || e.workArea === filterWorkArea);
  }, [events, filterWorkArea]);

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() - 1);
    else if (view === 'week') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() + 1);
    else if (view === 'week') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border-b border-r border-gray-100 bg-gray-50/30" />);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dayEvents = filteredEvents.filter(e => e.start.toDateString() === date.toDateString());
      const shifts = dayEvents.filter(e => e.type === 'shift').length;
      const leaves = dayEvents.filter(e => e.type === 'leave').length;
      const opens = dayEvents.filter(e => e.status === 'pending').length;

      days.push(
        <div key={d} className="h-24 border-b border-r border-gray-100 p-1 flex flex-col justify-between group hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => {}}>
          <span className="text-[10px] font-bold text-gray-400 mb-1">{d}</span>
          <div className="flex flex-col gap-1">
            {shifts > 0 && (
              <div className="flex items-center gap-1 text-[9px] font-bold text-teal-600">
                <div className="w-1 h-1 rounded-full bg-teal-600" /> {shifts} Shifts
              </div>
            )}
            {leaves > 0 && (
              <div className="flex items-center gap-1 text-[9px] font-bold text-green-600">
                <div className="w-1 h-1 rounded-full bg-green-600" /> {leaves} Leave
              </div>
            )}
            {opens > 0 && (
              <div className="flex items-center gap-1 text-[9px] font-bold text-purple-600">
                <div className="w-1 h-1 rounded-full bg-purple-600" /> {opens} Open
              </div>
            )}
          </div>
        </div>
      );
    }
    return days;
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }

    return (
      <div className="flex flex-col overflow-x-auto">
        <div className="flex min-w-[800px]">
          <div className="w-48 shrink-0 border-r border-gray-100 bg-gray-50/50">
            <div className="h-10 border-b border-gray-100" />
            {WORK_AREAS.map(area => (
              <div key={area} className="h-16 border-b border-gray-100 px-4 flex items-center text-[11px] font-bold text-gray-600 truncate">
                {area}
              </div>
            ))}
          </div >
          <div className="flex-1 grid grid-cols-7">
            {days.map(day => (
              <div key={day.toISOString()} className="border-r border-gray-100">
                <div className="h-10 border-b border-gray-100 p-2 text-center bg-gray-50/50">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <span className="block text-xs font-bold text-gray-900">{day.getDate()}</span>
                </div>
                {WORK_AREAS.map(area => {
                  const areaEvents = filteredEvents.filter(e =>
                    e.workArea === area && e.start.toDateString() === day.toDateString()
                  );
                  return (
                    <div key={area} className="h-16 border-b border-gray-100 p-1 overflow-hidden">
                      {areaEvents.map(e => (
                        <button
                          key={e.id}
                          onClick={() => onEventClick(e)}
                          className={`w-full text-[9px] p-1 rounded border truncate text-left font-medium ${eventTones[e.type]}`}
                        >
                          {e.title}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderAgendaView = () => {
    const sorted = [...filteredEvents].sort((a, b) => a.start.getTime() - b.start.getTime());
    return (
      <div className="flex flex-col gap-2 p-4">
        {sorted.map(e => (
          <div
            key={e.id}
            onClick={() => onEventClick(e)}
            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:bg-gray-50 transition-colors ${eventTones[e.type]}`}
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{e.title}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/50 font-bold uppercase">{e.status}</span>
              </div>
              <span className="text-xs opacity-80">{e.employee} • {e.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {e.workArea || 'General'}</span>
            </div>
            <span className="text-xs font-bold opacity-70">{e.start.toLocaleDateString()}</span>
          </div>
        ))}
        {sorted.length === 0 && <div className="text-center py-8 text-gray-400 italic text-sm">No events found for the selected filters.</div>}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button onClick={handlePrev} className="p-1 hover:bg-gray-200 rounded"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-2 py-1 text-[10px] font-bold text-gray-600 hover:bg-gray-200 rounded">Today</button>
            <button onClick={handleNext} className="p-1 hover:bg-gray-200 rounded"><ChevronRight className="w-4 h-4 text-gray-600" /></button>
          </div>
          <h3 className="text-sm font-bold text-gray-900">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
            {[
              { id: 'month', icon: LayoutGrid, label: 'Month' },
              { id: 'week', icon: CalendarIcon, label: 'Week' },
              { id: 'agenda', icon: List, label: 'Agenda' },
            ].map(v => (
              <button
                key={v.id}
                onClick={() => setView(v.id as CalendarView)}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  view === v.id ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <v.icon className="w-3 h-3" />
                {v.label}
              </button>
            ))}
          </div>
          <select
            value={filterWorkArea}
            onChange={(e) => setFilterWorkArea(e.target.value)}
            className="text-xs font-medium bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="All">All Areas</option>
            {WORK_AREAS.map(area => <option key={area} value={area}>{area}</option>)}
          </select>
        </div>
      </div>

      <div className="p-0">
        {view === 'month' && (
          <div className="grid grid-cols-7">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-[10px] font-bold text-gray-400 uppercase border-b border-r border-gray-100 bg-gray-50">
                {day}
              </div>
            ))}
            {renderMonthView()}
          </div>
        )}
        {view === 'week' && renderWeekView()}
        {view === 'agenda' && renderAgendaView()}
      </div>
    </div>
  );
}
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
