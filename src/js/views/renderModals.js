import { getDemoTravelerHint } from '../auth-client.js';
import { CATEGORIES, HALAL_STATUSES, REGIONS } from '../data.js';
import { t, translateCategory } from '../i18n.js';
import {
  buildMapsSearchUrl,
  buildWhatsAppUrl,
  escapeHtml,
  formatRupiah,
  formatRupiahNumeric,
} from '../utils.js';

export function renderActiveModalOrDrawer(state) {
  const { lang } = state.config;
  const { detailDestId, favoritesOpen, waModal, crudModal, authModal } = state.ui;

  if (detailDestId) {
    const dest = state.destinasi.find((d) => d.id === detailDestId);
    if (!dest) return '';
    const title = lang === 'en' && dest.namaEn ? dest.namaEn : dest.nama;
    const desc = lang === 'en' && dest.deskripsiEn ? dest.deskripsiEn : dest.deskripsi;
    const isFav = state.favorit.some((f) => f.itemId === dest.id && f.tipeItem === 'destinasi');
    const mapsLink = dest.mapsUrl || buildMapsSearchUrl(`${dest.nama} ${dest.wilayah} Aceh`);

    return `
      <div class="modal-backdrop" data-action="close-modals">
        <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-dest-title">
          <div class="modal-header">
            <div>
              <div class="card-meta-line">
                <span>${escapeHtml(dest.wilayah)}</span>
                <span aria-hidden="true">·</span>
                <span>${escapeHtml(translateCategory(dest.kategori, lang))}</span>
              </div>
              <h3 id="modal-dest-title" class="modal-title">${escapeHtml(title)}</h3>
            </div>
            <button type="button" class="modal-close-btn" data-action="close-modals" aria-label="Close">✕</button>
          </div>

          <div class="modal-body">
            <div class="modal-hero-img img-fallback-frame">
              <img src="${escapeHtml(dest.imageUrl || '/src/assets/images/dest_mosque_aceh_1795590639134.jpg')}" alt="${escapeHtml(title)}" referrerpolicy="no-referrer" />
            </div>

            <p class="modal-lead">${escapeHtml(desc)}</p>

            <dl class="modal-spec-grid">
              <div>
                <dt>${lang === 'en' ? 'Address' : 'Alamat Lokasi'}</dt>
                <dd>${escapeHtml(dest.alamat)}</dd>
              </div>
              <div>
                <dt>${lang === 'en' ? 'Estimated Cost (Simulation)' : 'Estimasi Biaya (Simulasi)'}</dt>
                <dd class="mono-num">${escapeHtml(formatRupiah(dest.estimasiBiaya, lang))}</dd>
              </div>
              <div>
                <dt>${lang === 'en' ? 'Information Verification' : 'Status Verifikasi Informasi'}</dt>
                <dd>${escapeHtml(dest.statusVerifikasi)}</dd>
              </div>
            </dl>

            <div class="modal-two-col">
              <div class="modal-box">
                <h4>${lang === 'en' ? 'Prayer & Muslim-Friendly Facilities' : 'Fasilitas Ibadah & Ramah Muslim'}</h4>
                <ul class="clean-list">
                  ${(dest.fasilitasIbadah || []).map((f) => `<li>${escapeHtml(f)}</li>`).join('')}
                </ul>
              </div>
              <div class="modal-box">
                <h4>${lang === 'en' ? 'General Facilities' : 'Fasilitas Umum'}</h4>
                <ul class="clean-list">
                  ${(dest.fasilitas || []).map((f) => `<li>${escapeHtml(f)}</li>`).join('')}
                </ul>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <a href="${escapeHtml(mapsLink)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
              ${escapeHtml(t('btnOpenMaps', lang))} ↗
            </a>
            <button type="button" class="btn btn-outline" data-action="quick-add-itinerary" data-id="${escapeHtml(dest.id)}">
              ${escapeHtml(t('btnAddPlan', lang))}
            </button>
            <button type="button" class="btn btn-ghost ${isFav ? 'is-favorited' : ''}" data-action="toggle-favorite" data-id="${escapeHtml(dest.id)}" data-type="destinasi">
              ${isFav ? '♥ ' + escapeHtml(t('btnFavorited', lang)) : '♡ ' + escapeHtml(t('btnFavorite', lang))}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  if (favoritesOpen) {
    const itemsMarkup = state.favorit.length
      ? state.favorit
          .map((fav) => {
            let record = null;
            let title = '';
            let meta = '';
            if (fav.tipeItem === 'destinasi') {
              record = state.destinasi.find((d) => d.id === fav.itemId);
              title = record ? (lang === 'en' && record.namaEn ? record.namaEn : record.nama) : fav.itemId;
              meta = record ? `${record.wilayah} · ${translateCategory(record.kategori, lang)}` : 'Destinasi';
            } else if (fav.tipeItem === 'kuliner') {
              record = state.kuliner.find((k) => k.id === fav.itemId);
              title = record ? (lang === 'en' && record.namaEn ? record.namaEn : record.nama) : fav.itemId;
              meta = record ? `${record.wilayah} · ${formatRupiahNumeric(record.harga)}` : 'Kuliner';
            } else {
              record = state.akomodasi.find((a) => a.id === fav.itemId);
              title = record ? record.nama : fav.itemId;
              meta = record ? `${record.wilayah} · ${formatRupiahNumeric(record.hargaPerMalam)}/mlm` : 'Akomodasi';
            }

            return `
              <div class="fav-row">
                <div>
                  <div class="fav-row-title">${escapeHtml(title)}</div>
                  <div class="fav-row-meta">
                    <span>${escapeHtml(meta)}</span>
                    <span aria-hidden="true">·</span>
                    <span class="mono-num">${escapeHtml(t('favAddedOn', lang))} ${escapeHtml(fav.tanggalDitambahkan)}</span>
                  </div>
                </div>
                <div class="fav-row-actions">
                  ${fav.tipeItem === 'destinasi' && record ? `<button type="button" class="btn btn-outline btn-xs" data-action="quick-add-itinerary" data-id="${escapeHtml(record.id)}">+ Plan</button>` : ''}
                  <button type="button" class="btn btn-ghost btn-xs danger-text" data-action="remove-favorite" data-fav-id="${escapeHtml(fav.id)}">${escapeHtml(t('favRemove', lang))}</button>
                </div>
              </div>
            `;
          })
          .join('')
      : `<div class="empty-state-box compact"><p>${escapeHtml(t('favEmpty', lang))}</p></div>`;

    return `
      <div class="modal-backdrop" data-action="close-modals">
        <div class="drawer-panel" role="dialog" aria-modal="true" aria-label="${escapeHtml(t('favDrawerTitle', lang))}">
          <div class="modal-header">
            <h3 class="modal-title">${escapeHtml(t('favDrawerTitle', lang))} (${state.favorit.length})</h3>
            <button type="button" class="modal-close-btn" data-action="close-modals" aria-label="Close">✕</button>
          </div>
          <div class="drawer-body">
            ${itemsMarkup}
          </div>
        </div>
      </div>
    `;
  }

  if (waModal) {
    const defaultMsg =
      lang === 'en'
        ? `Assalamu'alaikum, I am inquiring via Hihu Eksplor (Demo) regarding "${waModal.name}". Could you share availability and halal/Muslim-friendly facility details?`
        : `Assalamu'alaikum, saya ingin bertanya melalui Hihu Eksplor (Mode Demo) mengenai "${waModal.name}". Mohon info ketersediaan dan fasilitas ramah Muslim.`;
    const waUrl = buildWhatsAppUrl(waModal.phone, defaultMsg);

    return `
      <div class="modal-backdrop" data-action="close-modals">
        <div class="modal-dialog modal-sm" role="dialog" aria-modal="true">
          <div class="modal-header">
            <h3 class="modal-title">${escapeHtml(t('waModalTitle', lang))}</h3>
            <button type="button" class="modal-close-btn" data-action="close-modals" aria-label="Close">✕</button>
          </div>
          <div class="modal-body">
            <p class="sim-notice-box">${escapeHtml(t('waModalBadge', lang))}</p>
            <div class="wa-meta-info">
              <div><strong>${lang === 'en' ? 'Merchant / Service' : 'Layanan / UMKM'}:</strong> ${escapeHtml(waModal.name)}</div>
              <div><strong>${lang === 'en' ? 'Simulated Number' : 'Nomor Simulasi'}:</strong> <span class="mono-num">+${escapeHtml(waModal.phone)}</span></div>
            </div>
            <label class="form-field">
              <span>${escapeHtml(t('waModalMessageLabel', lang))}</span>
              <textarea id="wa-preview-msg" class="input-control" rows="4">${escapeHtml(defaultMsg)}</textarea>
            </label>
          </div>
          <div class="modal-footer">
            <a id="wa-direct-link" href="${escapeHtml(waUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
              ${escapeHtml(t('waModalOpenLink', lang))} ↗
            </a>
            <button type="button" class="btn btn-outline" data-action="close-modals">${escapeHtml(t('waModalClose', lang))}</button>
          </div>
        </div>
      </div>
    `;
  }

  if (crudModal) {
    return renderCrudFormModal(state, crudModal);
  }

  if (authModal) {
    return renderAuthDemoModal(state, authModal);
  }

  return '';
}

function renderAuthDemoModal(state, authModal) {
  const { lang } = state.config;
  const activeUser = state.authUser;
  const showProfile = Boolean(activeUser && !authModal.forceAuthForm);
  const mode = ['login', 'register', 'curator'].includes(authModal.mode) ? authModal.mode : 'login';
  const demoTraveler = getDemoTravelerHint();
  const errKey = authModal.errorKey || '';
  const showPass = Boolean(authModal.showPassword);
  const passType = showPass ? 'text' : 'password';
  const togglePassLabel = showPass ? t('authHidePass', lang) : t('authShowPass', lang);
  const { adminEnvConfigured, adminClaimed } = state.ui.authStatus || {
    adminEnvConfigured: false,
    adminClaimed: false,
  };

  if (showProfile) {
    const initial = (activeUser.name || 'U').trim().charAt(0).toUpperCase();
    return `
      <div class="modal-backdrop" data-action="close-modals">
        <div class="modal-dialog modal-sm" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
          <div class="modal-header">
            <h3 id="auth-modal-title" class="modal-title">${escapeHtml(t('authProfileTitle', lang))}</h3>
            <button type="button" class="modal-close-btn" data-action="close-modals" aria-label="Close">✕</button>
          </div>

          <div class="modal-body">
            <div class="profile-summary-card">
              <div class="profile-avatar-lg" aria-hidden="true">${escapeHtml(initial)}</div>
              <div class="profile-meta">
                <strong>${escapeHtml(activeUser.name)}</strong>
                <span class="mono-num">${escapeHtml(activeUser.email)}</span>
                <span class="profile-role-badge">${escapeHtml(activeUser.role)}</span>
              </div>
            </div>

            <p class="sim-notice-box">${escapeHtml(t('authProfileSyncNote', lang))}</p>

            ${errKey ? `<p class="auth-error-box" role="alert">${escapeHtml(t(errKey, lang))}</p>` : ''}

            <div class="profile-stats-row">
              <div class="profile-stat-box">
                <span class="mini-heading">${escapeHtml(t('favoritesLabel', lang))}</span>
                <strong class="mono-num">${state.favorit.length}</strong>
              </div>
              <div class="profile-stat-box">
                <span class="mini-heading">${escapeHtml(t('navItinerary', lang))}</span>
                <strong>${escapeHtml(state.itinerary?.namaPerjalanan || 'Aceh Trip')}</strong>
              </div>
            </div>

            <form class="auth-form" data-action="submit-profile-update">
              <label class="form-field">
                <span>${escapeHtml(t('authNameLabel', lang))}</span>
                <input type="text" name="name" class="input-control" minlength="2" maxlength="80" required value="${escapeHtml(activeUser.name)}" />
              </label>
              <button type="submit" class="btn btn-primary auth-submit-btn">${escapeHtml(t('authProfileUpdateBtn', lang))}</button>
            </form>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-outline" data-action="switch-to-auth-form">
              ${escapeHtml(t('authSwitchAccountBtn', lang))}
            </button>
            <button type="button" class="btn btn-ghost danger-text" data-action="logout-user">
              ${escapeHtml(t('authLogoutBtn', lang))}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  let tabBody = '';
  if (mode === 'login') {
    tabBody = `
      <form class="auth-form" data-action="submit-user-login">
        <label class="form-field">
          <span>${escapeHtml(t('authEmailLabel', lang))}</span>
          <input
            type="email"
            name="email"
            class="input-control"
            required
            autocomplete="email"
            value="${escapeHtml(authModal.prefillEmail || '')}"
            placeholder="nama@email.com"
          />
        </label>

        <label class="form-field">
          <span>${escapeHtml(t('authPasswordLabel', lang))}</span>
          <div class="password-input-wrap">
            <input
              type="${passType}"
              name="password"
              class="input-control"
              required
              autocomplete="current-password"
              value="${escapeHtml(authModal.prefillPassword || '')}"
              placeholder="••••••••"
            />
            <button type="button" class="btn btn-outline btn-xs pass-toggle-btn" data-action="toggle-auth-password">
              ${escapeHtml(togglePassLabel)}
            </button>
          </div>
        </label>

        <button type="submit" class="btn btn-primary auth-submit-btn">${escapeHtml(t('authSubmitLogin', lang))}</button>
      </form>

      <div class="auth-presets-box">
        <span class="mini-heading">${escapeHtml(t('authPresetHeading', lang))}</span>
        <div class="auth-presets-list">
          <div class="auth-preset-card">
            <div class="auth-preset-info">
              <strong>${escapeHtml(demoTraveler.name)}</strong>
              <span class="mono-num auth-preset-creds">${escapeHtml(demoTraveler.email)} · ${escapeHtml(demoTraveler.passcode)}</span>
            </div>
            <div class="auth-preset-actions">
              <button type="button" class="btn btn-outline btn-xs" data-action="fill-demo-login" data-email="${escapeHtml(demoTraveler.email)}" data-passcode="${escapeHtml(demoTraveler.passcode)}">
                ${escapeHtml(t('authFillForm', lang))}
              </button>
              <button type="button" class="btn btn-primary btn-xs" data-action="quick-demo-login">
                ${escapeHtml(t('authQuickLogin', lang))}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (mode === 'register') {
    tabBody = `
      <form class="auth-form" data-action="submit-user-register">
        <label class="form-field">
          <span>${escapeHtml(t('authNameLabel', lang))}</span>
          <input type="text" name="name" class="input-control" minlength="2" maxlength="80" required autocomplete="name" placeholder="Siti Aminah" />
        </label>

        <label class="form-field">
          <span>${escapeHtml(t('authEmailLabel', lang))}</span>
          <input type="email" name="email" class="input-control" maxlength="120" required autocomplete="email" placeholder="siti@email.com" />
        </label>

        <label class="form-field">
          <span>${escapeHtml(t('authPasswordLabel', lang))}</span>
          <div class="password-input-wrap">
            <input type="${passType}" name="password" class="input-control" minlength="6" maxlength="128" required autocomplete="new-password" placeholder="${lang === 'en' ? 'Minimum 6 characters' : 'Minimal 6 karakter'}" />
            <button type="button" class="btn btn-outline btn-xs pass-toggle-btn" data-action="toggle-auth-password">
              ${escapeHtml(togglePassLabel)}
            </button>
          </div>
        </label>

        <button type="submit" class="btn btn-primary auth-submit-btn">${escapeHtml(t('authSubmitRegister', lang))}</button>
      </form>
    `;
  } else if (adminEnvConfigured) {
    tabBody = `
      <form class="auth-form" data-action="submit-curator-passcode">
        <label class="form-field">
          <span>${escapeHtml(t('authPasscodeLabel', lang))}</span>
          <div class="password-input-wrap">
            <input type="${passType}" name="passcode" class="input-control" required autocomplete="current-password" placeholder="••••••••" />
            <button type="button" class="btn btn-outline btn-xs pass-toggle-btn" data-action="toggle-auth-password">
              ${escapeHtml(togglePassLabel)}
            </button>
          </div>
        </label>
        <button type="submit" class="btn btn-primary auth-submit-btn">${escapeHtml(t('authSubmitCuratorPasscode', lang))}</button>
      </form>
    `;
  } else if (!adminClaimed) {
    tabBody = `
      <p class="curator-setup-note">${escapeHtml(t('authCuratorSetupNote', lang))}</p>
      <form class="auth-form" data-action="submit-claim-curator">
        <label class="form-field">
          <span>${escapeHtml(t('authNameLabel', lang))}</span>
          <input type="text" name="name" class="input-control" minlength="2" maxlength="80" required placeholder="Kurator Aceh" />
        </label>
        <label class="form-field">
          <span>${escapeHtml(t('authEmailLabel', lang))}</span>
          <input type="email" name="email" class="input-control" maxlength="120" required placeholder="kurator@hihueksplor.id" />
        </label>
        <label class="form-field">
          <span>${escapeHtml(t('authPasswordLabel', lang))}</span>
          <div class="password-input-wrap">
            <input type="${passType}" name="password" class="input-control" minlength="6" maxlength="128" required placeholder="${lang === 'en' ? 'Minimum 6 characters' : 'Minimal 6 karakter'}" />
            <button type="button" class="btn btn-outline btn-xs pass-toggle-btn" data-action="toggle-auth-password">
              ${escapeHtml(togglePassLabel)}
            </button>
          </div>
        </label>
        <button type="submit" class="btn btn-primary auth-submit-btn">${escapeHtml(t('authSubmitClaimCurator', lang))}</button>
      </form>
    `;
  } else {
    tabBody = `
      <div class="curator-claimed-box">
        <p>${escapeHtml(t('authCuratorClaimedNote', lang))}</p>
        <button type="button" class="btn btn-primary auth-submit-btn" data-action="switch-auth-mode" data-mode="login">
          ${escapeHtml(t('authGoToLoginTab', lang))}
        </button>
      </div>
    `;
  }

  return `
    <div class="modal-backdrop" data-action="close-modals">
      <div class="modal-dialog modal-sm" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
        <div class="modal-header">
          <h3 id="auth-modal-title" class="modal-title">${escapeHtml(t('authModalTitle', lang))}</h3>
          <button type="button" class="modal-close-btn" data-action="close-modals" aria-label="Close">✕</button>
        </div>

        <div class="modal-body">
          <p class="sim-notice-box">${escapeHtml(t('authModalBadge', lang))}</p>

          <div class="filter-group auth-tabs" role="tablist">
            <button type="button" class="filter-tab ${mode === 'login' ? 'is-active' : ''}" data-action="switch-auth-mode" data-mode="login">
              ${escapeHtml(t('authTabLogin', lang))}
            </button>
            <button type="button" class="filter-tab ${mode === 'register' ? 'is-active' : ''}" data-action="switch-auth-mode" data-mode="register">
              ${escapeHtml(t('authTabRegister', lang))}
            </button>
            <button type="button" class="filter-tab ${mode === 'curator' ? 'is-active' : ''}" data-action="switch-auth-mode" data-mode="curator">
              ${escapeHtml(t('authTabCurator', lang))}
            </button>
          </div>

          ${errKey ? `<p class="auth-error-box" role="alert">${escapeHtml(t(errKey, lang))}</p>` : ''}

          ${tabBody}
        </div>
      </div>
    </div>
  `;
}

function renderCrudFormModal(state, crudModal) {
  const { lang } = state.config;
  const { entity, id } = crudModal;
  const isEdit = Boolean(id);

  let record = null;
  if (entity === 'destinasi') record = state.destinasi.find((x) => x.id === id);
  if (entity === 'kuliner') record = state.kuliner.find((x) => x.id === id);
  if (entity === 'akomodasi') record = state.akomodasi.find((x) => x.id === id);
  if (entity === 'paket') record = state.paketWisata.find((x) => x.id === id);

  let fieldsMarkup = '';

  if (entity === 'destinasi') {
    const r = record || {
      nama: '',
      namaEn: '',
      kategori: 'Religi',
      wilayah: 'Banda Aceh',
      estimasiBiaya: 0,
      alamat: '',
      mapsUrl: '',
      imageUrl: '/src/assets/images/dest_mosque_aceh_1795590639134.jpg',
      deskripsi: '',
      fasilitas: ['Area parkir'],
      fasilitasIbadah: ['Mushola & tempat wudhu'],
      statusVerifikasi: 'Belum Terverifikasi Langsung — Input Demo Lokal',
      unggulan: false,
    };
    fieldsMarkup = `
      <div class="crud-form-grid">
        <label class="form-field">
          <span>Nama Destinasi (ID) *</span>
          <input type="text" name="nama" class="input-control" required value="${escapeHtml(r.nama)}" />
        </label>
        <label class="form-field">
          <span>Destination Name (EN)</span>
          <input type="text" name="namaEn" class="input-control" value="${escapeHtml(r.namaEn || '')}" />
        </label>
        <label class="form-field">
          <span>Wilayah *</span>
          <select name="wilayah" class="input-control">
            ${REGIONS.map((reg) => `<option value="${escapeHtml(reg)}" ${r.wilayah === reg ? 'selected' : ''}>${escapeHtml(reg)}</option>`).join('')}
          </select>
        </label>
        <label class="form-field">
          <span>Kategori *</span>
          <select name="kategori" class="input-control">
            ${CATEGORIES.map((cat) => `<option value="${escapeHtml(cat)}" ${r.kategori === cat ? 'selected' : ''}>${escapeHtml(cat)}</option>`).join('')}
          </select>
        </label>
        <label class="form-field">
          <span>Estimasi Biaya (Rp)</span>
          <input type="number" name="estimasiBiaya" class="input-control mono-num" min="0" value="${escapeHtml(r.estimasiBiaya)}" />
        </label>
        <label class="form-field">
          <span>Foto Destinasi</span>
          <select name="imageUrl" class="input-control">
            <option value="/src/assets/images/dest_mosque_aceh_1795590639134.jpg" ${r.imageUrl === '/src/assets/images/dest_mosque_aceh_1795590639134.jpg' ? 'selected' : ''}>Masjid / Religi</option>
            <option value="/src/assets/images/dest_tsunami_museum_1795590640183.jpg" ${r.imageUrl === '/src/assets/images/dest_tsunami_museum_1795590640183.jpg' ? 'selected' : ''}>Museum / Sejarah</option>
            <option value="/src/assets/images/dest_sabang_iboih_1795590640334.jpg" ${r.imageUrl === '/src/assets/images/dest_sabang_iboih_1795590640334.jpg' ? 'selected' : ''}>Bahari Sabang</option>
            <option value="/src/assets/images/dest_kilometer_nol_1795590640384.jpg" ${r.imageUrl === '/src/assets/images/dest_kilometer_nol_1795590640384.jpg' ? 'selected' : ''}>Tugu / Tebing</option>
            <option value="/src/assets/images/dest_gayo_highlands_1795590640695.jpg" ${r.imageUrl === '/src/assets/images/dest_gayo_highlands_1795590640695.jpg' ? 'selected' : ''}>Danau & Dataran Tinggi</option>
            <option value="/src/assets/images/dest_rumoh_aceh_1795590641231.jpg" ${r.imageUrl === '/src/assets/images/dest_rumoh_aceh_1795590641231.jpg' ? 'selected' : ''}>Rumoh Aceh / Budaya</option>
            <option value="/src/assets/images/dest_lampuuk_beach_1795590641357.jpg" ${r.imageUrl === '/src/assets/images/dest_lampuuk_beach_1795590641357.jpg' ? 'selected' : ''}>Pantai Aceh Besar</option>
            <option value="/src/assets/images/cul_kopi_gayo_1795590642290.jpg" ${r.imageUrl === '/src/assets/images/cul_kopi_gayo_1795590642290.jpg' ? 'selected' : ''}>Agrowisata Kopi</option>
          </select>
        </label>
        <label class="form-field span-2">
          <span>Alamat</span>
          <input type="text" name="alamat" class="input-control" required value="${escapeHtml(r.alamat)}" />
        </label>
        <label class="form-field span-2">
          <span>Deskripsi *</span>
          <textarea name="deskripsi" class="input-control" rows="2" required>${escapeHtml(r.deskripsi)}</textarea>
        </label>
        <label class="form-field span-2">
          <span>Fasilitas Ibadah & Ramah Muslim (pisahkan dengan koma)</span>
          <input type="text" name="fasilitasIbadah" class="input-control" value="${escapeHtml((r.fasilitasIbadah || []).join(', '))}" />
        </label>
        <label class="form-field span-2">
          <span>Fasilitas Umum (pisahkan dengan koma)</span>
          <input type="text" name="fasilitas" class="input-control" value="${escapeHtml((r.fasilitas || []).join(', '))}" />
        </label>
        <label class="form-field">
          <span>Status Verifikasi</span>
          <input type="text" name="statusVerifikasi" class="input-control" value="${escapeHtml(r.statusVerifikasi)}" />
        </label>
        <label class="checkbox-field">
          <input type="checkbox" name="unggulan" ${r.unggulan ? 'checked' : ''} />
          <span>Tandai sebagai Destinasi Unggulan</span>
        </label>
      </div>
    `;
  } else if (entity === 'kuliner') {
    const r = record || {
      nama: '',
      kategori: 'Kuliner Berat',
      wilayah: 'Banda Aceh',
      harga: 35000,
      imageUrl: '/src/assets/images/cul_mie_aceh_1795590641312.jpg',
      statusSertifikasiHalal: 'Klaim Mandiri Pelaku Usaha',
      sumberVerifikasi: 'Input Demo Lokal — Belum terverifikasi resmi',
      kontak: '6281200010999',
      deskripsi: '',
    };
    fieldsMarkup = `
      <div class="crud-form-grid">
        <label class="form-field span-2">
          <span>Nama Kuliner / Produk UMKM *</span>
          <input type="text" name="nama" class="input-control" required value="${escapeHtml(r.nama)}" />
        </label>
        <label class="form-field">
          <span>Kategori</span>
          <input type="text" name="kategori" class="input-control" required value="${escapeHtml(r.kategori)}" />
        </label>
        <label class="form-field">
          <span>Wilayah</span>
          <select name="wilayah" class="input-control">
            ${REGIONS.map((reg) => `<option value="${escapeHtml(reg)}" ${r.wilayah === reg ? 'selected' : ''}>${escapeHtml(reg)}</option>`).join('')}
          </select>
        </label>
        <label class="form-field">
          <span>Harga Simulasi (Rp)</span>
          <input type="number" name="harga" class="input-control mono-num" min="0" value="${escapeHtml(r.harga)}" />
        </label>
        <label class="form-field">
          <span>Status Sertifikasi Halal *</span>
          <select name="statusSertifikasiHalal" class="input-control">
            ${HALAL_STATUSES.map((st) => `<option value="${escapeHtml(st)}" ${r.statusSertifikasiHalal === st ? 'selected' : ''}>${escapeHtml(st)}</option>`).join('')}
          </select>
        </label>
        <label class="form-field span-2">
          <span>Sumber Verifikasi Halal</span>
          <input type="text" name="sumberVerifikasi" class="input-control" required value="${escapeHtml(r.sumberVerifikasi)}" />
        </label>
        <label class="form-field">
          <span>Nomor WhatsApp Simulasi</span>
          <input type="text" name="kontak" class="input-control mono-num" value="${escapeHtml(r.kontak)}" />
        </label>
        <label class="form-field">
          <span>Foto Kuliner</span>
          <select name="imageUrl" class="input-control">
            <option value="/src/assets/images/cul_mie_aceh_1795590641312.jpg" ${r.imageUrl === '/src/assets/images/cul_mie_aceh_1795590641312.jpg' ? 'selected' : ''}>Hidangan Rempah</option>
            <option value="/src/assets/images/cul_kopi_gayo_1795590642290.jpg" ${r.imageUrl === '/src/assets/images/cul_kopi_gayo_1795590642290.jpg' ? 'selected' : ''}>Kopi Gayo</option>
            <option value="/src/assets/images/cul_kue_aceh_1795590642423.jpg" ${r.imageUrl === '/src/assets/images/cul_kue_aceh_1795590642423.jpg' ? 'selected' : ''}>Kue UMKM</option>
          </select>
        </label>
        <label class="form-field span-2">
          <span>Deskripsi</span>
          <textarea name="deskripsi" class="input-control" rows="2" required>${escapeHtml(r.deskripsi)}</textarea>
        </label>
      </div>
    `;
  } else if (entity === 'akomodasi') {
    const r = record || {
      nama: '',
      wilayah: 'Banda Aceh',
      hargaPerMalam: 400000,
      fasilitas: ['Wi-Fi', 'Parkir'],
      fasilitasRamahMuslim: ['Sajadah & penanda kiblat'],
      statusSertifikasiHalal: 'Fasilitas Ramah Muslim (Bukan sertifikat hotel halal resmi)',
      imageUrl: '/src/assets/images/stay_syariah_hotel_1795590642816.jpg',
      kontak: '6281300020999',
      deskripsi: '',
    };
    fieldsMarkup = `
      <div class="crud-form-grid">
        <label class="form-field span-2">
          <span>Nama Akomodasi *</span>
          <input type="text" name="nama" class="input-control" required value="${escapeHtml(r.nama)}" />
        </label>
        <label class="form-field">
          <span>Wilayah</span>
          <select name="wilayah" class="input-control">
            ${REGIONS.map((reg) => `<option value="${escapeHtml(reg)}" ${r.wilayah === reg ? 'selected' : ''}>${escapeHtml(reg)}</option>`).join('')}
          </select>
        </label>
        <label class="form-field">
          <span>Harga / Malam Simulasi (Rp)</span>
          <input type="number" name="hargaPerMalam" class="input-control mono-num" min="0" value="${escapeHtml(r.hargaPerMalam)}" />
        </label>
        <label class="form-field span-2">
          <span>Fasilitas Ramah Muslim (pisahkan koma)</span>
          <input type="text" name="fasilitasRamahMuslim" class="input-control" value="${escapeHtml((r.fasilitasRamahMuslim || []).join(', '))}" />
        </label>
        <label class="form-field span-2">
          <span>Fasilitas Umum (pisahkan koma)</span>
          <input type="text" name="fasilitas" class="input-control" value="${escapeHtml((r.fasilitas || []).join(', '))}" />
        </label>
        <label class="form-field">
          <span>Keterangan Status Halal</span>
          <input type="text" name="statusSertifikasiHalal" class="input-control" value="${escapeHtml(r.statusSertifikasiHalal)}" />
        </label>
        <label class="form-field">
          <span>Nomor WhatsApp Simulasi</span>
          <input type="text" name="kontak" class="input-control mono-num" value="${escapeHtml(r.kontak)}" />
        </label>
        <label class="form-field span-2">
          <span>Deskripsi</span>
          <textarea name="deskripsi" class="input-control" rows="2" required>${escapeHtml(r.deskripsi)}</textarea>
        </label>
      </div>
    `;
  } else {
    const r = record || {
      nama: '',
      durasi: 2,
      estimasiBiaya: 1200000,
      wilayahUtama: 'Banda Aceh',
      daftarDestinasi: ['dest-01', 'dest-02'],
      minat: ['Religi', 'Sejarah'],
      deskripsi: '',
    };
    fieldsMarkup = `
      <div class="crud-form-grid">
        <label class="form-field span-2">
          <span>Nama Paket Wisata *</span>
          <input type="text" name="nama" class="input-control" required value="${escapeHtml(r.nama)}" />
        </label>
        <label class="form-field">
          <span>Durasi (1–5 Hari)</span>
          <input type="number" name="durasi" class="input-control mono-num" min="1" max="5" value="${escapeHtml(r.durasi)}" />
        </label>
        <label class="form-field">
          <span>Estimasi Biaya / Orang (Rp)</span>
          <input type="number" name="estimasiBiaya" class="input-control mono-num" min="0" value="${escapeHtml(r.estimasiBiaya)}" />
        </label>
        <label class="form-field">
          <span>Wilayah Utama</span>
          <select name="wilayahUtama" class="input-control">
            ${REGIONS.map((reg) => `<option value="${escapeHtml(reg)}" ${r.wilayahUtama === reg ? 'selected' : ''}>${escapeHtml(reg)}</option>`).join('')}
          </select>
        </label>
        <label class="form-field">
          <span>Minat Kategori (pisahkan koma)</span>
          <input type="text" name="minat" class="input-control" value="${escapeHtml((r.minat || []).join(', '))}" />
        </label>
        <label class="form-field span-2">
          <span>Daftar ID Destinasi (pisahkan koma, misal: dest-01, dest-06)</span>
          <input type="text" name="daftarDestinasi" class="input-control mono-num" value="${escapeHtml((r.daftarDestinasi || []).join(', '))}" />
        </label>
        <label class="form-field span-2">
          <span>Deskripsi Paket *</span>
          <textarea name="deskripsi" class="input-control" rows="2" required>${escapeHtml(r.deskripsi)}</textarea>
        </label>
      </div>
    `;
  }

  return `
    <div class="modal-backdrop" data-action="close-modals">
      <div class="modal-dialog" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h3 class="modal-title">${isEdit ? (lang === 'en' ? 'Edit Record' : 'Ubah Data') : (lang === 'en' ? 'Add New Record' : 'Tambah Data Baru')} (${escapeHtml(entity)})</h3>
          <button type="button" class="modal-close-btn" data-action="close-modals" aria-label="Close">✕</button>
        </div>
        <form data-action="submit-crud-form" data-entity="${escapeHtml(entity)}" data-id="${escapeHtml(id || '')}">
          <div class="modal-body">
            ${fieldsMarkup}
          </div>
          <div class="modal-footer">
            <button type="submit" class="btn btn-primary">${escapeHtml(t('dashSave', lang))}</button>
            <button type="button" class="btn btn-outline" data-action="close-modals">${escapeHtml(t('dashCancel', lang))}</button>
          </div>
        </form>
      </div>
    </div>
  `;
}
