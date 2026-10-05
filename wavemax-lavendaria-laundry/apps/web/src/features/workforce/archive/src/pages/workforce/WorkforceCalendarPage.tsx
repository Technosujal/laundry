// @ts-nocheck
import React from 'react';
import WorkforceCalendar from '../../components/workforce/WorkforceCalendar';
import CalendarEventDrawer from '../../components/workforce/CalendarEventDrawer';
import { useWorkforceCalendar } from '../../hooks/useWorkforceCalendar';
import { useState } from 'react';
import { type CalendarEvent } from '../../components/workforce/WorkforceCalendar';

export default function WorkforceCalendarPage() {
  const { events } = useWorkforceCalendar();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workforce Calendar</h1>
          <p className="text-sm text-gray-500 mt-1">Plan shifts, monitor leave and manage workforce coverage.</p>
        </div>
      </div>

      <WorkforceCalendar
        events={events}
        onEventClick={setSelectedEvent}
      />

      <CalendarEventDrawer
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
