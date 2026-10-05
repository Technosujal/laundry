// @ts-nocheck
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { locations } from '../data/dashboardData';
import {
  Droplets,
  User,
  Shield,
  MapPin,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Search,
  AlertCircle,
  FileCheck,
  Camera,
} from 'lucide-react';
import { photoStorageAdapter } from '../services/photoStorageAdapter';

export default function Register() {
  const { submitRegistration } = useAppContext();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Personal Info & Photo
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoFileError, setPhotoFileError] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoFileError('Only JPG, JPEG, PNG, or WebP images are permitted.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setPhotoFileError('Photo exceeds 2MB file size limit.');
      return;
    }

    setPhotoFileError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Step 2: Role
  const [role, setRole] = useState<'Manager' | 'Employee'>('Employee');

  // Step 3: Location
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>(['loc-1']);

  // Step 4: Work Info
  const [employmentType, setEmploymentType] = useState<'Full Time' | 'Part Time' | 'Contractor'>('Full Time');
  const [preferredShift, setPreferredShift] = useState<'Morning' | 'Afternoon' | 'Evening' | 'Flexible'>('Morning');
  const [proposedStartDate, setProposedStartDate] = useState('');
  const [message, setMessage] = useState('');

  // Step 5: Data Acknowledgement
  const [acknowledged, setAcknowledged] = useState(false);

  // Location search filter
  const filteredLocations = locations.filter((loc) =>
    loc.name.toLowerCase().includes(searchLocation.toLowerCase())
  );

  const toggleLocation = (locId: string) => {
    if (role === 'Employee') {
      // Exactly one location for Employee
      setSelectedLocations([locId]);
    } else {
      // One or more for Manager
      if (selectedLocations.includes(locId)) {
        if (selectedLocations.length > 1) {
          setSelectedLocations(selectedLocations.filter((id) => id !== locId));
        }
      } else {
        setSelectedLocations([...selectedLocations, locId]);
      }
    }
  };

  // Step validation
  const validateStep1 = () => {
    if (!fullName.trim()) return 'Please enter your full name.';
    if (!email.trim() || !email.includes('@')) return 'Please enter a valid work email address.';
    if (!phone.trim()) return 'Please enter a contact mobile number.';
    if (!password || password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirmPassword) return 'Password and Confirm Password do not match.';
    return null;
  };

  const validateStep3 = () => {
    if (selectedLocations.length === 0) return 'Please select at least one primary work location.';
    return null;
  };

  const validateStep4 = () => {
    if (!proposedStartDate) return 'Please select a proposed start date.';
    return null;
  };

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
      setStep(2);
    } else if (step === 2) {
      // If switching to employee, ensure single location
      if (role === 'Employee' && selectedLocations.length > 1) {
        setSelectedLocations([selectedLocations[0]]);
      }
      setStep(3);
    } else if (step === 3) {
      const err = validateStep3();
      if (err) { setError(err); return; }
      setStep(4);
    } else if (step === 4) {
      const err = validateStep4();
      if (err) { setError(err); return; }
      setStep(5);
    }
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) setStep((step - 1) as any);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acknowledged) {
      setError('You must acknowledge the operational data policy before submitting.');
      return;
    }

    const locNames = selectedLocations.map(
      (id) => locations.find((l) => l.id === id)?.name || id
    );

    const refNumber = submitRegistration({
      fullName,
      email,
      phone,
      requestedRole: role,
      requestedLocationIds: selectedLocations,
      requestedLocationNames: locNames,
      employmentType,
      preferredShift,
      proposedStartDate,
      message,
    });

    if (photoDataUrl) {
      photoStorageAdapter.savePhoto(refNumber, photoDataUrl);
    }

    // Navigate to submitted screen with refNumber in state
    navigate('/register-submitted', {
      state: {
        refNumber,
        fullName,
        requestedRole: role,
        locations: locNames,
        approver: role === 'Manager' ? 'Executive Owner' : 'Store Manager',
      },
    });
  };

  const approvalDestination =
    role === 'Manager'
      ? 'Executive Owner (Eleanor Vance)'
      : `Store Manager for ${selectedLocations
          .map((id) => locations.find((l) => l.id === id)?.name)
          .join(', ')}`;

  return (
    <div className="min-h-screen bg-slate-900 py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-600 text-white shadow-lg mb-3">
          <Droplets className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">New Member Registration</h1>
        <p className="text-xs text-slate-400 mt-1">
          Apply to join the Clean Wave Express laundromat operational team
        </p>
      </div>

      {/* Progress Steps Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl mb-6">
        <div className="grid grid-cols-5 gap-2 text-center">
          {[
            { num: 1, label: 'Personal', icon: User },
            { num: 2, label: 'Role', icon: Shield },
            { num: 3, label: 'Location', icon: MapPin },
            { num: 4, label: 'Work Info', icon: Briefcase },
            { num: 5, label: 'Review', icon: FileCheck },
          ].map((s) => (
            <div
              key={s.num}
              className={`p-2 rounded-xl border text-center transition-all ${
                step === s.num
                  ? 'bg-teal-600 text-white border-teal-500 shadow-md'
                  : step > s.num
                  ? 'bg-slate-800/80 text-teal-400 border-teal-800'
                  : 'bg-slate-800/40 text-slate-500 border-slate-700'
              }`}
            >
              <div className="text-[11px] font-bold">Step {s.num}</div>
              <div className="text-xs font-semibold truncate mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Wizard Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Personal Information</h2>
                <p className="text-xs text-gray-500">Please provide your legal contact details</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Jordan Blake"
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 outline-teal-600"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Work Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jordan.b@cleanwave.com"
                    className="w-full text-xs border border-gray-300 rounded-lg p-2.5 outline-teal-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full text-xs border border-gray-300 rounded-lg p-2.5 outline-teal-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full text-xs border border-gray-300 rounded-lg p-2.5 outline-teal-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full text-xs border border-gray-300 rounded-lg p-2.5 outline-teal-600"
                    required
                  />
                </div>
              </div>

              {/* Profile Photo (Optional) */}
              <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-gray-800">Profile Photo (Optional)</label>
                    <p className="text-[11px] text-gray-500">
                      Upload a headshot (JPG, PNG, or WebP, max 2MB). Displayed on live workforce rosters and shift timesheets.
                    </p>
                  </div>
                  {photoDataUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoDataUrl(null)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3.5">
                  {photoDataUrl ? (
                    <img
                      src={photoDataUrl}
                      alt="Profile preview"
                      className="w-12 h-12 rounded-full object-cover border-2 border-teal-500 shadow-2xs shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 border border-teal-200">
                      <Camera className="w-5 h-5 text-teal-600" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <input
                      type="file"
                      id="profile-photo-upload"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      className="text-xs text-gray-600 file:mr-2.5 file:py-1 file:px-3 file:rounded-lg file:border file:border-gray-300 file:text-xs file:font-semibold file:bg-white file:text-gray-700 hover:file:bg-gray-100 cursor-pointer"
                    />
                    {photoFileError && (
                      <p className="text-[11px] text-rose-600 font-semibold">{photoFileError}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Role Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Select Operational Role</h2>
                <p className="text-xs text-gray-500">
                  Note: Executive Owner accounts are provisioned via administrative governance and cannot self-register.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('Employee')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    role === 'Employee'
                      ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-600/30'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-gray-900">Front-line Employee</span>
                    {role === 'Employee' && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                  </div>
                  <p className="text-xs text-gray-600">
                    Counter attendant, wash-dry-fold production specialist, or delivery contractor.
                  </p>
                  <div className="mt-3 text-[11px] text-teal-700 font-semibold">
                    Approver: Local Store Manager
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('Manager')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    role === 'Manager'
                      ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-600/30'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-gray-900">Store Operations Manager</span>
                    {role === 'Manager' && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                  </div>
                  <p className="text-xs text-gray-600">
                    Shift scheduling, machine health monitoring, daily capacity, and staff management.
                  </p>
                  <div className="mt-3 text-[11px] text-teal-700 font-semibold">
                    Approver: Executive Owner
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Laundry Location */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  {role === 'Employee' ? 'Select Primary Work Location' : 'Select Requested Store Locations'}
                </h2>
                <p className="text-xs text-gray-500">
                  {role === 'Employee'
                    ? 'Employees must choose exactly 1 primary operating facility.'
                    : 'Managers may request oversight across 1 or more laundromat hubs.'}
                </p>
              </div>

              {/* Searchable Dropdown / List */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  placeholder="Search laundromat facility by name..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg outline-teal-600"
                />
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {filteredLocations.map((loc) => {
                  const isSelected = selectedLocations.includes(loc.id);
                  return (
                    <div
                      key={loc.id}
                      onClick={() => toggleLocation(loc.id)}
                      className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/70'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin className={`w-4 h-4 ${isSelected ? 'text-teal-600' : 'text-gray-400'}`} />
                        <div>
                          <div className="text-xs font-bold text-gray-900">{loc.name}</div>
                          <div className="text-[11px] text-gray-500">
                            Managed by: {loc.id === 'loc-1' ? 'Anita Ramirez' : 'Marcus Chen'}
                          </div>
                        </div>
                      </div>
                      <input
                        type={role === 'Employee' ? 'radio' : 'checkbox'}
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 text-teal-600 accent-teal-600"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600">
                <span>Selected: <strong>{selectedLocations.length} location(s)</strong></span>
                <span className="block text-[11px] text-teal-700 mt-0.5">
                  Application will be routed to: <strong>{approvalDestination}</strong>
                </span>
              </div>
            </div>
          )}

          {/* Step 4: Work Information */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Work & Shift Information</h2>
                <p className="text-xs text-gray-500">Specify your availability and employment preferences</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Employment Type *</label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value as any)}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2.5 outline-teal-600 bg-white"
                  >
                    <option value="Full Time">Full Time (W2 · 35–40 hrs/wk)</option>
                    <option value="Part Time">Part Time (W2 · 15–25 hrs/wk)</option>
                    <option value="Contractor">Contractor (1099 / Flexible)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Preferred Shift *</label>
                  <select
                    value={preferredShift}
                    onChange={(e) => setPreferredShift(e.target.value as any)}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2.5 outline-teal-600 bg-white"
                  >
                    <option value="Morning">Morning Shift (7:30 AM – 3:30 PM)</option>
                    <option value="Afternoon">Afternoon Shift (12:00 PM – 8:00 PM)</option>
                    <option value="Evening">Evening / Closing Shift (3:00 PM – 10:00 PM)</option>
                    <option value="Flexible">Flexible / Rotating</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Proposed Start Date *</label>
                <input
                  type="date"
                  value={proposedStartDate}
                  onChange={(e) => setProposedStartDate(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 outline-teal-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Optional Message to {role === 'Manager' ? 'Executive Owner' : 'Store Manager'}
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share relevant commercial laundry or retail customer service experience..."
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 outline-teal-600"
                ></textarea>
              </div>
            </div>
          )}

          {/* Step 5: Review and Submit */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Review Application Details</h2>
                <p className="text-xs text-gray-500">Confirm your registration before sending to the approver</p>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-xs space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-400 block">Applicant:</span>
                    <strong className="text-gray-900">{fullName}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Contact:</span>
                    <span className="text-gray-800">{email} · {phone}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                  <div>
                    <span className="text-gray-400 block">Requested Role:</span>
                    <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold bg-teal-100 text-teal-800">
                      {role}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Employment Type:</span>
                    <span className="text-gray-800 font-semibold">{employmentType} ({preferredShift})</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <span className="text-gray-400 block">Target Facilities:</span>
                  <span className="text-gray-800 font-medium">
                    {selectedLocations
                      .map((id) => locations.find((l) => l.id === id)?.name)
                      .join('; ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                  <div>
                    <span className="text-gray-400 block">Start Date:</span>
                    <strong className="text-gray-900">{proposedStartDate}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Approval Destination:</span>
                    <strong className="text-teal-700">{approvalDestination}</strong>
                  </div>
                </div>

                {message && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-gray-400 block">Note:</span>
                    <p className="text-gray-600 italic">"{message}"</p>
                  </div>
                )}
              </div>

              {/* Data-use Acknowledgement */}
              <label className="flex items-start gap-2.5 p-3 rounded-lg border border-teal-200 bg-teal-50/40 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="w-4 h-4 text-teal-600 accent-teal-600 rounded mt-0.5"
                />
                <span className="text-gray-700">
                  I certify that all personal and employment details submitted are accurate, and I acknowledge that Clean Wave Express operations data access is subject to supervisor approval and confidentiality guidelines.
                </span>
              </label>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="text-xs font-semibold text-gray-500 hover:text-gray-800"
              >
                Cancel to Sign In
              </Link>
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer ml-auto"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-md transition-colors cursor-pointer ml-auto"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Application</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
