/**
 * SE2026-PSLS Form Application Script
 * Features: Multi-step form, signature pads, offline-first sync, local storage auto-save
 */

// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Application State
let appState = {
  currentView: 'dashboard',
  currentStep: 1,
  online: navigator.onLine,
  surveys: [], // Holds data fetched from server + local unsynced
  localDraft: null, // Holds current form input draft
  restoredId: null // If editing a saved record
};

// Help Modal Content database
const HELP_DATABASE = {
  col1_prov: {
    title: 'Kolom (1) - Kode Provinsi',
    desc: 'Masukkan 2 digit kode provinsi tempat SLS berada berdasarkan standar administrasi BPS. Contoh: 36 untuk Banten.'
  },
  col2_kab: {
    title: 'Kolom (2) - Kode Kabupaten / Kota',
    desc: 'Masukkan 2 digit kode kabupaten atau kota tempat SLS berada. Contoh: 74 untuk Kota Tangerang Selatan.'
  },
  col3_kec: {
    title: 'Kolom (3) - Kode Kecamatan',
    desc: 'Masukkan 3 digit kode kecamatan tempat SLS berada. Contoh: 040.'
  },
  col4_desa: {
    title: 'Kolom (4) - Kode Desa / Kelurahan',
    desc: 'Masukkan 3 digit kode desa atau kelurahan tempat SLS berada. Contoh: 012.'
  },
  col5_kodesls: {
    title: 'Kolom (5) - Kode SLS / Non SLS Sebelum Perubahan',
    desc: 'Masukkan 4 digit kode SLS sebelum pemutakhiran. Digit pertama menerangkan tipe wilayah:\n' +
          '• 0 : Wilayah SLS (RT, RW, Dusun)\n' +
          '• 1 : Wilayah vegetasi pertanian\n' +
          '• 2 : Wilayah vegetasi non-pertanian\n' +
          '• 3 : Lahan terbuka\n' +
          '• 4 : Kawasan terbangun permukiman\n' +
          '• 5 : Kawasan terbangun non-permukiman\n' +
          '• 6 : Wilayah perairan'
  },
  col6_subsls: {
    title: 'Kolom (6) - Kode Sub SLS Sebelum Perubahan',
    desc: 'Masukkan 2 digit kode pecahan/sub SLS. Jika SLS utuh/tidak pecah, isi dengan "00".'
  },
  col7_namasls: {
    title: 'Kolom (7) - Nama SLS Lengkap Sebelum Perubahan',
    desc: 'Tulis nama SLS lengkap beserta level di atasnya. Contoh format: RT 02 RW 05 Dusun Sukamulya.'
  },
  col8_prov: {
    title: 'Kolom (8) - Kode Provinsi Setelah Perubahan',
    desc: 'Masukkan 2 digit kode provinsi terbaru hasil verifikasi lapangan.'
  },
  col9_kab: {
    title: 'Kolom (9) - Kode Kabupaten/Kota Setelah Perubahan',
    desc: 'Masukkan 2 digit kode kabupaten/kota terbaru hasil verifikasi lapangan.'
  },
  col10_kec: {
    title: 'Kolom (10) - Kode Kecamatan Setelah Perubahan',
    desc: 'Masukkan 3 digit kode kecamatan terbaru hasil verifikasi lapangan.'
  },
  col11_desa: {
    title: 'Kolom (11) - Kode Desa/Kelurahan Setelah Perubahan',
    desc: 'Masukkan 3 digit kode desa/kelurahan terbaru hasil verifikasi lapangan.'
  },
  col12_namadesa: {
    title: 'Kolom (12) - Nama Desa / Kelurahan',
    desc: 'Ketik nama desa atau kelurahan terbaru dengan huruf kapital/jelas. Contoh: MARGOMULYO.'
  },
  col13_kodesls: {
    title: 'Kolom (13) - Kode SLS / Non SLS Setelah Perubahan',
    desc: 'Masukkan 4 digit kode SLS terbaru hasil verifikasi lapangan. Aturan digit pertama (0-6) sama seperti Kolom (5).'
  },
  col14_subsls: {
    title: 'Kolom (14) - Kode Sub SLS Setelah Perubahan',
    desc: 'Masukkan 2 digit kode sub-SLS terbaru. Isi dengan "00" jika tidak ada pecahan.'
  },
  col15_muatandominan: {
    title: 'Kolom (15) - Muatan Dominan',
    desc: 'Pilih peruntukan dominan dari wilayah SLS tersebut berdasarkan daftar opsi (1 s.d 13). Misal: Opsi 1 untuk Permukiman Biasa, Opsi 9 untuk Kawasan Industri, dsb.'
  },
  col16_kk: {
    title: 'Kolom (16) - Jumlah KK',
    desc: 'Jumlah kepala keluarga (KK) yang berdomisili riil di wilayah SLS tersebut setelah perubahan.'
  },
  col17_btt: {
    title: 'Kolom (17) - Jumlah Bangunan Tempat Tinggal (BTT)',
    desc: 'Jumlah bangunan fisik yang digunakan sebagai tempat tinggal (baik dihuni maupun sementara kosong).'
  },
  col18_bbtt: {
    title: 'Kolom (18) - Jumlah Bangunan Bukan Tempat Tinggal (BBTT)',
    desc: 'Jumlah bangunan yang bukan untuk tempat tinggal, seperti ruko murni, toko, masjid, kantor, atau pabrik.'
  },
  col19_bttkosong: {
    title: 'Kolom (19) - Jumlah BTT Kosong',
    desc: 'Banyaknya bangunan tempat tinggal yang dalam keadaan kosong atau tidak dihuni saat pendataan.'
  },
  col20_bku: {
    title: 'Kolom (20) - Jumlah Bangunan Khusus (BKU)',
    desc: 'Jumlah bangunan khusus seperti asrama, barak militer, pesantren, panti asuhan, candi, museum, dll.'
  },
  col21_ruta: {
    title: 'Kolom (21) - Jumlah Rumah Tangga (Ruta)',
    desc: 'Jumlah unit rumah tangga riil yang tinggal di SLS tersebut. Biasanya nilainya mendekati atau sama dengan Jumlah KK.'
  },
  col22_namasls: {
    title: 'Kolom (22) - Nama SLS Lengkap Setelah Perubahan',
    desc: 'Ketik nama SLS lengkap setelah perubahan. Tekan tombol suguhkan di bawahnya jika ingin menyalin nama SLS lama.'
  },
  col23_ketuasls: {
    title: 'Kolom (23) - Nama Ketua SLS Terkecil',
    desc: 'Ketik nama lengkap Ketua RT / RW / Kepala Dusun yang aktif memimpin wilayah SLS terkecil tersebut.'
  },
  col24_statusperubahan: {
    title: 'Kolom (24) - Status Perubahan Wilayah SLS',
    desc: 'Pilih jenis perubahan administrasi yang terjadi:\n' +
          '1. Pemekaran SLS (satu SLS pecah menjadi beberapa)\n' +
          '2. Penggabungan SLS (beberapa SLS menyatu)\n' +
          '3. Perubahan Jenis SLS (misal dari SLS jadi non-SLS)\n' +
          '4. Perubahan Tingkatan/Nama SLS\n' +
          '5. Perubahan Kode SLS saja\n' +
          '6. Perubahan Ketua SLS saja (Muatan)\n' +
          '0. Tidak ada perubahan wilayah'
  },
  col25_perubahanbatas: {
    title: 'Kolom (25) - Apakah Terdapat Perubahan Batas?',
    desc: 'Pilih Ya (1) jika batas fisik/garis batas peta wilayah SLS tersebut bergeser/berubah. Pilih Tidak (2) jika batas geografi SLS tetap sama.'
  }
};

const SLS_TYPES = {
  '0': 'Wilayah SLS (RT/RW/Dusun)',
  '1': 'Wilayah vegetasi pertanian (Hutan/Sawah)',
  '2': 'Wilayah vegetasi non-pertanian (Semak/Hutan Lindung)',
  '3': 'Lahan terbuka (Gurun/Rawa)',
  '4': 'Kawasan terbangun permukiman (Perumahan baru/Asrama)',
  '5': 'Kawasan terbangun non-permukiman (Industri/Bandara)',
  '6': 'Wilayah perairan (Danau/Waduk/Laut)'
};

// DOM Elements
const dom = {
  navItems: document.querySelectorAll('.nav-item'),
  views: document.querySelectorAll('.content-view'),
  themeToggle: document.getElementById('theme-toggle'),
  networkStatus: document.getElementById('network-status'),
  btnSync: document.getElementById('btn-sync'),
  syncCount: document.getElementById('sync-count'),
  syncBanner: document.getElementById('sync-banner'),
  bannerCount: document.getElementById('banner-count'),
  btnSyncBanner: document.getElementById('btn-sync-banner'),
  toastContainer: document.getElementById('toast-container'),
  
  // Dashboard Elements
  statsTotal: document.getElementById('stats-total'),
  statsDrafts: document.getElementById('stats-drafts'),
  statsSubmitted: document.getElementById('stats-submitted'),
  btnStartForm: document.querySelector('.start-form-btn'),
  recentDraftsContainer: document.getElementById('recent-drafts-container'),
  btnViewAllHistory: document.querySelector('.view-all-history'),
  
  // Form Wizard Elements
  form: document.getElementById('psls-form'),
  stepNodes: document.querySelectorAll('.step-node'),
  stepPanels: document.querySelectorAll('.form-step-panel'),
  stepProgressFill: document.querySelector('.step-progress-fill'),
  currentStepTitle: document.getElementById('current-step-title'),
  btnWizardPrev: document.getElementById('btn-wizard-prev'),
  btnWizardNext: document.getElementById('btn-wizard-next'),
  btnWizardSubmit: document.getElementById('btn-wizard-submit'),
  btnSaveDraft: document.getElementById('btn-save-draft'),
  btnCopyPrev: document.getElementById('btn-copy-prev'),
  btnCopyName: document.getElementById('btn-copy-name'),
  
  // Digit translations helpers
  col5KodeSLS: document.getElementById('col5_kodesls'),
  col13KodeSLS: document.getElementById('col13_kodesls'),
  helperCol5: document.getElementById('helper-col5'),
  helperCol13: document.getElementById('helper-col13'),

  // Help inline button clicks
  helpInlineButtons: document.querySelectorAll('.btn-help-inline'),
  helpModal: document.getElementById('help-modal'),
  helpModalTitle: document.getElementById('help-modal-title'),
  helpModalBody: document.getElementById('help-modal-body'),
  btnCloseHelpModal: document.getElementById('btn-close-help-modal'),
  btnCloseHelpModalOk: document.getElementById('btn-close-help-modal-ok'),
  
  // Signature pads
  canvasOfficer: document.getElementById('sig-pad-officer'),
  canvasSupervisor: document.getElementById('sig-pad-supervisor'),
  btnClearSigOfficer: document.getElementById('btn-clear-sig-officer'),
  btnClearSigSupervisor: document.getElementById('btn-clear-sig-supervisor'),
  
  // Review nodes
  revBeforeAdmin: document.getElementById('rev-before-admin'),
  revBeforeCode: document.getElementById('rev-before-code'),
  revBeforeName: document.getElementById('rev-before-name'),
  revAfterAdmin: document.getElementById('rev-after-admin'),
  revAfterCode: document.getElementById('rev-after-code'),
  revMuatanDominan: document.getElementById('rev-muatan-dominan'),
  revAfterName: document.getElementById('rev-after-name'),
  revKkRuta: document.getElementById('rev-kk-ruta'),
  revBangunan: document.getElementById('rev-bangunan'),
  revBttBku: document.getElementById('rev-btt-bku'),
  revKetua: document.getElementById('rev-ketua'),
  revStatusPerubahan: document.getElementById('rev-status-perubahan'),
  revPerubahanBatas: document.getElementById('rev-perubahan-batas'),
  
  // History Elements
  historySearch: document.getElementById('history-search'),
  historyItemsContainer: document.getElementById('history-items-container'),
  btnExportAll: document.getElementById('btn-export-all'),
  btnImportTrigger: document.getElementById('btn-import-trigger'),
  importFileInput: document.getElementById('import-file-input'),
  
  // Guide tabs
  guideTabButtons: document.querySelectorAll('.guide-tab-btn'),
  guideTabContents: document.querySelectorAll('.guide-tab-content')
};

// Signature Drawing Contexts
let sigContexts = {
  officer: { drawing: false, canvas: null, ctx: null },
  supervisor: { drawing: false, canvas: null, ctx: null }
};

/* ==========================================================================
   INITIALIZATION & BOOTSTRAP
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavigation();
  initNetworkListeners();
  initFormWizard();
  initSignaturePads();
  initHelpSystem();
  initHistoryControls();
  initAutosave();
  
  // Load initial data
  loadLocalDraft();
  refreshData();
});

// Theme Management (Dark Mode)
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
  }
  
  dom.themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
  });
}

// Navigation Views Manager
function initNavigation() {
  dom.navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetView = item.getAttribute('data-view');
      navigateToView(targetView);
    });
  });
  
  // Dashboard button handlers
  dom.btnStartForm.addEventListener('click', () => {
    dom.form.reset();
    clearSignatures();
    appState.restoredId = null;
    appState.currentStep = 1;
    updateWizardUI();
    navigateToView('form-wizard');
  });

  dom.btnViewAllHistory.addEventListener('click', () => {
    navigateToView('history-list');
  });
}

function navigateToView(viewId) {
  appState.currentView = viewId;
  
  // Update nav item active classes
  dom.navItems.forEach(item => {
    if (item.getAttribute('data-view') === viewId || 
        (viewId === 'form-wizard' && item.id === 'nav-btn-form')) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Update visible section views
  dom.views.forEach(view => {
    if (view.id === `view-${viewId}`) {
      view.classList.add('active');
    } else {
      view.classList.remove('active');
    }
  });

  // Toggle full-height flex layout on app-main for form wizard
  const appMain = document.querySelector('.app-main');
  if (appMain) {
    if (viewId === 'form-wizard') {
      appMain.classList.add('form-wizard-active');
    } else {
      appMain.classList.remove('form-wizard-active');
    }
  }

  if (viewId === 'dashboard' || viewId === 'history-list') {
    refreshData();
  }
}


/* ==========================================================================
   NETWORK STATUS & OFFLINE-FIRST MANAGEMENT
   ========================================================================== */

function initNetworkListeners() {
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  
  dom.btnSync.addEventListener('click', triggerSync);
  dom.btnSyncBanner.addEventListener('click', triggerSync);
  
  updateNetworkStatus();
}

function updateNetworkStatus() {
  appState.online = navigator.onLine;
  
  if (appState.online) {
    dom.networkStatus.classList.remove('offline');
    dom.networkStatus.classList.add('online');
    dom.networkStatus.querySelector('.status-text').innerText = 'Online';
    showToast('Koneksi internet terhubung kembali.', 'success');
    checkUnsyncedData();
  } else {
    dom.networkStatus.classList.remove('online');
    dom.networkStatus.classList.add('offline');
    dom.networkStatus.querySelector('.status-text').innerText = 'Offline';
    dom.btnSync.classList.add('hidden');
    dom.syncBanner.classList.add('hidden');
    showToast('Bekerja dalam mode luring (offline).', 'warning');
  }
}

function getLocalSurveys() {
  return JSON.parse(localStorage.getItem('psls_local_surveys') || '[]');
}

function saveLocalSurveys(surveys) {
  localStorage.setItem('psls_local_surveys', JSON.stringify(surveys));
}

// Checks if there is any local data waiting to be synced to MySQL
function checkUnsyncedData() {
  if (!appState.online) return;
  
  const localSurveys = getLocalSurveys();
  const unsyncedCount = localSurveys.filter(s => s.sync_status === 'local').length;
  
  if (unsyncedCount > 0) {
    // Show sync buttons and banners
    dom.btnSync.classList.remove('hidden');
    dom.syncCount.innerText = unsyncedCount;
    dom.syncBanner.classList.remove('hidden');
    dom.bannerCount.innerText = unsyncedCount;
  } else {
    dom.btnSync.classList.add('hidden');
    dom.syncBanner.classList.add('hidden');
  }
}

// Syncs unsynced local surveys to the Express database backend
async function triggerSync() {
  if (!appState.online) {
    showToast('Gagal sinkronisasi: Anda sedang offline.', 'danger');
    return;
  }

  const localSurveys = getLocalSurveys();
  const unsynced = localSurveys.filter(s => s.sync_status === 'local');
  
  if (unsynced.length === 0) {
    showToast('Semua data sudah tersinkronisasi.', 'success');
    return;
  }

  showToast('Memulai sinkronisasi data...', 'warning');
  let syncSuccessCount = 0;
  
  for (let survey of unsynced) {
    try {
      const cleanSurvey = { ...survey };
      delete cleanSurvey.id; // Let server generate MySQL id
      
      const response = await fetch(`${API_BASE_URL}/surveys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanSurvey)
      });
      
      if (response.ok) {
        syncSuccessCount++;
        // Remove from local list
        const idx = localSurveys.findIndex(s => s.id === survey.id);
        if (idx !== -1) {
          localSurveys.splice(idx, 1);
        }
      }
    } catch (err) {
      console.error('Error syncing survey ID ' + survey.id, err);
    }
  }

  saveLocalSurveys(localSurveys);
  checkUnsyncedData();
  refreshData();

  if (syncSuccessCount === unsynced.length) {
    showToast(`Berhasil mensinkronkan ${syncSuccessCount} data ke database!`, 'success');
  } else if (syncSuccessCount > 0) {
    showToast(`Berhasil mensinkronkan ${syncSuccessCount} dari ${unsynced.length} data.`, 'warning');
  } else {
    showToast('Gagal menghubungi server database.', 'danger');
  }
}

/* ==========================================================================
   MULTI-STEP FORM WIZARD LOGIC
   ========================================================================== */

function initFormWizard() {
  // Navigation buttons
  dom.btnWizardPrev.addEventListener('click', () => {
    if (appState.currentStep > 1) {
      appState.currentStep--;
      updateWizardUI();
    }
  });

  dom.btnWizardNext.addEventListener('click', () => {
    if (validateStep(appState.currentStep)) {
      if (appState.currentStep < 5) {
        appState.currentStep++;
        updateWizardUI();
      }
    } else {
      showToast('Mohon lengkapi kolom yang wajib diisi dengan benar.', 'danger');
    }
  });

  // Pre-fill copy handlers
  dom.btnCopyPrev.addEventListener('click', copyBeforeToAfterFields);
  dom.btnCopyName.addEventListener('click', () => {
    const prevName = document.getElementById('col7_namasls').value;
    if (prevName) {
      document.getElementById('col22_namasls').value = prevName;
      document.getElementById('col22_namasls').dispatchEvent(new Event('input'));
    }
  });

  // Digit classification helpers
  dom.col5KodeSLS.addEventListener('input', () => {
    const val = dom.col5KodeSLS.value;
    if (val.length > 0) {
      const typeDigit = val[0];
      dom.helperCol5.innerText = `Jenis SLS: ${SLS_TYPES[typeDigit] || 'Tidak diketahui'}`;
    } else {
      dom.helperCol5.innerText = 'Jenis SLS: -';
    }
  });

  dom.col13KodeSLS.addEventListener('input', () => {
    const val = dom.col13KodeSLS.value;
    if (val.length > 0) {
      const typeDigit = val[0];
      dom.helperCol13.innerText = `Jenis SLS: ${SLS_TYPES[typeDigit] || 'Tidak diketahui'}`;
    } else {
      dom.helperCol13.innerText = 'Jenis SLS: -';
    }
  });

  // Submit Handler
  dom.form.addEventListener('submit', handleFormSubmit);
}

// Validation rules per step
function validateStep(step) {
  let isValid = true;
  const panel = dom.stepPanels[step - 1];
  const requiredInputs = panel.querySelectorAll('[required]');

  requiredInputs.forEach(input => {
    const field = input.closest('.form-field');
    
    // Reset invalid
    if (field) field.classList.remove('invalid');
    
    // Check radio buttons separately
    if (input.type === 'radio') {
      const groupName = input.name;
      const checkedRadio = panel.querySelector(`input[name="${groupName}"]:checked`);
      if (!checkedRadio) {
        isValid = false;
        if (field) field.classList.add('invalid');
      }
    } else {
      // Standard inputs
      if (!input.value.trim()) {
        isValid = false;
        if (field) field.classList.add('invalid');
      } else if (input.pattern) {
        // Regex pattern verification (codes etc)
        const regex = new RegExp(`^${input.pattern}$`);
        if (!regex.test(input.value.trim())) {
          isValid = false;
          if (field) field.classList.add('invalid');
        }
      } else if (input.type === 'number') {
        const minVal = parseFloat(input.getAttribute('min') || '0');
        const currVal = parseFloat(input.value);
        if (isNaN(currVal) || currVal < minVal) {
          isValid = false;
          if (field) field.classList.add('invalid');
        }
      }
    }
  });

  // Validation logic helper
  if (step === 3 && isValid) {
    // Validate KK and Ruta are logical (Rule check)
    const kk = parseInt(document.getElementById('col16_kk').value || '0');
    const ruta = parseInt(document.getElementById('col21_ruta').value || '0');
    if (ruta > 0 && kk === 0) {
      showToast('Peringatan: Jumlah KK 0 namun Jumlah Rumah Tangga > 0.', 'warning');
    }
  }

  return isValid;
}

// UI Steps rendering
function updateWizardUI() {
  // Update step panels visibility
  dom.stepPanels.forEach(panel => {
    const panelStep = parseInt(panel.getAttribute('data-step'));
    if (panelStep === appState.currentStep) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  // Update indicator nodes
  dom.stepNodes.forEach(node => {
    const nodeStep = parseInt(node.getAttribute('data-step'));
    node.classList.remove('active', 'completed');
    if (nodeStep === appState.currentStep) {
      node.classList.add('active');
    } else if (nodeStep < appState.currentStep) {
      node.classList.add('completed');
    }
  });

  // Progress Bar Fill
  const progressPercent = ((appState.currentStep - 1) / 4) * 100;
  dom.stepProgressFill.style.width = `${progressPercent}%`;

  // Controls buttons
  dom.btnWizardPrev.disabled = appState.currentStep === 1;
  
  if (appState.currentStep === 5) {
    dom.btnWizardNext.classList.add('hidden');
    dom.btnWizardSubmit.classList.remove('hidden');
    generateReviewSummary();
    resizeSignatureCanvases(); // Ensure canvasses are responsive before signing
  } else {
    dom.btnWizardNext.classList.remove('hidden');
    dom.btnWizardSubmit.classList.add('hidden');
  }

  // Titles
  const titles = [
    'Langkah 1: SLS Sebelum Perubahan',
    'Langkah 2: SLS Setelah Perubahan (Administrasi)',
    'Langkah 3: SLS Setelah Perubahan (Muatan)',
    'Langkah 4: Status & Batas Wilayah SLS',
    'Langkah 5: Tinjau & Tanda Tangan'
  ];
  dom.currentStepTitle.innerText = titles[appState.currentStep - 1];

  // Scroll to top of wizard on step change
  document.querySelector('.app-main').scrollTop = 0;
}

// Autofills column 8-11, 13, 14 with columns 1-6
function copyBeforeToAfterFields() {
  const fieldsMap = {
    col1_prov: 'col8_prov',
    col2_kab: 'col9_kab',
    col3_kec: 'col10_kec',
    col4_desa: 'col11_desa',
    col5_kodesls: 'col13_kodesls',
    col6_subsls: 'col14_subsls'
  };

  let copiedCount = 0;
  for (let beforeId in fieldsMap) {
    const beforeVal = document.getElementById(beforeId).value;
    if (beforeVal) {
      document.getElementById(fieldsMap[beforeId]).value = beforeVal;
      copiedCount++;
    }
  }

  // Pre-fill default Nama Desa if they entered a code
  const desaCode = document.getElementById('col4_desa').value;
  if (desaCode && !document.getElementById('col12_namadesa').value) {
    document.getElementById('col12_namadesa').value = 'Desa ' + desaCode;
  }

  // Dispatch events to trigger digit helper updates
  dom.col13KodeSLS.dispatchEvent(new Event('input'));

  if (copiedCount > 0) {
    showToast('Berhasil menyalin data administratif sebelum perubahan.', 'success');
  } else {
    showToast('Kolom sebelum perubahan masih kosong.', 'warning');
  }
}

// Populates step 5 summaries dynamically
function generateReviewSummary() {
  const getVal = (id) => document.getElementById(id).value || '-';
  const getSelectText = (id) => {
    const el = document.getElementById(id);
    return el.selectedIndex > 0 ? el.options[el.selectedIndex].text : '-';
  };
  
  // Before
  dom.revBeforeAdmin.innerText = `${getVal('col1_prov')} / ${getVal('col2_kab')} / ${getVal('col3_kec')} / ${getVal('col4_desa')}`;
  dom.revBeforeCode.innerText = `${getVal('col5_kodesls')} - Sub: ${getVal('col6_subsls')}`;
  dom.revBeforeName.innerText = getVal('col7_namasls');

  // After Admin
  dom.revAfterAdmin.innerText = `${getVal('col8_prov')} / ${getVal('col9_kab')} / ${getVal('col10_kec')} / ${getVal('col11_desa')} (${getVal('col12_namadesa')})`;
  dom.revAfterCode.innerText = `${getVal('col13_kodesls')} - Sub: ${getVal('col14_subsls')}`;

  // After Muatan
  dom.revMuatanDominan.innerText = getSelectText('col15_muatandominan');
  dom.revAfterName.innerText = getVal('col22_namasls');
  dom.revKkRuta.innerText = `${getVal('col16_kk')} KK / ${getVal('col21_ruta')} Ruta`;
  dom.revBangunan.innerText = `${getVal('col17_btt')} BTT / ${getVal('col18_bbtt')} BBTT`;
  dom.revBttBku.innerText = `${getVal('col19_bttkosong')} Kosong / ${getVal('col20_bku')} BKU`;

  // Leadership & Changes
  dom.revKetua.innerText = getVal('col23_ketuasls');
  dom.revStatusPerubahan.innerText = getSelectText('col24_statusperubahan');
  
  const batasRadio = document.querySelector('input[name="col25_perubahanbatas"]:checked');
  dom.revPerubahanBatas.innerText = batasRadio ? (batasRadio.value === '1' ? 'Ya (Batas berubah)' : 'Tidak (Batas tetap)') : '-';
}

/* ==========================================================================
   TANDA TANGAN DIGITAL — PREMIUM VERSION
   ========================================================================== */

// Global ink color
let currentInkColor = '#1e3a8a';

function initSignaturePads() {
  const setupCanvas = (canvasId, sigPadKey) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = currentInkColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    sigContexts[sigPadKey].canvas = canvas;
    sigContexts[sigPadKey].ctx = ctx;
    sigContexts[sigPadKey].hasSigned = false;

    // Mouse events
    canvas.addEventListener('mousedown',  (e) => startDrawing(e, sigPadKey));
    canvas.addEventListener('mousemove',  (e) => draw(e, sigPadKey));
    canvas.addEventListener('mouseup',    ()  => stopDrawing(sigPadKey));
    canvas.addEventListener('mouseleave', ()  => stopDrawing(sigPadKey));

    // Touch events for smartphone
    canvas.addEventListener('touchstart', (e) => startDrawing(e, sigPadKey), { passive: false });
    canvas.addEventListener('touchmove',  (e) => draw(e, sigPadKey),         { passive: false });
    canvas.addEventListener('touchend',   ()  => stopDrawing(sigPadKey));
  };

  setupCanvas('sig-pad-officer',    'officer');
  setupCanvas('sig-pad-supervisor', 'supervisor');

  // Clear buttons
  document.getElementById('btn-clear-sig-officer')
    .addEventListener('click', () => clearCanvas('officer'));
  document.getElementById('btn-clear-sig-supervisor')
    .addEventListener('click', () => clearCanvas('supervisor'));

  // Ink color selector
  document.querySelectorAll('.ink-color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ink-color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentInkColor = btn.getAttribute('data-color');
      // Apply to both canvases
      ['officer', 'supervisor'].forEach(key => {
        if (sigContexts[key].ctx) sigContexts[key].ctx.strokeStyle = currentInkColor;
      });
    });
  });

  // Declaration checkbox animation
  const chk = document.getElementById('chk-declaration');
  if (chk) {
    chk.addEventListener('change', () => {
      const box = document.getElementById('sig-declaration');
      if (box) box.classList.toggle('confirmed', chk.checked);
    });
  }

  // Live timestamp update
  updateSigTimestamp();
}

function updateSigTimestamp() {
  const el = document.getElementById('sig-timestamp-text');
  if (!el) return;
  const now = new Date();
  const fmt = now.toLocaleString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  el.textContent = `Waktu pengisian: ${fmt}`;
  setTimeout(updateSigTimestamp, 1000);
}

function startDrawing(e, key) {
  e.preventDefault();
  const state = sigContexts[key];
  state.drawing = true;
  const coords = getEventCoords(e, state.canvas);
  state.ctx.strokeStyle = currentInkColor;
  state.ctx.beginPath();
  state.ctx.moveTo(coords.x, coords.y);
}

function draw(e, key) {
  const state = sigContexts[key];
  if (!state.drawing) return;
  e.preventDefault();
  const coords = getEventCoords(e, state.canvas);
  state.ctx.lineTo(coords.x, coords.y);
  state.ctx.stroke();

  // First stroke — hide placeholder, mark as signed
  if (!state.hasSigned) {
    state.hasSigned = true;
    markSigned(key, true);
  }
}

function stopDrawing(key) {
  sigContexts[key].drawing = false;
}

function markSigned(key, isSigned) {
  const wrapperId   = key === 'officer' ? 'canvas-wrapper-officer'    : 'canvas-wrapper-supervisor';
  const placeholderId = key === 'officer' ? 'canvas-placeholder-officer' : 'canvas-placeholder-supervisor';
  const statusDotId = key === 'officer' ? 'sig-status-officer'        : 'sig-status-supervisor';
  const cardId      = key === 'officer' ? 'sig-card-officer'          : 'sig-card-supervisor';

  const wrapper     = document.getElementById(wrapperId);
  const placeholder = document.getElementById(placeholderId);
  const statusDot   = document.getElementById(statusDotId);

  if (wrapper)     wrapper.classList.toggle('is-signed', isSigned);
  if (placeholder) placeholder.classList.toggle('hidden', isSigned);
  if (statusDot) {
    statusDot.classList.toggle('empty',  !isSigned);
    statusDot.classList.toggle('signed',  isSigned);
  }
}

function clearCanvas(key) {
  const state = sigContexts[key];
  if (!state.canvas) return;
  state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
  state.hasSigned = false;
  markSigned(key, false);
}

function clearSignatures() {
  clearCanvas('officer');
  clearCanvas('supervisor');
  // Also uncheck declaration
  const chk = document.getElementById('chk-declaration');
  if (chk) {
    chk.checked = false;
    const box = document.getElementById('sig-declaration');
    if (box) box.classList.remove('confirmed');
  }
}


function getEventCoords(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  let clientX, clientY;
  
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  
  // Calculate exact coordinates mapping back to canvas pixel scale
  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height)
  };
}

// Adjust canvas resolution dynamically on window resize (high-DPI mobile screens)
function resizeSignatureCanvases() {
  const resizePad = (key) => {
    const state = sigContexts[key];
    const wrapper = state.canvas.parentElement;
    const width = wrapper.clientWidth;
    const height = wrapper.clientHeight;
    
    // Only resize canvas if dimensions actually changed
    if (state.canvas.width !== width || state.canvas.height !== height) {
      // Save canvas image first to avoid loss
      const tempImg = state.canvas.toDataURL();
      
      state.canvas.width = width;
      state.canvas.height = height;
      
      // Re-configure context styles after resize
      state.ctx.strokeStyle = '#1e293b';
      state.ctx.lineWidth = 3;
      state.ctx.lineCap = 'round';
      state.ctx.lineJoin = 'round';
      
      // Draw back the signature
      const img = new Image();
      img.onload = () => {
        state.ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = tempImg;
    }
  };

  resizePad('officer');
  resizePad('supervisor');
}

// Checks if canvas has drawing in it
function isCanvasBlank(canvas) {
  const blank = document.createElement('canvas');
  blank.width = canvas.width;
  blank.height = canvas.height;
  return canvas.toDataURL() === blank.toDataURL();
}

/* ==========================================================================
   FORM SUBMISSION (DATABASE INSERT & OFFLINE STORES)
   ========================================================================== */

async function handleFormSubmit(e) {
  e.preventDefault();
  
  // Final validation checking
  if (!validateStep(5)) {
    showToast('Tolong isi informasi petugas dan pengawas.', 'danger');
    return;
  }

  // Ensure signatures are present before sending
  const isOfficerSigBlank = isCanvasBlank(dom.canvasOfficer);
  const isSupervisorSigBlank = isCanvasBlank(dom.canvasSupervisor);

  if (isOfficerSigBlank || isSupervisorSigBlank) {
    showToast('Wajib melampirkan tanda tangan Petugas dan Pengawas.', 'danger');
    return;
  }

  // Parse Form Data
  const formData = new FormData(dom.form);
  const surveyData = {
    col1_prov: formData.get('col1_prov'),
    col2_kab: formData.get('col2_kab'),
    col3_kec: formData.get('col3_kec'),
    col4_desa: formData.get('col4_desa'),
    col5_kodesls: formData.get('col5_kodesls'),
    col6_subsls: formData.get('col6_subsls'),
    col7_namasls: formData.get('col7_namasls'),
    col8_prov: formData.get('col8_prov'),
    col9_kab: formData.get('col9_kab'),
    col10_kec: formData.get('col10_kec'),
    col11_desa: formData.get('col11_desa'),
    col12_namadesa: formData.get('col12_namadesa'),
    col13_kodesls: formData.get('col13_kodesls'),
    col14_subsls: formData.get('col14_subsls'),
    col15_muatandominan: parseInt(formData.get('col15_muatandominan')),
    col16_kk: parseInt(formData.get('col16_kk')),
    col17_btt: parseInt(formData.get('col17_btt')),
    col18_bbtt: parseInt(formData.get('col18_bbtt')),
    col19_bttkosong: parseInt(formData.get('col19_bttkosong')),
    col20_bku: parseInt(formData.get('col20_bku')),
    col21_ruta: parseInt(formData.get('col21_ruta')),
    col22_namasls: formData.get('col22_namasls'),
    col23_ketuasls: formData.get('col23_ketuasls'),
    col24_statusperubahan: parseInt(formData.get('col24_statusperubahan')),
    col25_perubahanbatas: parseInt(formData.get('col25_perubahanbatas')),
    officer_name: formData.get('officer_name'),
    officer_date: formData.get('officer_date'),
    officer_sig: dom.canvasOfficer.toDataURL(),
    supervisor_name: formData.get('supervisor_name'),
    supervisor_date: formData.get('supervisor_date'),
    supervisor_sig: dom.canvasSupervisor.toDataURL(),
    status: 'submitted'
  };

  if (appState.restoredId) {
    surveyData.id = appState.restoredId;
  }

  showToast('Menyimpan data...', 'warning');

  // Submit flow
  if (appState.online) {
    try {
      let response;
      if (appState.restoredId) {
        response = await fetch(`${API_BASE_URL}/surveys/${appState.restoredId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(surveyData)
        });
      } else {
        response = await fetch(`${API_BASE_URL}/surveys`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(surveyData)
        });
      }
      
      if (response.ok) {
        showToast('Berhasil mengirimkan data ke database MySQL!', 'success');
        clearDraft();
        navigateToView('dashboard');
      } else {
        throw new Error('Gagal mengirim ke database server.');
      }
    } catch (err) {
      console.error(err);
      saveOfflineFallback(surveyData);
    }
  } else {
    saveOfflineFallback(surveyData);
  }
}

// Stores submitted survey to localStorage fallback if offline
function saveOfflineFallback(surveyData) {
  surveyData.sync_status = 'local';
  
  if (!surveyData.id) {
    surveyData.id = 'loc_' + Date.now();
  }
  
  const localSurveys = getLocalSurveys();
  
  // Update or insert
  const idx = localSurveys.findIndex(s => s.id === surveyData.id);
  if (idx !== -1) {
    localSurveys[idx] = surveyData;
  } else {
    localSurveys.push(surveyData);
  }
  
  saveLocalSurveys(localSurveys);
  showToast('Offline fallback: Data berhasil disimpan di memori telepon (draf).', 'warning');
  
  clearDraft();
  checkUnsyncedData();
  navigateToView('dashboard');
}

/* ==========================================================================
   AUTO-SAVE DRAFT (LOCAL STORAGE MECHANISM)
   ========================================================================== */

let autosaveTimeout = null;

function initAutosave() {
  // Save form fields dynamically on input
  dom.form.addEventListener('input', () => {
    if (appState.currentView !== 'form-wizard') return;
    
    if (autosaveTimeout) clearTimeout(autosaveTimeout);
    
    autosaveTimeout = setTimeout(() => {
      saveFormDraft();
    }, 1500); // 1.5 seconds debounce
  });

  // Manual save draft button in wizard
  dom.btnSaveDraft.addEventListener('click', () => {
    saveFormDraft(true);
  });
}

function saveFormDraft(isManual = false) {
  const formData = new FormData(dom.form);
  const draft = {};
  
  // Extract all standard textual data
  for (let pair of formData.entries()) {
    if (pair[0] !== 'col25_perubahanbatas' && !pair[0].endsWith('_sig')) {
      draft[pair[0]] = pair[1];
    }
  }

  // Save changes border radio
  const batasRadio = document.querySelector('input[name="col25_perubahanbatas"]:checked');
  if (batasRadio) {
    draft['col25_perubahanbatas'] = batasRadio.value;
  }

  // Save signatures if drawn
  if (!isCanvasBlank(dom.canvasOfficer)) {
    draft['officer_sig'] = dom.canvasOfficer.toDataURL();
  }
  if (!isCanvasBlank(dom.canvasSupervisor)) {
    draft['supervisor_sig'] = dom.canvasSupervisor.toDataURL();
  }

  localStorage.setItem('psls_form_draft', JSON.stringify({
    data: draft,
    restoredId: appState.restoredId,
    timestamp: Date.now()
  }));

  if (isManual) {
    showToast('Progres pengisian berhasil disimpan sebagai draft.', 'success');
  }
}

function loadLocalDraft() {
  const draftStr = localStorage.getItem('psls_form_draft');
  if (!draftStr) return;

  try {
    const draft = JSON.parse(draftStr);
    const data = draft.data;
    
    // Fill text inputs
    for (let key in data) {
      if (key !== 'col25_perubahanbatas' && !key.endsWith('_sig')) {
        const input = document.getElementById(key);
        if (input) {
          input.value = data[key];
          // Trigger events
          input.dispatchEvent(new Event('input'));
        }
      }
    }

    // Fill radio buttons
    if (data['col25_perubahanbatas']) {
      const radio = document.querySelector(`input[name="col25_perubahanbatas"][value="${data['col25_perubahanbatas']}"]`);
      if (radio) radio.checked = true;
    }

    // Draw signatures back
    if (data['officer_sig']) {
      drawSignatureFromDataURL(dom.canvasOfficer, data['officer_sig']);
    }
    if (data['supervisor_sig']) {
      drawSignatureFromDataURL(dom.canvasSupervisor, data['supervisor_sig']);
    }

    appState.restoredId = draft.restoredId;
    
    showToast('Draft pengisian sebelumnya berhasil dipulihkan.', 'success');
  } catch (err) {
    console.error('Error loading draft', err);
  }
}

function drawSignatureFromDataURL(canvas, dataURL) {
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  img.src = dataURL;
}

function clearDraft() {
  localStorage.removeItem('psls_form_draft');
  dom.form.reset();
  clearSignatures();
  appState.restoredId = null;
}

/* ==========================================================================
   HISTORY VIEWER & DATABASE INTERACTION (GET, DELETE, IMPORT/EXPORT)
   ========================================================================== */

function initHistoryControls() {
  dom.historySearch.addEventListener('input', renderHistoryList);
  
  dom.btnExportAll.addEventListener('click', exportToCSV);
  
  dom.btnImportTrigger.addEventListener('click', () => dom.importFileInput.click());
  dom.importFileInput.addEventListener('change', importJSON);
}

// Refresh data: Fetch from backend API and combine with unsynced local surveys
async function refreshData() {
  let serverSurveys = [];
  
  if (appState.online) {
    try {
      const response = await fetch(`${API_BASE_URL}/surveys`);
      if (response.ok) {
        serverSurveys = await response.json();
      }
    } catch (err) {
      console.error('Error fetching surveys from server', err);
    }
  }

  const localSurveys = getLocalSurveys();
  
  // Combine databases
  appState.surveys = [...localSurveys, ...serverSurveys];
  
  // Update stats cards in dashboard
  updateStats(localSurveys, serverSurveys);
  
  // Render lists
  renderRecentDrafts();
  renderHistoryList();
}

function updateStats(local, server) {
  const totalInput = appState.surveys.length;
  const draftCount = local.length; // Local unsynced surveys act as local items
  const submittedCount = server.length; // Server-saved items are fully submitted
  
  dom.statsTotal.innerText = totalInput;
  dom.statsDrafts.innerText = draftCount;
  dom.statsSubmitted.innerText = submittedCount;
}

function renderRecentDrafts() {
  const container = dom.recentDraftsContainer;
  container.innerHTML = '';
  
  // Take top 3 recent entries
  const recents = appState.surveys.slice(-3).reverse();
  
  if (recents.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Belum ada data pengisian terbaru.</p></div>';
    return;
  }

  recents.forEach(survey => {
    const item = document.createElement('div');
    item.className = 'survey-card';
    item.innerHTML = `
      <div class="card-header-row">
        <div class="card-title-area">
          <h4>${survey.col22_namasls || survey.col7_namasls || 'SLS Tanpa Nama'}</h4>
          <p>Desa/Kel: ${survey.col12_namadesa || '-'}</p>
        </div>
        <div>
          <span class="badge ${survey.sync_status === 'local' ? 'badge-draft' : 'badge-submitted'}">
            ${survey.sync_status === 'local' ? 'Local Draft' : 'Submitted'}
          </span>
        </div>
      </div>
      <div class="card-info-grid">
        <div class="card-info-item"><span class="lbl">Sebelum</span><span class="val">${survey.col5_kodesls || '-'}</span></div>
        <div class="card-info-item"><span class="lbl">Setelah</span><span class="val">${survey.col13_kodesls || '-'}</span></div>
      </div>
    `;
    container.appendChild(item);
  });
}

function renderHistoryList() {
  const container = dom.historyItemsContainer;
  container.innerHTML = '';
  
  const query = dom.historySearch.value.toLowerCase().trim();
  
  // Filter entries
  const filtered = appState.surveys.filter(survey => {
    const name = (survey.col22_namasls || survey.col7_namasls || '').toLowerCase();
    const desa = (survey.col12_namadesa || '').toLowerCase();
    const ketua = (survey.col23_ketuasls || '').toLowerCase();
    return name.includes(query) || desa.includes(query) || ketua.includes(query);
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Tidak ada data pengisian yang cocok.</p></div>';
    return;
  }

  filtered.reverse().forEach(survey => {
    const isLocal = String(survey.id).startsWith('loc_') || survey.sync_status === 'local';
    
    const card = document.createElement('div');
    card.className = 'survey-card';
    card.innerHTML = `
      <div class="card-header-row">
        <div class="card-title-area">
          <h4>${survey.col22_namasls || survey.col7_namasls || 'SLS Tanpa Nama'}</h4>
          <p>Kecamatan: ${survey.col10_kec || '-'} | Desa: ${survey.col12_namadesa || '-'}</p>
        </div>
        <div>
          <span class="badge ${isLocal ? 'status-draft' : 'status-submitted'}">
            ${isLocal ? 'Lokal' : 'MySQL DB'}
          </span>
        </div>
      </div>
      <div class="card-info-grid">
        <div class="card-info-item"><span class="lbl">Kode SLS</span><span class="val">${survey.col13_kodesls || '-'}</span></div>
        <div class="card-info-item"><span class="lbl">Jumlah KK</span><span class="val">${survey.col16_kk ?? '-'} KK</span></div>
        <div class="card-info-item"><span class="lbl">Muatan Dominan</span><span class="val">${survey.col15_muatandominan || '-'}</span></div>
        <div class="card-info-item"><span class="lbl">Ketua SLS</span><span class="val">${survey.col23_ketuasls || '-'}</span></div>
      </div>
      <div class="card-actions-row">
        <button class="btn btn-secondary btn-small btn-view-detail" data-id="${survey.id}">Tinjau</button>
        <button class="btn btn-danger btn-small btn-delete-survey" data-id="${survey.id}">Hapus</button>
      </div>
    `;

    // Edit/View details binding
    card.querySelector('.btn-view-detail').addEventListener('click', () => viewSurveyDetail(survey));
    card.querySelector('.btn-delete-survey').addEventListener('click', () => deleteSurvey(survey.id));

    container.appendChild(card);
  });
}

function viewSurveyDetail(survey) {
  // Load survey data into wizard inputs
  clearDraft();
  
  for (let key in survey) {
    if (key !== 'col25_perubahanbatas' && !key.endsWith('_sig')) {
      const input = document.getElementById(key);
      if (input) {
        input.value = survey[key];
        input.dispatchEvent(new Event('input'));
      }
    }
  }

  // Radios
  if (survey.col25_perubahanbatas) {
    const radio = document.querySelector(`input[name="col25_perubahanbatas"][value="${survey.col25_perubahanbatas}"]`);
    if (radio) radio.checked = true;
  }

  // Draw signature back
  if (survey.officer_sig) drawSignatureFromDataURL(dom.canvasOfficer, survey.officer_sig);
  if (survey.supervisor_sig) drawSignatureFromDataURL(dom.canvasSupervisor, survey.supervisor_sig);

  appState.restoredId = survey.id;
  appState.currentStep = 5; // Direct to Step 5 (Review step)
  updateWizardUI();
  navigateToView('form-wizard');
}

async function deleteSurvey(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus data pengisian SLS ini secara permanen?')) return;

  const isLocal = String(id).startsWith('loc_');
  
  if (isLocal) {
    const localSurveys = getLocalSurveys();
    const idx = localSurveys.findIndex(s => s.id === id);
    if (idx !== -1) {
      localSurveys.splice(idx, 1);
      saveLocalSurveys(localSurveys);
      showToast('Data draft lokal berhasil dihapus.', 'success');
      refreshData();
      checkUnsyncedData();
    }
  } else {
    if (!appState.online) {
      showToast('Gagal menghapus: Koneksi internet offline.', 'danger');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/surveys/${id}`, { method: 'DELETE' });
      if (response.ok) {
        showToast('Data berhasil dihapus dari database MySQL.', 'success');
        refreshData();
      } else {
        showToast('Gagal menghapus data dari server.', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Terjadi kesalahan saat menghubungi server.', 'danger');
    }
  }
}

// Client-side CSV generation representing Columns 1-25
function exportToCSV() {
  if (appState.surveys.length === 0) {
    showToast('Tidak ada data untuk diekspor.', 'warning');
    return;
  }

  const headers = [
    'ID', 'col1_prov', 'col2_kab', 'col3_kec', 'col4_desa', 'col5_kodesls', 'col6_subsls', 'col7_namasls',
    'col8_prov', 'col9_kab', 'col10_kec', 'col11_desa', 'col12_namadesa', 'col13_kodesls', 'col14_subsls',
    'col15_muatandominan', 'col16_kk', 'col17_btt', 'col18_bbtt', 'col19_bttkosong', 'col20_bku', 'col21_ruta',
    'col22_namasls', 'col23_ketuasls', 'col24_statusperubahan', 'col25_perubahanbatas', 'officer_name', 'officer_date',
    'supervisor_name', 'supervisor_date'
  ];

  let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
  
  appState.surveys.forEach(survey => {
    const row = headers.map(header => {
      let val = survey[header];
      if (val === undefined || val === null) {
        return '';
      }
      val = String(val).replace(/"/g, '""'); // escape quotes
      return `"${val}"`;
    });
    csvContent += row.join(",") + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `se2026_psls_export_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Ekspor data CSV berhasil terunduh.', 'success');
}

// Impor JSON Backup file to fill database/local list
function importJSON(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const surveys = JSON.parse(event.target.result);
      if (!Array.isArray(surveys)) {
        showToast('Berkas JSON tidak valid (harus array).', 'danger');
        return;
      }

      showToast('Mengimpor data...', 'warning');
      
      if (appState.online) {
        // Send batch import to MySQL server DB
        const response = await fetch(`${API_BASE_URL}/surveys/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(surveys)
        });
        
        if (response.ok) {
          showToast('Batch import ke database MySQL sukses!', 'success');
        } else {
          showToast('Server gagal memproses import. Menyimpan cadangan lokal.', 'warning');
          saveImportLocally(surveys);
        }
      } else {
        saveImportLocally(surveys);
      }
      
      refreshData();
    } catch (err) {
      console.error(err);
      showToast('Berkas tidak dapat diurai.', 'danger');
    }
  };
  reader.readAsText(file);
}

function saveImportLocally(surveys) {
  const localSurveys = getLocalSurveys();
  surveys.forEach(survey => {
    survey.id = 'loc_' + Date.now() + Math.random().toString(36).substr(2, 4);
    survey.sync_status = 'local';
    localSurveys.push(survey);
  });
  saveLocalSurveys(localSurveys);
  showToast('Batch import luring disimpan ke memori lokal.', 'success');
  checkUnsyncedData();
}

/* ==========================================================================
   HELP & COLLAPSIBLE SYSTEM LOGIC
   ========================================================================== */

function initHelpSystem() {
  // Inline "?" click listeners
  dom.helpInlineButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const helpKey = btn.getAttribute('data-help');
      const info = HELP_DATABASE[helpKey];
      if (info) {
        dom.helpModalTitle.innerText = info.title;
        dom.helpModalBody.innerHTML = `
          <h5>Penjelasan Kolom</h5>
          <p style="white-space: pre-line; line-height: 1.6; margin-top: 0.5rem;">${info.desc}</p>
        `;
        dom.helpModal.classList.add('active');
      }
    });
  });

  const closeModal = () => dom.helpModal.classList.remove('active');
  dom.btnCloseHelpModal.addEventListener('click', closeModal);
  dom.btnCloseHelpModalOk.addEventListener('click', closeModal);
  
  // Close modal when background clicked
  dom.helpModal.addEventListener('click', (e) => {
    if (e.target === dom.helpModal) closeModal();
  });

  // Guide Tabs Switching in View Bantuan
  dom.guideTabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      
      // Update buttons
      dom.guideTabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update contents
      dom.guideTabContents.forEach(content => {
        if (content.id === tabId) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });
  });
}

/* ==========================================================================
   NOTIFICATION SYSTEM (TOASTS SYSTEM)
   ========================================================================== */

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button class="toast-close">&times;</button>
  `;

  // Bind close action
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.remove();
  });

  dom.toastContainer.appendChild(toast);

  // Auto remove after 4.5 seconds
  setTimeout(() => {
    toast.style.animation = 'fadeIn 0.3s reverse';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}
