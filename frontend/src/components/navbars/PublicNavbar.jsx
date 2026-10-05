import React from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';

export default function PublicNavbar() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm">
      <Link to="/" className="flex items-center gap-2 font-bold text-lg text-slate-800 hover:text-slate-900">
        <HeartPulse className="w-6 h-6 text-rose-600" />
        <span>RaktDan Portal</span>
      </Link>
    </header>
  );
}
