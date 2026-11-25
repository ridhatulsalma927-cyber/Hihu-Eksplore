import './styles/main.css';
import { t } from './js/i18n.js';
import {
  getFreshDefaultItinerary,
  loadInitialState,
  resetCatalogSeedData,
  saveEntity,
} from './js/storage.js';
import {
  claimCuratorAccount,
  clearLegacyClientAuthStorage,
  fetchAuthStatus,
  fetchUserSavedData,
  hasAuthToken,
  loginCuratorWithPasscode,
  loginDemoTraveler,
  loginUser,
  logoutUser,
  registerUser,
  saveUserSavedData,
  updateUserProfile,
} from './js/auth-client.js';
import { buildMapsSearchUrl, buildWhatsAppUrl, escapeHtml, generateId } from './js/utils.js';
import { renderCatalogSection } from './js/views/renderCatalog.js';
import { renderCulinaryAndHotelSection } from './js/views/renderCulinaryHotel.js';
import { renderDashboardSection } from './js/views/renderDashboard.js';
import { renderItinerarySection } from './js/views/renderItinerary.js';
import { renderHeaderAndUtility, renderLandingHeroAndTrust } from './js/views/renderLanding.js';
import { renderMapAndPackagesSection } from './js/views/renderMapAndPackages.js';
import { renderActiveModalOrDrawer } from './js/views/renderModals.js';
import {
  clearSearchMarkers,
  focusSearchMarkerById,
  getPersistentMapElement,
  initOrFocusDestinationMap,
  installQuotaDefenseGuards,
  isMapInitialized,
  loadRegionDestinationsOnMap,
  refreshMarkerHighlights,
  searchMuslimFriendlyPlacesOnMap,
  setAcehMapType,
} from './js/map-google.js';

installQuotaDefenseGuards();
clearLegacyClientAuthStorage();

const persisted = loadInitialState();

const state = {
  ...persisted,
  authUser: null,
  ui: {
    mobileMenuOpen: false,
    destFilters: {
      search: '',
      region: 'all',
      category: 'all',
      sort: 'featured',
    },
    culFilters: {
      region: 'all',
      cert: 'all',
    },
    stayFilters: {
      region: 'all',
    },
    map: {
      selectedRegion: 'all',
      selectedDestId: persisted.destinasi[0]?.id || null,
      mapTypeId: 'roadmap',
      status: 'idle',
      searchQuery: '',
      searchResults: [],
      searchAttempted: false,
    },
    gmpQuotaExceeded: false,
    pkgFilters: {
      maxBudget: 3000000,
      duration: 'all',
      interest: 'all',
      region: 'all',
    },
    activeItineraryDay: 1,
    dashboard: {
      activeTab: 'destinasi',
      search: '',
    },
    detailDestId: null,
    favoritesOpen: false,
    waModal: null,
    crudModal: null,
    authModal: null,
    authStatus: {
      adminEnvConfigured: false,
      adminClaimed: false,
    },
    toast: null,
  },
};

void fetchAuthStatus().then((status) => {
  state.ui.authStatus = status;
});

function syncUserStateIfAuthenticated() {
  if (hasAuthToken()) {
    void saveUserSavedData({
      favorit: state.favorit,
      itinerary: state.itinerary,
    });
  }
}

async function hydrateUserDataAfterLogin() {
  const saved = await fetchUserSavedData();
  if (saved && typeof saved === 'object') {
    if (Array.isArray(saved.favorit)) {
      state.favorit = saved.favorit;
    }
    if (saved.itinerary && typeof saved.itinerary === 'object') {
      state.itinerary = saved.itinerary;
      state.ui.activeItineraryDay = 1;
    }
    renderApp();
  } else {
    void saveUserSavedData({
      favorit: state.favorit,
      itinerary: state.itinerary,
    });
  }
}

function openAuthModal(mode = 'login', forceAuthForm = false) {
  state.ui.authModal = {
    mode,
    forceAuthForm,
    showPassword: false,
    errorKey: '',
    prefillEmail: '',
    prefillPassword: '',
  };
  renderApp();
  void fetchAuthStatus().then((status) => {
    state.ui.authStatus = status;
    if (state.ui.authModal) {
      renderApp();
    }
  });
}

function requireCuratorAccess() {
  if (state.authUser?.role === 'Kurator Katalog') {
    return true;
  }
  openAuthModal('curator', true);
  showToast(
    state.config.lang === 'en'
      ? 'Please sign in as a Catalog Curator to edit catalog items.'
      : 'Silakan masuk sebagai Kurator Katalog untuk mengedit data katalog.'
  );
  return false;
}

let toastTimer = null;

function showToast(message) {
  state.ui.toast = message;
  renderToastOnly();
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    state.ui.toast = null;
    renderToastOnly();
  }, 3200);
}

function renderToastOnly() {
  const existing = document.getElementById('toast-region');
  if (!existing) return;
  existing.innerHTML = state.ui.toast
    ? `<div class="toast-banner" role="status">${escapeHtml(state.ui.toast)}</div>`
    : '';
}

function getSelectedMapDestination() {
  const { selectedRegion, selectedDestId } = state.ui.map;
  return (
    state.destinasi.find((d) => d.id === selectedDestId) ||
    state.destinasi.find((d) => selectedRegion === 'all' || d.wilayah === selectedRegion) ||
    state.destinasi[0]
  );
}

function handleMapStatusChange(nextStatus) {
  if (nextStatus === 'quota') {
    state.ui.gmpQuotaExceeded = true;
  }
  if (state.ui.map.status !== nextStatus) {
    state.ui.map.status = nextStatus;
    renderApp();
  }
}

function handleMarkerSelectDestination(destId) {
  const found = state.destinasi.find((d) => d.id === destId);
  if (!found) return;
  state.ui.map.selectedDestId = found.id;
  refreshMarkerHighlights(found.id);
  renderApp();
}

function ensureMapInitializedAndFocused() {
  const selectedDest = getSelectedMapDestination();
  if (!selectedDest) return;
  void initOrFocusDestinationMap({
    destinations: state.destinasi,
    selectedDest,
    selectedRegion: state.ui.map.selectedRegion,
    lang: state.config.lang,
    mapTypeId: state.ui.map.mapTypeId,
    onSelectDest: handleMarkerSelectDestination,
    onStatusChange: handleMapStatusChange,
  });
}

let mapSectionObserver = null;

function setupMapViewportObserver() {
  if (mapSectionObserver) {
    mapSectionObserver.disconnect();
    mapSectionObserver = null;
  }

  const sectionEl = document.getElementById('peta-paket');
  if (!sectionEl || isMapInitialized() || state.ui.map.status === 'loading') return;

  if (typeof IntersectionObserver === 'undefined') {
    ensureMapInitializedAndFocused();
    return;
  }

  mapSectionObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        if (mapSectionObserver) {
          mapSectionObserver.disconnect();
          mapSectionObserver = null;
        }
        ensureMapInitializedAndFocused();
      }
    },
    { rootMargin: '250px 0px' }
  );
  mapSectionObserver.observe(sectionEl);
}

function renderQuotaBannerMarkup() {
  if (!state.ui.gmpQuotaExceeded) return '';
  return `
    <div class="gmp-quota-banner" role="alert">
      <span>
        Google Maps Platform quota reached. If you are the app owner, visit
        <a
          href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
          target="_blank"
          rel="noopener noreferrer"
        >maps developer site</a>
        for instructions to update your account.
      </span>
    </div>
  `;
}

function renderApp() {
  const root = document.getElementById('app');
  if (!root) return;

  // Preserve the live Google Maps DOM container across innerHTML updates
  const mapEl = getPersistentMapElement();
  if (mapEl.parentNode) {
    mapEl.parentNode.removeChild(mapEl);
  }

  // Preserve active input focus and caret across DOM re-render
  const activeEl = document.activeElement;
  let focusSelector = null;
  let selStart = null;
  let selEnd = null;
  if (activeEl && root.contains(activeEl) && activeEl.dataset?.action) {
    const action = activeEl.dataset.action;
    const field = activeEl.dataset.field || '';
    focusSelector = field
      ? `[data-action="${action}"][data-field="${field}"]`
      : `[data-action="${action}"]`;
    if (typeof activeEl.selectionStart === 'number') {
      selStart = activeEl.selectionStart;
      selEnd = activeEl.selectionEnd;
    }
  }

  document.documentElement.lang = state.config.lang === 'en' ? 'en' : 'id';

  root.innerHTML = `
    ${renderQuotaBannerMarkup()}
    ${renderHeaderAndUtility(state)}
    <main>
      ${renderLandingHeroAndTrust(state)}
      ${renderCatalogSection(state)}
      ${renderCulinaryAndHotelSection(state)}
      ${renderMapAndPackagesSection(state)}
      ${renderItinerarySection(state)}
      ${renderDashboardSection(state)}
    </main>
    <footer class="site-footer">
      <div class="container footer-inner">
        <span class="footer-brand">${escapeHtml(t('brand', state.config.lang))}</span>
        <p class="footer-copy">${escapeHtml(t('footerText', state.config.lang))}</p>
      </div>
    </footer>
    ${renderActiveModalOrDrawer(state)}
    <div id="toast-region" class="toast-region" aria-live="polite">
      ${state.ui.toast ? `<div class="toast-banner" role="status">${escapeHtml(state.ui.toast)}</div>` : ''}
    </div>
  `;

  const mapSlot = document.getElementById('google-map-slot');
  if (mapSlot) {
    mapSlot.appendChild(mapEl);
  }
  setupMapViewportObserver();

  if (focusSelector) {
    const restored = root.querySelector(focusSelector);
    if (restored) {
      restored.focus({ preventScroll: true });
      if (selStart !== null && typeof restored.setSelectionRange === 'function') {
        try {
          restored.setSelectionRange(selStart, selEnd);
        } catch {
          // Input type like date/number does not support setSelectionRange
        }
      }
    }
  }
}

function toggleFavorite(itemId, tipeItem) {
  const existingIndex = state.favorit.findIndex(
    (f) => f.itemId === itemId && f.tipeItem === tipeItem
  );
  if (existingIndex >= 0) {
    state.favorit.splice(existingIndex, 1);
    showToast(state.config.lang === 'en' ? 'Removed from favorites.' : 'Dihapus dari favorit.');
  } else {
    state.favorit.unshift({
      id: generateId('fav'),
      itemId,
      tipeItem,
      tanggalDitambahkan: new Date().toISOString().slice(0, 10),
    });
    showToast(state.config.lang === 'en' ? 'Saved to favorites.' : 'Disimpan ke daftar favorit.');
  }
  saveEntity('favorit', state.favorit);
  syncUserStateIfAuthenticated();
  renderApp();
}

function addDestinationToItinerary(destId, customDay = null, customTime = '10:00') {
  const dest = state.destinasi.find((d) => d.id === destId);
  if (!dest) return;
  const targetDay = customDay || state.ui.activeItineraryDay || 1;
  const title = state.config.lang === 'en' && dest.namaEn ? dest.namaEn : dest.nama;

  state.itinerary.daftarAktivitas.push({
    id: generateId('act'),
    hari: targetDay,
    itemId: dest.id,
    tipe: 'destinasi',
    judul: title,
    wilayah: dest.wilayah,
    estimasiBiaya: Number(dest.estimasiBiaya) || 0,
    waktu: customTime,
  });
  saveEntity('itinerary', state.itinerary);
  syncUserStateIfAuthenticated();
  state.ui.activeItineraryDay = targetDay;
  renderApp();
  showToast(
    state.config.lang === 'en'
      ? `Added "${title}" to Day ${targetDay}.`
      : `"${title}" ditambahkan ke Hari ${targetDay}.`
  );
}

function loadPackageIntoItinerary(pkgId) {
  const pkg = state.paketWisata.find((p) => p.id === pkgId);
  if (!pkg) return;

  const days = Math.max(1, Math.min(5, Number(pkg.durasi) || 2));
  const destIds = Array.isArray(pkg.daftarDestinasi) ? pkg.daftarDestinasi : [];
  const activities = [];

  destIds.forEach((dId, idx) => {
    const dest = state.destinasi.find((d) => d.id === dId);
    if (!dest) return;
    const assignedDay = (idx % days) + 1;
    const hour = 9 + Math.floor(idx / days) * 3;
    activities.push({
      id: generateId('act'),
      hari: assignedDay,
      itemId: dest.id,
      tipe: 'destinasi',
      judul: state.config.lang === 'en' && dest.namaEn ? dest.namaEn : dest.nama,
      wilayah: dest.wilayah,
      estimasiBiaya: Number(dest.estimasiBiaya) || 0,
      waktu: `${String(hour).padStart(2, '0')}:00`,
    });
  });

  const matchingStay = state.akomodasi.find((a) => a.wilayah === pkg.wilayahUtama) || state.akomodasi[0];

  state.itinerary = {
    ...state.itinerary,
    namaPerjalanan: state.config.lang === 'en' && pkg.namaEn ? pkg.namaEn : pkg.nama,
    jumlahHari: days,
    akomodasiId: matchingStay ? matchingStay.id : '',
    daftarAktivitas: activities,
  };
  state.ui.activeItineraryDay = 1;
  saveEntity('itinerary', state.itinerary);
  syncUserStateIfAuthenticated();
  renderApp();

  const itinSection = document.getElementById('itinerary');
  if (itinSection) itinSection.scrollIntoView({ behavior: 'smooth' });

  showToast(
    state.config.lang === 'en'
      ? 'Tour package loaded into your Itinerary Planner.'
      : 'Paket wisata dimuat ke Itinerary Planner.'
  );
}

function exportItineraryJson() {
  const blob = new Blob([JSON.stringify(state.itinerary, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'hihu-eksplor-itinerary.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast(state.config.lang === 'en' ? 'Itinerary JSON downloaded.' : 'Ringkasan JSON berhasil diunduh.');
}

function handleCrudSubmit(form) {
  if (!requireCuratorAccess()) return;
  const entity = form.dataset.entity;
  const id = form.dataset.id;
  const fd = new FormData(form);
  const splitCsv = (val) =>
    String(val || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  if (entity === 'destinasi') {
    const nama = String(fd.get('nama') || '').trim();
    if (!nama) return;
    const payload = {
      id: id || generateId('dest'),
      nama,
      namaEn: String(fd.get('namaEn') || '').trim() || nama,
      wilayah: String(fd.get('wilayah') || 'Banda Aceh'),
      kategori: String(fd.get('kategori') || 'Religi'),
      estimasiBiaya: Math.max(0, Number(fd.get('estimasiBiaya')) || 0),
      imageUrl: String(fd.get('imageUrl') || '/src/assets/images/dest_mosque_aceh_1795590639134.jpg'),
      alamat: String(fd.get('alamat') || '').trim(),
      mapsUrl: buildMapsSearchUrl(`${nama} ${fd.get('wilayah')} Aceh`),
      deskripsi: String(fd.get('deskripsi') || '').trim(),
      deskripsiEn: String(fd.get('deskripsi') || '').trim(),
      fasilitasIbadah: splitCsv(fd.get('fasilitasIbadah')),
      fasilitas: splitCsv(fd.get('fasilitas')),
      statusVerifikasi: String(fd.get('statusVerifikasi') || 'Input Demo Lokal'),
      unggulan: fd.get('unggulan') === 'on',
      koordinatPeta: { x: 205, y: 185 },
    };

    if (id) {
      const idx = state.destinasi.findIndex((d) => d.id === id);
      if (idx >= 0) {
        payload.koordinatPeta = state.destinasi[idx].koordinatPeta || payload.koordinatPeta;
        state.destinasi[idx] = { ...state.destinasi[idx], ...payload };
      }
    } else {
      state.destinasi.unshift(payload);
    }
    saveEntity('destinasi', state.destinasi);
  } else if (entity === 'kuliner') {
    const nama = String(fd.get('nama') || '').trim();
    if (!nama) return;
    const payload = {
      id: id || generateId('kul'),
      nama,
      namaEn: nama,
      kategori: String(fd.get('kategori') || 'Kuliner Berat').trim(),
      wilayah: String(fd.get('wilayah') || 'Banda Aceh'),
      harga: Math.max(0, Number(fd.get('harga')) || 0),
      statusSertifikasiHalal: String(fd.get('statusSertifikasiHalal') || 'Klaim Mandiri Pelaku Usaha'),
      sumberVerifikasi: String(fd.get('sumberVerifikasi') || '').trim(),
      kontak: String(fd.get('kontak') || '6281200010999').replace(/\D/g, ''),
      imageUrl: String(fd.get('imageUrl') || '/src/assets/images/cul_mie_aceh_1795590641312.jpg'),
      deskripsi: String(fd.get('deskripsi') || '').trim(),
      deskripsiEn: String(fd.get('deskripsi') || '').trim(),
    };
    if (id) {
      const idx = state.kuliner.findIndex((k) => k.id === id);
      if (idx >= 0) state.kuliner[idx] = { ...state.kuliner[idx], ...payload };
    } else {
      state.kuliner.unshift(payload);
    }
    saveEntity('kuliner', state.kuliner);
  } else if (entity === 'akomodasi') {
    const nama = String(fd.get('nama') || '').trim();
    if (!nama) return;
    const payload = {
      id: id || generateId('ako'),
      nama,
      wilayah: String(fd.get('wilayah') || 'Banda Aceh'),
      hargaPerMalam: Math.max(0, Number(fd.get('hargaPerMalam')) || 0),
      fasilitasRamahMuslim: splitCsv(fd.get('fasilitasRamahMuslim')),
      fasilitas: splitCsv(fd.get('fasilitas')),
      statusSertifikasiHalal: String(fd.get('statusSertifikasiHalal') || '').trim(),
      kontak: String(fd.get('kontak') || '6281300020999').replace(/\D/g, ''),
      imageUrl: '/src/assets/images/stay_syariah_hotel_1795590642816.jpg',
      deskripsi: String(fd.get('deskripsi') || '').trim(),
      deskripsiEn: String(fd.get('deskripsi') || '').trim(),
    };
    if (id) {
      const idx = state.akomodasi.findIndex((a) => a.id === id);
      if (idx >= 0) state.akomodasi[idx] = { ...state.akomodasi[idx], ...payload };
    } else {
      state.akomodasi.unshift(payload);
    }
    saveEntity('akomodasi', state.akomodasi);
  } else if (entity === 'paket') {
    const nama = String(fd.get('nama') || '').trim();
    if (!nama) return;
    const payload = {
      id: id || generateId('pak'),
      nama,
      namaEn: nama,
      durasi: Math.max(1, Math.min(5, Number(fd.get('durasi')) || 2)),
      estimasiBiaya: Math.max(0, Number(fd.get('estimasiBiaya')) || 0),
      wilayahUtama: String(fd.get('wilayahUtama') || 'Banda Aceh'),
      minat: splitCsv(fd.get('minat')),
      daftarDestinasi: splitCsv(fd.get('daftarDestinasi')),
      deskripsi: String(fd.get('deskripsi') || '').trim(),
      deskripsiEn: String(fd.get('deskripsi') || '').trim(),
    };
    if (id) {
      const idx = state.paketWisata.findIndex((p) => p.id === id);
      if (idx >= 0) state.paketWisata[idx] = { ...state.paketWisata[idx], ...payload };
    } else {
      state.paketWisata.unshift(payload);
    }
    saveEntity('paketWisata', state.paketWisata);
  }

  state.ui.crudModal = null;
  renderApp();
  showToast(state.config.lang === 'en' ? 'Catalog record saved.' : 'Data berhasil disimpan ke localStorage.');
}

function attachGlobalListeners() {
  const root = document.getElementById('app');
  if (!root) return;

  root.addEventListener('click', (e) => {
    const actionEl = e.target.closest('[data-action]');
    if (!actionEl) {
      const navEl = e.target.closest('[data-nav]');
      if (navEl) {
        if (navEl.dataset.nav === 'peta-paket') {
          ensureMapInitializedAndFocused();
        }
        if (state.ui.mobileMenuOpen) {
          state.ui.mobileMenuOpen = false;
          renderApp();
        }
      }
      return;
    }

    const action = actionEl.dataset.action;

    if (action === 'close-modals') {
      if (e.target === actionEl || actionEl.classList.contains('modal-close-btn') || actionEl.closest('.modal-footer')) {
        state.ui.detailDestId = null;
        state.ui.favoritesOpen = false;
        state.ui.waModal = null;
        state.ui.crudModal = null;
        state.ui.authModal = null;
        renderApp();
      }
      return;
    }

    if (action === 'toggle-mobile-menu') {
      state.ui.mobileMenuOpen = !state.ui.mobileMenuOpen;
      renderApp();
    } else if (action === 'set-lang') {
      state.config.lang = actionEl.dataset.lang === 'en' ? 'en' : 'id';
      saveEntity('config', state.config);
      renderApp();
    } else if (action === 'open-auth-modal') {
      openAuthModal('login', false);
    } else if (action === 'open-curator-modal') {
      openAuthModal('curator', true);
    } else if (action === 'switch-to-auth-form') {
      openAuthModal('login', true);
    } else if (action === 'switch-auth-mode') {
      const nextMode = ['login', 'register', 'curator'].includes(actionEl.dataset.mode)
        ? actionEl.dataset.mode
        : 'login';
      state.ui.authModal = {
        mode: nextMode,
        forceAuthForm: true,
        showPassword: false,
        errorKey: '',
        prefillEmail: '',
        prefillPassword: '',
      };
      renderApp();
    } else if (action === 'toggle-auth-password') {
      if (state.ui.authModal) {
        state.ui.authModal.showPassword = !state.ui.authModal.showPassword;
        renderApp();
      }
    } else if (action === 'fill-demo-login') {
      state.ui.authModal = {
        mode: 'login',
        forceAuthForm: true,
        showPassword: false,
        errorKey: '',
        prefillEmail: actionEl.dataset.email || '',
        prefillPassword: actionEl.dataset.passcode || '',
      };
      renderApp();
    } else if (action === 'quick-demo-login') {
      void loginDemoTraveler().then(async (res) => {
        if (res.ok) {
          state.authUser = res.user;
          state.ui.authModal = null;
          renderApp();
          await hydrateUserDataAfterLogin();
          showToast(
            state.config.lang === 'en'
              ? `Signed in as ${res.user.name}.`
              : `Masuk sebagai ${res.user.name}.`
          );
        } else if (state.ui.authModal) {
          state.ui.authModal.errorKey = 'authErrNetwork';
          renderApp();
        }
      });
    } else if (action === 'logout-user') {
      void logoutUser().then(() => {
        const guest = loadInitialState();
        state.authUser = null;
        state.ui.authModal = null;
        state.favorit = guest.favorit;
        state.itinerary = guest.itinerary;
        state.ui.activeItineraryDay = 1;
        renderApp();
        showToast(state.config.lang === 'en' ? 'Signed out.' : 'Anda telah keluar dari akun.');
      });
    } else if (action === 'open-favorites') {
      state.ui.favoritesOpen = true;
      renderApp();
    } else if (action === 'toggle-favorite') {
      toggleFavorite(actionEl.dataset.id, actionEl.dataset.type);
    } else if (action === 'remove-favorite') {
      state.favorit = state.favorit.filter((f) => f.id !== actionEl.dataset.favId);
      saveEntity('favorit', state.favorit);
      syncUserStateIfAuthenticated();
      renderApp();
    } else if (action === 'filter-dest-region') {
      state.ui.destFilters.region = actionEl.dataset.value;
      renderApp();
    } else if (action === 'filter-dest-category') {
      state.ui.destFilters.category = actionEl.dataset.value;
      renderApp();
    } else if (action === 'reset-dest-filters') {
      state.ui.destFilters = { search: '', region: 'all', category: 'all', sort: 'featured' };
      renderApp();
    } else if (action === 'open-dest-detail') {
      state.ui.detailDestId = actionEl.dataset.id;
      renderApp();
    } else if (action === 'quick-add-itinerary') {
      addDestinationToItinerary(actionEl.dataset.id);
    } else if (action === 'filter-cul-region') {
      state.ui.culFilters.region = actionEl.dataset.value;
      renderApp();
    } else if (action === 'filter-cul-cert') {
      state.ui.culFilters.cert = actionEl.dataset.value;
      renderApp();
    } else if (action === 'filter-stay-region') {
      state.ui.stayFilters.region = actionEl.dataset.value;
      renderApp();
    } else if (action === 'select-map-region') {
      const region = actionEl.dataset.value;
      state.ui.map.selectedRegion = region;
      if (region !== 'all') {
        const first = state.destinasi.find((d) => d.wilayah === region);
        if (first) state.ui.map.selectedDestId = first.id;
      }
      renderApp();
      ensureMapInitializedAndFocused();
    } else if (action === 'select-map-dest') {
      state.ui.map.selectedDestId = actionEl.dataset.id;
      renderApp();
      ensureMapInitializedAndFocused();
    } else if (action === 'set-map-type') {
      const mode = actionEl.dataset.value || 'roadmap';
      state.ui.map.mapTypeId = mode;
      setAcehMapType(mode);
      renderApp();
    } else if (action === 'load-region-pins') {
      void loadRegionDestinationsOnMap({
        destinations: state.destinasi,
        selectedRegion: state.ui.map.selectedRegion,
        selectedDestId: state.ui.map.selectedDestId,
        lang: state.config.lang,
        onSelectDest: handleMarkerSelectDestination,
        onStatusChange: handleMapStatusChange,
      });
    } else if (action === 'clear-map-search') {
      clearSearchMarkers();
      state.ui.map.searchQuery = '';
      state.ui.map.searchResults = [];
      state.ui.map.searchAttempted = false;
      renderApp();
    } else if (action === 'focus-search-place') {
      focusSearchMarkerById(actionEl.dataset.placeId, state.config.lang);
    } else if (action === 'load-package-itinerary') {
      loadPackageIntoItinerary(actionEl.dataset.id);
    } else if (action === 'open-wa-demo') {
      state.ui.waModal = {
        name: actionEl.dataset.name,
        phone: actionEl.dataset.phone,
        kind: actionEl.dataset.kind,
      };
      renderApp();
    } else if (action === 'select-itin-day') {
      state.ui.activeItineraryDay = Number(actionEl.dataset.day) || 1;
      renderApp();
    } else if (action === 'remove-itin-activity') {
      state.itinerary.daftarAktivitas = state.itinerary.daftarAktivitas.filter(
        (a) => a.id !== actionEl.dataset.id
      );
      saveEntity('itinerary', state.itinerary);
      syncUserStateIfAuthenticated();
      renderApp();
    } else if (action === 'export-itinerary-json') {
      exportItineraryJson();
    } else if (action === 'print-itinerary') {
      window.print();
    } else if (action === 'reset-itinerary') {
      state.itinerary = getFreshDefaultItinerary();
      state.ui.activeItineraryDay = 1;
      syncUserStateIfAuthenticated();
      renderApp();
      showToast(state.config.lang === 'en' ? 'Default itinerary restored.' : 'Rencana perjalanan default dipulihkan.');
    } else if (action === 'switch-dash-tab') {
      state.ui.dashboard.activeTab = actionEl.dataset.tab;
      state.ui.dashboard.search = '';
      renderApp();
    } else if (action === 'open-crud-modal') {
      if (!requireCuratorAccess()) return;
      state.ui.crudModal = {
        entity: actionEl.dataset.entity,
        id: actionEl.dataset.id || null,
      };
      renderApp();
    } else if (action === 'delete-crud-item') {
      if (!requireCuratorAccess()) return;
      const entity = actionEl.dataset.entity;
      const id = actionEl.dataset.id;
      if (entity === 'destinasi') {
        state.destinasi = state.destinasi.filter((d) => d.id !== id);
        saveEntity('destinasi', state.destinasi);
      } else if (entity === 'kuliner') {
        state.kuliner = state.kuliner.filter((k) => k.id !== id);
        saveEntity('kuliner', state.kuliner);
      } else if (entity === 'akomodasi') {
        state.akomodasi = state.akomodasi.filter((a) => a.id !== id);
        saveEntity('akomodasi', state.akomodasi);
      } else if (entity === 'paket') {
        state.paketWisata = state.paketWisata.filter((p) => p.id !== id);
        saveEntity('paketWisata', state.paketWisata);
      }
      renderApp();
      showToast(state.config.lang === 'en' ? 'Record deleted.' : 'Data berhasil dihapus.');
    } else if (action === 'reset-seed-data') {
      if (!requireCuratorAccess()) return;
      const fresh = resetCatalogSeedData();
      state.destinasi = fresh.destinasi;
      state.kuliner = fresh.kuliner;
      state.akomodasi = fresh.akomodasi;
      state.paketWisata = fresh.paketWisata;
      renderApp();
      showToast(state.config.lang === 'en' ? 'Seed catalog restored.' : 'Seluruh data katalog awal berhasil dipulihkan.');
    }
  });

  root.addEventListener('input', (e) => {
    const target = e.target;
    if (target.id === 'wa-preview-msg' && state.ui.waModal) {
      const link = document.getElementById('wa-direct-link');
      if (link) {
        link.href = buildWhatsAppUrl(state.ui.waModal.phone, target.value);
      }
      return;
    }

    const action = target.dataset?.action;
    if (!action) return;

    if (action === 'search-dest') {
      state.ui.destFilters.search = target.value;
      renderApp();
    } else if (action === 'search-dash') {
      state.ui.dashboard.search = target.value;
      renderApp();
    } else if (action === 'pkg-filter-budget') {
      state.ui.pkgFilters.maxBudget = Math.max(0, Number(target.value) || 0);
      renderApp();
    } else if (action === 'itin-update-field') {
      const field = target.dataset.field;
      if (!field) return;
      if (field === 'jumlahHari') {
        state.itinerary[field] = Math.max(1, Math.min(5, Number(target.value) || 1));
        state.ui.activeItineraryDay = Math.min(state.ui.activeItineraryDay, state.itinerary.jumlahHari);
      } else if (
        field === 'jumlahWisatawan' ||
        field === 'estimasiKonsumsiHarian' ||
        field === 'estimasiTransport'
      ) {
        state.itinerary[field] = Math.max(0, Number(target.value) || 0);
      } else {
        state.itinerary[field] = target.value;
      }
      saveEntity('itinerary', state.itinerary);
      syncUserStateIfAuthenticated();
      renderApp();
    }
  });

  root.addEventListener('change', (e) => {
    const target = e.target;
    const action = target.dataset?.action;
    if (!action) return;

    if (action === 'sort-dest') {
      state.ui.destFilters.sort = target.value;
      renderApp();
    } else if (action === 'pkg-filter-duration') {
      state.ui.pkgFilters.duration = target.value;
      renderApp();
    } else if (action === 'pkg-filter-interest') {
      state.ui.pkgFilters.interest = target.value;
      renderApp();
    } else if (action === 'pkg-filter-region') {
      state.ui.pkgFilters.region = target.value;
      renderApp();
    } else if (action === 'itin-update-field') {
      const field = target.dataset.field;
      if (!field) return;
      if (field === 'jumlahHari') {
        state.itinerary[field] = Math.max(1, Math.min(5, Number(target.value) || 1));
        state.ui.activeItineraryDay = Math.min(state.ui.activeItineraryDay, state.itinerary.jumlahHari);
      } else {
        state.itinerary[field] = target.value;
      }
      saveEntity('itinerary', state.itinerary);
      syncUserStateIfAuthenticated();
      renderApp();
    }
  });

  root.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    const action = form.dataset?.action;

    if (action === 'itin-add-catalog-activity') {
      const fd = new FormData(form);
      addDestinationToItinerary(
        String(fd.get('destId') || ''),
        state.ui.activeItineraryDay,
        String(fd.get('waktu') || '10:00')
      );
    } else if (action === 'itin-add-custom-activity') {
      const fd = new FormData(form);
      const judul = String(fd.get('judul') || '').trim();
      if (!judul) return;
      state.itinerary.daftarAktivitas.push({
        id: generateId('act'),
        hari: state.ui.activeItineraryDay,
        itemId: null,
        tipe: 'kustom',
        judul,
        wilayah: 'Aceh',
        estimasiBiaya: Math.max(0, Number(fd.get('estimasiBiaya')) || 0),
        waktu: String(fd.get('waktu') || '14:00'),
      });
      saveEntity('itinerary', state.itinerary);
      syncUserStateIfAuthenticated();
      renderApp();
      showToast(state.config.lang === 'en' ? 'Custom activity added.' : 'Aktivitas mandiri ditambahkan.');
    } else if (action === 'search-map-places') {
      const fd = new FormData(form);
      const query = String(fd.get('query') || '').trim();
      state.ui.map.searchQuery = query;
      if (!query) return;
      state.ui.map.searchAttempted = true;
      void searchMuslimFriendlyPlacesOnMap({
        query,
        lang: state.config.lang,
        onStatusChange: handleMapStatusChange,
      }).then((results) => {
        state.ui.map.searchResults = results;
        renderApp();
      });
    } else if (action === 'submit-crud-form') {
      handleCrudSubmit(form);
    } else if (action === 'submit-user-login') {
      const fd = new FormData(form);
      const email = String(fd.get('email') || '').trim();
      const password = String(fd.get('password') || '');
      void loginUser(email, password).then(async (res) => {
        if (res.ok) {
          state.authUser = res.user;
          state.ui.authModal = null;
          renderApp();
          await hydrateUserDataAfterLogin();
          showToast(
            state.config.lang === 'en'
              ? `Signed in as ${res.user.name}.`
              : `Masuk sebagai ${res.user.name}.`
          );
        } else {
          const errKey =
            res.errorCode === 'EMPTY_FIELDS'
              ? 'authErrEmpty'
              : res.errorCode === 'NETWORK_ERROR'
                ? 'authErrNetwork'
                : 'authErrInvalid';
          state.ui.authModal = {
            mode: 'login',
            forceAuthForm: true,
            showPassword: false,
            errorKey: errKey,
            prefillEmail: email,
            prefillPassword: '',
          };
          renderApp();
        }
      });
    } else if (action === 'submit-user-register') {
      const fd = new FormData(form);
      const name = String(fd.get('name') || '').trim();
      const email = String(fd.get('email') || '').trim();
      const password = String(fd.get('password') || '');
      void registerUser({ name, email, password }).then(async (res) => {
        if (res.ok) {
          state.authUser = res.user;
          state.ui.authModal = null;
          renderApp();
          await hydrateUserDataAfterLogin();
          showToast(
            state.config.lang === 'en'
              ? `Account created and signed in as ${res.user.name}.`
              : `Akun berhasil dibuat dan masuk sebagai ${res.user.name}.`
          );
        } else {
          const errKey =
            res.errorCode === 'EMAIL_EXISTS'
              ? 'authErrExists'
              : res.errorCode === 'NETWORK_ERROR'
                ? 'authErrNetwork'
                : 'authErrInput';
          state.ui.authModal = {
            mode: 'register',
            forceAuthForm: true,
            showPassword: false,
            errorKey: errKey,
            prefillEmail: '',
            prefillPassword: '',
          };
          renderApp();
        }
      });
    } else if (action === 'submit-claim-curator') {
      const fd = new FormData(form);
      const name = String(fd.get('name') || '').trim();
      const email = String(fd.get('email') || '').trim();
      const password = String(fd.get('password') || '');
      void claimCuratorAccount({ name, email, password }).then(async (res) => {
        if (res.ok) {
          state.authUser = res.user;
          state.ui.authStatus = {
            adminEnvConfigured: res.adminEnvConfigured,
            adminClaimed: res.adminClaimed,
          };
          state.ui.authModal = null;
          renderApp();
          await hydrateUserDataAfterLogin();
          showToast(
            state.config.lang === 'en'
              ? `Curator account claimed and signed in as ${res.user.name}.`
              : `Akun Kurator berhasil diklaim dan masuk sebagai ${res.user.name}.`
          );
        } else {
          const errKey =
            res.errorCode === 'ADMIN_ALREADY_CONFIGURED'
              ? 'authErrClaimLocked'
              : res.errorCode === 'EMAIL_EXISTS'
                ? 'authErrExists'
                : res.errorCode === 'NETWORK_ERROR'
                  ? 'authErrNetwork'
                  : 'authErrInput';
          state.ui.authModal = {
            mode: 'curator',
            forceAuthForm: true,
            showPassword: false,
            errorKey: errKey,
            prefillEmail: '',
            prefillPassword: '',
          };
          renderApp();
        }
      });
    } else if (action === 'submit-curator-passcode') {
      const fd = new FormData(form);
      const passcode = String(fd.get('passcode') || '');
      void loginCuratorWithPasscode(passcode).then(async (res) => {
        if (res.ok) {
          state.authUser = res.user;
          state.ui.authModal = null;
          renderApp();
          await hydrateUserDataAfterLogin();
          showToast(
            state.config.lang === 'en'
              ? 'Signed in as Catalog Curator.'
              : 'Berhasil masuk sebagai Kurator Katalog.'
          );
        } else {
          state.ui.authModal = {
            mode: 'curator',
            forceAuthForm: true,
            showPassword: false,
            errorKey: res.errorCode === 'NETWORK_ERROR' ? 'authErrNetwork' : 'authErrInvalid',
            prefillEmail: '',
            prefillPassword: '',
          };
          renderApp();
        }
      });
    } else if (action === 'submit-profile-update') {
      const fd = new FormData(form);
      const name = String(fd.get('name') || '').trim();
      void updateUserProfile(name).then((res) => {
        if (res.ok) {
          state.authUser = res.user;
          state.ui.authModal = null;
          renderApp();
          showToast(
            state.config.lang === 'en' ? 'Profile name updated.' : 'Nama profil berhasil diperbarui.'
          );
        } else if (state.ui.authModal) {
          state.ui.authModal.errorKey = 'authErrInput';
          renderApp();
        }
      });
    }
  });

  window.addEventListener('gmp-quota-exceeded', () => {
    if (!state.ui.gmpQuotaExceeded) {
      state.ui.gmpQuotaExceeded = true;
      state.ui.map.status = 'quota';
      renderApp();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (
        state.ui.detailDestId ||
        state.ui.favoritesOpen ||
        state.ui.waModal ||
        state.ui.crudModal ||
        state.ui.authModal
      ) {
        state.ui.detailDestId = null;
        state.ui.favoritesOpen = false;
        state.ui.waModal = null;
        state.ui.crudModal = null;
        state.ui.authModal = null;
        renderApp();
      }
    }
  });
}

renderApp();
attachGlobalListeners();
setupMapViewportObserver();
