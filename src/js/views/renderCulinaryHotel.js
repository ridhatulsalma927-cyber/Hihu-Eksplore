import { REGIONS } from '../data.js';
import { t, translateHalalStatus } from '../i18n.js';
import { escapeHtml, formatRupiahNumeric } from '../utils.js';

export function renderCulinaryAndHotelSection(state) {
  const { lang } = state.config;
  const { region: culRegion, cert: culCert } = state.ui.culFilters;
  const { region: stayRegion } = state.ui.stayFilters;

  const favCulIds = new Set(
    state.favorit.filter((f) => f.tipeItem === 'kuliner').map((f) => f.itemId)
  );
  const favStayIds = new Set(
    state.favorit.filter((f) => f.tipeItem === 'akomodasi').map((f) => f.itemId)
  );

  const filteredCul = state.kuliner.filter((k) => {
    if (culRegion !== 'all' && k.wilayah !== culRegion) return false;
    if (culCert !== 'all' && k.statusSertifikasiHalal !== culCert) return false;
    return true;
  });

  const filteredStay = state.akomodasi.filter((a) => {
    if (stayRegion !== 'all' && a.wilayah !== stayRegion) return false;
    return true;
  });

  const culCards = filteredCul.length
    ? filteredCul
        .map((k) => {
          const title = lang === 'en' && k.namaEn ? k.namaEn : k.nama;
          const desc = lang === 'en' && k.deskripsiEn ? k.deskripsiEn : k.deskripsi;
          const isFav = favCulIds.has(k.id);
          const isVerified = k.statusSertifikasiHalal === 'Tersertifikasi Halal Resmi';

          return `
            <article class="catalog-card">
              <div class="card-media img-fallback-frame" data-fallback-title="${escapeHtml(title)}">
                <img src="${escapeHtml(k.imageUrl || '/src/assets/images/cul_mie_aceh_1795590641312.jpg')}" alt="${escapeHtml(title)}" loading="lazy" referrerpolicy="no-referrer" />
              </div>
              <div class="card-body">
                <div class="card-meta-line">
                  <span>${escapeHtml(k.wilayah)}</span>
                  <span aria-hidden="true">·</span>
                  <span>${escapeHtml(k.kategori)}</span>
                </div>
                <h3 class="card-title">${escapeHtml(title)}</h3>
                <p class="card-desc">${escapeHtml(desc)}</p>

                <div class="halal-status-box ${isVerified ? 'is-verified' : 'is-unverified'}">
                  <div class="halal-status-heading">
                    <span>${isVerified ? '✓' : 'ⓘ'}</span>
                    <strong>${escapeHtml(translateHalalStatus(k.statusSertifikasiHalal, lang))}</strong>
                  </div>
                  <p class="halal-source-text">${escapeHtml(t('verificationSourceLabel', lang))}: ${escapeHtml(k.sumberVerifikasi)}</p>
                </div>

                <div class="card-price-row">
                  <span class="mono-price">${escapeHtml(formatRupiahNumeric(k.harga))}</span>
                  <span class="price-sim-note">${escapeHtml(t('simPriceNote', lang))}</span>
                </div>

                <div class="card-actions">
                  <button type="button" class="btn btn-primary btn-sm" data-action="open-wa-demo" data-name="${escapeHtml(title)}" data-phone="${escapeHtml(k.kontak)}" data-kind="kuliner">
                    ${escapeHtml(t('btnContactWa', lang))}
                  </button>
                  <button type="button" class="btn btn-ghost btn-sm ${isFav ? 'is-favorited' : ''}" data-action="toggle-favorite" data-id="${escapeHtml(k.id)}" data-type="kuliner" aria-pressed="${isFav}">
                    ${isFav ? '♥ ' + escapeHtml(t('btnFavorited', lang)) : '♡ ' + escapeHtml(t('btnFavorite', lang))}
                  </button>
                </div>
              </div>
            </article>
          `;
        })
        .join('')
    : `<div class="empty-state-box"><p>${lang === 'en' ? 'No culinary items match this filter.' : 'Tidak ada kuliner yang sesuai filter saat ini.'}</p></div>`;

  const stayCards = filteredStay.length
    ? filteredStay
        .map((a) => {
          const desc = lang === 'en' && a.deskripsiEn ? a.deskripsiEn : a.deskripsi;
          const isFav = favStayIds.has(a.id);

          return `
            <article class="stay-card">
              <div class="stay-media img-fallback-frame" data-fallback-title="${escapeHtml(a.nama)}">
                <img src="${escapeHtml(a.imageUrl || '/src/assets/images/stay_syariah_hotel_1795590642816.jpg')}" alt="${escapeHtml(a.nama)}" loading="lazy" referrerpolicy="no-referrer" />
              </div>
              <div class="stay-body">
                <div class="card-meta-line">
                  <span>${escapeHtml(a.wilayah)}</span>
                  <span aria-hidden="true">·</span>
                  <span class="meta-turquoise">${escapeHtml(a.statusSertifikasiHalal)}</span>
                </div>
                <h3 class="card-title">${escapeHtml(a.nama)}</h3>
                <p class="card-desc">${escapeHtml(desc)}</p>

                <div class="stay-lists-grid">
                  <div>
                    <h4 class="mini-heading">${escapeHtml(t('muslimFacilitiesLabel', lang))}</h4>
                    <ul class="clean-list">
                      ${(a.fasilitasRamahMuslim || []).map((f) => `<li>${escapeHtml(f)}</li>`).join('')}
                    </ul>
                  </div>
                  <div>
                    <h4 class="mini-heading">${escapeHtml(t('generalFacilitiesLabel', lang))}</h4>
                    <ul class="clean-list">
                      ${(a.fasilitas || []).map((f) => `<li>${escapeHtml(f)}</li>`).join('')}
                    </ul>
                  </div>
                </div>

                <div class="stay-footer">
                  <div>
                    <span class="mono-price">${escapeHtml(formatRupiahNumeric(a.hargaPerMalam))}</span>
                    <span class="price-sim-note">${escapeHtml(t('perNightLabel', lang))}</span>
                  </div>
                  <div class="card-actions">
                    <button type="button" class="btn btn-primary btn-sm" data-action="open-wa-demo" data-name="${escapeHtml(a.nama)}" data-phone="${escapeHtml(a.kontak)}" data-kind="akomodasi">
                      ${escapeHtml(t('btnContactWa', lang))}
                    </button>
                    <button type="button" class="btn btn-ghost btn-sm ${isFav ? 'is-favorited' : ''}" data-action="toggle-favorite" data-id="${escapeHtml(a.id)}" data-type="akomodasi" aria-pressed="${isFav}">
                      ${isFav ? '♥ ' + escapeHtml(t('btnFavorited', lang)) : '♡ ' + escapeHtml(t('btnFavorite', lang))}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          `;
        })
        .join('')
    : `<div class="empty-state-box"><p>${lang === 'en' ? 'No accommodations found in this region.' : 'Belum ada akomodasi pada wilayah ini.'}</p></div>`;

  return `
    <section id="kuliner-inap" class="page-section section-tinted">
      <div class="container">
        <div class="section-header">
          <p class="section-index">${escapeHtml(t('culSectionIndex', lang))}</p>
          <h2 class="section-title">${escapeHtml(t('culSectionTitle', lang))}</h2>
          <p class="section-desc">${escapeHtml(t('culSectionDesc', lang))}</p>
        </div>

        <div class="filter-toolbar">
          <div class="filter-group" role="group" aria-label="Filter Wilayah Kuliner">
            <button type="button" class="filter-tab ${culRegion === 'all' ? 'is-active' : ''}" data-action="filter-cul-region" data-value="all">${escapeHtml(t('filterRegionAll', lang))}</button>
            ${REGIONS.map((r) => `<button type="button" class="filter-tab ${culRegion === r ? 'is-active' : ''}" data-action="filter-cul-region" data-value="${escapeHtml(r)}">${escapeHtml(r)}</button>`).join('')}
          </div>

          <div class="filter-group" role="group" aria-label="Filter Status Halal">
            <button type="button" class="filter-tab ${culCert === 'all' ? 'is-active' : ''}" data-action="filter-cul-cert" data-value="all">${escapeHtml(t('filterCertAll', lang))}</button>
            <button type="button" class="filter-tab ${culCert === 'Tersertifikasi Halal Resmi' ? 'is-active' : ''}" data-action="filter-cul-cert" data-value="Tersertifikasi Halal Resmi">${escapeHtml(t('filterCertVerified', lang))}</button>
            <button type="button" class="filter-tab ${culCert === 'Proses Verifikasi' ? 'is-active' : ''}" data-action="filter-cul-cert" data-value="Proses Verifikasi">${escapeHtml(t('filterCertProcess', lang))}</button>
            <button type="button" class="filter-tab ${culCert === 'Klaim Mandiri Pelaku Usaha' ? 'is-active' : ''}" data-action="filter-cul-cert" data-value="Klaim Mandiri Pelaku Usaha">${escapeHtml(t('filterCertSelf', lang))}</button>
          </div>
        </div>

        <div class="catalog-grid">
          ${culCards}
        </div>

        <div class="section-divider-space"></div>

        <div class="section-header">
          <p class="section-index">${escapeHtml(t('staySectionIndex', lang))}</p>
          <h2 class="section-title">${escapeHtml(t('staySectionTitle', lang))}</h2>
          <p class="section-desc">${escapeHtml(t('staySectionDesc', lang))}</p>
        </div>

        <div class="filter-toolbar">
          <div class="filter-group" role="group" aria-label="Filter Wilayah Akomodasi">
            <button type="button" class="filter-tab ${stayRegion === 'all' ? 'is-active' : ''}" data-action="filter-stay-region" data-value="all">${escapeHtml(t('filterRegionAll', lang))}</button>
            ${REGIONS.map((r) => `<button type="button" class="filter-tab ${stayRegion === r ? 'is-active' : ''}" data-action="filter-stay-region" data-value="${escapeHtml(r)}">${escapeHtml(r)}</button>`).join('')}
          </div>
        </div>

        <div class="stays-stack">
          ${stayCards}
        </div>
      </div>
    </section>
  `;
}
