const OPS_STORAGE_KEY = 'sia-final-operasional-pos-v2';
const OPS_VERSION = '2.3.0-firebase-auto-auth';
const MAIN_STORAGE_PREFIX = 'project-sia-interactive-state-v2';
const OPS_CLOUD_DOC_ID = 'operasional-pos';
const MAIN_CLOUD_DOC_ID = 'primary';
const FIREBASE_SDK_VERSION = '10.13.1';
const opsAuthSettings = {
  requireLogin: true,
  allowLocalFallback: true,
  ...(window.SIA_AUTH_SETTINGS || {})
};

const ACCOUNTS = {
  cash: { code: '1101', name: 'Kas' },
  ar: { code: '1102', name: 'Piutang dagang' },
  supplies: { code: '1105', name: 'Perlengkapan kantor' },
  inventory: { code: '1106', name: 'Persediaan barang dagang' },
  equipment: { code: '1107', name: 'Peralatan operasional' },
  bank: { code: '1108', name: 'Bank' },
  vatIn: { code: '1110', name: 'PPN Masukan' },
  ap: { code: '2101', name: 'Utang usaha' },
  payrollPayable: { code: '2103', name: 'Utang gaji dan komisi' },
  vatOut: { code: '2110', name: 'PPN Keluaran' },
  capital: { code: '3101', name: 'Modal Tiara' },
  serviceRevenue: { code: '4101', name: 'Pendapatan jasa' },
  salesRevenue: { code: '4102', name: 'Penjualan barang dagang' },
  salaryExpense: { code: '5101', name: 'Biaya gaji dan komisi' },
  operatingExpense: { code: '5105', name: 'Biaya lainnya' },
  cogs: { code: '5110', name: 'Harga Pokok Penjualan' }
};

const ACCOUNT_LIST = Object.values(ACCOUNTS);

function defaultState() {
  return {
    meta: {
      companyName: 'NusaBuku UMKM Demo',
      businessType: 'dagang',
      updatedAt: new Date().toISOString()
    },
    products: [
      { id: 'PRD-001', sku: 'BRG-001', name: 'Buku Tulis Premium', type: 'barang', unit: 'pcs', stock: 70, purchasePrice: 6000, salePrice: 10000 },
      { id: 'PRD-002', sku: 'BRG-002', name: 'Pulpen Gel Hitam', type: 'barang', unit: 'pcs', stock: 150, purchasePrice: 2500, salePrice: 5000 },
      { id: 'SRV-001', sku: 'JAS-001', name: 'Jasa Penjilidan', type: 'jasa', unit: 'paket', stock: 0, purchasePrice: 0, salePrice: 15000 },
      { id: 'SUP-001', sku: 'OPR-001', name: 'Kertas Operasional Kantor', type: 'perlengkapan', unit: 'rim', stock: 10, purchasePrice: 45000, salePrice: 0 }
    ],
    contacts: [
      { id: 'CUS-001', name: 'Pelanggan Umum', type: 'customer', phone: '0800000000' },
      { id: 'VEN-001', name: 'CV Supplier ATK', type: 'vendor', phone: '081234567890' }
    ],
    sales: [
      { id: 'INV-001', date: '2026-04-27', contactId: 'CUS-001', status: 'Lunas', paymentMethod: 'cash', useVat: false, discount: 0, items: [{ productId: 'PRD-001', qty: 10, price: 10000 }] }
    ],
    purchases: [
      { id: 'PUR-001', date: '2026-04-27', contactId: 'VEN-001', status: 'Belum Lunas', paymentMethod: 'ap', useVat: false, discount: 0, items: [{ productId: 'PRD-002', qty: 30, price: 2500 }] }
    ],
    employees: [
      { id: 'EMP-001', nik: '3201012704260001', name: 'Budi Santoso', position: 'Kasir', ptkp: 'TK/0', salary: 4500000 },
      { id: 'EMP-002', nik: '3201012704260002', name: 'Siti Aminah', position: 'Admin Keuangan', ptkp: 'K/1', salary: 6000000 }
    ],
    attendances: [
      { id: 'ATT-001', date: '2026-04-27', employeeId: 'EMP-001', clockIn: '08:00', clockOut: '16:00', status: 'Hadir' },
      { id: 'ATT-002', date: '2026-04-27', employeeId: 'EMP-002', clockIn: '08:05', clockOut: '16:10', status: 'Hadir' }
    ],
    payrolls: []
  };
}

let activeOpsStorageKey = OPS_STORAGE_KEY;
let state = loadState();
let activeTab = 'dashboard';
let opsCurrentUser = null;
let opsAuthClient = null;
let opsFirestoreClient = null;
let opsCloudUnsubscribe = null;
let opsCloudTimer = null;
let opsCloudInFlight = false;
let opsPendingCloudSync = false;
let opsApplyingRemoteState = false;
let lastSyncedOpsHash = '';
let lastLoadedOpsHash = '';

function rupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0));
}

function num(value) { return Number(value || 0); }
function byId(id) { return document.getElementById(id); }
function uid(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
function today() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
function safe(text) {
  return String(text ?? '').replace(/[&<>'"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[m]));
}
function accountLabel(account) { return `${account.code} - ${account.name}`; }
function productById(id) { return state.products.find((p) => p.id === id); }
function contactById(id) { return state.contacts.find((c) => c.id === id); }
function employeeById(id) { return state.employees.find((e) => e.id === id); }
function isDagang() { return state.meta.businessType === 'dagang'; }

function opsStorageKeyForUser(user = opsCurrentUser) {
  return user?.uid ? `${OPS_STORAGE_KEY}:${user.uid}` : OPS_STORAGE_KEY;
}

function mainStorageKeyForUser(user = opsCurrentUser) {
  return user?.uid ? `${MAIN_STORAGE_PREFIX}:${user.uid}` : MAIN_STORAGE_PREFIX;
}

function loadState(storageKey = activeOpsStorageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return defaultState();
    return normalizeState(JSON.parse(raw));
  } catch (error) {
    console.warn('Gagal memuat data operasional:', error);
    return defaultState();
  }
}
function saveState() {
  state.meta.updatedAt = new Date().toISOString();
  persistOperationalLocalState();
  syncOperationalToMainLedger();
  scheduleOperationalCloudSync('Perubahan data Operasional POS');
}
function persistOperationalLocalState() {
  localStorage.setItem(activeOpsStorageKey, JSON.stringify(state));
}
function normalizeState(input) {
  const base = defaultState();
  return {
    meta: { ...base.meta, ...(input.meta || {}) },
    products: Array.isArray(input.products) ? input.products : base.products,
    contacts: Array.isArray(input.contacts) ? input.contacts : base.contacts,
    sales: Array.isArray(input.sales) ? input.sales : base.sales,
    purchases: Array.isArray(input.purchases) ? input.purchases : base.purchases,
    employees: Array.isArray(input.employees) ? input.employees : base.employees,
    attendances: Array.isArray(input.attendances) ? input.attendances : base.attendances,
    payrolls: Array.isArray(input.payrolls) ? input.payrolls : base.payrolls
  };
}


function opsSnapshotState() {
  return normalizeState(JSON.parse(JSON.stringify(state)));
}

function opsStateHash(payload) {
  return JSON.stringify(payload || defaultState());
}

function updateOpsSyncIndicator(mode = 'local', message = 'Data lokal') {
  const pill = byId('ops-sync-pill');
  if (!pill) return;
  pill.dataset.mode = mode;
  pill.textContent = message;
}

function setOpsAuthButtons() {
  const loginBtn = byId('ops-login-google');
  const logoutBtn = byId('ops-logout-google');
  if (loginBtn) loginBtn.classList.toggle('hidden', Boolean(opsCurrentUser));
  if (logoutBtn) logoutBtn.classList.toggle('hidden', !opsCurrentUser);
}

function canUseOpsCloud() {
  return Boolean(opsFirestoreClient?.db && opsCurrentUser?.uid);
}

function opsCloudDocRef(docId = OPS_CLOUD_DOC_ID) {
  if (!canUseOpsCloud()) return null;
  return opsFirestoreClient.doc(opsFirestoreClient.db, 'siaUsers', opsCurrentUser.uid, 'apps', docId);
}

function teardownOpsCloudListener() {
  if (typeof opsCloudUnsubscribe === 'function') opsCloudUnsubscribe();
  opsCloudUnsubscribe = null;
}

function resetOpsCloudTimers() {
  teardownOpsCloudListener();
  if (opsCloudTimer) clearTimeout(opsCloudTimer);
  opsCloudTimer = null;
  opsCloudInFlight = false;
  opsPendingCloudSync = false;
  opsApplyingRemoteState = false;
  lastSyncedOpsHash = '';
  lastLoadedOpsHash = '';
}

function humanizeOpsFirebaseError(error) {
  const code = String(error?.code || '').replace('auth/', '').replace('firestore/', '');
  if (code === 'permission-denied') return 'Akses Firestore ditolak. Pastikan rules mengizinkan siaUsers/{uid}/apps/{docId}.';
  if (code === 'failed-precondition') return 'Cloud Firestore belum dibuat atau index/rules belum siap.';
  if (code === 'popup-closed-by-user') return 'Login dibatalkan sebelum selesai.';
  if (code === 'unauthorized-domain') return 'Domain aplikasi belum didaftarkan di Firebase Authentication.';
  return error?.message || 'Firebase belum dapat digunakan.';
}

async function signInOpsGoogle() {
  if (!opsAuthClient?.auth || !opsAuthClient?.provider) {
    toast('Firebase belum siap', 'Periksa firebase-config.js, koneksi internet, dan provider Google.');
    return;
  }
  try {
    await opsAuthClient.signInWithPopup(opsAuthClient.auth, opsAuthClient.provider);
  } catch (error) {
    toast('Login gagal', humanizeOpsFirebaseError(error));
  }
}

async function signOutOpsGoogle() {
  try {
    if (opsAuthClient?.auth) await opsAuthClient.signOut(opsAuthClient.auth);
  } catch (error) {
    toast('Logout gagal', humanizeOpsFirebaseError(error));
  }
}

async function saveOperationalToCloud({ reason = 'Perubahan data Operasional POS', force = false } = {}) {
  const docRef = opsCloudDocRef(OPS_CLOUD_DOC_ID);
  if (!docRef || opsApplyingRemoteState) return;

  const payload = opsSnapshotState();
  const payloadHash = opsStateHash(payload);
  if (!force && payloadHash === lastSyncedOpsHash) {
    updateOpsSyncIndicator('synced', 'Firebase tersimpan');
    return;
  }
  if (opsCloudInFlight) {
    opsPendingCloudSync = true;
    return;
  }

  opsCloudInFlight = true;
  updateOpsSyncIndicator('saving', 'Menyimpan Firebase...');
  try {
    await opsFirestoreClient.setDoc(docRef, {
      schemaVersion: 2,
      app: 'SIA Final Operasional POS',
      version: OPS_VERSION,
      state: payload,
      updatedAt: opsFirestoreClient.serverTimestamp(),
      updatedBy: {
        uid: opsCurrentUser.uid,
        email: opsCurrentUser.email || '',
        displayName: opsCurrentUser.displayName || ''
      }
    }, { merge: true });

    lastSyncedOpsHash = payloadHash;
    lastLoadedOpsHash = payloadHash;
    await syncMainLedgerToCloud();
    updateOpsSyncIndicator('synced', 'Firebase tersimpan');
  } catch (error) {
    console.error(`Gagal menyimpan Operasional POS ke Firebase (${reason}):`, error);
    updateOpsSyncIndicator('error', 'Firebase gagal');
    toast('Sinkronisasi gagal', humanizeOpsFirebaseError(error));
  } finally {
    opsCloudInFlight = false;
    if (opsPendingCloudSync) {
      opsPendingCloudSync = false;
      scheduleOperationalCloudSync('Perubahan lanjutan Operasional POS');
    }
  }
}

function scheduleOperationalCloudSync(reason = 'Perubahan data Operasional POS') {
  if (!canUseOpsCloud() || opsApplyingRemoteState) {
    updateOpsSyncIndicator(opsCurrentUser ? 'pending' : 'local', opsCurrentUser ? 'Menunggu Firebase' : 'Data lokal');
    return;
  }
  updateOpsSyncIndicator('pending', 'Menunggu sinkronisasi');
  if (opsCloudTimer) clearTimeout(opsCloudTimer);
  opsCloudTimer = setTimeout(() => {
    saveOperationalToCloud({ reason }).catch(() => {});
  }, 700);
}

async function loadOperationalFromCloud() {
  const docRef = opsCloudDocRef(OPS_CLOUD_DOC_ID);
  if (!docRef) return;

  updateOpsSyncIndicator('saving', 'Memuat Firebase...');
  const snapshot = await opsFirestoreClient.getDoc(docRef);
  if (snapshot.exists()) {
    const remoteState = normalizeState(snapshot.data()?.state || snapshot.data());
    const remoteHash = opsStateHash(remoteState);
    opsApplyingRemoteState = true;
    state = remoteState;
    persistOperationalLocalState();
    syncOperationalToMainLedger();
    render();
    opsApplyingRemoteState = false;
    lastLoadedOpsHash = remoteHash;
    lastSyncedOpsHash = remoteHash;
    updateOpsSyncIndicator('synced', 'Firebase dimuat');
    return;
  }

  const baseLocal = normalizeState(loadState(OPS_STORAGE_KEY));
  const hasBaseLocalData = baseLocal.sales.length || baseLocal.purchases.length || baseLocal.products.length;
  if (hasBaseLocalData && activeOpsStorageKey !== OPS_STORAGE_KEY) {
    state = baseLocal;
    persistOperationalLocalState();
    render();
  }
  await saveOperationalToCloud({ reason: 'Inisialisasi Operasional POS Firebase', force: true });
  updateOpsSyncIndicator('synced', 'Firebase siap');
}

function attachOpsCloudListener() {
  teardownOpsCloudListener();
  const docRef = opsCloudDocRef(OPS_CLOUD_DOC_ID);
  if (!docRef) return;

  opsCloudUnsubscribe = opsFirestoreClient.onSnapshot(docRef, (snapshot) => {
    if (!snapshot.exists()) return;
    const remoteState = normalizeState(snapshot.data()?.state || snapshot.data());
    const remoteHash = opsStateHash(remoteState);
    const localHash = opsStateHash(opsSnapshotState());
    if (remoteHash === localHash || remoteHash === lastLoadedOpsHash) return;

    opsApplyingRemoteState = true;
    state = remoteState;
    persistOperationalLocalState();
    syncOperationalToMainLedger();
    render();
    opsApplyingRemoteState = false;
    lastLoadedOpsHash = remoteHash;
    lastSyncedOpsHash = remoteHash;
    updateOpsSyncIndicator('synced', 'Firebase diperbarui');
  }, (error) => {
    console.error('Listener Operasional POS terputus:', error);
    updateOpsSyncIndicator('error', 'Listener Firebase gagal');
  });
}

function normalizeMainLedgerCloudState(input = {}) {
  return {
    meta: {
      companyName: String(input?.meta?.companyName || state.meta.companyName || 'CV Contoh SIA'),
      periodLabel: String(input?.meta?.periodLabel || 'Periode Berjalan'),
      sourceNote: 'Transaksi operasional POS otomatis masuk ke transaksi, jurnal umum, buku besar, neraca saldo, laba rugi, dan neraca.'
    },
    transactions: Array.isArray(input?.transactions) ? input.transactions : []
  };
}

async function syncMainLedgerToCloud() {
  const docRef = opsCloudDocRef(MAIN_CLOUD_DOC_ID);
  if (!docRef) return;

  const snapshot = await opsFirestoreClient.getDoc(docRef);
  const ledgerState = normalizeMainLedgerCloudState(snapshot.exists() ? snapshot.data() : {});
  const generated = operationalTransactionsForMainLedger();
  const preserved = ledgerState.transactions.filter((transaction) => !String(transaction?.id || '').startsWith('ops-'));
  ledgerState.meta.companyName = state.meta.companyName || ledgerState.meta.companyName;
  ledgerState.transactions = [...preserved, ...generated];

  await opsFirestoreClient.setDoc(docRef, {
    schemaVersion: 1,
    meta: ledgerState.meta,
    transactions: ledgerState.transactions,
    updatedAt: opsFirestoreClient.serverTimestamp(),
    updatedBy: {
      uid: opsCurrentUser.uid,
      email: opsCurrentUser.email || '',
      displayName: opsCurrentUser.displayName || ''
    }
  }, { merge: true });
}

async function setupOpsFirebase() {
  if (!window.FIREBASE_CONFIG || !window.FIREBASE_CONFIG.apiKey || window.FIREBASE_CONFIG.apiKey.includes('ISI_')) {
    updateOpsSyncIndicator('local', 'Firebase belum dikonfigurasi');
    setOpsAuthButtons();
    return;
  }
  try {
    const [{ initializeApp, getApps, getApp }, {
      getAuth, GoogleAuthProvider, browserLocalPersistence, onAuthStateChanged, setPersistence, signInWithPopup, signOut
    }, {
      getFirestore, doc, getDoc, setDoc, onSnapshot, serverTimestamp
    }] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-firestore.js`)
    ]);

    // Pakai app Firebase default yang sama dengan halaman SIA lain.
    // Dengan begitu sesi Google yang sudah login di Dashboard/Jurnal otomatis terbaca di Operasional POS.
    const app = getApps().length ? getApp() : initializeApp(window.FIREBASE_CONFIG);
    const auth = getAuth(app);
    await setPersistence(auth, browserLocalPersistence);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const db = getFirestore(app);
    opsAuthClient = { auth, provider, signInWithPopup, signOut };
    opsFirestoreClient = { db, doc, getDoc, setDoc, onSnapshot, serverTimestamp };

    byId('ops-login-google')?.addEventListener('click', signInOpsGoogle);
    byId('ops-logout-google')?.addEventListener('click', signOutOpsGoogle);
    updateOpsSyncIndicator('pending', 'Login Google untuk Firebase');

    onAuthStateChanged(auth, async (user) => {
      resetOpsCloudTimers();
      opsCurrentUser = user || null;
      activeOpsStorageKey = opsStorageKeyForUser(opsCurrentUser);
      state = loadState(activeOpsStorageKey);
      syncOperationalToMainLedger();
      render();
      setOpsAuthButtons();

      if (!user) {
        updateOpsSyncIndicator('local', opsAuthSettings.requireLogin ? 'Login untuk Firebase' : 'Data lokal');
        return;
      }

      try {
        await loadOperationalFromCloud();
        attachOpsCloudListener();
      } catch (error) {
        console.error('Gagal memuat Operasional POS dari Firebase:', error);
        updateOpsSyncIndicator('error', 'Firebase gagal dimuat');
        toast('Firebase gagal dimuat', humanizeOpsFirebaseError(error));
      }
    });
  } catch (error) {
    console.error('Gagal menyiapkan Firebase Operasional POS:', error);
    updateOpsSyncIndicator('error', 'Firebase gagal dimuat');
    toast('Firebase gagal dimuat', humanizeOpsFirebaseError(error));
    setOpsAuthButtons();
  }
}

function toast(title, message) {
  const stack = byId('ops-toast-stack');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = 'ops-toast';
  el.innerHTML = `<strong>${safe(title)}</strong><span>${safe(message)}</span>`;
  stack.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; }, 2600);
  setTimeout(() => el.remove(), 3200);
}

function transactionSubtotal(items = []) {
  return items.reduce((total, item) => total + num(item.qty) * num(item.price), 0);
}
function transactionDpp(trx) {
  return Math.max(0, transactionSubtotal(trx.items) - num(trx.discount));
}
function transactionVat(trx) { return trx.useVat ? Math.round(transactionDpp(trx) * 0.11) : 0; }
function transactionTotal(trx) { return transactionDpp(trx) + transactionVat(trx); }
function getSaleCost(sale) {
  if (!isDagang()) return 0;
  return (sale.items || []).reduce((total, item) => {
    const product = productById(item.productId);
    if (!product || product.type !== 'barang') return total;
    return total + num(product.purchasePrice) * num(item.qty);
  }, 0);
}

function revenueSplit(items = []) {
  return items.reduce((memo, item) => {
    const product = productById(item.productId);
    const amount = num(item.qty) * num(item.price);
    if (product?.type === 'jasa') memo.service += amount;
    else memo.goods += amount;
    return memo;
  }, { service: 0, goods: 0 });
}

function paymentAccount(status, method, mode) {
  if (status !== 'Lunas') return mode === 'sale' ? ACCOUNTS.ar : ACCOUNTS.ap;
  if (method === 'bank') return ACCOUNTS.bank;
  return ACCOUNTS.cash;
}

function buildSaleJournal(sale) {
  const total = transactionTotal(sale);
  const dpp = transactionDpp(sale);
  const vat = transactionVat(sale);
  const split = revenueSplit(sale.items);
  const gross = Math.max(1, split.service + split.goods);
  const serviceRevenue = Math.round(dpp * (split.service / gross));
  const goodsRevenue = dpp - serviceRevenue;
  const debitAcc = paymentAccount(sale.status, sale.paymentMethod, 'sale');
  const lines = [{ account: debitAcc, debit: total, credit: 0 }];
  if (serviceRevenue > 0) lines.push({ account: ACCOUNTS.serviceRevenue, debit: 0, credit: serviceRevenue });
  if (goodsRevenue > 0) lines.push({ account: ACCOUNTS.salesRevenue, debit: 0, credit: goodsRevenue });
  if (vat > 0) lines.push({ account: ACCOUNTS.vatOut, debit: 0, credit: vat });
  const cogs = getSaleCost(sale);
  if (cogs > 0) {
    lines.push({ account: ACCOUNTS.cogs, debit: cogs, credit: 0 });
    lines.push({ account: ACCOUNTS.inventory, debit: 0, credit: cogs });
  }
  return lines;
}

function buildPurchaseJournal(purchase) {
  const total = transactionTotal(purchase);
  const dpp = transactionDpp(purchase);
  const vat = transactionVat(purchase);
  const creditAcc = paymentAccount(purchase.status, purchase.paymentMethod, 'purchase');
  const itemBuckets = purchase.items.reduce((memo, item) => {
    const product = productById(item.productId);
    const amount = num(item.qty) * num(item.price);
    if (product?.type === 'barang' && isDagang()) memo.inventory += amount;
    else if (product?.type === 'peralatan') memo.equipment += amount;
    else if (product?.type === 'perlengkapan') memo.supplies += amount;
    else memo.expense += amount;
    return memo;
  }, { inventory: 0, supplies: 0, equipment: 0, expense: 0 });
  const gross = Math.max(1, itemBuckets.inventory + itemBuckets.supplies + itemBuckets.equipment + itemBuckets.expense);
  const lines = [];
  const pushDebit = (account, grossAmount) => {
    const amount = Math.round(dpp * (grossAmount / gross));
    if (amount > 0) lines.push({ account, debit: amount, credit: 0 });
  };
  pushDebit(ACCOUNTS.inventory, itemBuckets.inventory);
  pushDebit(ACCOUNTS.supplies, itemBuckets.supplies);
  pushDebit(ACCOUNTS.equipment, itemBuckets.equipment);
  pushDebit(ACCOUNTS.operatingExpense, itemBuckets.expense);
  if (vat > 0) lines.push({ account: ACCOUNTS.vatIn, debit: vat, credit: 0 });
  lines.push({ account: creditAcc, debit: 0, credit: total });
  return lines;
}

function payrollTax(gross, ptkp) {
  const ptkpYear = { 'TK/0': 54000000, 'K/0': 58500000, 'K/1': 63000000, 'K/2': 67500000, 'K/3': 72000000 }[ptkp] || 54000000;
  const netYear = gross * 12;
  const pkpYear = Math.max(0, netYear - ptkpYear);
  return Math.round((pkpYear * 0.05) / 12);
}
function buildPayrollJournal(payroll) {
  const totalExpense = num(payroll.gross);
  const net = num(payroll.netPay);
  const tax = num(payroll.tax);
  const lines = [{ account: ACCOUNTS.salaryExpense, debit: totalExpense, credit: 0 }];
  lines.push({ account: ACCOUNTS.bank, debit: 0, credit: net });
  if (tax > 0) lines.push({ account: ACCOUNTS.payrollPayable, debit: 0, credit: tax });
  return lines;
}

function allJournalEntries() {
  const rows = [];
  state.sales.forEach((sale) => rows.push({ id: sale.id, date: sale.date, source: 'Penjualan POS', desc: `Penjualan kepada ${contactById(sale.contactId)?.name || '-'}`, lines: buildSaleJournal(sale), total: transactionTotal(sale) }));
  state.purchases.forEach((purchase) => rows.push({ id: purchase.id, date: purchase.date, source: 'Pembelian', desc: `Pembelian dari ${contactById(purchase.contactId)?.name || '-'}`, lines: buildPurchaseJournal(purchase), total: transactionTotal(purchase) }));
  state.payrolls.forEach((payroll) => rows.push({ id: payroll.id, date: payroll.date, source: 'Payroll', desc: `Gaji ${employeeById(payroll.employeeId)?.name || '-'}`, lines: buildPayrollJournal(payroll), total: payroll.gross }));
  return rows.sort((a, b) => b.date.localeCompare(a.date));
}

function readMainLedgerState(storageKey) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || '{}');
    return {
      meta: {
        companyName: String(parsed?.meta?.companyName || state.meta.companyName || 'CV Contoh SIA'),
        periodLabel: String(parsed?.meta?.periodLabel || 'Periode Berjalan'),
        sourceNote: 'Data operasional POS terhubung otomatis ke transaksi, jurnal umum, buku besar, dan laporan.'
      },
      transactions: Array.isArray(parsed?.transactions) ? parsed.transactions : []
    };
  } catch (error) {
    return {
      meta: {
        companyName: state.meta.companyName || 'CV Contoh SIA',
        periodLabel: 'Periode Berjalan',
        sourceNote: 'Data operasional POS terhubung otomatis ke transaksi, jurnal umum, buku besar, dan laporan.'
      },
      transactions: []
    };
  }
}

function mainLedgerKeys() {
  const keys = new Set([MAIN_STORAGE_PREFIX, mainStorageKeyForUser()]);
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(MAIN_STORAGE_PREFIX)) keys.add(key);
    }
  } catch (error) {
    keys.add(MAIN_STORAGE_PREFIX);
  }
  return Array.from(keys);
}

function pairJournalLines(entry) {
  const debits = entry.lines
    .filter((line) => num(line.debit) > 0)
    .map((line) => ({ account: line.account.code, amount: num(line.debit) }));
  const credits = entry.lines
    .filter((line) => num(line.credit) > 0)
    .map((line) => ({ account: line.account.code, amount: num(line.credit) }));
  const transactions = [];
  let di = 0;
  let ci = 0;
  let pair = 1;

  while (di < debits.length && ci < credits.length) {
    const debit = debits[di];
    const credit = credits[ci];
    const amount = Math.min(debit.amount, credit.amount);
    if (amount > 0) {
      transactions.push({
        id: `ops-${entry.id}-${pair}`.replace(/[^a-zA-Z0-9_-]/g, '-'),
        mode: 'manual',
        date: entry.date,
        description: `Operasional POS | ${entry.id} | ${entry.desc}`,
        amount,
        debitAccount: debit.account,
        creditAccount: credit.account
      });
      pair += 1;
    }
    debit.amount -= amount;
    credit.amount -= amount;
    if (debit.amount <= 0) di += 1;
    if (credit.amount <= 0) ci += 1;
  }
  return transactions;
}

function operationalTransactionsForMainLedger() {
  return allJournalEntries().flatMap(pairJournalLines);
}

function syncOperationalToMainLedger() {
  const generated = operationalTransactionsForMainLedger();
  mainLedgerKeys().forEach((storageKey) => {
    const ledgerState = readMainLedgerState(storageKey);
    const preserved = ledgerState.transactions.filter((transaction) => !String(transaction?.id || '').startsWith('ops-'));
    ledgerState.meta.companyName = state.meta.companyName || ledgerState.meta.companyName;
    ledgerState.meta.sourceNote = 'Transaksi operasional POS otomatis masuk ke transaksi, jurnal umum, buku besar, neraca saldo, laba rugi, dan neraca.';
    ledgerState.transactions = [...preserved, ...generated];
    localStorage.setItem(storageKey, JSON.stringify(ledgerState));
  });
}

function accountBalances() {
  const balances = new Map(ACCOUNT_LIST.map((account) => [account.code, 0]));
  balances.set(ACCOUNTS.cash.code, 12000000);
  balances.set(ACCOUNTS.bank.code, 18000000);
  balances.set(ACCOUNTS.capital.code, -30000000);
  allJournalEntries().slice().reverse().forEach((entry) => {
    entry.lines.forEach((line) => {
      const code = line.account.code;
      balances.set(code, (balances.get(code) || 0) + num(line.debit) - num(line.credit));
    });
  });
  // Nilai persediaan dan perlengkapan diambil dari stok riil terkini agar kartu stok dan neraca ringkas konsisten.
  const inventoryValue = state.products.filter((p) => p.type === 'barang').reduce((t, p) => t + num(p.stock) * num(p.purchasePrice), 0);
  const suppliesValue = state.products.filter((p) => p.type === 'perlengkapan').reduce((t, p) => t + num(p.stock) * num(p.purchasePrice), 0);
  balances.set(ACCOUNTS.inventory.code, inventoryValue);
  balances.set(ACCOUNTS.supplies.code, suppliesValue);
  return balances;
}

function summary() {
  const salesDpp = state.sales.reduce((t, s) => t + transactionDpp(s), 0);
  const serviceSales = state.sales.reduce((t, s) => t + revenueSplit(s.items).service, 0);
  const goodsSales = salesDpp - serviceSales;
  const cogs = state.sales.reduce((t, s) => t + getSaleCost(s), 0);
  const purchases = state.purchases.reduce((t, p) => t + transactionDpp(p), 0);
  const payroll = state.payrolls.reduce((t, p) => t + num(p.gross), 0);
  const operatingExpense = state.purchases.reduce((t, p) => {
    return t + p.items.reduce((sub, item) => {
      const product = productById(item.productId);
      if (product?.type === 'barang' && isDagang()) return sub;
      if (product?.type === 'perlengkapan' || product?.type === 'peralatan') return sub;
      return sub + num(item.qty) * num(item.price);
    }, 0);
  }, 0);
  const grossProfit = salesDpp - cogs;
  const netIncome = grossProfit - operatingExpense - payroll;
  const ar = state.sales.filter((s) => s.status !== 'Lunas').reduce((t, s) => t + transactionTotal(s), 0);
  const ap = state.purchases.filter((p) => p.status !== 'Lunas').reduce((t, p) => t + transactionTotal(p), 0);
  const stockValue = state.products.filter((p) => p.type === 'barang').reduce((t, p) => t + num(p.stock) * num(p.purchasePrice), 0);
  return { salesDpp, serviceSales, goodsSales, cogs, purchases, payroll, operatingExpense, grossProfit, netIncome, ar, ap, stockValue };
}

function productOptions(filter = 'all') {
  return state.products
    .filter((p) => filter === 'all' || p.type === filter)
    .map((p) => `<option value="${p.id}">${safe(p.sku)} — ${safe(p.name)} (${safe(p.type)})</option>`)
    .join('');
}
function contactOptions(type) {
  return state.contacts.filter((c) => c.type === type).map((c) => `<option value="${c.id}">${safe(c.name)}</option>`).join('');
}
function employeeOptions() {
  return state.employees.map((e) => `<option value="${e.id}">${safe(e.name)} — ${safe(e.position)}</option>`).join('');
}

function setBusinessTypeNote() {
  const pill = byId('ops-type-pill');
  if (!pill) return;
  pill.textContent = isDagang() ? 'Perusahaan Dagang · HPP aktif' : 'Perusahaan Jasa · HPP nonaktif';
  pill.style.background = isDagang() ? '#ecfdf5' : '#eff6ff';
  pill.style.color = isDagang() ? '#047857' : '#1d4ed8';
}

function renderKpis() {
  const s = summary();
  const cards = [
    ['Penjualan Bersih', rupiah(s.salesDpp), 'Pendapatan sebelum PPN'],
    ['HPP', rupiah(s.cogs), isDagang() ? 'Aktif untuk barang dagang' : 'Nonaktif untuk jasa'],
    ['Laba Kotor', rupiah(s.grossProfit), 'Penjualan bersih - HPP'],
    ['Laba Bersih', rupiah(s.netIncome), 'Setelah beban & payroll'],
    ['Nilai Stok', rupiah(s.stockValue), 'Barang dagang tersisa'],
    ['Piutang', rupiah(s.ar), 'Penjualan belum lunas'],
    ['Hutang', rupiah(s.ap), 'Pembelian belum lunas'],
    ['Payroll', rupiah(s.payroll), 'Total beban gaji']
  ];
  byId('ops-kpis').innerHTML = cards.map(([label, value, note]) => `
    <div class="ops-kpi-card"><span>${safe(label)}</span><strong>${safe(value)}</strong><small class="ops-muted">${safe(note)}</small></div>
  `).join('');
}

function render() {
  setBusinessTypeNote();
  renderKpis();
  const form = byId('company-form');
  if (form) {
    form.companyName.value = state.meta.companyName;
    form.businessType.value = state.meta.businessType;
  }
  const tabButtons = document.querySelectorAll('#ops-tabs button');
  tabButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.tab === activeTab));
  const content = byId('ops-content');
  const renderers = {
    dashboard: renderDashboard,
    penjualan: renderSales,
    pembelian: renderPurchases,
    persediaan: renderInventory,
    arap: renderArap,
    hr: renderHR,
    jurnal: renderJournal,
    laporan: renderReports
  };
  content.innerHTML = renderers[activeTab]();
  wireDynamicForms();
}

function renderDashboard() {
  const s = summary();
  const lowStock = state.products.filter((p) => p.type === 'barang' && num(p.stock) <= 10);
  const note = isDagang()
    ? 'Mode dagang aktif: penjualan barang otomatis membentuk HPP dan mengurangi persediaan.'
    : 'Mode jasa aktif: HPP dan persediaan barang dagang tidak dipakai. Item operasional masuk perlengkapan/peralatan.';
  return `
    <div class="ops-grid-2">
      <section class="ops-card">
        <h3 class="ops-section-title">Ringkasan Operasional</h3>
        <div class="${isDagang() ? 'ops-success-box' : 'ops-warning-box'}">${safe(note)}</div>
        <p class="ops-muted">Halaman ini menjadi pusat operasional kasir dan owner. Alur utama mencakup penjualan, pembelian, stok, HPP, hutang-piutang, payroll, jurnal otomatis, dan laporan.</p>
        <div class="ops-actions-row">
          <button class="ops-secondary-btn" data-go="penjualan">Input Penjualan</button>
          <button class="ops-secondary-btn" data-go="pembelian">Input Pembelian</button>
          <button class="ops-secondary-btn" data-go="laporan">Lihat Laporan</button>
        </div>
      </section>
      <section class="ops-card">
        <h3 class="ops-section-title">Ringkasan Owner</h3>
        <div class="ops-table-wrap">
          <table class="ops-table">
            <tbody>
              <tr><td>Penjualan barang</td><td class="num">${rupiah(s.goodsSales)}</td></tr>
              <tr><td>Pendapatan jasa</td><td class="num">${rupiah(s.serviceSales)}</td></tr>
              <tr><td>HPP</td><td class="num">${rupiah(s.cogs)}</td></tr>
              <tr><td>Stok menipis</td><td class="num">${lowStock.length} item</td></tr>
              <tr><td>Piutang/Hutang</td><td class="num">${rupiah(s.ar)} / ${rupiah(s.ap)}</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `;
}

function renderSales() {
  const rows = state.sales.map((s) => `
    <tr>
      <td><strong>${safe(s.id)}</strong><br><small>${safe(s.date)}</small></td>
      <td>${safe(contactById(s.contactId)?.name || '-')}</td>
      <td>${(s.items || []).map((i) => `${safe(productById(i.productId)?.name || '-')} × ${num(i.qty)}`).join('<br>')}</td>
      <td><span class="ops-badge ${s.status === 'Lunas' ? 'green' : 'orange'}">${safe(s.status)}</span></td>
      <td class="num">${rupiah(transactionTotal(s))}</td>
      <td class="num">${rupiah(getSaleCost(s))}</td>
      <td><button class="ops-mini-btn" data-delete-sale="${s.id}">Hapus</button></td>
    </tr>
  `).join('');
  return `
    <div class="ops-grid-2">
      <section class="ops-card">
        <h3 class="ops-section-title">Input Penjualan POS</h3>
        <form id="sale-form" class="ops-form">
          <div class="ops-form-row">
            <label><span>Tanggal</span><input name="date" type="date" value="${today()}" required></label>
            <label><span>Pelanggan</span><select name="contactId" required>${contactOptions('customer')}</select></label>
          </div>
          <div class="ops-form-row">
            <label><span>Produk/Jasa</span><select name="productId" required>${productOptions('all')}</select></label>
            <label><span>Qty</span><input name="qty" type="number" min="1" value="1" required></label>
          </div>
          <div class="ops-form-row">
            <label><span>Harga Jual</span><input name="price" type="number" min="0" placeholder="kosong = harga master"></label>
            <label><span>Diskon</span><input name="discount" type="number" min="0" value="0"></label>
          </div>
          <div class="ops-form-row">
            <label><span>Status</span><select name="status"><option>Lunas</option><option>Belum Lunas</option></select></label>
            <label><span>Metode</span><select name="paymentMethod"><option value="cash">Tunai</option><option value="bank">Bank/QRIS</option></select></label>
          </div>
          <label><span>PPN</span><select name="useVat"><option value="false">Tidak pakai PPN</option><option value="true">Pakai PPN 11%</option></select></label>
          <button class="ops-primary-btn" type="submit">Simpan Penjualan + Jurnal</button>
        </form>
      </section>
      <section class="ops-card">
        <h3 class="ops-section-title">Daftar Penjualan</h3>
        <div class="ops-table-wrap"><table class="ops-table"><thead><tr><th>Faktur</th><th>Pelanggan</th><th>Item</th><th>Status</th><th class="num">Total</th><th class="num">HPP</th><th>Aksi</th></tr></thead><tbody>${rows || `<tr><td colspan="7">Belum ada penjualan.</td></tr>`}</tbody></table></div>
      </section>
    </div>
  `;
}

function renderPurchases() {
  const rows = state.purchases.map((p) => `
    <tr>
      <td><strong>${safe(p.id)}</strong><br><small>${safe(p.date)}</small></td>
      <td>${safe(contactById(p.contactId)?.name || '-')}</td>
      <td>${(p.items || []).map((i) => `${safe(productById(i.productId)?.name || '-')} × ${num(i.qty)}`).join('<br>')}</td>
      <td><span class="ops-badge ${p.status === 'Lunas' ? 'green' : 'orange'}">${safe(p.status)}</span></td>
      <td class="num">${rupiah(transactionTotal(p))}</td>
      <td><button class="ops-mini-btn" data-delete-purchase="${p.id}">Hapus</button></td>
    </tr>
  `).join('');
  return `
    <div class="ops-grid-2">
      <section class="ops-card">
        <h3 class="ops-section-title">Input Pembelian</h3>
        <form id="purchase-form" class="ops-form">
          <div class="ops-form-row">
            <label><span>Tanggal</span><input name="date" type="date" value="${today()}" required></label>
            <label><span>Vendor</span><select name="contactId" required>${contactOptions('vendor')}</select></label>
          </div>
          <div class="ops-form-row">
            <label><span>Barang/Operasional</span><select name="productId" required>${productOptions('all')}</select></label>
            <label><span>Qty</span><input name="qty" type="number" min="1" value="1" required></label>
          </div>
          <div class="ops-form-row">
            <label><span>Harga Beli</span><input name="price" type="number" min="0" placeholder="kosong = harga master"></label>
            <label><span>Diskon</span><input name="discount" type="number" min="0" value="0"></label>
          </div>
          <div class="ops-form-row">
            <label><span>Status</span><select name="status"><option>Lunas</option><option>Belum Lunas</option></select></label>
            <label><span>Metode</span><select name="paymentMethod"><option value="cash">Tunai</option><option value="bank">Bank/Transfer</option></select></label>
          </div>
          <label><span>PPN Masukan</span><select name="useVat"><option value="false">Tidak pakai PPN</option><option value="true">Pakai PPN 11%</option></select></label>
          <button class="ops-primary-btn" type="submit">Simpan Pembelian + Jurnal</button>
        </form>
      </section>
      <section class="ops-card">
        <h3 class="ops-section-title">Daftar Pembelian</h3>
        <div class="ops-table-wrap"><table class="ops-table"><thead><tr><th>No</th><th>Vendor</th><th>Item</th><th>Status</th><th class="num">Total</th><th>Aksi</th></tr></thead><tbody>${rows || `<tr><td colspan="6">Belum ada pembelian.</td></tr>`}</tbody></table></div>
      </section>
    </div>
  `;
}

function renderInventory() {
  const rows = state.products.map((p) => {
    const sold = state.sales.flatMap((s) => s.items || []).filter((i) => i.productId === p.id).reduce((t, i) => t + num(i.qty), 0);
    const bought = state.purchases.flatMap((s) => s.items || []).filter((i) => i.productId === p.id).reduce((t, i) => t + num(i.qty), 0);
    return `
      <tr>
        <td><strong>${safe(p.sku)}</strong><br><small>${safe(p.type)}</small></td>
        <td>${safe(p.name)}</td>
        <td class="num">${rupiah(p.purchasePrice)}</td>
        <td class="num">${rupiah(p.salePrice)}</td>
        <td class="num"><span class="ops-badge green">+${bought}</span></td>
        <td class="num"><span class="ops-badge red">-${sold}</span></td>
        <td class="num"><strong>${p.type === 'jasa' ? '-' : `${num(p.stock)} ${safe(p.unit)}`}</strong></td>
        <td class="num">${p.type === 'barang' ? rupiah(num(p.stock) * num(p.purchasePrice)) : '-'}</td>
        <td><button class="ops-mini-btn" data-delete-product="${p.id}">Hapus</button></td>
      </tr>
    `;
  }).join('');
  return `
    <div class="ops-grid-2">
      <section class="ops-card">
        <h3 class="ops-section-title">Tambah Produk/Jasa/Operasional</h3>
        <form id="product-form" class="ops-form">
          <div class="ops-form-row">
            <label><span>SKU</span><input name="sku" required placeholder="BRG-003"></label>
            <label><span>Jenis</span><select name="type"><option value="barang">Barang Dagang</option><option value="jasa">Jasa</option><option value="perlengkapan">Perlengkapan Operasional</option><option value="peralatan">Peralatan Operasional</option></select></label>
          </div>
          <label><span>Nama</span><input name="name" required></label>
          <div class="ops-form-row">
            <label><span>Satuan</span><input name="unit" value="pcs" required></label>
            <label><span>Stok Awal</span><input name="stock" type="number" min="0" value="0"></label>
          </div>
          <div class="ops-form-row">
            <label><span>Harga Beli</span><input name="purchasePrice" type="number" min="0" value="0"></label>
            <label><span>Harga Jual</span><input name="salePrice" type="number" min="0" value="0"></label>
          </div>
          <button class="ops-primary-btn" type="submit">Simpan Item</button>
        </form>
      </section>
      <section class="ops-card">
        <h3 class="ops-section-title">Kartu Stok & Persediaan</h3>
        <p class="ops-muted">Untuk perusahaan jasa, perlengkapan/peralatan operasional tidak diperlakukan sebagai barang dagang.</p>
        <div class="ops-table-wrap"><table class="ops-table"><thead><tr><th>SKU</th><th>Nama</th><th class="num">Harga Beli</th><th class="num">Harga Jual</th><th class="num">Masuk</th><th class="num">Keluar</th><th class="num">Stok</th><th class="num">Nilai</th><th>Aksi</th></tr></thead><tbody>${rows}</tbody></table></div>
      </section>
    </div>
  `;
}

function renderArap() {
  const saleRows = state.sales.filter((s) => s.status !== 'Lunas').map((s) => `
    <tr><td>${safe(s.id)}</td><td>Piutang</td><td>${safe(contactById(s.contactId)?.name || '-')}</td><td class="num">${rupiah(transactionTotal(s))}</td><td><button class="ops-mini-btn" data-pay-sale="${s.id}">Tandai Lunas</button></td></tr>
  `).join('');
  const purchaseRows = state.purchases.filter((p) => p.status !== 'Lunas').map((p) => `
    <tr><td>${safe(p.id)}</td><td>Hutang</td><td>${safe(contactById(p.contactId)?.name || '-')}</td><td class="num">${rupiah(transactionTotal(p))}</td><td><button class="ops-mini-btn" data-pay-purchase="${p.id}">Tandai Lunas</button></td></tr>
  `).join('');
  return `
    <section class="ops-card">
      <h3 class="ops-section-title">Daftar Hutang & Piutang</h3>
      <div class="ops-table-wrap"><table class="ops-table"><thead><tr><th>Ref</th><th>Jenis</th><th>Kontak</th><th class="num">Nominal</th><th>Aksi</th></tr></thead><tbody>${saleRows}${purchaseRows || ''}${(!saleRows && !purchaseRows) ? `<tr><td colspan="5">Tidak ada hutang/piutang belum lunas.</td></tr>` : ''}</tbody></table></div>
    </section>
  `;
}

function renderHR() {
  const empRows = state.employees.map((e) => `<tr><td>${safe(e.nik)}</td><td><strong>${safe(e.name)}</strong><br><small>${safe(e.position)}</small></td><td>${safe(e.ptkp)}</td><td class="num">${rupiah(e.salary)}</td><td><button class="ops-mini-btn" data-delete-employee="${e.id}">Hapus</button></td></tr>`).join('');
  const attRows = state.attendances.slice().reverse().map((a) => `<tr><td>${safe(a.date)}</td><td>${safe(employeeById(a.employeeId)?.name || '-')}</td><td>${safe(a.clockIn)} - ${safe(a.clockOut)}</td><td><span class="ops-badge blue">${safe(a.status)}</span></td></tr>`).join('');
  const payRows = state.payrolls.map((p) => `<tr><td>${safe(p.period)}</td><td>${safe(employeeById(p.employeeId)?.name || '-')}</td><td class="num">${rupiah(p.gross)}</td><td class="num">${rupiah(p.tax)}</td><td class="num"><strong>${rupiah(p.netPay)}</strong></td></tr>`).join('');
  return `
    <div class="ops-grid-2">
      <section class="ops-card">
        <h3 class="ops-section-title">Data Pegawai</h3>
        <form id="employee-form" class="ops-form">
          <div class="ops-form-row"><label><span>NIK</span><input name="nik" required></label><label><span>PTKP</span><select name="ptkp"><option>TK/0</option><option>K/0</option><option>K/1</option><option>K/2</option><option>K/3</option></select></label></div>
          <label><span>Nama</span><input name="name" required></label>
          <div class="ops-form-row"><label><span>Jabatan</span><input name="position" required></label><label><span>Gaji Pokok</span><input name="salary" type="number" min="0" required></label></div>
          <button class="ops-primary-btn" type="submit">Tambah Pegawai</button>
        </form>
        <div class="ops-table-wrap" style="margin-top:12px"><table class="ops-table"><thead><tr><th>NIK</th><th>Nama</th><th>PTKP</th><th class="num">Gaji</th><th>Aksi</th></tr></thead><tbody>${empRows}</tbody></table></div>
      </section>
      <section class="ops-card">
        <h3 class="ops-section-title">Absensi & Payroll</h3>
        <form id="attendance-form" class="ops-form">
          <div class="ops-form-row"><label><span>Tanggal</span><input name="date" type="date" value="${today()}" required></label><label><span>Pegawai</span><select name="employeeId">${employeeOptions()}</select></label></div>
          <div class="ops-form-row"><label><span>Masuk</span><input name="clockIn" type="time" value="08:00"></label><label><span>Keluar</span><input name="clockOut" type="time" value="16:00"></label></div>
          <label><span>Status</span><select name="status"><option>Hadir</option><option>Izin</option><option>Sakit</option><option>Cuti</option><option>Alpha</option></select></label>
          <button class="ops-secondary-btn" type="submit">Catat Absensi Manual</button>
        </form>
        <form id="payroll-form" class="ops-form" style="margin-top:12px">
          <div class="ops-form-row"><label><span>Periode</span><input name="period" type="month" value="${today().slice(0,7)}" required></label><label><span>Pegawai</span><select name="employeeId">${employeeOptions()}</select></label></div>
          <div class="ops-form-row"><label><span>Tunjangan</span><input name="allowance" type="number" min="0" value="0"></label><label><span>Potongan</span><input name="deduction" type="number" min="0" value="0"></label></div>
          <button class="ops-primary-btn" type="submit">Proses Gaji + PPh 21</button>
        </form>
      </section>
    </div>
    <div class="ops-grid-2" style="margin-top:16px">
      <section class="ops-card"><h3 class="ops-section-title">Log Absensi</h3><div class="ops-table-wrap"><table class="ops-table"><thead><tr><th>Tanggal</th><th>Pegawai</th><th>Jam</th><th>Status</th></tr></thead><tbody>${attRows || `<tr><td colspan="4">Belum ada absensi.</td></tr>`}</tbody></table></div></section>
      <section class="ops-card"><h3 class="ops-section-title">Riwayat Slip Gaji</h3><div class="ops-table-wrap"><table class="ops-table"><thead><tr><th>Periode</th><th>Pegawai</th><th class="num">Bruto</th><th class="num">PPh 21</th><th class="num">Take Home Pay</th></tr></thead><tbody>${payRows || `<tr><td colspan="5">Belum ada payroll.</td></tr>`}</tbody></table></div></section>
    </div>
  `;
}

function renderJournal() {
  const cards = allJournalEntries().map((entry) => `
    <article class="ops-journal-card">
      <div class="ops-journal-head"><span>${safe(entry.date)} · ${safe(entry.id)} · ${safe(entry.source)}</span><span>${safe(entry.desc)}</span></div>
      <div class="ops-table-wrap" style="border:0;border-radius:0"><table class="ops-table"><thead><tr><th>Akun</th><th class="num">Debit</th><th class="num">Kredit</th></tr></thead><tbody>${entry.lines.map((l) => `<tr><td>${safe(accountLabel(l.account))}</td><td class="num">${l.debit ? rupiah(l.debit) : '-'}</td><td class="num">${l.credit ? rupiah(l.credit) : '-'}</td></tr>`).join('')}</tbody></table></div>
    </article>
  `).join('');
  return `<section class="ops-card"><h3 class="ops-section-title">Jurnal Operasional Otomatis</h3><p class="ops-muted">Jurnal ini berasal dari penjualan, pembelian, dan payroll. Data yang sama otomatis masuk ke Jurnal Umum, Buku Besar, Neraca Saldo, Laba Rugi, dan Neraca utama.</p><div class="ops-journal-list">${cards || '<div class="ops-warning-box">Belum ada jurnal operasional.</div>'}</div></section>`;
}

function renderReports() {
  const s = summary();
  const balances = accountBalances();
  const assets = [ACCOUNTS.cash, ACCOUNTS.bank, ACCOUNTS.ar, ACCOUNTS.inventory, ACCOUNTS.supplies, ACCOUNTS.equipment, ACCOUNTS.vatIn];
  const liabilities = [ACCOUNTS.ap, ACCOUNTS.payrollPayable, ACCOUNTS.vatOut];
  const assetTotal = assets.reduce((t, a) => t + Math.max(0, balances.get(a.code) || 0), 0);
  const liabilityTotal = liabilities.reduce((t, a) => t + Math.abs(Math.min(0, balances.get(a.code) || 0)), 0);
  const equity = assetTotal - liabilityTotal;
  const assetRows = assets.map((a) => `<tr><td>${safe(accountLabel(a))}</td><td class="num">${rupiah(Math.max(0, balances.get(a.code) || 0))}</td></tr>`).join('');
  const liaRows = liabilities.map((a) => `<tr><td>${safe(accountLabel(a))}</td><td class="num">${rupiah(Math.abs(Math.min(0, balances.get(a.code) || 0)))}</td></tr>`).join('');
  return `
    <div class="ops-grid-2">
      <section class="ops-card">
        <h3 class="ops-section-title">Laporan Laba Rugi Operasional</h3>
        <div class="ops-table-wrap"><table class="ops-table"><tbody>
          <tr><td>Penjualan barang dagang</td><td class="num">${rupiah(s.goodsSales)}</td></tr>
          <tr><td>Pendapatan jasa</td><td class="num">${rupiah(s.serviceSales)}</td></tr>
          <tr><td>Total pendapatan</td><td class="num"><strong>${rupiah(s.salesDpp)}</strong></td></tr>
          <tr><td>Harga Pokok Penjualan</td><td class="num">${rupiah(s.cogs)}</td></tr>
          <tr><td>Laba kotor</td><td class="num"><strong>${rupiah(s.grossProfit)}</strong></td></tr>
          <tr><td>Beban operasional</td><td class="num">${rupiah(s.operatingExpense)}</td></tr>
          <tr><td>Beban gaji</td><td class="num">${rupiah(s.payroll)}</td></tr>
          <tr><td>Laba bersih</td><td class="num"><strong>${rupiah(s.netIncome)}</strong></td></tr>
        </tbody></table></div>
      </section>
      <section class="ops-card">
        <h3 class="ops-section-title">Neraca Ringkas Owner</h3>
        <div class="ops-table-wrap"><table class="ops-table"><thead><tr><th>Aset</th><th class="num">Nominal</th></tr></thead><tbody>${assetRows}<tr><td><strong>Total Aset</strong></td><td class="num"><strong>${rupiah(assetTotal)}</strong></td></tr></tbody></table></div>
        <div class="ops-table-wrap" style="margin-top:12px"><table class="ops-table"><thead><tr><th>Kewajiban & Ekuitas</th><th class="num">Nominal</th></tr></thead><tbody>${liaRows}<tr><td>Ekuitas berjalan</td><td class="num">${rupiah(equity)}</td></tr><tr><td><strong>Total Pasiva</strong></td><td class="num"><strong>${rupiah(liabilityTotal + equity)}</strong></td></tr></tbody></table></div>
      </section>
    </div>
  `;
}

function wireDynamicForms() {
  document.querySelectorAll('[data-go]').forEach((btn) => btn.addEventListener('click', () => { activeTab = btn.dataset.go; render(); }));

  byId('sale-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const fd = new FormData(event.target);
    const product = productById(fd.get('productId'));
    const qty = num(fd.get('qty'));
    if (!product) return toast('Gagal', 'Produk tidak ditemukan.');
    if (isDagang() && product.type === 'barang' && product.stock < qty) return toast('Stok kurang', 'Jumlah jual melebihi stok barang dagang.');
    const price = num(fd.get('price')) || num(product.salePrice);
    const sale = { id: uid('INV'), date: fd.get('date'), contactId: fd.get('contactId'), status: fd.get('status'), paymentMethod: fd.get('paymentMethod'), useVat: fd.get('useVat') === 'true', discount: num(fd.get('discount')), items: [{ productId: product.id, qty, price }] };
    if (product.type === 'barang') product.stock = num(product.stock) - qty;
    state.sales.unshift(sale);
    saveState(); render(); toast('Penjualan tersimpan', 'Stok, HPP, jurnal, dan laporan diperbarui otomatis.');
  });

  byId('purchase-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const fd = new FormData(event.target);
    const product = productById(fd.get('productId'));
    if (!product) return toast('Gagal', 'Produk tidak ditemukan.');
    const qty = num(fd.get('qty'));
    const price = num(fd.get('price')) || num(product.purchasePrice);
    const purchase = { id: uid('PUR'), date: fd.get('date'), contactId: fd.get('contactId'), status: fd.get('status'), paymentMethod: fd.get('paymentMethod'), useVat: fd.get('useVat') === 'true', discount: num(fd.get('discount')), items: [{ productId: product.id, qty, price }] };
    if (product.type !== 'jasa') product.stock = num(product.stock) + qty;
    product.purchasePrice = price || product.purchasePrice;
    state.purchases.unshift(purchase);
    saveState(); render(); toast('Pembelian tersimpan', 'Stok masuk, hutang/kas, dan jurnal pembelian diperbarui.');
  });

  byId('product-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const fd = new FormData(event.target);
    state.products.unshift({ id: uid('PRD'), sku: fd.get('sku'), name: fd.get('name'), type: fd.get('type'), unit: fd.get('unit'), stock: num(fd.get('stock')), purchasePrice: num(fd.get('purchasePrice')), salePrice: num(fd.get('salePrice')) });
    saveState(); render(); toast('Item tersimpan', 'Master produk/jasa berhasil ditambah.');
  });

  byId('employee-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const fd = new FormData(event.target);
    state.employees.unshift({ id: uid('EMP'), nik: fd.get('nik'), name: fd.get('name'), position: fd.get('position'), ptkp: fd.get('ptkp'), salary: num(fd.get('salary')) });
    saveState(); render(); toast('Pegawai tersimpan', 'Data pegawai masuk ke modul HR.');
  });

  byId('attendance-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const fd = new FormData(event.target);
    state.attendances.unshift({ id: uid('ATT'), date: fd.get('date'), employeeId: fd.get('employeeId'), clockIn: fd.get('clockIn'), clockOut: fd.get('clockOut'), status: fd.get('status') });
    saveState(); render(); toast('Absensi tercatat', 'Data absensi manual berhasil disimpan.');
  });

  byId('payroll-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const fd = new FormData(event.target);
    const emp = employeeById(fd.get('employeeId'));
    if (!emp) return toast('Gagal', 'Pegawai tidak ditemukan.');
    const period = fd.get('period');
    const absences = state.attendances.filter((a) => a.employeeId === emp.id && a.date.startsWith(period) && ['Izin', 'Alpha'].includes(a.status)).length;
    const attendanceDeduction = Math.round((num(emp.salary) / 22) * absences);
    const gross = num(emp.salary) + num(fd.get('allowance'));
    const tax = payrollTax(gross, emp.ptkp);
    const deduction = num(fd.get('deduction')) + attendanceDeduction;
    const netPay = Math.max(0, gross - tax - deduction);
    state.payrolls.unshift({ id: uid('PRL'), date: today(), period, employeeId: emp.id, gross, tax, deduction, netPay });
    saveState(); render(); toast('Payroll diproses', 'Slip gaji, PPh 21 estimasi, dan jurnal payroll sudah terbentuk.');
  });

  document.querySelectorAll('[data-delete-sale]').forEach((btn) => btn.addEventListener('click', () => {
    const sale = state.sales.find((s) => s.id === btn.dataset.deleteSale);
    if (sale) sale.items.forEach((i) => { const p = productById(i.productId); if (p?.type === 'barang') p.stock += num(i.qty); });
    state.sales = state.sales.filter((s) => s.id !== btn.dataset.deleteSale);
    saveState(); render(); toast('Penjualan dihapus', 'Stok barang dikembalikan.');
  }));
  document.querySelectorAll('[data-delete-purchase]').forEach((btn) => btn.addEventListener('click', () => {
    const pur = state.purchases.find((p) => p.id === btn.dataset.deletePurchase);
    if (pur) pur.items.forEach((i) => { const p = productById(i.productId); if (p && p.type !== 'jasa') p.stock = Math.max(0, num(p.stock) - num(i.qty)); });
    state.purchases = state.purchases.filter((p) => p.id !== btn.dataset.deletePurchase);
    saveState(); render(); toast('Pembelian dihapus', 'Stok masuk dikurangi kembali.');
  }));
  document.querySelectorAll('[data-delete-product]').forEach((btn) => btn.addEventListener('click', () => {
    state.products = state.products.filter((p) => p.id !== btn.dataset.deleteProduct);
    saveState(); render(); toast('Item dihapus', 'Master item dihapus dari daftar.');
  }));
  document.querySelectorAll('[data-delete-employee]').forEach((btn) => btn.addEventListener('click', () => {
    state.employees = state.employees.filter((e) => e.id !== btn.dataset.deleteEmployee);
    saveState(); render(); toast('Pegawai dihapus', 'Data pegawai dihapus dari daftar.');
  }));
  document.querySelectorAll('[data-pay-sale]').forEach((btn) => btn.addEventListener('click', () => {
    const sale = state.sales.find((s) => s.id === btn.dataset.paySale); if (sale) { sale.status = 'Lunas'; sale.paymentMethod = 'bank'; }
    saveState(); render(); toast('Piutang lunas', 'Status penjualan berubah menjadi lunas.');
  }));
  document.querySelectorAll('[data-pay-purchase]').forEach((btn) => btn.addEventListener('click', () => {
    const purchase = state.purchases.find((p) => p.id === btn.dataset.payPurchase); if (purchase) { purchase.status = 'Lunas'; purchase.paymentMethod = 'bank'; }
    saveState(); render(); toast('Hutang lunas', 'Status pembelian berubah menjadi lunas.');
  }));
}

function exportOperationalData() {
  const payload = { app: 'SIA Final Operasional POS', version: OPS_VERSION, exportedAt: new Date().toISOString(), state };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sia-operasional-pos-backup.json';
  a.click();
  URL.revokeObjectURL(url);
  toast('Export berhasil', 'Data operasional berhasil diunduh.');
}

function importOperationalData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      state = normalizeState(parsed.state || parsed);
      saveState(); render(); toast('Import berhasil', 'Data operasional berhasil dimuat.');
    } catch (error) {
      toast('Import gagal', 'File JSON tidak sesuai format operasional.');
    }
  };
  reader.readAsText(file);
}

function init() {
  document.querySelectorAll('#ops-tabs button').forEach((btn) => btn.addEventListener('click', () => { activeTab = btn.dataset.tab; render(); }));
  byId('company-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const fd = new FormData(event.target);
    state.meta.companyName = fd.get('companyName');
    state.meta.businessType = fd.get('businessType');
    saveState(); render(); toast('Setup disimpan', isDagang() ? 'Mode dagang aktif: HPP dan kartu stok dipakai.' : 'Mode jasa aktif: HPP barang dagang dinonaktifkan.');
  });
  byId('ops-export')?.addEventListener('click', exportOperationalData);
  byId('ops-import-file')?.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (file) importOperationalData(file);
    event.target.value = '';
  });
  byId('ops-reset')?.addEventListener('click', () => {
    if (!confirm('Reset semua data operasional POS? Jurnal otomatis di tabel utama akan ikut diperbarui.')) return;
    state = defaultState(); saveState(); render(); toast('Data operasional direset', 'Modul POS kembali ke data demo.');
  });

  const mobileMenuBtn = byId('mobile-menu-btn');
  const mobileOverlay = byId('mobile-overlay');
  const sidebar = byId('sidebar');
  const closeMobileSidebar = () => { sidebar?.classList.remove('is-open'); document.body.classList.remove('sidebar-open'); };
  mobileMenuBtn?.addEventListener('click', () => {
    if (sidebar?.classList.contains('is-open')) closeMobileSidebar();
    else { sidebar?.classList.add('is-open'); document.body.classList.add('sidebar-open'); }
  });
  mobileOverlay?.addEventListener('click', closeMobileSidebar);
  window.addEventListener('resize', () => { if (window.innerWidth > 860) closeMobileSidebar(); });

  syncOperationalToMainLedger();
  render();
  setupOpsFirebase();
}

init();
