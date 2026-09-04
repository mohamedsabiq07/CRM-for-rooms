import React, { useState } from 'react';
import { X, Calculator, Calendar, Coins, ArrowRight, Copy, Check } from 'lucide-react';
import { calculateProRataRent } from '../utils/rentCalculator';

interface RentCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RentCalculatorModal: React.FC<RentCalculatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '.');

  const [monthlyRent, setMonthlyRent] = useState('800');
  const [moveInDate, setMoveInDate] = useState(todayFormatted);
  const [copied, setCopied] = useState(false);

  const result = calculateProRataRent(Number(monthlyRent) || 0, moveInDate);

  const handleCopyQuote = () => {
    if (!result) return;
    const text = `Room Rent Quote:\n💰 Monthly Rate: AED ${result.monthlyRent}\n📅 Move-in Date: ${moveInDate}\n📊 Daily Rate: AED ${result.dailyRate}/day\n👉 Pro-Rated Rent for remaining ${result.daysRemainingInMonth} days: AED ${result.proRataAmount}\nNext full rent starts: ${result.calendarMonthNextBillingDate}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-800 text-white rounded-lg border border-slate-700">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Pro-Rata Rent Calculator</h3>
              <p className="text-xs text-slate-400">Mid-month arrivals & flexible stay quotes</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Standard Monthly Rent (AED)
              </label>
              <input
                type="number"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value)}
                placeholder="800"
                className="w-full text-sm font-bold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Move-In Date (DD.MM.YYYY)
              </label>
              <input
                type="text"
                value={moveInDate}
                onChange={(e) => setMoveInDate(e.target.value)}
                placeholder="18.09.2026"
                className="w-full text-sm font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
              />
            </div>
          </div>

          {/* Results Summary */}
          {result && (
            <div className="space-y-3 pt-2">
              
              {/* Option 1: Calendar Pro-Rata */}
              <div className="bg-slate-50 border border-slate-300 rounded-xl p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800 bg-slate-200 px-2 py-0.5 rounded-full">
                  Option 1: Pro-Rated Calendar Month
                </span>
                <div className="mt-2.5 flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-black text-slate-900">
                      AED {result.proRataAmount}
                    </span>
                    <span className="text-xs text-slate-500 block">
                      For remaining {result.daysRemainingInMonth} days (@ AED {result.dailyRate}/day)
                    </span>
                  </div>
                  <span className="text-xs text-right text-slate-600">
                    Next cycle starts:<br />
                    <strong className="text-slate-900">{result.calendarMonthNextBillingDate}</strong>
                  </span>
                </div>
              </div>

              {/* Option 2: 30-Day Rolling Cycle */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                  Option 2: 30-Day Rolling Cycle
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <div>
                    <span className="text-lg font-bold text-slate-900">
                      AED {result.monthlyRent}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Full 30-day stay from move-in date
                    </span>
                  </div>
                  <span className="text-xs text-right text-slate-600">
                    Due next on:<br />
                    <strong className="text-slate-900">{result.thirtyDayCycleEndDate}</strong>
                  </span>
                </div>
              </div>

              {/* Copy Quote Button */}
              <button
                onClick={handleCopyQuote}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied Quote to Clipboard!' : 'Copy Customer Quote'}</span>
              </button>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
