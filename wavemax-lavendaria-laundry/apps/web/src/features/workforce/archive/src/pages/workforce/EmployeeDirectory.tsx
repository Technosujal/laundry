// @ts-nocheck
import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { locations } from '../../data/dashboardData';
import {
  Users,
  Search,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  X,
  Briefcase,
  Camera,
  Trash2,
  Clock,
  FileText,
  CalendarClock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { DirectoryEmployee } from '../../data/workforceData';
import Avatar from '../../components/workforce/Avatar';
import { photoStorageAdapter } from '../../services/photoStorageAdapter';

export default function EmployeeDirectory() {
  const {
    currentUser,
    employeeDirectory,
    leaveBalances,
    attendanceRecords,
    timesheets,
  } = useAppContext();
  const role = currentUser?.role || 'owner';

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEmp, setSelectedEmp] = useState<DirectoryEmployee | null>(null);
  const [drawerPhoto, setDrawerPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // When opening employee drawer, load any stored photo
  const handleOpenDrawer = (emp: DirectoryEmployee) => {
    setSelectedEmp(emp);
    setPhotoError(null);
    photoStorageAdapter.getPhoto(emp.employeeId).then((cached) => {
      setDrawerPhoto(cached || emp.photoUrl || null);
    });
  };

  // Filter employees
  const filteredEmployees = employeeDirectory.filter((emp) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = emp.name.toLowerCase().includes(q);
      const matchRole = emp.role.toLowerCase().includes(q);
      const matchId = emp.employeeId.toLowerCase().includes(q);
      if (!matchName && !matchRole && !matchId) return false;
    }
    if (roleFilter !== 'all' && emp.employmentType !== roleFilter) return false;
    if (locationFilter !== 'all' && emp.primaryLocationId !== locationFilter) return false;
    if (statusFilter !== 'all' && emp.status !== statusFilter) return false;
    return true;
  });

  // Handle Photo Upload in Drawer
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedEmp) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('Please upload a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('File size exceeds 2MB limit.');
      return;
    }

    setPhotoError(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      await photoStorageAdapter.savePhoto(selectedEmp.employeeId, dataUrl);
      setDrawerPhoto(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    if (!selectedEmp) return;
    await photoStorageAdapter.deletePhoto(selectedEmp.employeeId);
    setDrawerPhoto(null);
  };

  // Profile data for selected employee
  const empLeaveBalances = selectedEmp ? leaveBalances[selectedEmp.employeeId] || [] : [];
  const empAttendance = selectedEmp ? attendanceRecords.find(a => a.employeeId === selectedEmp.employeeId) : null;
  const empTimesheets = selectedEmp ? timesheets.filter(t => t.employeeId === selectedEmp.employeeId) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Directory</h1>
          <p className="text-sm text-gray-500 mt-1">
            Official operational team registry, profiles, credentials, and real-time station assignments
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-2xs">
          <Users className="w-4 h-4 text-teal-600" />
          <span>
            Showing <strong>{filteredEmployees.length}</strong> of {employeeDirectory.length} team members
          </span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, role, ID..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg outline-teal-600"
            />
          </div>

          {/* Employment Type Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full text-xs font-medium border border-gray-300 rounded-lg p-2 outline-teal-600 bg-white"
            >
              <option value="all">All Employment Types</option>
              <option value="Full Time">Full Time (W2)</option>
              <option value="Part Time">Part Time (W2)</option>
              <option value="Contractor">Contractor (1099)</option>
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full text-xs font-medium border border-gray-300 rounded-lg p-2 outline-teal-600 bg-white"
            >
              <option value="all">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs font-medium border border-gray-300 rounded-lg p-2 outline-teal-600 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Team Member</th>
                <th className="py-3 px-4">ID & Type</th>
                <th className="py-3 px-4">Primary Facility</th>
                <th className="py-3 px-4">Scheduled Shift</th>
                <th className="py-3 px-4">Direct Manager</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-xs">
                    No team members found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-teal-50/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={emp.photoUrl}
                          name={emp.name}
                          employeeId={emp.employeeId}
                          size="md"
                          showStatus
                          status={emp.status as any}
                        />
                        <div>
                          <span className="font-semibold text-gray-900 block leading-tight">{emp.name}</span>
                          <span className="text-xs text-gray-500 mt-0.5">{emp.role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-bold text-gray-900 block">{emp.employeeId}</span>
                      <span className="text-[11px] text-gray-500">{emp.employmentType}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-700 font-medium">
                      {emp.primaryLocationName}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600">
                      {emp.currentShift}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-700">
                      {emp.managerName}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          emp.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : emp.status === 'On Leave'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          emp.status === 'Active' ? 'bg-emerald-500' :
                          emp.status === 'On Leave' ? 'bg-amber-500' : 'bg-gray-400'
                        }`} />
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenDrawer(emp)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100/80 rounded-lg border border-teal-200 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Profile</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Detail Slide-over Drawer */}
      {selectedEmp && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex justify-end">
          <div className="bg-white w-full max-w-lg h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between animate-fadeIn">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-600" />
                  <h2 className="text-base font-bold text-gray-900">Comprehensive Employee Record</h2>
                </div>
                <button
                  onClick={() => setSelectedEmp(null)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Card with Photo and Upload Actions */}
              <div className="p-5 bg-gradient-to-br from-teal-50/60 to-cyan-50/40 rounded-2xl border border-teal-200/80 shadow-2xs">
                <div className="flex items-start gap-4">
                  <div className="relative group">
                    <Avatar
                      src={drawerPhoto || undefined}
                      name={selectedEmp.name}
                      employeeId={selectedEmp.employeeId}
                      size="xl"
                      showStatus
                      status={selectedEmp.status as any}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Upload or change profile photo"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900 truncate">{selectedEmp.name}</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                        {selectedEmp.status}
                      </span>
                    </div>
                    <p className="text-xs text-teal-900 font-semibold mt-0.5">{selectedEmp.role}</p>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 font-mono mt-1">
                      <span>ID: {selectedEmp.employeeId}</span>
                      <span>•</span>
                      <span>{selectedEmp.employmentType}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoUpload}
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 bg-white px-2.5 py-1 rounded-md border border-gray-300 shadow-2xs flex items-center gap-1 hover:border-teal-400 transition-all cursor-pointer"
                      >
                        <Camera className="w-3 h-3" />
                        <span>Update Photo</span>
                      </button>
                      {drawerPhoto && (
                        <button
                          onClick={handleRemovePhoto}
                          className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 bg-white px-2.5 py-1 rounded-md border border-gray-300 shadow-2xs flex items-center gap-1 hover:border-rose-400 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    {photoError && <p className="text-[10px] text-rose-600 mt-1 font-semibold">{photoError}</p>}
                  </div>
                </div>
              </div>

              {/* General Employment Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Primary Hub</span>
                  <div className="flex items-center gap-1.5 text-gray-800 font-medium mt-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{selectedEmp.primaryLocationName}</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Assigned Shift</span>
                  <div className="flex items-center gap-1.5 text-gray-800 font-medium mt-1">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{selectedEmp.currentShift}</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Start Date</span>
                  <span className="text-gray-900 font-semibold block mt-1">{selectedEmp.startDate}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Manager</span>
                  <span className="text-gray-900 font-semibold block mt-1">{selectedEmp.managerName}</span>
                </div>
              </div>

              {/* Contact Information */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 space-y-2 text-xs">
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Direct Contacts</span>
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <a href={`mailto:${selectedEmp.email}`} className="hover:text-teal-700 hover:underline">
                    {selectedEmp.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <a href={`tel:${selectedEmp.phone}`} className="hover:text-teal-700 hover:underline">
                    {selectedEmp.phone}
                  </a>
                </div>
              </div>

              {/* Real-Time Attendance Overview */}
              <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-600" />
                    <h4 className="text-xs font-bold text-gray-900">Today's Attendance Status</h4>
                  </div>
                  <Link
                    to="/workforce/attendance"
                    className="text-[11px] font-semibold text-teal-700 hover:underline flex items-center gap-0.5"
                  >
                    Console <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {empAttendance ? (
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <span className="text-[10px] text-gray-400 block">Status</span>
                      <span className="font-bold text-teal-700">{empAttendance.status}</span>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <span className="text-[10px] text-gray-400 block">Clock In</span>
                      <span className="font-bold text-gray-900">{empAttendance.clockInTime || '—'}</span>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <span className="text-[10px] text-gray-400 block">Hours Today</span>
                      <span className="font-bold text-gray-900">{empAttendance.totalHoursWorked}h</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No shift punched for today's active schedule.</p>
                )}
              </div>

              {/* Leave Balances */}
              {empLeaveBalances.length > 0 && (
                <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarClock className="w-4 h-4 text-teal-600" />
                      <h4 className="text-xs font-bold text-gray-900">Accrued Leave Balances</h4>
                    </div>
                    <Link
                      to="/workforce/leave"
                      className="text-[11px] font-semibold text-teal-700 hover:underline flex items-center gap-0.5"
                    >
                      Requests <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {empLeaveBalances.map((bal, idx) => (
                      <div key={idx} className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
                        <span className="text-gray-600 font-medium">{bal.type}</span>
                        <span className="font-bold text-gray-900">{bal.availableDays}d</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <Link
                to="/workforce/timesheets"
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline inline-flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View All Timesheets</span>
              </Link>
              <button
                onClick={() => setSelectedEmp(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
