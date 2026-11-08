import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Check, Zap, Shield, Sparkles, CreditCard, ArrowRight } from 'lucide-react';
import { closeUpgradeModal, upgradeUserPlanThunk } from '../store/authSlice.js';
import { PRICING_PLANS } from '../data/plans.js';

export default function PlanUpgradeModal() {
  const dispatch = useDispatch();
  const { user, isUpgradeModalOpen, upgradeTargetPlan, loading } = useSelector((state) => state.auth);
  const [selectedPlanId, setSelectedPlanId] = useState(upgradeTargetPlan || 'pro');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  if (!isUpgradeModalOpen) return null;

  const currentPlanId = user?.planId || (user?.plan?.toLowerCase().includes('starter') && !user?.plan?.toLowerCase().includes('free') ? 'starter' : user?.plan?.toLowerCase().includes('pro') ? 'pro' : user?.plan?.toLowerCase().includes('unlimited') ? 'unlimited' : 'free');

  const selectedPlan = PRICING_PLANS.find((p) => p.id === selectedPlanId) || PRICING_PLANS[2];

  const handleConfirmUpgrade = async () => {
    if (selectedPlanId === currentPlanId) return;
    setIsProcessing(true);
    try {
      await dispatch(upgradeUserPlanThunk({ planId: selectedPlanId })).unwrap();
      setSuccessMessage(`Successfully updated to ${selectedPlan.name}! Your daily credits are now active.`);
      setTimeout(() => {
        setSuccessMessage(null);
        dispatch(closeUpgradeModal());
      }, 1800);
    } catch {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => !isProcessing && dispatch(closeUpgradeModal())}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-700 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[11px] font-semibold uppercase tracking-wider mb-1.5">
                <Sparkles className="w-3 h-3" />
                Unlock High-Velocity B2B Pipeline
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-display text-white">
                Choose Your Daily Intelligence Plan
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                Every plan includes verified work emails, direct mobile numbers, and fresh daily replenished credits.
              </p>
            </div>

            <button
              type="button"
              onClick={() => dispatch(closeUpgradeModal())}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 text-center text-xs font-semibold text-emerald-800 flex items-center justify-center gap-2 shrink-0">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Plans Grid (Scrollable if height is constrained) */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {PRICING_PLANS.map((plan) => {
              const isCurrent = currentPlanId === plan.id;
              const isSelected = selectedPlanId === plan.id;

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`relative rounded-xl p-3.5 sm:p-4 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/20 shadow-md ring-2 ring-orange-400/20'
                      : isCurrent
                      ? 'border-slate-300 bg-slate-50/60'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase bg-orange-600 text-white shadow-xs whitespace-nowrap">
                      Most Popular 🔥
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-sm font-bold text-slate-900 font-display">
                        {plan.name}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="mb-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">
                          {plan.priceDisplay}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {plan.billingPeriod}
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-orange-600 mt-0.5 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-orange-500 shrink-0" />
                        <span>{plan.dailyCreditsDisplay}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 mb-2.5 leading-snug">
                      {plan.tagline}
                    </p>

                    <div className="border-t border-slate-100 pt-2.5 space-y-1.5 text-[11px] text-slate-600">
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 leading-tight">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3.5 pt-2">
                    <button
                      type="button"
                      disabled={isCurrent}
                      className={`w-full py-1.5 px-2.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                        isCurrent
                          ? 'bg-slate-100 text-slate-500 cursor-default'
                          : isSelected
                          ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-xs'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {isCurrent ? 'Current Plan' : isSelected ? 'Selected' : 'Choose Plan'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Checkout & Upgrade Confirmation Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Target Plan Selection</div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>{selectedPlan.name} · {selectedPlan.priceDisplay} {selectedPlan.billingPeriod}</span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-semibold">
                    {selectedPlan.dailyCreditsDisplay}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => dispatch(closeUpgradeModal())}
                disabled={isProcessing}
                className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUpgrade}
                disabled={isProcessing || selectedPlanId === currentPlanId}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Activating {selectedPlan.name}...</span>
                  </>
                ) : selectedPlanId === currentPlanId ? (
                  <span>Already on this plan</span>
                ) : (
                  <>
                    <span>Confirm & Activate ({selectedPlan.priceDisplay})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 text-[11px] text-slate-500 pb-1">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Instant activation & zero downtime</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-orange-500" />
              <span>Daily credits refresh every 24 hours</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

