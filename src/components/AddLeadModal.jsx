import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Plus } from 'lucide-react';
import { setAddLeadModalOpen, addCustomLead, fetchLeads } from '../store/leadsSlice.js';

export default function AddLeadModal() {
  const dispatch = useDispatch();
  const { isAddLeadModalOpen } = useSelector((state) => state.leads);
  const filters = useSelector((state) => state.filters);
  const { user } = useSelector((state) => state.auth);

  const isSuperAdmin = Boolean(
    user &&
    (user.isSuperAdmin ||
      user.role === 'superadmin' ||
      user.email === 'alex@leadsarrow.io' ||
      user.email === 'alex@nexuslead.io')
  );

  const [form, setForm] = useState({
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
    techStack: 'AWS, Snowflake, React',
    buyingIntentScore: 88
  });

  if (!isAddLeadModalOpen || !isSuperAdmin) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await dispatch(addCustomLead(form));
    dispatch(fetchLeads(filters));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/50"
        onClick={() => dispatch(setAddLeadModalOpen(false))}
      />

      <div className="relative z-10 w-full max-w-xl bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display">
              Add / Index New B2B Business Lead
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Inserts into the live B2B lead index and syncs with your cloud account
            </p>
          </div>
          <button
            type="button"
            onClick={() => dispatch(setAddLeadModalOpen(false))}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={form.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                placeholder="e.g. Synthetix Cloud Corp"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-orange-600"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Website Domain *</label>
              <input
                type="text"
                required
                value={form.domain}
                onChange={(e) => handleChange('domain', e.target.value)}
                placeholder="e.g. synthetixcloud.io"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-orange-600"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Industry Sector</label>
              <select
                value={form.industry}
                onChange={(e) => handleChange('industry', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-orange-600"
              >
                <option>Enterprise Software & SaaS</option>
                <option>Fintech & Digital Banking</option>
                <option>Cloud Infrastructure & DevOps</option>
                <option>Healthcare & Biotech</option>
                <option>Cybersecurity & Identity</option>
                <option>AI & Data Analytics</option>
                <option>E-Commerce & Retail Tech</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Company Headcount</label>
              <select
                value={form.employeeRange}
                onChange={(e) => handleChange('employeeRange', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-orange-600"
              >
                <option>1-10</option>
                <option>11-50</option>
                <option>51-200</option>
                <option>201-500</option>
                <option>501-1,000</option>
                <option>1,001-5,000</option>
                <option>10,000+</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Annual Revenue</label>
              <select
                value={form.revenueRange}
                onChange={(e) => handleChange('revenueRange', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-orange-600"
              >
                <option>Under $1M</option>
                <option>$1M - $10M</option>
                <option>$10M - $50M</option>
                <option>$50M - $100M</option>
                <option>$100M - $500M</option>
                <option>$1B+</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">HQ Country</label>
              <select
                value={form.country}
                onChange={(e) => handleChange('country', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-orange-600"
              >
                <option>United States</option>
                <option>United Kingdom</option>
                <option>Germany</option>
                <option>Canada</option>
                <option>Singapore</option>
                <option>France</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Decision Maker Name *</label>
              <input
                type="text"
                required
                value={form.contactName}
                onChange={(e) => handleChange('contactName', e.target.value)}
                placeholder="e.g. Elena Rostova"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-orange-600"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Job Title *</label>
              <input
                type="text"
                required
                value={form.contactTitle}
                onChange={(e) => handleChange('contactTitle', e.target.value)}
                placeholder="e.g. Chief Technology Officer"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-orange-600"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Work Email *</label>
              <input
                type="email"
                required
                value={form.contactEmail}
                onChange={(e) => handleChange('contactEmail', e.target.value)}
                placeholder="elena@synthetixcloud.io"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-orange-600"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Direct Phone</label>
              <input
                type="text"
                value={form.contactPhone}
                onChange={(e) => handleChange('contactPhone', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-orange-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">
                Installed Technologies (comma-separated)
              </label>
              <input
                type="text"
                value={form.techStack}
                onChange={(e) => handleChange('techStack', e.target.value)}
                placeholder="AWS, Snowflake, Salesforce, Kubernetes"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-orange-600"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => dispatch(setAddLeadModalOpen(false))}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Index B2B Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
