// @ts-nocheck
import { useNavigate } from 'react-router-dom';
import { Home, ChevronLeft } from 'lucide-react';

interface ModuleLandingHeaderProps {
  title: string;
  description: string;
  moduleName: string;
}

export default function ModuleLandingHeader({ title, description, moduleName }: ModuleLandingHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-teal-600 mb-1">
          <button
            onClick={() => navigate('/home')}
            className="p-1 -ml-1 hover:bg-teal-50 rounded-full transition-colors"
            title="Back to Operations Hub"
          >
            <Home className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold uppercase tracking-wider">{moduleName}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
