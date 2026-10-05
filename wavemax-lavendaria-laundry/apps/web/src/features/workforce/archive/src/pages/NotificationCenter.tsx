// @ts-nocheck
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import {
  Bell,
  CheckCircle2,
  Clock,
  Filter,
  UserPlus,
  Calendar,
  AlertTriangle,
  FileText,
  Zap,
  ShoppingCart,
  Check,
  ExternalLink,
} from 'lucide-react';
import type { AppNotification } from '../data/workforceData';

export default function NotificationCenter() {
  const { currentUser, notifications, markNotificationAsRead, markAllNotificationsAsRead } = useAppContext();

  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter notifications visible to current user's role
  const userNotifications = notifications.filter((n) => {
    if (!currentUser) return false;
    return n.targetRole.includes(currentUser.role);
  });

  const filteredNotifications = userNotifications.filter((n) => {
    if (filterMode === 'unread' && n.read) return false;
    if (selectedCategory !== 'all' && n.type !== selectedCategory) return false;
    return true;
  });

  const unreadCount = userNotifications.filter((n) => !n.read).length;

  const getTypeIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'registration': return <UserPlus className="w-4 h-4 text-teal-600" />;
      case 'leave': return <Calendar className="w-4 h-4 text-purple-600" />;
      case 'attendance': return <Clock className="w-4 h-4 text-amber-600" />;
      case 'schedule': return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'timesheet': return <FileText className="w-4 h-4 text-indigo-600" />;
      case 'machine': return <Zap className="w-4 h-4 text-red-600" />;
      case 'procurement': return <ShoppingCart className="w-4 h-4 text-amber-600" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Center</h1>
          <p className="text-sm text-gray-500 mt-1">
            Operational alerts, staffing messages, workflow changes, and approval notifications
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsAsRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-gray-50 text-teal-700 text-xs font-semibold rounded-lg border border-teal-200 shadow-2xs transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark All as Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Stats Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Status Filters */}
        <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50 self-start">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              filterMode === 'all'
                ? 'bg-white text-teal-800 shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Messages ({userNotifications.length})
          </button>
          <button
            onClick={() => setFilterMode('unread')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              filterMode === 'unread'
                ? 'bg-white text-teal-800 shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Unread Only ({unreadCount})
          </button>
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-600">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded-lg py-1 px-2.5 outline-teal-600 cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="registration">Registrations & Onboarding</option>
            <option value="leave">Leave & Time Off</option>
            <option value="attendance">Attendance & Punctuality</option>
            <option value="schedule">Schedules & Shifts</option>
            <option value="timesheet">Timesheets</option>
            <option value="machine">Machine Telemetry</option>
            <option value="procurement">Procurement & Restock</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs divide-y divide-gray-100 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-teal-600 mx-auto mb-2 opacity-80" />
            <h3 className="text-sm font-semibold text-gray-900">All caught up!</h3>
            <p className="text-xs text-gray-500 mt-0.5">No notifications match your current filter criteria.</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                notif.read ? 'bg-white hover:bg-gray-50/70' : 'bg-teal-50/30 hover:bg-teal-50/50'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                  {getTypeIcon(notif.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-xs font-bold ${notif.read ? 'text-gray-800' : 'text-gray-900'}`}>
                      {notif.title}
                    </h4>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0"></span>
                    )}
                    {notif.actionRequired && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                        Action Required
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 mt-1 leading-normal">{notif.message}</p>

                  <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-400">
                    <span>{notif.timestamp}</span>
                    <span className="capitalize text-gray-500 font-medium">{notif.type}</span>
                    {notif.linkPath && (
                      <Link
                        to={notif.linkPath}
                        onClick={() => markNotificationAsRead(notif.id)}
                        className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold"
                      >
                        <span>View Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {!notif.read && (
                <button
                  onClick={() => markNotificationAsRead(notif.id)}
                  className="text-xs font-medium text-gray-400 hover:text-teal-700 shrink-0 p-1"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
