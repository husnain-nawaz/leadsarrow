import React, { useState, useEffect } from 'react';
import { X, Pencil, Layers, Loader2, Lock } from 'lucide-react';
import { updateCustomLeadOnServerApi } from '../services/api.js';
import useBodyScrollLock from '../hooks/useBodyScrollLock.js';

export default function EditCustomLeadModal({ lead, clusters = [], isOpen, onClose, onSave }) {
  const [form, setForm] = useState({
    clusterName: '',
    companyName: '',
    domain: '',
    industry: 'Enterprise Software & SaaS',
    employeeRange: '51-200',
    revenueRange: '$10M - $50M',
    country: 'United States',
    city: 'San Francisco, CA',
    contactName: '',
    contactTitle: 'VP of Engineering',
    seniority: 'VP',
    department: 'Engineering & Technical',
    contactEmail: '',
    contactPhone: '+1 (415) 890-4321',
    verificationStatus: 'Verified',
    fundingStage: 'Series B',
    buyingIntentScore: 88
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (lead) {
      setForm({
        clusterName: lead.clusterName || lead.cluster || 'General',
        companyName: lead.companyName || '',
        domain: lead.domain || '',
        industry: lead.industry || 'Enterprise Software & SaaS',
        employeeRange: lead.employeeRange || '51-200',
        revenueRange: lead.revenueRange || '$10M - $50M',
        country: lead.country || 'United States',
        city: lead.city || 'San Francisco, CA',
        contactName: lead.contactName || '',
        contactTitle: lead.contactTitle || 'VP of Engineering',
        seniority: lead.seniority || 'VP',
        department: lead.department || 'Engineering & Technical',
        contactEmail: lead.contactEmail || '',
        contactPhone: lead.contactPhone || '+1 (415) 890-4321',
        verificationStatus: lead.verificationStatus || 'Verified',
        fundingStage: lead.fundingStage || 'Series B',
        buyingIntentScore: lead.buyingIntentScore ?? 88
      });
      setErrorMsg(null);
    }
  }, [lead, isOpen]);

  // Prevent background scrolling while edit modal is open
  useBodyScrollLock(Boolean(isOpen && lead));

  if (!isOpen || !lead) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setErrorMsg(null);

    try {
      const response = await updateCustomLeadOnServerApi(lead.id, form);
      const updated = response.lead || { ...lead, ...form };
      if (onSave) onSave(updated);
      onClose();
    } catch (err) {
      console.error('Failed to update custom lead:', err);
      setErrorMsg(err.message || 'Failed to save changes to this custom lead');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={() => !isSaving && onClose()} />

      <div className="relative z-10 w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900 dark:text-slate-100 transition-colors">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display leading-tight">
                Edit Private Custom Lead
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Saved privately to your personal workspace (isolated & secure)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs overscroll-contain">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs">
              {errorMsg}
            </div>
          )}

          {/* Assigned Cluster (Fixed & Non-Editable to Prevent Mistaken Reassignment) */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                <span>Assigned Cluster / Target Group</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-700/60 px-2 py-0.5 rounded-md">
                <Lock className="w-3 h-3 text-slate-400 dark:text-slate-400" />
                <span>Fixed Cluster</span>
              </span>
            </div>

            <div className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between text-slate-900 dark:text-white select-none shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="font-bold text-xs">{form.clusterName || lead.clusterName || 'General'}</span>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                Private Cluster
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Cluster assignment is locked to "{form.clusterName || lead.clusterName}" so this lead remains strictly within its designated cluster.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={form.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                placeholder="e.g. Synthetix Cloud Corp"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-orange-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Website Domain *</label>
              <input
                type="text"
                required
                value={form.domain}
                onChange={(e) => handleChange('domain', e.target.value)}
                placeholder="e.g. synthetixcloud.io"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-orange-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Industry Sector</label>
              <select
                value={form.industry}
                onChange={(e) => handleChange('industry', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-orange-600 cursor-pointer"
              >
                <option value="Enterprise Software & SaaS">Enterprise Software & SaaS</option>
                <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                <option value="Financial Services & FinTech">Financial Services & FinTech</option>
                <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                <option value="Manufacturing & Industrial">Manufacturing & Industrial</option>
                <option value="Marketing & Advertising">Marketing & Advertising</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Artificial Intelligence">Artificial Intelligence</option>
                <option value="Telecommunications">Telecommunications</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Company Headcount</label>
              <select
                value={form.employeeRange}
                onChange={(e) => handleChange('employeeRange', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-orange-600 cursor-pointer"
              >
                <option value="1-10">1-10 Employees</option>
                <option value="11-50">11-50 Employees</option>
                <option value="51-200">51-200 Employees</option>
                <option value="201-500">201-500 Employees</option>
                <option value="501-1,000">501-1,000 Employees</option>
                <option value="1,001-5,000">1,001-5,000 Employees</option>
                <option value="5,000+">5,000+ Employees</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Annual Revenue</label>
              <select
                value={form.revenueRange}
                onChange={(e) => handleChange('revenueRange', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-orange-600 cursor-pointer"
              >
                <option value="<$1M">&lt; $1M ARR</option>
                <option value="$1M - $10M">$1M - $10M ARR</option>
                <option value="$10M - $50M">$10M - $50M ARR</option>
                <option value="$50M - $100M">$50M - $100M ARR</option>
                <option value="$100M+">$100M+ ARR</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">HQ Country</label>
              <select
                value={form.country}
                onChange={(e) => handleChange('country', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-orange-600 cursor-pointer"
              >
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Germany">Germany</option>
                <option value="France">France</option>
                <option value="Australia">Australia</option>
                <option value="Singapore">Singapore</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">HQ City / State</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="San Francisco, CA"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-orange-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Decision Maker Name *</label>
              <input
                type="text"
                required
                value={form.contactName}
                onChange={(e) => handleChange('contactName', e.target.value)}
                placeholder="e.g. Elena Rostova"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-orange-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Job Title *</label>
              <input
                type="text"
                required
                value={form.contactTitle}
                onChange={(e) => handleChange('contactTitle', e.target.value)}
                placeholder="VP of Engineering"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-orange-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Work Email *</label>
              <input
                type="email"
                required
                value={form.contactEmail}
                onChange={(e) => handleChange('contactEmail', e.target.value)}
                placeholder="elena@synthetixcloud.io"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-orange-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Direct Phone</label>
              <input
                type="text"
                value={form.contactPhone}
                onChange={(e) => handleChange('contactPhone', e.target.value)}
                placeholder="+1 (415) 555-0142"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-orange-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Buying Intent Score (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.buyingIntentScore}
                onChange={(e) => handleChange('buyingIntentScore', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-orange-600 font-mono"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 active:scale-95 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Update Custom Lead</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
