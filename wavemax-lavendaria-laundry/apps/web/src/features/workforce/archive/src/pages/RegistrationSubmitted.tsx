// @ts-nocheck
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle2, Clock, Droplets, ArrowRight, ShieldCheck } from 'lucide-react';

export default function RegistrationSubmitted() {
  const location = useLocation();
  const state = location.state as
    | { refNumber?: string; fullName?: string; requestedRole?: string; locations?: string[]; approver?: string }
    | undefined;

  const refNumber = state?.refNumber || 'REG-2026-0891';
  const fullName = state?.fullName || 'Applicant';
  const role = state?.requestedRole || 'Employee';
  const approver = state?.approver || 'Store Operations Manager';
  const targetLocations = state?.locations?.join(', ') || 'Clean Wave Express — Springfield';

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-600 text-white shadow-xl mb-3">
          <Droplets className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Application Submitted</h1>
        <p className="text-xs text-slate-400 mt-1">Clean Wave Express Onboarding System</p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-100 text-center">
          <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto mb-4 text-teal-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-lg font-bold text-gray-900">Registration Successfully Queued</h2>
          <p className="text-xs text-gray-500 mt-1">
            Thank you, <strong>{fullName}</strong>. Your application has been logged into the platform registry.
          </p>

          {/* Reference Card */}
          <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Registration Reference:</span>
              <span className="font-mono font-bold text-teal-800 bg-teal-100/60 px-2 py-0.5 rounded">
                {refNumber}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Requested Position:</span>
              <span className="font-semibold text-gray-800">{role}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Operating Facility:</span>
              <span className="font-semibold text-gray-800 truncate max-w-[220px]">{targetLocations}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-gray-500">Assigned Reviewer:</span>
              <span className="font-bold text-teal-700">{approver}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Current Access Status:</span>
              <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <Clock className="w-3 h-3" />
                Pending Approval
              </span>
            </div>
          </div>

          {/* Notice Box */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-left flex items-start gap-2.5 text-amber-900">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Access Remains Restricted</strong>
              <span>
                In accordance with security and operations protocol, your account has <strong>not</strong> been automatically activated. You will receive an operational notification once your supervisor reviews and validates your credentials.
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <span>Return to Login Page</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
