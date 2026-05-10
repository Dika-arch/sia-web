const seed = window.PROJECT_SIA_SEED;
const STORAGE_KEY_BASE = 'project-sia-interactive-state-v2';
const APP_VERSION = '1.5.1';
const CLOUD_DOC_ID = 'primary';
const authSettings = {
  requireLogin: true,
  allowLocalFallback: true,
  ...(window.SIA_AUTH_SETTINGS || {})
};

const TEMPLATE_CONFIG = {
  service_revenue_cash: {
    label: 'Pendapatan jasa tunai',
    helper: 'Debit Kas, Kredit Pendapatan Jasa.',
    accountLabel: 'Akun pendapatan',
    accountOptions: ['4101'],
    sourceLabel: 'Akun kas',
    sourceOptions: ['1101'],
    buildLines: (tx) => [
      { account: tx.source || '1101', debit: tx.amount, credit: 0 },
      { account: tx.account || '4101', debit: 0, credit: tx.amount }
    ]
  },
  service_revenue_credit: {
    label: 'Pendapatan jasa piutang',
    helper: 'Debit Piutang Dagang, Kredit Pendapatan Jasa.',
    accountLabel: 'Akun pendapatan',
    accountOptions: ['4101'],
    sourceLabel: 'Akun piutang',
    sourceOptions: ['1102'],
    buildLines: (tx) => [
      { account: tx.source || '1102', debit: tx.amount, credit: 0 },
      { account: tx.account || '4101', debit: 0, credit: tx.amount }
    ]
  },
  expense_cash: {
    label: 'Pengeluaran tunai',
    helper: 'Debit akun beban terpilih, Kredit Kas. Cocok untuk gaji, sewa, iklan, dan biaya lain.',
    accountLabel: 'Akun beban',
    accountOptions: ['5101', '5102', '5103', '5105', '5106', '5107', '5108'],
    sourceLabel: 'Akun kas',
    sourceOptions: ['1101'],
    buildLines: (tx) => [
      { account: tx.account || '5105', debit: tx.amount, credit: 0 },
      { account: tx.source || '1101', debit: 0, credit: tx.amount }
    ]
  },
  expense_payable: {
    label: 'Beban masih utang',
    helper: 'Debit akun beban terpilih, Kredit Utang Usaha atau Utang Gaji dan Komisi.',
    accountLabel: 'Akun beban',
    accountOptions: ['5101', '5102', '5103', '5105', '5106'],
    sourceLabel: 'Akun utang',
    sourceOptions: ['2101', '2103'],
    buildLines: (tx) => [
      { account: tx.account || '5105', debit: tx.amount, credit: 0 },
      { account: tx.source || '2101', debit: 0, credit: tx.amount }
    ]
  },
  collect_receivable: {
    label: 'Penerimaan piutang',
    helper: 'Debit Kas, Kredit Piutang Dagang.',
    accountLabel: 'Akun piutang',
    accountOptions: ['1102'],
    sourceLabel: 'Akun kas',
    sourceOptions: ['1101'],
    buildLines: (tx) => [
      { account: tx.source || '1101', debit: tx.amount, credit: 0 },
      { account: tx.account || '1102', debit: 0, credit: tx.amount }
    ]
  },
  pay_payable: {
    label: 'Pembayaran utang',
    helper: 'Debit akun utang, Kredit Kas.',
    accountLabel: 'Akun utang',
    accountOptions: ['2101', '2103'],
    sourceLabel: 'Akun kas',
    sourceOptions: ['1101'],
    buildLines: (tx) => [
      { account: tx.account || '2101', debit: tx.amount, credit: 0 },
      { account: tx.source || '1101', debit: 0, credit: tx.amount }
    ]
  },
  owner_investment: {
    label: 'Setoran modal pemilik',
    helper: 'Debit Kas, Kredit Modal Tiara.',
    accountLabel: 'Akun modal',
    accountOptions: ['3101'],
    sourceLabel: 'Akun kas',
    sourceOptions: ['1101'],
    buildLines: (tx) => [
      { account: tx.source || '1101', debit: tx.amount, credit: 0 },
      { account: tx.account || '3101', debit: 0, credit: tx.amount }
    ]
  },
  owner_draw: {
    label: 'Prive pemilik',
    helper: 'Debit Prive Tiara, Kredit Kas.',
    accountLabel: 'Akun prive',
    accountOptions: ['3102'],
    sourceLabel: 'Akun kas',
    sourceOptions: ['1101'],
    buildLines: (tx) => [
      { account: tx.account || '3102', debit: tx.amount, credit: 0 },
      { account: tx.source || '1101', debit: 0, credit: tx.amount }
    ]
  },
  buy_supplies: {
    label: 'Pembelian perlengkapan',
    helper: 'Debit Perlengkapan Kantor, kredit Kas atau Utang Usaha.',
    accountLabel: 'Akun perlengkapan',
    accountOptions: ['1105'],
    sourceLabel: 'Sumber pembayaran',
    sourceOptions: ['1101', '2101'],
    buildLines: (tx) => [
      { account: tx.account || '1105', debit: tx.amount, credit: 0 },
      { account: tx.source || '2101', debit: 0, credit: tx.amount }
    ]
  },
  prepaid_insurance: {
    label: 'Bayar asuransi di muka',
    helper: 'Debit Asuransi Dibayar Dimuka, Kredit Kas.',
    accountLabel: 'Akun prepaid',
    accountOptions: ['1103'],
    sourceLabel: 'Akun kas',
    sourceOptions: ['1101'],
    buildLines: (tx) => [
      { account: tx.account || '1103', debit: tx.amount, credit: 0 },
      { account: tx.source || '1101', debit: 0, credit: tx.amount }
    ]
  },
  insurance_adjustment: {
    label: 'Penyesuaian asuransi',
    helper: 'Debit Biaya Asuransi, Kredit Asuransi Dibayar Dimuka.',
    accountLabel: 'Akun beban',
    accountOptions: ['5108'],
    sourceLabel: 'Akun prepaid',
    sourceOptions: ['1103'],
    buildLines: (tx) => [
      { account: tx.account || '5108', debit: tx.amount, credit: 0 },
      { account: tx.source || '1103', debit: 0, credit: tx.amount }
    ]
  },
  depreciation_adjustment: {
    label: 'Penyesuaian penyusutan',
    helper: 'Debit Biaya Penyusutan Gedung, Kredit Akumulasi Penyusutan Gedung.',
    accountLabel: 'Akun beban',
    accountOptions: ['5107'],
    sourceLabel: 'Akun kontra aset',
    sourceOptions: ['1203'],
    buildLines: (tx) => [
      { account: tx.account || '5107', debit: tx.amount, credit: 0 },
      { account: tx.source || '1203', debit: 0, credit: tx.amount }
    ]
  }
};

const KPI_META = [
  {
    label: 'Total Kas',
    key: 'cash',
    relationLabel: 'vs saldo awal kas',
    icon: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M16 12h.01" /><path d="M7 10h10" /></svg>'
  },
  {
    label: 'Total Pendapatan',
    key: 'revenue',
    relationLabel: 'dari total aset',
    icon: '<svg viewBox="0 0 24 24"><path d="M4 16 10 10l4 4 6-8" /><path d="M20 6v4h-4" /></svg>'
  },
  {
    label: 'Total Beban',
    key: 'expense',
    relationLabel: 'terhadap pendapatan',
    icon: '<svg viewBox="0 0 24 24"><path d="M4 8 10 14l4-4 6 6" /><path d="M20 16v-4h-4" /></svg>'
  },
  {
    label: 'Laba Bersih',
    key: 'netIncome',
    relationLabel: 'margin bersih',
    icon: '<svg viewBox="0 0 24 24"><path d="M12 3v18" /><path d="M8 7h7a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h7" /></svg>'
  },
  {
    label: 'Total Aset',
    key: 'assets',
    relationLabel: 'vs saldo awal aset',
    icon: '<svg viewBox="0 0 24 24"><path d="M6 4h9l3 3v13H6z" /><path d="M9 12h6" /><path d="M9 16h6" /><path d="M15 4v3h3" /></svg>'
  },
  {
    label: 'Kewajiban + Ekuitas',
    key: 'rightSide',
    relationLabel: 'vs saldo awal',
    icon: '<svg viewBox="0 0 24 24"><path d="M12 3v18" /><path d="M6 7h12" /><path d="M4 21h16" /><path d="M8 7c0 2-2 4-2 7s2 5 2 7" /><path d="M16 7c0 2 2 4 2 7s-2 5-2 7" /></svg>'
  }
];

const state = createFreshState([]);
const CLOUD_SCHEMA_VERSION = 1;
let activeStorageKey = STORAGE_KEY_BASE;
let transactionQuery = '';
let ledgerQuery = '';
let confirmHandler = null;
let currentUser = null;
let authClient = null;
let firestoreClient = null;
let authReady = false;
let localModeActive = false;
let cloudSyncTimer = null;
let cloudSyncInFlight = false;
let pendingCloudSync = false;
let lastSyncedStateHash = '';
let lastLoadedCloudHash = '';
let isApplyingRemoteState = false;
let cloudUnsubscribe = null;
const OPENING_KPI_VALUES = deriveOpeningKpiValues();


function deriveOpeningKpiValues() {
  const openingMap = new Map(seed.openingBalances.map((item) => [item.code, Number(item.debit || 0) - Number(item.credit || 0)]));
  const cash = openingMap.get('1101') || 0;
  const assetBuckets = new Set(['asset_current', 'asset_fixed', 'contra_asset']);
  const liabilityBuckets = new Set(['liability_current']);

  let assets = 0;
  let liabilities = 0;
  seed.accounts.forEach((account) => {
    const signed = openingMap.get(account.code) || 0;
    if (assetBuckets.has(account.bucket)) assets += signed;
    if (liabilityBuckets.has(account.bucket)) liabilities += Math.abs(Math.min(signed, 0));
  });

  const capital = Math.abs(Math.min(openingMap.get('3101') || 0, 0));
  return {
    cash,
    assets,
    rightSide: liabilities + capital
  };
}

function percentChange(currentValue, baseValue) {
  if (Math.abs(baseValue) < 1) {
    if (Math.abs(currentValue) < 1) return 0;
    return currentValue > 0 ? 100 : -100;
  }
  return ((currentValue - baseValue) / Math.abs(baseValue)) * 100;
}

function ratioPercent(numerator, denominator, { negative = false } = {}) {
  if (Math.abs(denominator) < 1) {
    if (Math.abs(numerator) < 1) return 0;
    return numerator > 0 ? (negative ? -100 : 100) : -100;
  }
  const value = (numerator / Math.abs(denominator)) * 100;
  return negative ? -value : value;
}

function formatPercent(value) {
  const rounded = Math.abs(value) >= 100 ? value.toFixed(0) : value.toFixed(1);
  return `${value > 0 ? '+' : ''}${Number(rounded).toLocaleString('id-ID', {
    minimumFractionDigits: rounded.includes('.') ? 1 : 0,
    maximumFractionDigits: rounded.includes('.') ? 1 : 0
  })}%`;
}

function computeKpiIndicator(key, values) {
  switch (key) {
    case 'cash':
      return {
        value: percentChange(values.cash, OPENING_KPI_VALUES.cash),
        relation: 'vs saldo awal kas'
      };
    case 'revenue':
      return {
        value: ratioPercent(values.revenue, values.assets),
        relation: 'dari total aset'
      };
    case 'expense':
      return {
        value: ratioPercent(values.expense, values.revenue, { negative: true }),
        relation: 'terhadap pendapatan'
      };
    case 'netIncome':
      return {
        value: ratioPercent(values.netIncome, values.revenue),
        relation: 'margin bersih'
      };
    case 'assets':
      return {
        value: percentChange(values.assets, OPENING_KPI_VALUES.assets),
        relation: 'vs saldo awal aset'
      };
    case 'rightSide':
      return {
        value: percentChange(values.rightSide, OPENING_KPI_VALUES.rightSide),
        relation: 'vs saldo awal'
      };
    default:
      return {
        value: 0,
        relation: ''
      };
  }
}

function loadState(storageKey = activeStorageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) return normalizeAppState(JSON.parse(raw));
  } catch (error) {
    console.warn('Gagal membaca localStorage:', error);
  }
  return createFreshState([]);
}

function createFreshState(transactions = []) {
  return {
    meta: { ...seed.meta },
    transactions: transactions.map((item) => ({ ...item }))
  };
}

function normalizeMeta(meta = {}) {
  return {
    companyName: String(meta.companyName || seed.meta.companyName || '').trim() || seed.meta.companyName,
    periodLabel: String(meta.periodLabel || seed.meta.periodLabel || '').trim() || seed.meta.periodLabel,
    sourceNote: String(meta.sourceNote || seed.meta.sourceNote || '').trim() || seed.meta.sourceNote
  };
}

function normalizeTransaction(item, index = 0) {
  if (!item || typeof item !== 'object') return null;

  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(item.date || '').trim())
    ? String(item.date).trim()
    : defaultToday();
  const description = String(item.description || `Transaksi ${index + 1}`).trim() || `Transaksi ${index + 1}`;
  const amount = Number(item.amount || 0);

  if (!(amount > 0)) return null;

  if (item.mode === 'manual') {
    const debitAccount = String(item.debitAccount || '').trim();
    const creditAccount = String(item.creditAccount || '').trim();
    if (!accountByCode(debitAccount) || !accountByCode(creditAccount) || debitAccount === creditAccount) return null;
    return {
      id: String(item.id || id('man')),
      mode: 'manual',
      date,
      description,
      amount,
      debitAccount,
      creditAccount
    };
  }

  const type = String(item.type || '').trim();
  if (!TEMPLATE_CONFIG[type]) return null;

  const template = TEMPLATE_CONFIG[type];
  const source = template.sourceOptions.includes(String(item.source || '').trim())
    ? String(item.source).trim()
    : template.sourceOptions[0];
  const account = template.accountOptions.includes(String(item.account || '').trim())
    ? String(item.account).trim()
    : template.accountOptions[0];

  return {
    id: String(item.id || id('tpl')),
    mode: 'template',
    type,
    date,
    description,
    amount,
    source,
    account
  };
}

function normalizeAppState(input = {}) {
  const source = input?.state && typeof input.state === 'object' ? input.state : input;
  const transactions = Array.isArray(source?.transactions)
    ? source.transactions.map((item, index) => normalizeTransaction(item, index)).filter(Boolean)
    : [];

  return {
    meta: normalizeMeta(source?.meta || {}),
    transactions
  };
}

function replaceState(nextState) {
  const normalized = normalizeAppState(nextState);
  state.meta = normalized.meta;
  state.transactions = normalized.transactions;
}

function storageKeyForUser(user) {
  return user?.uid ? `${STORAGE_KEY_BASE}:${user.uid}` : STORAGE_KEY_BASE;
}

function hydrateStateForUser(user) {
  activeStorageKey = storageKeyForUser(user);
  replaceState(loadState(activeStorageKey));
}

function snapshotState() {
  return {
    meta: { ...state.meta },
    transactions: state.transactions.map((item) => ({ ...item }))
  };
}

function stateHash(payload) {
  return JSON.stringify(payload || { meta: {}, transactions: [] });
}

function persistLocalState() {
  localStorage.setItem(activeStorageKey, JSON.stringify(state));
}

function byId(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const el = byId(id);
  if (el) el.textContent = value;
}

function setHtml(id, value) {
  const el = byId(id);
  if (el) el.innerHTML = value;
}

function setValue(id, value) {
  const el = byId(id);
  if (el) el.value = value;
}

function scrollToSection(id) {
  const el = byId(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


function updateSyncIndicator(mode = 'local', message = 'Data lokal saja') {
  const pill = document.getElementById('sync-status-pill');
  const text = document.getElementById('sync-status-text');
  if (!pill || !text) return;

  const shouldShow = Boolean(currentUser || localModeActive || mode === 'error');
  pill.classList.toggle('hidden', !shouldShow);
  pill.dataset.mode = mode;
  text.textContent = message;
}

function canUseCloudSync() {
  return Boolean(firestoreClient?.db && currentUser?.uid && !localModeActive);
}

function getCloudDocRef() {
  if (!canUseCloudSync()) return null;
  return firestoreClient.doc(firestoreClient.db, 'siaUsers', currentUser.uid, 'apps', CLOUD_DOC_ID);
}

function normalizeCloudState(data) {
  return normalizeAppState(data);
}

function teardownCloudListener() {
  if (typeof cloudUnsubscribe === 'function') cloudUnsubscribe();
  cloudUnsubscribe = null;
}

function resetCloudSyncState() {
  teardownCloudListener();
  if (cloudSyncTimer) clearTimeout(cloudSyncTimer);
  cloudSyncTimer = null;
  cloudSyncInFlight = false;
  pendingCloudSync = false;
  lastSyncedStateHash = '';
  lastLoadedCloudHash = '';
  isApplyingRemoteState = false;
}

async function saveStateToCloud({ reason = 'Perubahan data', force = false } = {}) {
  const docRef = getCloudDocRef();
  if (!docRef) return;

  const payload = snapshotState();
  const payloadHash = stateHash(payload);

  if (!force && payloadHash === lastSyncedStateHash) {
    updateSyncIndicator('synced', 'Semua perubahan tersimpan');
    return;
  }

  if (cloudSyncInFlight) {
    pendingCloudSync = true;
    return;
  }

  cloudSyncInFlight = true;
  updateSyncIndicator('saving', 'Menyimpan ke cloud...');

  try {
    await firestoreClient.setDoc(docRef, {
      schemaVersion: CLOUD_SCHEMA_VERSION,
      meta: payload.meta,
      transactions: payload.transactions,
      updatedAt: firestoreClient.serverTimestamp(),
      updatedBy: {
        uid: currentUser.uid,
        email: currentUser.email || '',
        displayName: currentUser.displayName || ''
      }
    }, { merge: true });

    lastSyncedStateHash = payloadHash;
    lastLoadedCloudHash = payloadHash;
    updateSyncIndicator('synced', `Tersimpan ${timeLabel()}`);
  } catch (error) {
    console.error(`Gagal sinkronisasi cloud (${reason}):`, error);
    updateSyncIndicator('error', 'Sinkronisasi cloud gagal');
    showToast('Sinkronisasi gagal', 'Perubahan terbaru masih aman di browser ini. Cek Firestore, rules, atau koneksi internet.', 'error');
    throw error;
  } finally {
    cloudSyncInFlight = false;
    if (pendingCloudSync) {
      pendingCloudSync = false;
      scheduleCloudSync('Perubahan lanjutan');
    }
  }
}

function scheduleCloudSync(reason = 'Perubahan data') {
  if (!canUseCloudSync() || isApplyingRemoteState) return;
  updateSyncIndicator('pending', 'Perubahan menunggu sinkronisasi');
  if (cloudSyncTimer) clearTimeout(cloudSyncTimer);
  cloudSyncTimer = setTimeout(() => {
    saveStateToCloud({ reason }).catch(() => {});
  }, 700);
}

async function loadStateFromCloud() {
  const docRef = getCloudDocRef();
  if (!docRef) return;

  updateSyncIndicator('saving', 'Mengambil data cloud...');
  const snapshot = await firestoreClient.getDoc(docRef);

  if (snapshot.exists()) {
    const remoteState = normalizeCloudState(snapshot.data());
    const remoteHash = stateHash(remoteState);
    isApplyingRemoteState = true;
    replaceState(remoteState);
    persistLocalState();
    render();
    isApplyingRemoteState = false;
    lastLoadedCloudHash = remoteHash;
    lastSyncedStateHash = remoteHash;
    updateSyncIndicator('synced', `Cloud dimuat ${timeLabel()}`);
    return;
  }

  const guestState = normalizeCloudState(loadState(STORAGE_KEY_BASE));
  const hasGuestData = guestState.transactions.length > 0;
  const hasCurrentUserData = state.transactions.length > 0;

  if (hasGuestData && !hasCurrentUserData) {
    isApplyingRemoteState = true;
    replaceState(guestState);
    persistLocalState();
    render();
    isApplyingRemoteState = false;
    await saveStateToCloud({ reason: 'Migrasi data lokal pertama', force: true });
    showToast('Data lama dipindahkan', 'Transaksi lokal di browser ini sudah disalin ke cloud akun Google kamu.');
    return;
  }

  await saveStateToCloud({ reason: 'Inisialisasi dokumen cloud', force: true });
  updateSyncIndicator('synced', 'Cloud siap dipakai');
}

function attachCloudListener() {
  teardownCloudListener();
  const docRef = getCloudDocRef();
  if (!docRef) return;

  cloudUnsubscribe = firestoreClient.onSnapshot(docRef, (snapshot) => {
    if (!snapshot.exists()) return;
    const remoteState = normalizeCloudState(snapshot.data());
    const remoteHash = stateHash(remoteState);
    const localHash = stateHash(snapshotState());

    if (remoteHash === localHash || remoteHash === lastLoadedCloudHash) return;

    isApplyingRemoteState = true;
    replaceState(remoteState);
    persistLocalState();
    render();
    isApplyingRemoteState = false;
    lastLoadedCloudHash = remoteHash;
    lastSyncedStateHash = remoteHash;
    updateSyncIndicator('synced', `Cloud diperbarui ${timeLabel()}`);
  }, (error) => {
    console.error('Listener Firestore terputus:', error);
    updateSyncIndicator('error', 'Listener cloud terputus');
  });
}

function persistState() {
  persistLocalState();
  scheduleCloudSync('Perubahan data aplikasi');
}

function id(prefix = 'tx') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function accountByCode(code) {
  return seed.accounts.find((account) => account.code === code);
}

function accountName(code) {
  const account = accountByCode(code);
  return account ? `${account.code} - ${account.name}` : code;
}

function currency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function plainNumber(value) {
  return new Intl.NumberFormat('id-ID').format(Number(value || 0));
}

function timeLabel(date = new Date()) {
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(date);
}

function signedToDisplay(value) {
  const amount = Number(value || 0);
  if (amount < 0) return `(${currency(Math.abs(amount))})`;
  return currency(amount);
}

function sum(list) {
  return list.reduce((total, value) => total + Number(value || 0), 0);
}

function populateSelect(select, options, formatter) {
  select.innerHTML = options.map((value) => `<option value="${value}">${formatter(value)}</option>`).join('');
}

function initialsFromName(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'U';
}

function avatarFallback(name = '') {
  const initials = encodeURIComponent(initialsFromName(name));
  return `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" rx="32" fill="#2f7cf7"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="24" fill="white">${initials}</text></svg>` )}`;
}

function setAppLocked(locked) {
  document.body.classList.toggle('app-locked', locked);
  const backdrop = document.getElementById('auth-modal-backdrop');
  if (backdrop) backdrop.classList.toggle('hidden', !locked);
}

function setAuthModalState({ title, message, status, canLogin = false, allowLocal = false, loginLabel = 'Masuk dengan Google' }) {
  const titleNode = document.getElementById('auth-modal-title');
  const messageNode = document.getElementById('auth-modal-message');
  const statusNode = document.getElementById('auth-status-box');
  const loginBtn = document.getElementById('btn-login-google');
  const continueBtn = document.getElementById('btn-auth-continue-local');
  if (titleNode) titleNode.textContent = title;
  if (messageNode) messageNode.textContent = message;
  if (statusNode) statusNode.innerHTML = status;
  if (loginBtn) {
    loginBtn.textContent = loginLabel;
    loginBtn.classList.toggle('hidden', !canLogin);
    loginBtn.disabled = !canLogin;
  }
  if (continueBtn) continueBtn.classList.toggle('hidden', !allowLocal);
}

function updateAuthToolbar(user) {
  const chip = document.getElementById('auth-user-chip');
  const nameNode = document.getElementById('auth-user-name');
  const emailNode = document.getElementById('auth-user-email');
  const avatarNode = document.getElementById('auth-user-avatar');
  const logoutBtn = document.getElementById('btn-logout-top');

  if (!chip || !nameNode || !emailNode || !avatarNode || !logoutBtn) return;

  chip.classList.remove('hidden');

  if (user) {
    nameNode.textContent = user.displayName || 'Pengguna Google';
    emailNode.textContent = user.email || 'Login aktif';
    avatarNode.src = user.photoURL || avatarFallback(user.displayName || user.email || 'User');
    avatarNode.alt = `Foto ${user.displayName || user.email || 'pengguna'}`;
    logoutBtn.classList.remove('hidden');
    return;
  }

  nameNode.textContent = localModeActive ? 'Mode Lokal' : 'Belum login';
  emailNode.textContent = localModeActive ? 'Aplikasi tetap berjalan tanpa autentikasi Firebase.' : 'Masuk untuk memisahkan data per akun.';
  avatarNode.src = avatarFallback(localModeActive ? 'Mode Lokal' : 'Guest');
  avatarNode.alt = localModeActive ? 'Mode lokal' : 'Belum login';
  logoutBtn.classList.add('hidden');
}

function humanizeAuthError(error) {
  const code = error?.code || '';
  if (code === 'auth/popup-closed-by-user') return 'Popup login ditutup sebelum proses selesai.';
  if (code === 'auth/popup-blocked') return 'Browser memblokir popup login. Izinkan popup lalu coba lagi.';
  if (code === 'auth/unauthorized-domain') return 'Domain website belum diizinkan di Firebase Auth. Tambahkan domain GitHub Pages kamu di Authorized domains.';
  if (code === 'auth/cancelled-popup-request') return 'Permintaan login sebelumnya dibatalkan karena ada popup baru.';
  if (code === 'permission-denied') return 'Firestore menolak akses. Periksa Firestore Security Rules agar user hanya mengakses dokumennya sendiri.';
  if (code === 'failed-precondition') return 'Cloud Firestore biasanya belum dibuat. Buka Firebase Console lalu buat database Firestore terlebih dulu.';
  return error?.message || 'Terjadi kendala saat login Google.';
}

function isFirebaseConfigured() {
  const config = window.FIREBASE_CONFIG || {};
  const required = ['apiKey', 'authDomain', 'projectId', 'appId'];
  return required.every((key) => {
    const value = String(config[key] || '').trim();
    return value && !value.startsWith('YOUR_');
  });
}

function continueInLocalMode() {
  resetCloudSyncState();
  localModeActive = true;
  currentUser = null;
  hydrateStateForUser(null);
  updateAuthToolbar(null);
  updateSyncIndicator('local', 'Mode lokal aktif');
  setAppLocked(false);
  render();
  showToast('Mode lokal aktif', 'Login Firebase belum dipakai. Data tetap tersimpan di browser ini.', 'info');
}

async function handleGoogleLogin() {
  if (!authClient) return;
  const loginBtn = document.getElementById('btn-login-google');
  const originalLabel = loginBtn?.textContent || 'Masuk dengan Google';
  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.textContent = 'Membuka Google...';
  }

  try {
    await authClient.signInWithPopup(authClient.auth, authClient.provider);
  } catch (error) {
    showToast('Login gagal', humanizeAuthError(error), 'error');
    if (authReady && authSettings.requireLogin) setAppLocked(true);
  } finally {
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent = originalLabel;
    }
  }
}

async function handleLogout() {
  if (!authClient) return;
  try {
    resetCloudSyncState();
    await authClient.signOut(authClient.auth);
    showToast('Logout berhasil', 'Sesi Google sudah ditutup.');
  } catch (error) {
    showToast('Logout gagal', humanizeAuthError(error), 'error');
  }
}

async function bootstrapAuth() {
  const configured = isFirebaseConfigured();
  updateAuthToolbar(null);

  const loginButton = document.getElementById('btn-login-google');
  const continueButton = document.getElementById('btn-auth-continue-local');
  const logoutButton = document.getElementById('btn-logout-top');

  loginButton?.addEventListener('click', handleGoogleLogin);
  continueButton?.addEventListener('click', continueInLocalMode);
  logoutButton?.addEventListener('click', handleLogout);

  if (!configured) {
    setAuthModalState({
      title: 'Firebase belum dikonfigurasi',
      message: 'Isi file firebase-config.js dulu agar login Google aktif di GitHub Pages.',
      status: 'Salin konfigurasi Web App Firebase ke file <code>firebase-config.js</code>, lalu aktifkan provider Google di Firebase Authentication.',
      canLogin: false,
      allowLocal: Boolean(authSettings.allowLocalFallback)
    });
    setAppLocked(true);
    return;
  }

  if (authSettings.requireLogin) {
    setAuthModalState({
      title: 'Masuk untuk membuka aplikasi',
      message: 'Gunakan akun Google agar data SIA dipisahkan berdasarkan akun yang login.',
      status: 'Menghubungkan Firebase Authentication...',
      canLogin: false,
      allowLocal: false
    });
    setAppLocked(true);
  }

  try {
    const version = '12.2.0';
    const [{ initializeApp }, {
      getAuth,
      GoogleAuthProvider,
      browserLocalPersistence,
      onAuthStateChanged,
      setPersistence,
      signInWithPopup,
      signOut
    }, {
      getFirestore,
      doc,
      getDoc,
      onSnapshot,
      serverTimestamp,
      setDoc
    }] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${version}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${version}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${version}/firebase-firestore.js`)
    ]);

    const app = initializeApp(window.FIREBASE_CONFIG);
    const auth = getAuth(app);
    const db = getFirestore(app);
    await setPersistence(auth, browserLocalPersistence);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    authClient = { auth, provider, signInWithPopup, signOut };
    firestoreClient = { db, doc, getDoc, onSnapshot, serverTimestamp, setDoc };
    authReady = true;

    setAuthModalState({
      title: 'Masuk untuk membuka aplikasi',
      message: 'Gunakan akun Google agar data SIA dipisahkan berdasarkan akun yang login.',
      status: 'Firebase Auth dan Firestore siap. Klik tombol di bawah untuk login Google.',
      canLogin: true,
      allowLocal: false
    });

    onAuthStateChanged(auth, async (user) => {
      currentUser = user || null;

      if (currentUser) {
        try {
          localModeActive = false;
          hydrateStateForUser(currentUser);
          updateAuthToolbar(currentUser);
          updateSyncIndicator('saving', 'Menyiapkan sinkronisasi akun...');
          setAuthModalState({
            title: 'Menyiapkan data akun',
            message: 'Login berhasil. Sekarang aplikasi sedang memuat data cloud milik akun Google kamu.',
            status: 'Menghubungkan Cloud Firestore...',
            canLogin: false,
            allowLocal: false
          });
          setAppLocked(true);
          await loadStateFromCloud();
          attachCloudListener();
          updateAuthToolbar(currentUser);
          setAppLocked(false);
          render();
        } catch (error) {
          console.error('Gagal memuat data cloud:', error);
          updateSyncIndicator('error', 'Cloud gagal dimuat');
          setAuthModalState({
            title: 'Cloud Firestore belum siap',
            message: 'Login Google berhasil, tetapi data cloud belum bisa dibaca. Periksa apakah Firestore sudah dibuat dan rules-nya benar.',
            status: humanizeAuthError(error),
            canLogin: false,
            allowLocal: false
          });
          setAppLocked(false);
          render();
          showToast('Cloud belum aktif', 'Akun Google sudah masuk, tetapi sinkronisasi cloud belum berjalan. Data sementara tetap tersimpan di browser akun ini.', 'info');
        }
        return;
      }

      resetCloudSyncState();

      if (!authSettings.requireLogin && !localModeActive) {
        hydrateStateForUser(null);
        updateAuthToolbar(null);
        updateSyncIndicator('local', 'Mode browser biasa');
        setAppLocked(false);
        render();
        return;
      }

      hydrateStateForUser(null);
      updateAuthToolbar(null);
      updateSyncIndicator('local', 'Menunggu login');
      render();
      setAuthModalState({
        title: 'Masuk untuk membuka aplikasi',
        message: 'Gunakan akun Google agar data SIA dipisahkan berdasarkan akun yang login dan tersimpan ke cloud.',
        status: 'Firebase Auth dan Firestore siap. Klik tombol di bawah untuk login Google.',
        canLogin: true,
        allowLocal: false
      });
      setAppLocked(true);
    });
  } catch (error) {
    console.error('Gagal menyiapkan Firebase Auth:', error);
    updateSyncIndicator('error', 'Firebase gagal dimuat');
    setAuthModalState({
      title: 'Firebase gagal dimuat',
      message: 'Script autentikasi tidak berhasil dimuat. Cek konfigurasi atau koneksi internet.',
      status: humanizeAuthError(error),
      canLogin: false,
      allowLocal: Boolean(authSettings.allowLocalFallback)
    });
    setAppLocked(true);
  }
}

function defaultToday() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function emptyState(message) {
  return `<div class="empty-state">${message}</div>`;
}

function showToast(title, message, type = 'success') {
  const stack = document.getElementById('toast-stack');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<strong>${title}</strong><span>${message}</span>`;
  stack.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
  }, 2800);
  setTimeout(() => toast.remove(), 3300);
}

function openConfirm(title, message, onConfirm) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-message').textContent = message;
  document.getElementById('confirm-modal-backdrop').classList.remove('hidden');
  confirmHandler = onConfirm;
}

function closeConfirm() {
  document.getElementById('confirm-modal-backdrop').classList.add('hidden');
  confirmHandler = null;
}

function computeJournalLines(transaction) {
  if (transaction.mode === 'manual') {
    return [
      { account: transaction.debitAccount, debit: transaction.amount, credit: 0 },
      { account: transaction.creditAccount, debit: 0, credit: transaction.amount }
    ];
  }
  const template = TEMPLATE_CONFIG[transaction.type];
  if (!template) return [];
  return template.buildLines(transaction);
}

function deriveBook() {
  const openingMap = new Map(seed.openingBalances.map((item) => [item.code, { debit: Number(item.debit || 0), credit: Number(item.credit || 0) }]));
  const balances = new Map(seed.accounts.map((account) => [account.code, (openingMap.get(account.code)?.debit || 0) - (openingMap.get(account.code)?.credit || 0)]));
  const ledgerMap = new Map(seed.accounts.map((account) => [account.code, []]));
  const transactions = [...state.transactions].sort((a, b) => a.date.localeCompare(b.date));
  const journalRows = [];
  const flow = {};

  transactions.forEach((transaction) => {
    const lines = computeJournalLines(transaction);
    const debitTotal = sum(lines.map((line) => line.debit));
    const creditTotal = sum(lines.map((line) => line.credit));
    const counterNames = lines.map((line) => accountByCode(line.account)?.name || line.account).join(' / ');
    const isOperational = String(transaction.id || '').startsWith('ops-');
    const flowKey = isOperational ? 'operasional-pos' : (transaction.type || transaction.id);
    const transactionLabel = isOperational ? 'Operasional POS' : (transaction.mode === 'manual' ? 'Jurnal manual' : TEMPLATE_CONFIG[transaction.type].label);

    if (!flow[flowKey]) {
      flow[flowKey] = {
        label: transactionLabel,
        amount: 0,
        count: 0
      };
    }
    flow[flowKey].amount += Number(transaction.amount || 0);
    flow[flowKey].count += 1;

    lines.forEach((line, index) => {
      const currentSigned = balances.get(line.account) || 0;
      const nextSigned = currentSigned + Number(line.debit || 0) - Number(line.credit || 0);
      balances.set(line.account, nextSigned);

      ledgerMap.get(line.account).push({
        date: transaction.date,
        ref: transaction.id,
        description: transaction.description,
        debit: Number(line.debit || 0),
        credit: Number(line.credit || 0),
        runningSigned: nextSigned,
        transactionType: transactionLabel,
        counterpart: counterNames
      });

      journalRows.push({
        transactionId: transaction.id,
        date: transaction.date,
        description: transaction.description,
        lineNumber: index + 1,
        account: line.account,
        accountName: accountByCode(line.account)?.name || line.account,
        debit: Number(line.debit || 0),
        credit: Number(line.credit || 0),
        modeLabel: transactionLabel,
        transactionAmount: Number(transaction.amount || 0)
      });
    });

    journalRows.push({
      transactionId: `${transaction.id}-total`,
      date: '',
      description: `Total transaksi ${transaction.description}`,
      lineNumber: 99,
      account: '',
      accountName: 'TOTAL',
      debit: debitTotal,
      credit: creditTotal,
      modeLabel: '',
      transactionAmount: Number(transaction.amount || 0),
      isTotal: true
    });
  });

  const trialRows = seed.accounts.map((account) => {
    const signed = balances.get(account.code) || 0;
    return {
      code: account.code,
      name: account.name,
      bucket: account.bucket,
      signed,
      debit: signed > 0 ? signed : 0,
      credit: signed < 0 ? Math.abs(signed) : 0
    };
  });

  const debitTotal = sum(trialRows.map((row) => row.debit));
  const creditTotal = sum(trialRows.map((row) => row.credit));

  const revenueRows = trialRows.filter((row) => row.bucket === 'revenue' && row.credit > 0);
  const expenseRows = trialRows.filter((row) => row.bucket === 'expense' && row.debit > 0);
  const revenueTotal = sum(revenueRows.map((row) => row.credit));
  const expenseTotal = sum(expenseRows.map((row) => row.debit));
  const netIncome = revenueTotal - expenseTotal;

  const capitalOpening = Math.abs((openingMap.get('3101')?.credit || 0) - (openingMap.get('3101')?.debit || 0));
  const capitalCurrent = Math.abs(Math.min(balances.get('3101') || 0, 0));
  const additionalCapital = Math.max(capitalCurrent - capitalOpening, 0);
  const drawings = Math.max(balances.get('3102') || 0, 0);
  const endingCapital = capitalOpening + additionalCapital + netIncome - drawings;

  const currentAssets = trialRows.filter((row) => row.bucket === 'asset_current');
  const fixedAssets = trialRows.filter((row) => row.bucket === 'asset_fixed' || row.bucket === 'contra_asset');
  const liabilities = trialRows.filter((row) => row.bucket === 'liability_current');

  const totalCurrentAssets = sum(currentAssets.map((row) => row.signed));
  const totalFixedAssets = sum(fixedAssets.map((row) => row.signed));
  const totalAssets = totalCurrentAssets + totalFixedAssets;
  const totalLiabilities = sum(liabilities.map((row) => Math.abs(Math.min(row.signed, 0))));
  const totalRightSide = totalLiabilities + endingCapital;

  const closingJournalRows = [];
  const pushClosingEntry = (description, lines) => {
    if (!lines.length) return;
    const debit = sum(lines.map((line) => line.debit));
    const credit = sum(lines.map((line) => line.credit));
    lines.forEach((line, index) => {
      closingJournalRows.push({
        date: state.meta.periodLabel,
        type: 'Jurnal penutup',
        description,
        account: line.account,
        accountName: accountByCode(line.account)?.name || line.account,
        debit: Number(line.debit || 0),
        credit: Number(line.credit || 0),
        lineNumber: index + 1
      });
    });
    closingJournalRows.push({
      date: '',
      type: '',
      description: `Total ${description}`,
      account: '',
      accountName: 'TOTAL',
      debit,
      credit,
      isTotal: true
    });
  };

  if (revenueTotal > 0) {
    pushClosingEntry('Menutup akun pendapatan ke modal', [
      ...revenueRows.map((row) => ({ account: row.code, debit: row.credit, credit: 0 })),
      { account: '3101', debit: 0, credit: revenueTotal }
    ]);
  }

  if (expenseTotal > 0) {
    pushClosingEntry('Menutup akun beban ke modal', [
      { account: '3101', debit: expenseTotal, credit: 0 },
      ...expenseRows.map((row) => ({ account: row.code, debit: 0, credit: row.debit }))
    ]);
  }

  if (drawings > 0) {
    pushClosingEntry('Menutup akun prive ke modal', [
      { account: '3101', debit: drawings, credit: 0 },
      { account: '3102', debit: 0, credit: drawings }
    ]);
  }

  const postClosingRows = trialRows
    .filter((row) => !['revenue', 'expense', 'equity_withdrawal'].includes(row.bucket))
    .map((row) => {
      if (row.code === '3101') {
        return {
          ...row,
          signed: -endingCapital,
          debit: endingCapital < 0 ? Math.abs(endingCapital) : 0,
          credit: endingCapital >= 0 ? endingCapital : 0
        };
      }
      return { ...row };
    })
    .filter((row) => row.debit > 0 || row.credit > 0);

  const postClosingDebitTotal = sum(postClosingRows.map((row) => row.debit));
  const postClosingCreditTotal = sum(postClosingRows.map((row) => row.credit));

  return {
    transactions,
    journalRows,
    closingJournalRows,
    ledgerMap,
    trialRows,
    postClosingRows,
    revenueRows,
    expenseRows,
    revenueTotal,
    expenseTotal,
    netIncome,
    capitalOpening,
    additionalCapital,
    drawings,
    endingCapital,
    totalAssets,
    totalLiabilities,
    totalRightSide,
    totalCurrentAssets,
    totalFixedAssets,
    currentAssets,
    fixedAssets,
    liabilities,
    flow,
    debitTotal,
    creditTotal,
    postClosingDebitTotal,
    postClosingCreditTotal
  };
}

function createTable(columns, rows, options = {}) {
  const { numericKeys = [] } = options;
  if (!rows.length) return emptyState('Belum ada data untuk ditampilkan.');
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>${columns.map((column) => `<th class="${numericKeys.includes(column.key) ? 'num' : ''}">${column.label}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr class="${row.isTotal ? 'total-row' : ''}">
              ${columns.map((column) => {
                let value = row[column.key];
                if (numericKeys.includes(column.key) && value !== '' && value !== null && value !== undefined) value = currency(value);
                return `<td class="${numericKeys.includes(column.key) ? 'num' : ''}">${value ?? ''}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function syncMetaForm() {
  const form = document.getElementById('meta-form');
  if (!form) return;
  if (form.contains(document.activeElement)) return;
  form.querySelector('[name="companyName"]').value = state.meta.companyName || '';
  form.querySelector('[name="periodLabel"]').value = state.meta.periodLabel || '';
  form.querySelector('[name="sourceNote"]').value = state.meta.sourceNote || '';
}

function renderMeta(book) {
  setText('meta-company', state.meta.companyName);
  setText('meta-period', state.meta.periodLabel);
  setText('meta-transaction-count', plainNumber(book.transactions.length));
  setText('meta-source-note', state.meta.sourceNote || 'Catatan sumber belum diisi.');
  setText('app-version', APP_VERSION);
  syncMetaForm();
}

function renderKpis(book) {
  const mount = byId('kpi-grid');
  if (!mount) return;

  const values = {
    cash: book.trialRows.find((row) => row.code === '1101')?.signed || 0,
    revenue: book.revenueTotal,
    expense: book.expenseTotal,
    netIncome: book.netIncome,
    assets: book.totalAssets,
    rightSide: book.totalRightSide
  };

  mount.innerHTML = KPI_META.map((item) => {
    const indicator = computeKpiIndicator(item.key, values);
    const badgeClass = indicator.value < 0 ? 'negative' : indicator.value > 0 ? 'positive' : 'neutral';

    return `
      <article class="kpi-card">
        <div class="kpi-card-top">
          <div class="kpi-icon">${item.icon}</div>
          <div class="kpi-trend-wrap">
            <span class="kpi-pill ${badgeClass}">${formatPercent(indicator.value)}</span>
            <span class="kpi-caption">${indicator.relation || item.relationLabel || ''}</span>
          </div>
        </div>
        <span class="kpi-label">${item.label}</span>
        <strong class="kpi-value">${currency(values[item.key])}</strong>
      </article>
    `;
  }).join('');
}

function renderValidation(book) {
  const mount = byId('validation-list');
  if (!mount) return;

  const items = [
    {
      title: 'Jurnal seimbang',
      ok: book.journalRows.filter((row) => row.isTotal).every((row) => row.debit === row.credit),
      detail: 'Setiap transaksi memiliki total debit dan kredit yang sama.'
    },
    {
      title: 'Neraca saldo seimbang',
      ok: Math.abs(book.debitTotal - book.creditTotal) < 1,
      detail: `Debit ${currency(book.debitTotal)} dan kredit ${currency(book.creditTotal)}.`
    },
    {
      title: 'Neraca seimbang',
      ok: Math.abs(book.totalAssets - book.totalRightSide) < 1,
      detail: `Aktiva ${currency(book.totalAssets)} dan kewajiban + ekuitas ${currency(book.totalRightSide)}.`
    },
    {
      title: 'Neraca saldo setelah penutup seimbang',
      ok: Math.abs(book.postClosingDebitTotal - book.postClosingCreditTotal) < 1,
      detail: `Debit ${currency(book.postClosingDebitTotal)} dan kredit ${currency(book.postClosingCreditTotal)}.`
    }
  ];

  mount.innerHTML = items.map((item) => `
    <article class="validation-item">
      <span class="validation-badge ${item.ok ? 'ok' : 'fail'}">${item.ok ? 'OK' : 'CHECK'}</span>
      <h4>${item.title}</h4>
      <p>${item.detail}</p>
    </article>
  `).join('');
}

function renderFlowBars(book) {
  const mount = byId('flow-bars');
  if (!mount) return;

  const entries = Object.values(book.flow).sort((a, b) => b.amount - a.amount);
  const maxAmount = Math.max(1, ...entries.map((item) => item.amount));
  if (!entries.length) {
    mount.innerHTML = emptyState('Belum ada transaksi.');
    return;
  }

  mount.innerHTML = entries.map((item) => `
    <div class="flow-item">
      <div class="flow-top">
        <strong>${item.label}</strong>
        <small>${plainNumber(item.count)} transaksi · ${currency(item.amount)}</small>
      </div>
      <div class="flow-track"><div class="flow-fill" style="width:${(item.amount / maxAmount) * 100}%"></div></div>
    </div>
  `).join('');
}

function transactionRowsForDisplay(book) {
  return book.transactions.map((transaction) => {
    const lines = computeJournalLines(transaction);
    const summary = lines.map((line) => accountByCode(line.account)?.name || line.account).join(' / ');
    const isOperational = String(transaction.id || '').startsWith('ops-');
    return {
      id: transaction.id,
      date: transaction.date,
      type: isOperational ? 'Operasional POS' : (transaction.mode === 'manual' ? 'Jurnal manual' : TEMPLATE_CONFIG[transaction.type].label),
      description: transaction.description,
      accountFlow: summary,
      amount: transaction.amount,
      readonly: isOperational
    };
  });
}

function renderTransactions(book) {
  const mount = byId('transactions-table');
  if (!mount) return;

  const query = transactionQuery.trim().toLowerCase();
  const rows = transactionRowsForDisplay(book).filter((row) => {
    if (!query) return true;
    return [row.date, row.type, row.description, row.accountFlow].join(' ').toLowerCase().includes(query);
  });

  if (!rows.length) {
    mount.innerHTML = emptyState('Tidak ada transaksi yang cocok dengan pencarian.');
    return;
  }

  mount.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Jenis</th>
            <th>Keterangan</th>
            <th>Alur Akun</th>
            <th class="num">Nominal</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${row.date}</td>
              <td>${row.type}</td>
              <td>${row.description}</td>
              <td>${row.accountFlow}</td>
              <td class="num">${currency(row.amount)}</td>
              <td>${row.readonly ? '<span class="auto-sync-tag">Otomatis</span>' : `<button class="table-action" type="button" data-delete-id="${row.id}">Hapus</button>`}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  mount.querySelectorAll('[data-delete-id]').forEach((button) => {
    button.addEventListener('click', () => {
      openConfirm('Hapus transaksi', 'Transaksi yang dihapus akan mengubah jurnal, buku besar, dan seluruh laporan. Lanjutkan?', () => {
        state.transactions = state.transactions.filter((transaction) => transaction.id !== button.dataset.deleteId);
        persistState();
        render();
        showToast('Transaksi dihapus', 'Seluruh laporan sudah diperbarui otomatis.');
      });
    });
  });
}

function renderJournal(book) {
  const mount = byId('journal-table');
  if (!mount) return;

  const rows = book.journalRows.map((row) => ({
    date: row.date,
    type: row.modeLabel,
    description: row.description,
    account: row.account ? `${row.account} - ${row.accountName}` : row.accountName,
    debit: row.debit,
    credit: row.credit,
    isTotal: row.isTotal
  }));

  mount.innerHTML = createTable([
    { key: 'date', label: 'Tanggal' },
    { key: 'type', label: 'Jenis' },
    { key: 'description', label: 'Keterangan' },
    { key: 'account', label: 'Akun' },
    { key: 'debit', label: 'Debit' },
    { key: 'credit', label: 'Kredit' }
  ], rows, { numericKeys: ['debit', 'credit'] });
}

function renderLedger(book) {
  const mount = byId('ledger-list');
  if (!mount) return;

  const q = ledgerQuery.trim().toLowerCase();
  const cards = seed.accounts.filter((account) => !q || `${account.code} ${account.name}`.toLowerCase().includes(q)).map((account) => {
    const opening = seed.openingBalances.find((item) => item.code === account.code) || { debit: 0, credit: 0 };
    const openingSigned = Number(opening.debit || 0) - Number(opening.credit || 0);
    const entries = book.ledgerMap.get(account.code) || [];
    const endingSigned = book.trialRows.find((row) => row.code === account.code)?.signed || 0;
    const body = entries.length ? createTable([
      { key: 'date', label: 'Tanggal' },
      { key: 'description', label: 'Keterangan' },
      { key: 'transactionType', label: 'Jenis' },
      { key: 'debit', label: 'Debit' },
      { key: 'credit', label: 'Kredit' },
      { key: 'displayRunning', label: 'Saldo' }
    ], entries.map((entry) => ({ ...entry, displayRunning: signedToDisplay(entry.runningSigned) })), { numericKeys: ['debit', 'credit'] }) : emptyState('Belum ada mutasi pada akun ini.');

    return `
      <article class="ledger-card">
        <div class="ledger-top">
          <div class="ledger-meta">
            <span>${account.code}</span>
            <strong>${account.name}</strong>
          </div>
          <div class="ledger-balance">
            <small>Saldo awal ${signedToDisplay(openingSigned)}</small>
            <strong>Saldo akhir ${signedToDisplay(endingSigned)}</strong>
          </div>
        </div>
        ${body}
      </article>
    `;
  });

  mount.innerHTML = cards.length ? cards.join('') : emptyState('Tidak ada akun yang cocok dengan pencarian.');
}

function renderTrialBalance(book) {
  const mount = byId('trial-balance-table');
  if (!mount) return;

  const rows = book.trialRows.map((row) => ({
    account: row.name,
    debit: row.debit,
    credit: row.credit
  }));
  rows.push({ account: 'Total', debit: book.debitTotal, credit: book.creditTotal, isTotal: true });

  mount.innerHTML = createTable([
    { key: 'account', label: 'Akun' },
    { key: 'debit', label: 'Debit' },
    { key: 'credit', label: 'Kredit' }
  ], rows, { numericKeys: ['debit', 'credit'] });
}

function renderIncome(book) {
  const mount = byId('income-table');
  if (!mount) return;

  const revenueRows = book.revenueRows.map((row) => `
    <div class="report-row">
      <span>${row.name}</span>
      <strong>${currency(row.credit)}</strong>
    </div>
  `).join('') || '<div class="report-row"><span>Total Pendapatan</span><strong>Rp 0</strong></div>';

  const expenseRows = book.expenseRows.map((row) => `
    <div class="report-row">
      <span>${row.name}</span>
      <strong>${currency(row.debit)}</strong>
    </div>
  `).join('') || '<div class="report-row"><span>Total Beban</span><strong>Rp 0</strong></div>';

  mount.innerHTML = `
    <div class="report-list">
      <div class="report-section">
        <div class="report-caption">Pendapatan</div>
        ${revenueRows}
        <div class="report-row">
          <span>Total Pendapatan</span>
          <strong>${currency(book.revenueTotal)}</strong>
        </div>
      </div>
      <div class="report-section">
        <div class="report-caption">Beban</div>
        ${expenseRows}
        <div class="report-row">
          <span>Total Beban</span>
          <strong>${currency(book.expenseTotal)}</strong>
        </div>
      </div>
      <div class="report-summary">
        <strong>Laba Bersih</strong>
        <strong class="${book.netIncome >= 0 ? 'report-positive' : 'report-negative'}">${signedToDisplay(book.netIncome)}</strong>
      </div>
    </div>
  `;
}

function renderEquity(book) {
  const mount = byId('equity-table');
  if (!mount) return;

  mount.innerHTML = `
    <div class="equity-list">
      <div class="equity-item"><span>Modal Awal</span><strong>${currency(book.capitalOpening)}</strong></div>
      <div class="equity-item"><span>Laba Bersih</span><strong class="report-positive">${signedToDisplay(book.netIncome)}</strong></div>
      <div class="equity-item"><span>Prive</span><strong class="report-negative">${signedToDisplay(-book.drawings)}</strong></div>
      <div class="equity-summary">
        <strong>Modal Akhir</strong>
        <strong>${currency(book.endingCapital)}</strong>
      </div>
    </div>
  `;
}

function renderClosingJournal(book) {
  const mount = byId('closing-journal-table');
  if (!mount) return;

  if (!book.closingJournalRows.length) {
    mount.innerHTML = emptyState('Belum ada akun nominal yang perlu ditutup. Tambahkan pendapatan, beban, atau prive terlebih dahulu.');
    return;
  }

  const rows = book.closingJournalRows.map((row) => ({
    date: row.date,
    type: row.type,
    description: row.description,
    account: row.account ? `${row.account} - ${row.accountName}` : row.accountName,
    debit: row.debit,
    credit: row.credit,
    isTotal: row.isTotal
  }));

  mount.innerHTML = createTable([
    { key: 'date', label: 'Periode' },
    { key: 'type', label: 'Jenis' },
    { key: 'description', label: 'Keterangan' },
    { key: 'account', label: 'Akun' },
    { key: 'debit', label: 'Debit' },
    { key: 'credit', label: 'Kredit' }
  ], rows, { numericKeys: ['debit', 'credit'] });
}

function renderPostClosingTrialBalance(book) {
  const mount = byId('post-closing-trial-balance-table');
  if (!mount) return;

  const rows = book.postClosingRows.map((row) => ({
    account: `${row.code} - ${row.name}`,
    debit: row.debit,
    credit: row.credit
  }));
  rows.push({ account: 'Total', debit: book.postClosingDebitTotal, credit: book.postClosingCreditTotal, isTotal: true });

  mount.innerHTML = createTable([
    { key: 'account', label: 'Akun Permanen' },
    { key: 'debit', label: 'Debit' },
    { key: 'credit', label: 'Kredit' }
  ], rows, { numericKeys: ['debit', 'credit'] });
}

function renderBalanceSheet(book) {
  const mount = byId('balance-sheet-layout');
  if (!mount) return;

  const leftRows = [
    ...book.currentAssets.map((row) => ({ label: row.name, value: row.signed })),
    { label: 'Total Aset', value: book.totalAssets, total: true }
  ];

  const rightRows = [
    ...book.liabilities.map((row) => ({ label: row.name, value: Math.abs(Math.min(row.signed, 0)) })),
    { label: 'Modal', value: book.endingCapital },
    { label: 'Total', value: book.totalRightSide, total: true }
  ];

  const sideTemplate = (title, rows) => `
    <div class="balance-side">
      <div class="balance-head">${title}</div>
      ${rows.map((row) => row.total ? `
        <div class="balance-summary">
          <strong>${row.label}</strong>
          <strong>${currency(row.value)}</strong>
        </div>
      ` : `
        <div class="balance-row">
          <span>${row.label}</span>
          <strong>${currency(row.value)}</strong>
        </div>
      `).join('')}
    </div>
  `;

  mount.innerHTML = `
    <div class="balance-grid">
      ${sideTemplate('Aset', leftRows)}
      ${sideTemplate('Kewajiban & Ekuitas', rightRows)}
    </div>
  `;
}

function render() {
  const book = deriveBook();
  renderMeta(book);
  renderKpis(book);
  renderValidation(book);
  renderFlowBars(book);
  renderTransactions(book);
  renderJournal(book);
  renderLedger(book);
  renderTrialBalance(book);
  renderIncome(book);
  renderEquity(book);
  renderClosingJournal(book);
  renderPostClosingTrialBalance(book);
  renderBalanceSheet(book);
}

function wireMetaForm() {
  const form = document.getElementById('meta-form');
  if (!form) return;

  syncMetaForm();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    state.meta = normalizeMeta({
      companyName: formData.get('companyName'),
      periodLabel: formData.get('periodLabel'),
      sourceNote: formData.get('sourceNote')
    });
    persistState();
    render();
    showToast('Identitas disimpan', 'Nama perusahaan dan periode laporan berhasil diperbarui.');
  });
}

function updateTemplateFields(type) {
  const config = TEMPLATE_CONFIG[type];
  if (!config) return;
  const accountSelect = document.getElementById('template-account');
  const sourceSelect = document.getElementById('template-source');
  const accountField = accountSelect.closest('.advanced-field');

  populateSelect(accountSelect, config.accountOptions, (value) => `${config.accountLabel}: ${accountName(value)}`);
  populateSelect(sourceSelect, config.sourceOptions, (value) => `${config.sourceLabel}: ${accountName(value)}`);
  document.getElementById('template-helper').textContent = config.helper;

  if (config.accountOptions.length > 1) {
    accountField.classList.add('show');
  } else {
    accountField.classList.remove('show');
  }
}

function wireTemplateForm() {
  const typeSelect = byId('transaction-type');
  const form = byId('transaction-form');
  if (!typeSelect || !form) return;

  populateSelect(typeSelect, Object.keys(TEMPLATE_CONFIG), (value) => TEMPLATE_CONFIG[value].label);
  typeSelect.addEventListener('change', (event) => updateTemplateFields(event.target.value));
  updateTemplateFields(typeSelect.value || Object.keys(TEMPLATE_CONFIG)[0]);

  const dateInput = form.querySelector('[name="date"]');
  if (dateInput) dateInput.value = defaultToday();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const amount = Number(formData.get('amount') || 0);
    if (amount <= 0) {
      showToast('Nominal tidak valid', 'Isi nominal transaksi lebih besar dari nol.', 'error');
      return;
    }

    state.transactions.push({
      id: id('tpl'),
      mode: 'template',
      type: formData.get('type'),
      date: formData.get('date'),
      description: formData.get('description'),
      amount,
      account: formData.get('account'),
      source: formData.get('source')
    });

    persistState();
    form.reset();
    if (dateInput) dateInput.value = defaultToday();
    typeSelect.value = Object.keys(TEMPLATE_CONFIG)[0];
    updateTemplateFields(typeSelect.value);
    render();
    showToast('Transaksi tersimpan', 'Jurnal, buku besar, dan laporan ikut diperbarui otomatis.');
  });

  form.addEventListener('reset', () => {
    requestAnimationFrame(() => {
      if (dateInput) dateInput.value = defaultToday();
      typeSelect.value = Object.keys(TEMPLATE_CONFIG)[0];
      updateTemplateFields(typeSelect.value);
    });
  });
}

function wireManualForm() {
  const debitSelect = byId('manual-debit-account');
  const creditSelect = byId('manual-credit-account');
  const form = byId('manual-form');
  if (!debitSelect || !creditSelect || !form) return;

  populateSelect(debitSelect, seed.accounts.map((account) => account.code), accountName);
  populateSelect(creditSelect, seed.accounts.map((account) => account.code), accountName);

  const dateInput = form.querySelector('[name="date"]');
  if (dateInput) dateInput.value = defaultToday();
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const amount = Number(formData.get('amount') || 0);

    if (amount <= 0) {
      showToast('Nominal tidak valid', 'Isi nominal jurnal manual lebih besar dari nol.', 'error');
      return;
    }
    if (formData.get('debitAccount') === formData.get('creditAccount')) {
      showToast('Akun sama', 'Akun debit dan kredit tidak boleh sama.', 'error');
      return;
    }

    state.transactions.push({
      id: id('man'),
      mode: 'manual',
      date: formData.get('date'),
      description: formData.get('description'),
      amount,
      debitAccount: formData.get('debitAccount'),
      creditAccount: formData.get('creditAccount')
    });

    persistState();
    form.reset();
    if (dateInput) dateInput.value = defaultToday();
    render();
    showToast('Jurnal manual tersimpan', 'Laporan diperbarui dari jurnal penyesuaian baru.');
  });
}

function syncSearchInputs(value) {
  const globalInput = byId('global-search');
  const panelInput = byId('transaction-search');
  if (globalInput && globalInput.value !== value) globalInput.value = value;
  if (panelInput && panelInput.value !== value) panelInput.value = value;
}

function wireSearch() {
  const handler = (value) => {
    transactionQuery = value;
    syncSearchInputs(value);
    render();
  };

  const transactionSearch = byId('transaction-search');
  const globalSearch = byId('global-search');
  const ledgerSearch = byId('ledger-search');

  transactionSearch?.addEventListener('input', (event) => handler(event.target.value));
  globalSearch?.addEventListener('input', (event) => {
    handler(event.target.value);
    if (event.target.value.trim()) scrollToSection('transaksi-tersimpan');
  });

  ledgerSearch?.addEventListener('input', (event) => {
    ledgerQuery = event.target.value;
    render();
  });
}

function download(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function handleExport() {
  const payload = {
    app: 'SIA Web',
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    state: snapshotState()
  };
  download('sia-backup.json', JSON.stringify(payload, null, 2));
  showToast('Export berhasil', 'Backup JSON berhasil diunduh.');
}

function handleResetAll() {
  const count = state.transactions.length;
  openConfirm(
    'Reset data permanen?',
    `Warning: semua ${plainNumber(count)} transaksi tersimpan akan dihapus dari browser ini. Jurnal umum, buku besar, neraca saldo, laba rugi, perubahan modal, jurnal penutup, neraca saldo setelah penutup, dan neraca akan kembali kosong.`,
    () => {
      state.transactions = [];
      persistState();
      transactionQuery = '';
      ledgerQuery = '';
      syncSearchInputs('');
      setValue('ledger-search', '');
      render();
      showToast('Data direset', 'Seluruh transaksi lokal berhasil dihapus.');
    }
  );
}

function handleLoadDemo() {
  const load = () => {
    state.transactions = seed.demoTransactions.map((item) => ({ ...item }));
    persistState();
    render();
    showToast('Data demo dimuat', 'Dashboard, jurnal penutup, dan seluruh laporan sekarang terisi contoh transaksi.');
  };

  if (state.transactions.length) {
    openConfirm(
      'Muat data demo?',
      'Data transaksi saat ini akan diganti dengan contoh data demo. Gunakan ini untuk presentasi atau uji alur sistem.',
      load
    );
    return;
  }

  load();
}

function wireControls() {
  byId('btn-export-top')?.addEventListener('click', handleExport);
  byId('btn-export-side')?.addEventListener('click', handleExport);
  byId('btn-reset-side')?.addEventListener('click', handleResetAll);
  byId('btn-load-demo')?.addEventListener('click', handleLoadDemo);

  byId('import-file')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const importedRaw = JSON.parse(text);
      const normalized = normalizeAppState(importedRaw);
      const rawTransactions = importedRaw?.state?.transactions ?? importedRaw?.transactions;
      if (!Array.isArray(rawTransactions)) throw new Error('Format JSON tidak sesuai. File harus berisi data transaksi.');
      replaceState(normalized);
      persistState();
      render();
      showToast('Import berhasil', `${plainNumber(normalized.transactions.length)} transaksi berhasil dimuat ke aplikasi.`);
    } catch (error) {
      showToast('Import gagal', error.message, 'error');
    } finally {
      event.target.value = '';
    }
  });

  byId('confirm-cancel')?.addEventListener('click', closeConfirm);
  byId('confirm-accept')?.addEventListener('click', () => {
    if (typeof confirmHandler === 'function') confirmHandler();
    closeConfirm();
  });
  byId('confirm-modal-backdrop')?.addEventListener('click', (event) => {
    if (event.target.id === 'confirm-modal-backdrop') closeConfirm();
  });
}

function wireNavigation() {
  const links = [...document.querySelectorAll('.nav-link[data-page-link]')];
  const currentPage = document.body?.dataset?.page || 'dashboard';
  links.forEach((link) => {
    const isActive = link.dataset.pageLink === currentPage;
    link.classList.toggle('active', isActive);
    if (isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

function initApp() {
  hydrateStateForUser(null);
  wireMetaForm();
  wireTemplateForm();
  wireManualForm();
  wireSearch();
  wireControls();
  wireNavigation();
  render();
  updateSyncIndicator('local', 'Mode browser lokal');
  bootstrapAuth();
}

initApp();

const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileOverlay = document.getElementById('mobile-overlay');
const sidebar = document.getElementById('sidebar');

function openMobileSidebar() {
  if (!sidebar) return;
  sidebar.classList.add('is-open');
  document.body.classList.add('sidebar-open');
}

function closeMobileSidebar() {
  if (!sidebar) return;
  sidebar.classList.remove('is-open');
  document.body.classList.remove('sidebar-open');
}

if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', () => {
    if (sidebar && sidebar.classList.contains('is-open')) closeMobileSidebar();
    else openMobileSidebar();
  });
}

if (mobileOverlay) {
  mobileOverlay.addEventListener('click', closeMobileSidebar);
}

window.addEventListener('resize', () => {
  if (window.innerWidth > 860) closeMobileSidebar();
});

document.querySelectorAll('.nav-link').forEach((link) => {
  link.addEventListener('click', () => {
    if (window.innerWidth <= 860) closeMobileSidebar();
  });
});
