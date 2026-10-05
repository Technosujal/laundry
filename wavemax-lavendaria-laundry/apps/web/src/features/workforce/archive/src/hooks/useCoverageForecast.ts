// @ts-nocheck
import { useAppContext } from '../context/AppContext';

export interface DailyCoverage {
  date: Date;
  dayName: string;
  required: number;
  scheduled: number;
  available: number;
  gap: number;
  status: 'Healthy' | 'Attention' | 'Critical';
  explanation?: string;
}

export function useCoverageForecast() {
  const { schedules, leaveRequests } = useAppContext();

  // Deterministic requirements by day of week (0=Sun, 6=Sat)
  const requirements = [6, 8, 8, 10, 9, 12, 11];

  const getCoverageForDate = (date: Date): DailyCoverage => {
    const dayOfWeek = date.getDay();
    const required = requirements[dayOfWeek];

    // Count shifts starting on this date
    const scheduled = schedules.filter(s => {
      const sDate = new Date(s.date);
      return sDate.toDateString() === date.toDateString();
    }).length;

    // Subtract approved leave
    const leaveCount = leaveRequests.filter(l =>
      l.status === 'Approved' &&
      new Date(l.startDate) <= date &&
      new Date(l.endDate) >= date
    ).length;

    const available = Math.max(0, scheduled - leaveCount);
    const gap = required - available;

    let status: DailyCoverage['status'] = 'Healthy';
    if (gap > 0 && gap <= 2) status = 'Attention';
    if (gap > 2) status = 'Critical';

    let explanation: string | undefined;
    if (gap > 0) {
      explanation = `Gap of ${gap} staff. Cause: ${leaveCount > 0 ? 'approved leave' : 'unfilled shifts'}.`;
    }

    return {
      date,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      required,
      scheduled,
      available,
      gap,
      status,
      explanation,
    };
  };

  const forecast: DailyCoverage[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);
    forecast.push(getCoverageForDate(d));
  }

  return { forecast };
}
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
