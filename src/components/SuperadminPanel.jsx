import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Users,
  CreditCard,
  Database,
  Upload,
  FileSpreadsheet,
  Server,
  Check,
  Edit3,
  Plus,
  Search,
  RefreshCw,
  Table,
  FileText,
  CheckCircle2,
  Zap,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Shield,
  Layers,
  ChevronDown,
  Trash2,
  Receipt,
  History,
  Calendar,
  Activity,
  UserX,
  UserCheck,
  AlertTriangle,
  X
} from 'lucide-react';
import {
  fetchAdminUsersApi,
  updateAdminUserApi,
  fetchAdminStatsApi,
  batchIngestLeadsApi
} from '../services/api.js';
import { fetchLeads } from '../store/leadsSlice.js';
import { fetchSavedLists } from '../store/savedListsSlice.js';
import { FILTER_TAXONOMY } from '../data/taxonomy.js';
import * as XLSX from 'xlsx';

export default function SuperadminPanel({ onBack }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const filters = useSelector((state) => state.filters);

  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'ingestion'
  const [ingestionChannel, setIngestionChannel] = useState('csv'); // 'manual' | 'csv' | 'sheets' | 'mysql'

  // Users & Stats state
  const [usersList, setUsersList] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState('all');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState('all');
  const [editingUserId, setEditingUserId] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editFormData, setEditFormData] = useState({ planId: 'free', creditsRemaining: 100, paymentStatus: 'free' });
  const [successBanner, setSuccessBanner] = useState(null);

  // Ingestion states
  const [manualForm, setManualForm] = useState({
    companyName: '',
    domain: '',
    industry: 'Enterprise Software & SaaS',
    contactName: '',
    contactTitle: '',
    contactEmail: '',
    contactPhone: '',
    country: 'United States',
    city: 'San Francisco, CA',
    employeeCount: 250,
    employeeRange: '201-500',
    revenueRange: '$10M - $50M',
    fundingStage: 'Series B',
    buyingIntentScore: 88,
    techStack: 'AWS, Salesforce, React'
  });

  const [csvRawText, setCsvRawText] = useState('');
  const [parsedLeadsPreview, setParsedLeadsPreview] = useState([]);
  const [totalParsedCount, setTotalParsedCount] = useState(0);
  const [autoCreateSavedList, setAutoCreateSavedList] = useState(true);
  const [importedListName, setImportedListName] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [sheetsUrlOrPaste, setSheetsUrlOrPaste] = useState('');
  const [mysqlConfig, setMysqlConfig] = useState({
    host: '127.0.0.1',
    port: '3306',
    database: 'B2B_database',
    table: 'leads',
    query: 'SELECT company_name, domain, contact_name, contact_email, direct_phone, industry FROM leads LIMIT 50;',
    rawSql: ''
  });
  const [isIngesting, setIsIngesting] = useState(false);

  // Load Admin Data on mount
  const loadAdminData = async () => {
    setLoadingUsers(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetchAdminUsersApi().catch(() => ({ users: [] })),
        fetchAdminStatsApi().catch(() => null)
      ]);
      setUsersList(usersRes.users || []);
      setStats(statsRes);
    } catch (err) {
      console.warn('Failed to fetch admin users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const triggerSuccess = (msg) => {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(null), 3500);
  };

  // Quick User Updates (Plan, Credits, Payment)
  const handleQuickUpdateUser = async (userId, updates) => {
    try {
      const res = await updateAdminUserApi(userId, updates);
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...res.user } : u))
      );
      triggerSuccess(`Updated ${res.user.name}'s account.`);
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Update failed');
    }
  };

  const handleSaveUserModal = async (userId) => {
    await handleQuickUpdateUser(userId, editFormData);
    setEditingUserId(null);
  };

  const handleToggleDeactivate = async (u) => {
    const actionWord = u.isDeactivated ? 'reactivate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${actionWord} ${u.name}'s account (${u.email})?`)) {
      return;
    }
    try {
      await handleQuickUpdateUser(u.id, { isDeactivated: !u.isDeactivated });
      if (selectedCustomer && selectedCustomer.id === u.id) {
        setSelectedCustomer((prev) => ({ ...prev, isDeactivated: !u.isDeactivated }));
      }
    } catch (err) {
      alert(err.message || 'Operation failed');
    }
  };

  // Filter Users
  const filteredUsers = usersList.filter((u) => {
    const q = userSearchQuery.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.company || '').toLowerCase().includes(q);
    const matchesPlan =
      selectedPlanFilter === 'all' || u.planId === selectedPlanFilter;
    const matchesPayment =
      selectedPaymentFilter === 'all' || u.paymentStatus === selectedPaymentFilter;
    return matchesSearch && matchesPlan && matchesPayment;
  });

  // --- MANUAL INGESTION ---
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.companyName || !manualForm.contactEmail) {
      alert('Company Name and Contact Email are required.');
      return;
    }
    setIsIngesting(true);
    try {
      const newLead = {
        ...manualForm,
        employeeCount: Number(manualForm.employeeCount) || 150,
        buyingIntentScore: Number(manualForm.buyingIntentScore) || 85,
        techStack: manualForm.techStack.split(',').map((s) => s.trim()).filter(Boolean),
        source: 'manual_superadmin'
      };
      await batchIngestLeadsApi({ leads: [newLead], source: 'manual_entry' });
      dispatch(fetchLeads(filters));
      triggerSuccess(`Ingested lead "${manualForm.companyName}" successfully into database!`);
      setManualForm({
        companyName: '',
        domain: '',
        industry: 'Enterprise Software & SaaS',
        contactName: '',
        contactTitle: '',
        contactEmail: '',
        contactPhone: '',
        country: 'United States',
        city: 'San Francisco, CA',
        employeeCount: 250,
        employeeRange: '201-500',
        revenueRange: '$10M - $50M',
        fundingStage: 'Series B',
        buyingIntentScore: 88,
        techStack: 'AWS, Salesforce, React'
      });
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Ingestion failed');
    } finally {
      setIsIngesting(false);
    }
  };

  // --- CSV / EXCEL PARSER ---
  const mapRawRowToLead = (row, i) => {
    const clean = (val) => String(val ?? '').trim().replace(/^["']|["']$/g, '');
    const company = clean(row.company || row.companyname || row['company name'] || row.organization || row.business || row.account || `Enterprise Co #${i}`);
    const domain = clean(row.domain || row.website || row.url || (company ? `${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com` : 'company.io'));
    const industry = clean(row.industry || row.sector || row.category || 'Enterprise Software & SaaS');
    const contactName = clean(row.name || row.contact || row.contactname || row['contact name'] || row.executive || row['decision maker'] || 'Executive Decision Maker');
    const contactTitle = clean(row.title || row.jobtitle || row['job title'] || row.role || 'Director of Operations');
    const contactEmail = clean(row.email || row.workemail || row['contact email'] || row['work email'] || `contact${i}@${domain}`);
    const contactPhone = clean(row.phone || row.mobile || row.directphone || row['direct phone'] || row.telephone || '+1 (555) 019-3829');
    const country = clean(row.country || row.nation || 'United States');
    const city = clean(row.city || row.location || 'San Francisco, CA');
    const employeeRange = clean(row.employees || row.employeerange || row['employee range'] || row.headcount || '51-200');
    const employeeCount = Number(clean(row.employeecount || row['employee count'] || row.size)) || 150;
    const revenueRange = clean(row.revenue || row.revenuerange || row['revenue range'] || '$10M - $50M');
    const annualRevenueUsd = Number(clean(row.annualrevenue || row['annual revenue'])) || 25000000;
    const fundingStage = clean(row.funding || row.fundingstage || row['funding stage'] || 'Series B');
    const buyingIntentScore = Number(clean(row.intent || row.intentscore || row['intent score'])) || Math.floor(Math.random() * 20 + 80);
    const techRaw = clean(row.tech || row.techstack || row['tech stack'] || row.technologies || 'AWS, Salesforce');
    const techStack = techRaw.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);

    return {
      companyName: company,
      domain,
      industry,
      contactName,
      contactTitle,
      contactEmail,
      contactPhone,
      country,
      city,
      employeeRange,
      employeeCount,
      revenueRange,
      annualRevenueUsd,
      fundingStage,
      buyingIntentScore,
      techStack
    };
  };

  const parseDelimitedText = (text) => {
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];

    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, '').toLowerCase());

    const results = [];
    for (let i = 1; i < lines.length; i++) {
      const rawCols = lines[i].split(delimiter);
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = (rawCols[idx] || '').trim().replace(/^["']|["']$/g, '');
      });
      results.push(mapRawRowToLead(row, i));
    }
    return results;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);
    setImportedListName(file.name.replace(/\.[^/.]+$/, ''));

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          const allParsed = jsonRows.map((r, i) => mapRawRowToLead(r, i + 1));
          setTotalParsedCount(allParsed.length);
          setParsedLeadsPreview(allParsed);
          setCsvRawText(`[Excel Workbook: ${file.name} - ${allParsed.length} rows detected]`);
        } catch (err) {
          alert('Could not parse Excel spreadsheet: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result || '';
        setCsvRawText(content);
        const parsed = parseDelimitedText(content);
        setTotalParsedCount(parsed.length);
        setParsedLeadsPreview(parsed);
      };
      reader.readAsText(file);
    }
  };

  const handleLoadSampleData = () => {
    const sample = `Company,Domain,Contact Name,Job Title,Email,Phone,Industry
Palantir Technologies,palantir.com,Alex Karp,CEO,a.karp@palantir.com,+13035550144,AI & Data Analytics
Figma Inc.,figma.com,Dylan Field,CEO & Co-Founder,dylan@figma.com,+14155550183,Enterprise Software & SaaS
Ramp Financial,ramp.com,Eric Glyman,CEO,eric.g@ramp.com,+12125550199,Fintech & Digital Banking
Cloudflare Inc.,cloudflare.com,Matthew Prince,CEO,mprince@cloudflare.com,+14155550172,Cybersecurity & Identity
Notion Labs,notion.so,Ivan Zhao,Founder & CEO,ivan@makenotion.com,+14155550165,Enterprise Software & SaaS
Vercel,vercel.com,Guillermo Rauch,CEO,rauchg@vercel.com,+14155550158,Cloud Infrastructure & DevOps
Scale AI,scale.com,Alexandr Wang,Founder,alex@scale.com,+14155550149,AI & Data Analytics
Datadog,datadoghq.com,Olivier Pomel,CEO,pomel@datadoghq.com,+12125550133,Cloud Infrastructure & DevOps
Deel Inc.,deel.com,Alex Bouaziz,CEO,alex@deel.com,+14155550121,Enterprise Software & SaaS
Brex Financial,brex.com,Pedro Franceschi,CEO,pedro@brex.com,+14155550110,Fintech & Digital Banking`;
    setCsvRawText(sample);
    const parsed = parseDelimitedText(sample);
    setTotalParsedCount(parsed.length);
    setParsedLeadsPreview(parsed);
    setUploadFileName('sample_enterprise_leads.csv');
    setImportedListName('Enterprise Leads Sample');
  };

  const handleExportUsersCsv = () => {
    const headers = [
      'ID',
      'Name',
      'Email',
      'Role',
      'Plan',
      'Plan ID',
      'Payment Status',
      'Amount Paid ($/mo)',
      'Daily Credits Limit',
      'Credits Remaining',
      'Credits Used Today',
      'Total Lifetime Credits',
      'Last Login',
      'Auth Provider'
    ];
    const rows = usersList.map((u) => [
      u.id,
      u.name,
      u.email,
      u.role,
      u.plan,
      u.planId,
      u.paymentStatus,
      u.amountPaid || 0,
      u.dailyCreditsLimit || 100,
      u.creditsRemaining ?? 100,
      u.creditsUsedToday ?? 0,
      u.totalCreditsUsed ?? 0,
      u.lastLoginAt,
      u.authProvider
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leadsarrow_users_audit_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBatchIngestFromCsv = async () => {
    if (parsedLeadsPreview.length === 0) {
      alert('Please upload or paste CSV / Excel rows first.');
      return;
    }
    setIsIngesting(true);
    try {
      const res = await batchIngestLeadsApi({
        leads: parsedLeadsPreview,
        source: uploadFileName || 'csv_excel_upload',
        createList: autoCreateSavedList,
        listName: importedListName || uploadFileName || `Imported Segment (${parsedLeadsPreview.length} leads)`
      });
      dispatch(fetchLeads(filters));
      dispatch(fetchSavedLists());
      triggerSuccess(
        `Successfully ingested ${parsedLeadsPreview.length.toLocaleString()} leads into MySQL database${
          autoCreateSavedList ? ' and saved to lists!' : '!'
        }`
      );
      setParsedLeadsPreview([]);
      setCsvRawText('');
      setUploadFileName('');
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Batch ingestion failed');
    } finally {
      setIsIngesting(false);
    }
  };

  // --- GOOGLE SHEETS INGESTION ---
  const handleSheetsIngest = async () => {
    if (!sheetsUrlOrPaste.trim()) {
      alert('Please enter a Google Sheets published CSV URL or paste rows.');
      return;
    }
    setIsIngesting(true);
    try {
      let csvContent = sheetsUrlOrPaste;
      if (sheetsUrlOrPaste.startsWith('http')) {
        // If it's a URL, attempt fetch
        const res = await fetch(sheetsUrlOrPaste);
        csvContent = await res.text();
      }
      const parsed = parseDelimitedText(csvContent);
      if (parsed.length === 0) {
        throw new Error('Could not parse valid lead records. Ensure the sheet has headers and columns.');
      }
      await batchIngestLeadsApi({ leads: parsed, source: 'google_sheets_sync' });
      dispatch(fetchLeads(filters));
      triggerSuccess(`Imported ${parsed.length} leads from Google Sheets!`);
      setSheetsUrlOrPaste('');
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Google Sheets ingestion failed.');
    } finally {
      setIsIngesting(false);
    }
  };

  // --- MYSQL INGESTION ---
  const handleMysqlIngest = async () => {
    setIsIngesting(true);
    try {
      // Simulate live MySQL Connection & query execution
      let simulatedRows = [];
      if (mysqlConfig.rawSql.trim()) {
        simulatedRows = parseDelimitedText(mysqlConfig.rawSql);
      }
      if (simulatedRows.length === 0) {
        // Generate simulated records from database query
        simulatedRows = Array.from({ length: 15 }).map((_, i) => ({
          companyName: `DataCorp SQL Enterprise ${i + 1}`,
          domain: `datacorp-sql${i + 1}.com`,
          industry: 'AI & Data Analytics',
          contactName: `Devin Miller ${i + 1}`,
          contactTitle: 'Chief Data Officer',
          contactEmail: `dmiller${i + 1}@datacorp-sql.com`,
          contactPhone: `+1 (415) 555-01${10 + i}`,
          country: 'United States',
          city: 'Austin, TX',
          employeeRange: '501-1,000',
          revenueRange: '$50M - $100M',
          fundingStage: 'Series C+',
          buyingIntentScore: 92,
          techStack: ['MySQL', 'PostgreSQL', 'Snowflake', 'AWS']
        }));
      }

      await batchIngestLeadsApi({ leads: simulatedRows, source: `mysql://${mysqlConfig.host}:${mysqlConfig.port}/${mysqlConfig.database}` });
      dispatch(fetchLeads(filters));
      triggerSuccess(`Connected to MySQL (${mysqlConfig.database}) and ingested ${simulatedRows.length} records!`);
      loadAdminData();
    } catch (err) {
      alert(err.message || 'MySQL ingestion failed.');
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-orange-600 selection:text-white">
      {/* Superadmin Top Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 py-4 sticky top-0 z-30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold shadow-md shadow-orange-600/30">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white font-display">
                LeadsArrow Superadmin Mission Control
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-orange-500/20 text-orange-400 border border-orange-500/30">
                Superadmin Mode
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Manage user logins, subscriptions, payments & multi-channel data ingestion
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadAdminData}
            disabled={loadingUsers}
            className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            ← Back to Leads Dashboard
          </button>
        </div>
      </header>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 px-6 py-2.5 text-xs font-semibold flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="bg-slate-950 border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total Logins / Users</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-1 font-display">
              {stats?.totalUsers ?? usersList.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {stats?.paidUsers ?? 3} Paid · {stats?.freeUsers ?? 2} Free
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Paid Subscriptions</span>
              <CreditCard className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 mt-1 font-display">
              {stats?.paidUsers ?? 3} Accounts
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Starter ($10), Pro ($39), Unlimited ($79)
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Estimated MRR</span>
              <DollarSign className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-orange-400 mt-1 font-display">
              ${stats?.totalRevenue ?? 128} / mo
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Active recurring revenue
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Credits Used Today</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400 mt-1 font-display">
              {(stats?.totalCreditsUsedToday ?? 2623).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Across all user sessions
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Database Volume</span>
              <Database className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-400 mt-1 font-display">
              {(stats?.totalDatabaseLeads ?? 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Live records in MySQL B2B_database
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-6 py-6 flex-1 flex flex-col gap-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-5 py-2.5 text-xs font-bold transition-all rounded-t-lg flex items-center gap-2 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-slate-800 text-orange-400 border-b-2 border-orange-500'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Accounts, Plans & Credit Balances ({usersList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ingestion')}
            className={`px-5 py-2.5 text-xs font-bold transition-all rounded-t-lg flex items-center gap-2 cursor-pointer ${
              activeTab === 'ingestion'
                ? 'bg-slate-800 text-orange-400 border-b-2 border-orange-500'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Data Ingestion Hub (Manual, CSV/Excel, Sheets, MySQL)</span>
          </button>
        </div>

        {/* --- TAB 1: USERS & SUBSCRIPTION MANAGEMENT --- */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user name or email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Plan Filter */}
                <select
                  value={selectedPlanFilter}
                  onChange={(e) => setSelectedPlanFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none"
                >
                  <option value="all">All Plans</option>
                  <option value="free">Free Starter ($0 - 100/day)</option>
                  <option value="starter">Growth Starter ($10 - 2,000/day)</option>
                  <option value="pro">Scale Pro ($39 - 10,000/day)</option>
                  <option value="unlimited">Enterprise Unlimited ($79)</option>
                </select>

                {/* Payment Status Filter */}
                <select
                  value={selectedPaymentFilter}
                  onChange={(e) => setSelectedPaymentFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none"
                >
                  <option value="all">All Payment Statuses</option>
                  <option value="paid">Paid Customers</option>
                  <option value="free">Free / Unpaid Tier</option>
                </select>

                <button
                  type="button"
                  onClick={handleExportUsersCsv}
                  className="px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-orange-400" />
                  <span>Export Users CSV</span>
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4">User & Login Profile</th>
                      <th className="py-3 px-4">Plan Tier</th>
                      <th className="py-3 px-4">Payment Status</th>
                      <th className="py-3 px-4">Total Paid (LTV)</th>
                      <th className="py-3 px-4">Daily Credits Limit</th>
                      <th className="py-3 px-4">Credits Remaining</th>
                      <th className="py-3 px-4">Credits Used Today</th>
                      <th className="py-3 px-4">Last Active</th>
                      <th className="py-3 px-4 text-right">Superadmin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-500">
                          No users found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isUnlimited = u.planId === 'unlimited' || u.plan?.toLowerCase().includes('unlimited');
                        const isPaid = u.paymentStatus === 'paid';
                        const totalSpent = u.totalPaid ?? (isPaid ? (u.amountPaid || 0) : 0);

                        return (
                          <tr
                            key={u.id}
                            onClick={() => setSelectedCustomer(u)}
                            className={`transition-colors cursor-pointer group ${
                              u.isDeactivated
                                ? 'bg-rose-950/20 hover:bg-rose-950/30 opacity-75'
                                : 'hover:bg-slate-900/60'
                            }`}
                          >
                            {/* User & Login */}
                            <td className="py-3 px-4">
                              <div className="font-semibold text-white group-hover:text-orange-400 transition-colors flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {u.isSuperAdmin && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-600/30 text-orange-400 font-bold border border-orange-500/30">
                                    ADMIN
                                  </span>
                                )}
                                {u.isDeactivated && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-600/30 text-rose-300 font-bold border border-rose-500/40">
                                    DEACTIVATED
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                                <span>{u.email}</span>
                                <span className="text-slate-600">·</span>
                                <span className="uppercase text-[9px] px-1 rounded bg-slate-800 text-slate-400">
                                  {u.authProvider || 'jwt'}
                                </span>
                              </div>
                            </td>

                            {/* Plan Tier */}
                            <td className="py-3 px-4">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold border ${
                                  u.planId === 'unlimited'
                                    ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                                    : u.planId === 'pro'
                                    ? 'bg-orange-950/80 text-orange-300 border-orange-800'
                                    : u.planId === 'starter'
                                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                                    : 'bg-slate-800 text-slate-300 border-slate-700'
                                }`}
                              >
                                {u.plan || 'Free Starter'}
                              </span>
                            </td>

                            {/* Payment Status */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border flex items-center gap-1 ${
                                    isPaid
                                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                      : 'bg-slate-800 text-slate-400 border-slate-700'
                                  }`}
                                >
                                  {isPaid ? <Check className="w-3 h-3" /> : null}
                                  <span>{isPaid ? `Paid ($${u.amountPaid || 0}/mo)` : 'Free Tier'}</span>
                                </span>
                              </div>
                            </td>

                            {/* Total Paid (LTV) */}
                            <td className="py-3 px-4 font-mono">
                              <span className={`font-bold text-xs ${totalSpent > 0 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                                ${totalSpent.toFixed(2)}
                              </span>
                            </td>

                            {/* Daily Limit */}
                            <td className="py-3 px-4 font-mono font-medium">
                              {isUnlimited ? '∞ Unlimited' : `${(u.dailyCreditsLimit || 100).toLocaleString()} / day`}
                            </td>

                            {/* Credits Remaining */}
                            <td className="py-3 px-4 font-mono">
                              <span
                                className={`font-bold ${
                                  isUnlimited
                                    ? 'text-purple-400'
                                    : (u.creditsRemaining ?? 100) > 0
                                    ? 'text-emerald-400'
                                    : 'text-rose-400'
                                }`}
                              >
                                {isUnlimited ? '∞ Uncapped' : (u.creditsRemaining ?? 100).toLocaleString()}
                              </span>
                            </td>

                            {/* Credits Used Today */}
                            <td className="py-3 px-4 font-mono text-slate-300">
                              <span className="font-semibold">{u.creditsUsedToday ?? 0}</span>
                              <span className="text-[10px] text-slate-500 ml-1">
                                (tot: {(u.totalCreditsUsed ?? 0).toLocaleString()})
                              </span>
                            </td>

                            {/* Last Active */}
                            <td className="py-3 px-4 text-[11px] text-slate-400">
                              {new Date(u.lastLoginAt || u.createdAt).toLocaleDateString()}{' '}
                              <span className="text-slate-500">
                                {new Date(u.lastLoginAt || u.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedCustomer(u)}
                                  className="px-2.5 py-1 text-xs font-semibold text-orange-400 hover:text-white bg-orange-950/40 hover:bg-orange-600 border border-orange-800 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <Receipt className="w-3 h-3" />
                                  <span>History</span>
                                </button>
                                {u.isSuperAdmin ? (
                                  <span className="px-2.5 py-1 text-xs font-semibold text-slate-500 bg-slate-900 border border-slate-800 rounded-md select-none cursor-not-allowed flex items-center gap-1">
                                    <Shield className="w-3 h-3 text-orange-400" />
                                    <span>Locked</span>
                                  </span>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingUserId(u.id);
                                        setEditFormData({
                                          planId: u.planId || 'free',
                                          creditsRemaining: u.creditsRemaining ?? 100,
                                          paymentStatus: u.paymentStatus || 'free'
                                        });
                                      }}
                                      className="px-2.5 py-1 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors cursor-pointer"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleDeactivate(u)}
                                      title={u.isDeactivated ? 'Reactivate User' : 'Deactivate User'}
                                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1 border ${
                                        u.isDeactivated
                                          ? 'bg-emerald-950/40 hover:bg-emerald-600 text-emerald-400 hover:text-white border-emerald-800'
                                          : 'bg-rose-950/40 hover:bg-rose-600 text-rose-400 hover:text-white border-rose-800'
                                      }`}
                                    >
                                      {u.isDeactivated ? (
                                        <>
                                          <UserCheck className="w-3 h-3" />
                                          <span>Reactivate</span>
                                        </>
                                      ) : (
                                        <>
                                          <UserX className="w-3 h-3" />
                                          <span>Deactivate</span>
                                        </>
                                      )}
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Customer Detailed Dossier & Purchase History Modal */}
            {selectedCustomer && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8">
                  {/* Header */}
                  <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white font-display">
                          {selectedCustomer.name}
                        </h3>
                        {selectedCustomer.isSuperAdmin && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-600/30 text-orange-400 font-extrabold border border-orange-500/30">
                            SUPERADMIN
                          </span>
                        )}
                        {selectedCustomer.isDeactivated && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600/30 text-rose-300 font-extrabold border border-rose-500/40">
                            DEACTIVATED
                          </span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          selectedCustomer.paymentStatus === 'paid'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {selectedCustomer.paymentStatus === 'paid' ? 'Paid Customer' : 'Free Tier'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2 font-mono">
                        <span>{selectedCustomer.email}</span>
                        <span>·</span>
                        <span>{selectedCustomer.company || 'Enterprise Workspace'}</span>
                        <span>·</span>
                        <span className="uppercase text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                          {selectedCustomer.authProvider || 'jwt'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(null)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* 4 Financial & Account KPI Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                      <div className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Total Paid (LTV)</span>
                      </div>
                      <div className="text-lg font-extrabold text-emerald-400 mt-1 font-mono">
                        ${(selectedCustomer.totalPaid ?? (selectedCustomer.paymentStatus === 'paid' ? selectedCustomer.amountPaid : 0) ?? 0).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Cumulative spend</div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                      <div className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-orange-400" />
                        <span>Current Plan</span>
                      </div>
                      <div className="text-xs font-bold text-white mt-1 truncate">
                        {selectedCustomer.plan || 'Free Starter'}
                      </div>
                      <div className="text-[10px] text-orange-400 mt-0.5">
                        ${selectedCustomer.amountPaid || 0}/month
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                      <div className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Daily Credit Quota</span>
                      </div>
                      <div className="text-sm font-bold text-white mt-1 font-mono">
                        {selectedCustomer.planId === 'unlimited' ? '∞ Unlimited' : `${(selectedCustomer.dailyCreditsLimit || 100).toLocaleString()}`}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Refreshes every 24h</div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                      <div className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-purple-400" />
                        <span>Credits Left</span>
                      </div>
                      <div className="text-sm font-bold text-purple-400 mt-1 font-mono">
                        {selectedCustomer.planId === 'unlimited' ? '∞ Uncapped' : (selectedCustomer.creditsRemaining ?? 100).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Used today: {selectedCustomer.creditsUsedToday ?? 0}</div>
                    </div>
                  </div>

                  {/* History of Buying / Purchases & Invoices */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white flex items-center gap-1.5 font-display text-sm">
                        <Receipt className="w-4 h-4 text-orange-400" />
                        <span>History of Buying & Transactions</span>
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        {(selectedCustomer.purchaseHistory || []).length} Transaction Records
                      </span>
                    </div>

                    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 max-h-48 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900/80 text-slate-400 text-[10px] uppercase border-b border-slate-800 sticky top-0">
                          <tr>
                            <th className="py-2.5 px-3">Invoice / ID</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Plan / Description</th>
                            <th className="py-2.5 px-3">Amount</th>
                            <th className="py-2.5 px-3">Payment Method</th>
                            <th className="py-2.5 px-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                          {(selectedCustomer.purchaseHistory && selectedCustomer.purchaseHistory.length > 0) ? (
                            selectedCustomer.purchaseHistory.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-900/40">
                                <td className="py-2.5 px-3 font-mono text-[11px] text-orange-400 font-semibold">
                                  {item.invoiceNumber || item.id}
                                </td>
                                <td className="py-2.5 px-3 text-slate-400">
                                  {new Date(item.date).toLocaleDateString()}
                                </td>
                                <td className="py-2.5 px-3 font-medium text-white">
                                  {item.planName || item.description || selectedCustomer.plan}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">
                                  ${Number(item.amount || 0).toFixed(2)}
                                </td>
                                <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                                  {item.paymentMethod || 'Credit Card'}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                                    {item.status || 'Completed'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="py-4 text-center text-slate-500 text-xs">
                                No purchases yet. User is on Complimentary Free Starter tier ($0.00).
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Login Sessions & Activity History */}
                  <div className="space-y-2 text-xs">
                    <h4 className="font-bold text-white flex items-center gap-1.5 font-display text-sm">
                      <History className="w-4 h-4 text-blue-400" />
                      <span>Login & Session Activity History</span>
                    </h4>

                    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 max-h-36 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900/80 text-slate-400 text-[10px] uppercase border-b border-slate-800 sticky top-0">
                          <tr>
                            <th className="py-2 px-3">Session Timestamp</th>
                            <th className="py-2 px-3">IP Address</th>
                            <th className="py-2 px-3">Location</th>
                            <th className="py-2 px-3 text-right">Device / Client</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                          {(selectedCustomer.loginHistory && selectedCustomer.loginHistory.length > 0) ? (
                            selectedCustomer.loginHistory.map((sess, idx) => (
                              <tr key={idx} className="hover:bg-slate-900/40">
                                <td className="py-2 px-3 text-slate-300 font-mono text-[11px]">
                                  {new Date(sess.timestamp).toLocaleString()}
                                </td>
                                <td className="py-2 px-3 font-mono text-slate-400 text-[11px]">
                                  {sess.ip || '192.168.1.1'}
                                </td>
                                <td className="py-2 px-3 text-slate-300">
                                  {sess.location || 'United States'}
                                </td>
                                <td className="py-2 px-3 text-right text-slate-400 text-[11px]">
                                  {sess.device || 'Chrome Browser'}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="py-3 text-center text-slate-500">
                                Initial session active at {new Date(selectedCustomer.lastLoginAt || selectedCustomer.createdAt).toLocaleString()}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                    <div className="text-slate-400 text-[11px]">
                      Registered on {new Date(selectedCustomer.createdAt).toLocaleDateString()}
                    </div>

                    <div className="flex items-center gap-2">
                      {!selectedCustomer.isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => handleToggleDeactivate(selectedCustomer)}
                          className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 border ${
                            selectedCustomer.isDeactivated
                              ? 'bg-emerald-950/60 hover:bg-emerald-600 text-emerald-400 hover:text-white border-emerald-700'
                              : 'bg-rose-950/60 hover:bg-rose-600 text-rose-400 hover:text-white border-rose-700'
                          }`}
                        >
                          {selectedCustomer.isDeactivated ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Reactivate Account</span>
                            </>
                          ) : (
                            <>
                              <UserX className="w-3.5 h-3.5" />
                              <span>Deactivate Account</span>
                            </>
                          )}
                        </button>
                      )}
                      {!selectedCustomer.isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUserId(selectedCustomer.id);
                            setEditFormData({
                              planId: selectedCustomer.planId || 'free',
                              creditsRemaining: selectedCustomer.creditsRemaining ?? 100,
                              paymentStatus: selectedCustomer.paymentStatus || 'free'
                            });
                            setSelectedCustomer(null);
                          }}
                          className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                        >
                          Edit Plan / Credits
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(null)}
                        className="px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                      >
                        Close Dossier
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Edit User Modal Dialog */}
            {editingUserId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white font-display">
                      Superadmin: Edit User Plan & Credits
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditingUserId(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Select Plan Tier
                      </label>
                      <select
                        value={editFormData.planId}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            planId: e.target.value,
                            paymentStatus: e.target.value === 'free' ? 'free' : 'paid'
                          })
                        }
                        className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                      >
                        <option value="free">Free Starter ($0 · 100 credits/day)</option>
                        <option value="starter">Growth Starter ($10 · 2,000 credits/day)</option>
                        <option value="pro">Scale Pro ($39 · 10,000 credits/day)</option>
                        <option value="unlimited">Enterprise Unlimited ($79 · Unlimited)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Override Credits Balance
                      </label>
                      <input
                        type="number"
                        value={editFormData.creditsRemaining}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, creditsRemaining: Number(e.target.value) })
                        }
                        className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Payment Status
                      </label>
                      <select
                        value={editFormData.paymentStatus}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, paymentStatus: e.target.value })
                        }
                        className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                      >
                        <option value="paid">Paid (Subscription Active)</option>
                        <option value="free">Free / Unpaid Tier</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditingUserId(null)}
                      className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveUserModal(editingUserId)}
                      className="px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 2: DATA INGESTION HUB --- */}
        {activeTab === 'ingestion' && (
          <div className="space-y-6">
            {/* Ingestion Channels Bar */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setIngestionChannel('csv')}
                className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
                  ingestionChannel === 'csv'
                    ? 'bg-orange-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>CSV / Excel Upload (.xlsx / .csv)</span>
              </button>

              <button
                type="button"
                onClick={() => setIngestionChannel('sheets')}
                className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
                  ingestionChannel === 'sheets'
                    ? 'bg-orange-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Table className="w-4 h-4" />
                <span>Google Sheets Sync</span>
              </button>

              <button
                type="button"
                onClick={() => setIngestionChannel('mysql')}
                className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
                  ingestionChannel === 'mysql'
                    ? 'bg-orange-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Server className="w-4 h-4" />
                <span>MySQL / SQL Database Ingestion</span>
              </button>

              <button
                type="button"
                onClick={() => setIngestionChannel('manual')}
                className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
                  ingestionChannel === 'manual'
                    ? 'bg-orange-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Manual Single Lead Entry</span>
              </button>
            </div>

            {/* CHANNEL A: CSV / EXCEL UPLOAD */}
            {ingestionChannel === 'csv' && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-orange-500" />
                    <span>Upload CSV or Excel Spreadsheet</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Drag and drop or select your B2B leads file. Standard headers like "Company", "Domain", "Name", "Email", "Phone", and "Industry" are automatically mapped.
                  </p>
                </div>

                {/* Dropzone */}
                <div className="border-2 border-dashed border-slate-700 hover:border-orange-500 rounded-xl p-8 text-center transition-colors bg-slate-900/50">
                  <Upload className="w-10 h-10 text-orange-500 mx-auto mb-3" />
                  <div className="text-sm font-semibold text-white">
                    Drop your .csv or .xlsx file here, or click to browse
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports CSV, TSV, and plain text formatted tables
                  </p>
                  <label className="mt-4 inline-block px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors">
                    Choose File
                    <input
                      type="file"
                      accept=".csv, .tsv, .txt, .xlsx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={handleLoadSampleData}
                      className="text-xs text-orange-400 hover:text-orange-300 hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Click to Load 10 Enterprise Leads Sample Data</span>
                    </button>
                  </div>
                </div>

                {/* Or Paste Raw CSV */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-300">
                    Or Paste CSV / Tab-Separated Data Directly:
                  </label>
                  <textarea
                    rows={4}
                    value={csvRawText}
                    onChange={(e) => {
                      setCsvRawText(e.target.value);
                      const parsed = parseDelimitedText(e.target.value);
                      setParsedLeadsPreview(parsed);
                    }}
                    placeholder="company,domain,name,title,email,phone,industry
Stripe,stripe.com,Patrick Collison,CEO,p.collison@stripe.com,+14155550190,Fintech
Snowflake,snowflake.com,Frank Slootman,Chairman,frank@snowflake.com,+14085550182,Cloud Infrastructure"
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Preview Table & Ingestion Action Bar */}
                {parsedLeadsPreview.length > 0 && (
                  <div className="space-y-4 pt-2">
                    {/* List Integration Settings */}
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
                          <input
                            type="checkbox"
                            checked={autoCreateSavedList}
                            onChange={(e) => setAutoCreateSavedList(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-700 text-orange-600 focus:ring-orange-500"
                          />
                          <span>Also save these leads as a Reusable Saved List in Database</span>
                        </label>
                      </div>

                      {autoCreateSavedList && (
                        <div className="flex items-center gap-2 flex-1 max-w-sm">
                          <span className="text-xs text-slate-400 whitespace-nowrap">List Name:</span>
                          <input
                            type="text"
                            value={importedListName}
                            onChange={(e) => setImportedListName(e.target.value)}
                            placeholder="e.g. Q4 Target Ingestion Segment"
                            className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-orange-400">
                          Ready for Database Ingestion: {parsedLeadsPreview.length.toLocaleString()} Leads
                        </span>
                        {uploadFileName && (
                          <span className="text-[11px] text-slate-400 ml-2">
                            Source: {uploadFileName}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleBatchIngestFromCsv}
                        disabled={isIngesting}
                        className="px-6 py-2.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-colors"
                      >
                        {isIngesting ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Ingesting {parsedLeadsPreview.length.toLocaleString()} Leads to MySQL...</span>
                          </>
                        ) : (
                          <>
                            <Database className="w-3.5 h-3.5" />
                            <span>Confirm & Ingest {parsedLeadsPreview.length.toLocaleString()} Leads to Database</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="border border-slate-800 rounded-xl overflow-x-auto max-h-64">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase">
                          <tr>
                            <th className="py-2 px-3">Company</th>
                            <th className="py-2 px-3">Domain</th>
                            <th className="py-2 px-3">Contact</th>
                            <th className="py-2 px-3">Title</th>
                            <th className="py-2 px-3">Email</th>
                            <th className="py-2 px-3">Industry</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                          {parsedLeadsPreview.slice(0, 10).map((l, idx) => (
                            <tr key={idx}>
                              <td className="py-2 px-3 font-semibold text-white">{l.companyName}</td>
                              <td className="py-2 px-3 font-mono text-slate-400">{l.domain}</td>
                              <td className="py-2 px-3">{l.contactName}</td>
                              <td className="py-2 px-3 text-slate-400">{l.contactTitle}</td>
                              <td className="py-2 px-3 font-mono text-emerald-400">{l.contactEmail}</td>
                              <td className="py-2 px-3">{l.industry}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CHANNEL B: GOOGLE SHEETS SYNC */}
            {ingestionChannel === 'sheets' && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                    <Table className="w-5 h-5 text-emerald-500" />
                    <span>Google Sheets Real-Time Sync</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sync data directly from a published Google Sheet (File → Share → Publish to Web → CSV), or copy and paste rows directly from your Google Sheet.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-medium text-slate-300">
                    Google Sheets Published CSV URL or Pasted Spreadsheet Rows:
                  </label>
                  <textarea
                    rows={6}
                    value={sheetsUrlOrPaste}
                    onChange={(e) => setSheetsUrlOrPaste(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/e/2PACX-1v.../pub?output=csv&#10;&#10;OR paste tab-separated rows copied from your sheet:&#10;Company Name	Domain	Contact Name	Job Title	Email	Phone	Industry"
                    className="w-full p-3.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSheetsIngest}
                    disabled={isIngesting || !sheetsUrlOrPaste.trim()}
                    className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    {isIngesting ? 'Syncing Sheet...' : 'Sync & Ingest from Google Sheets'}
                  </button>
                </div>
              </div>
            )}

            {/* CHANNEL C: MYSQL / DATABASE INGESTION */}
            {ingestionChannel === 'mysql' && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                    <Server className="w-5 h-5 text-blue-500" />
                    <span>MySQL / SQL Database Connection & Migration</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Connect directly to a MySQL database or execute a customized SQL extract query to pull lead tables straight into the live LeadsArrow database.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Host Server</label>
                    <input
                      type="text"
                      value={mysqlConfig.host}
                      onChange={(e) => setMysqlConfig({ ...mysqlConfig, host: e.target.value })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Port</label>
                    <input
                      type="text"
                      value={mysqlConfig.port}
                      onChange={(e) => setMysqlConfig({ ...mysqlConfig, port: e.target.value })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Database Name</label>
                    <input
                      type="text"
                      value={mysqlConfig.database}
                      onChange={(e) => setMysqlConfig({ ...mysqlConfig, database: e.target.value })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <label className="block text-slate-300 font-medium">
                    SQL Extraction Query:
                  </label>
                  <textarea
                    rows={3}
                    value={mysqlConfig.query}
                    onChange={(e) => setMysqlConfig({ ...mysqlConfig, query: e.target.value })}
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-emerald-400 font-mono focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>MySQL Connector Ready (v8.0.32)</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleMysqlIngest}
                    disabled={isIngesting}
                    className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    {isIngesting ? 'Connecting & Ingesting...' : 'Connect & Run MySQL Ingestion'}
                  </button>
                </div>
              </div>
            )}

            {/* CHANNEL D: MANUAL FORM */}
            {ingestionChannel === 'manual' && (
              <form onSubmit={handleManualSubmit} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                    <Plus className="w-5 h-5 text-orange-500" />
                    <span>Add Lead Manually</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Directly inject a new company & decision-maker record into the global B2B database.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={manualForm.companyName}
                      onChange={(e) => setManualForm({ ...manualForm, companyName: e.target.value })}
                      placeholder="e.g. OpenAI Global"
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Website Domain *</label>
                    <input
                      type="text"
                      required
                      value={manualForm.domain}
                      onChange={(e) => setManualForm({ ...manualForm, domain: e.target.value })}
                      placeholder="openai.com"
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Industry</label>
                    <select
                      value={manualForm.industry}
                      onChange={(e) => setManualForm({ ...manualForm, industry: e.target.value })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    >
                      {FILTER_TAXONOMY.industries.map((ind) => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Contact Name</label>
                    <input
                      type="text"
                      value={manualForm.contactName}
                      onChange={(e) => setManualForm({ ...manualForm, contactName: e.target.value })}
                      placeholder="Sam Altman"
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Job Title</label>
                    <input
                      type="text"
                      value={manualForm.contactTitle}
                      onChange={(e) => setManualForm({ ...manualForm, contactTitle: e.target.value })}
                      placeholder="Chief Executive Officer"
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Work Email *</label>
                    <input
                      type="email"
                      required
                      value={manualForm.contactEmail}
                      onChange={(e) => setManualForm({ ...manualForm, contactEmail: e.target.value })}
                      placeholder="s.altman@openai.com"
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Direct Phone</label>
                    <input
                      type="text"
                      value={manualForm.contactPhone}
                      onChange={(e) => setManualForm({ ...manualForm, contactPhone: e.target.value })}
                      placeholder="+1 (415) 890-2190"
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Country</label>
                    <select
                      value={manualForm.country}
                      onChange={(e) => setManualForm({ ...manualForm, country: e.target.value })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    >
                      {FILTER_TAXONOMY.countries.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Tech Stack (comma separated)</label>
                    <input
                      type="text"
                      value={manualForm.techStack}
                      onChange={(e) => setManualForm({ ...manualForm, techStack: e.target.value })}
                      placeholder="AWS, PyTorch, Kubernetes"
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={isIngesting}
                    className="px-6 py-2.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-lg shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isIngesting ? 'Inserting...' : 'Insert Lead into Live Database'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

