import { CATEGORIES, REGIONS } from '../data.js';
import { t, translateCategory } from '../i18n.js';
import {
  buildMapsSearchUrl,
  escapeHtml,
  formatRupiah,
  formatRupiahNumeric,
  recommendPackages,
} from '../utils.js';

export function renderMapAndPackagesSection(state) {
  const { lang } = state.config;
  const {
    selectedRegion,
    selectedDestId,
    mapTypeId,
    status,
    searchQuery,
    searchResults,
    searchAttempted,
  } = state.ui.map;
  const pkgFilters = state.ui.pkgFilters;

  const selectedDest =
    state.destinasi.find((d) => d.id === selectedDestId) ||
    state.destinasi.find((d) => selectedRegion === 'all' || d.wilayah === selectedRegion) ||
    state.destinasi[0];

  const regionDestList = state.destinasi.filter(
    (d) => selectedRegion === 'all' || d.wilayah === selectedRegion
  );

  const selectedDestMarkup = selectedDest
    ? (() => {
        const title = lang === 'en' && selectedDest.namaEn ? selectedDest.namaEn : selectedDest.nama;
        const desc = lang === 'en' && selectedDest.deskripsiEn ? selectedDest.deskripsiEn : selectedDest.deskripsi;
        const mapsLink = selectedDest.mapsUrl || buildMapsSearchUrl(`${selectedDest.nama} ${selectedDest.wilayah} Aceh`);

        return `
          <div class="map-preview-card">
            <div class="card-meta-line">
              <span>${escapeHtml(selectedDest.wilayah)}</span>
              <span aria-hidden="true">·</span>
              <span>${escapeHtml(translateCategory(selectedDest.kategori, lang))}</span>
            </div>
            <h3 class="map-preview-title">${escapeHtml(title)}</h3>
            <p class="map-preview-address">${escapeHtml(selectedDest.alamat)}</p>
            <p class="card-desc">${escapeHtml(desc)}</p>

            <div class="map-prayer-block">
              <h4>${lang === 'en' ? 'Prayer & Muslim-Friendly Access' : 'Fasilitas Ibadah & Ramah Muslim'}</h4>
              <ul class="clean-list">
                ${(selectedDest.fasilitasIbadah || []).map((f) => `<li>${escapeHtml(f)}</li>`).join('')}
              </ul>
            </div>

            <div class="card-price-row">
              <span class="mono-price">${escapeHtml(formatRupiah(selectedDest.estimasiBiaya, lang))}</span>
              <span class="price-sim-note">${escapeHtml(t('simPriceNote', lang))}</span>
            </div>

            <div class="card-actions">
              <a href="${escapeHtml(mapsLink)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
                ${escapeHtml(t('btnOpenMaps', lang))} ↗
              </a>
              <button type="button" class="btn btn-outline btn-sm" data-action="quick-add-itinerary" data-id="${escapeHtml(selectedDest.id)}">
                ${escapeHtml(t('btnAddPlan', lang))}
              </button>
              <button type="button" class="btn btn-ghost btn-sm" data-action="open-dest-detail" data-id="${escapeHtml(selectedDest.id)}">
                ${escapeHtml(t('btnDetail', lang))}
              </button>
            </div>
          </div>
        `;
      })()
    : `<div class="empty-state-box"><p>${escapeHtml(t('mapPickPrompt', lang))}</p></div>`;

  const recommended = recommendPackages(state.paketWisata, pkgFilters, lang);

  const packagesMarkup = recommended.length
    ? recommended
        .map(({ pkg, reasons }) => {
          const pkgTitle = lang === 'en' && pkg.namaEn ? pkg.namaEn : pkg.nama;
          const pkgDesc = lang === 'en' && pkg.deskripsiEn ? pkg.deskripsiEn : pkg.deskripsi;
          const destNames = (pkg.daftarDestinasi || [])
            .map((id) => state.destinasi.find((d) => d.id === id))
            .filter(Boolean)
            .map((d) => (lang === 'en' && d.namaEn ? d.namaEn : d.nama));

          return `
            <article class="package-card">
              <div class="card-meta-line">
                <span>${escapeHtml(pkg.wilayahUtama)}</span>
                <span aria-hidden="true">·</span>
                <span class="mono-num">${pkg.durasi} ${lang === 'en' ? 'Days' : 'Hari'}</span>
                <span aria-hidden="true">·</span>
                <span>${escapeHtml((pkg.minat || []).map((m) => translateCategory(m, lang)).join(' / '))}</span>
              </div>

              <h4 class="package-title">${escapeHtml(pkgTitle)}</h4>
              <p class="card-desc">${escapeHtml(pkgDesc)}</p>

              <div class="package-meta-grid">
                <div>
                  <span class="mini-heading">${escapeHtml(t('pkgMatchReasons', lang))}</span>
                  <ul class="clean-list">
                    ${reasons.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}
                  </ul>
                </div>
                <div>
                  <span class="mini-heading">${escapeHtml(t('pkgDestinationsIncluded', lang))}</span>
                  <p class="package-dest-list">${escapeHtml(destNames.join(' · ') || '-')}</p>
                </div>
              </div>

              <div class="package-footer">
                <div>
                  <span class="mono-price">${escapeHtml(formatRupiahNumeric(pkg.estimasiBiaya))}</span>
                  <span class="price-sim-note">/ ${lang === 'en' ? 'person (simulated)' : 'orang (simulasi)'}</span>
                </div>
                <div class="card-actions">
                  <button type="button" class="btn btn-primary btn-sm" data-action="load-package-itinerary" data-id="${escapeHtml(pkg.id)}">
                    ${escapeHtml(t('pkgLoadToItinerary', lang))}
                  </button>
                  <button type="button" class="btn btn-outline btn-sm" data-action="open-wa-demo" data-name="${escapeHtml(pkgTitle)}" data-phone="6281100030001" data-kind="paket">
                    ${escapeHtml(t('btnContactWa', lang))}
                  </button>
                </div>
              </div>
            </article>
          `;
        })
        .join('')
    : `<div class="empty-state-box"><p>${escapeHtml(t('pkgNoMatch', lang))}</p></div>`;

  let statusBannerMarkup = '';
  if (status === 'loading') {
    statusBannerMarkup = `<p class="map-status-note">${escapeHtml(t('mapLoadingStatus', lang))}</p>`;
  } else if (status === 'missing-key') {
    statusBannerMarkup = `<p class="map-status-note is-warning">${escapeHtml(t('mapMissingKey', lang))}</p>`;
  } else if (status === 'error') {
    statusBannerMarkup = `<p class="map-status-note is-warning">${escapeHtml(t('mapErrorStatus', lang))}</p>`;
  }

  const searchResultsMarkup = searchResults.length
    ? `
      <div class="map-search-results">
        ${searchResults
          .map(
            (place) => `
            <div class="map-search-item">
              <button type="button" class="map-search-focus-btn" data-action="focus-search-place" data-place-id="${escapeHtml(place.id)}">
                <span class="mono-num">#${place.index}</span>
                <span>${escapeHtml(place.displayName)}</span>
              </button>
              ${place.formattedAddress ? `<span class="map-search-addr">${escapeHtml(place.formattedAddress)}</span>` : ''}
              <a href="${escapeHtml(place.mapsUrl)}" target="_blank" rel="noopener noreferrer" class="map-search-ext">Maps ↗</a>
            </div>
          `
          )
          .join('')}
      </div>
    `
    : searchAttempted
      ? `<p class="map-status-note">${escapeHtml(t('mapSearchEmpty', lang))}</p>`
      : '';

  return `
    <section id="peta-paket" class="page-section">
      <div class="container">
        <div class="section-header">
          <p class="section-index">${escapeHtml(t('mapSectionIndex', lang))}</p>
          <h2 class="section-title">${escapeHtml(t('mapSectionTitle', lang))}</h2>
          <p class="section-desc">${escapeHtml(t('mapSectionDesc', lang))}</p>
        </div>

        <div class="map-workspace-grid">
          <div class="map-canvas-column">
            <div class="map-region-bar">
              <button type="button" class="filter-tab ${selectedRegion === 'all' ? 'is-active' : ''}" data-action="select-map-region" data-value="all">${escapeHtml(t('mapAllRegions', lang))}</button>
              ${REGIONS.map((r) => `<button type="button" class="filter-tab ${selectedRegion === r ? 'is-active' : ''}" data-action="select-map-region" data-value="${escapeHtml(r)}">${escapeHtml(r)}</button>`).join('')}
            </div>

            <div class="map-controls-bar">
              <div class="segmented-switch" role="group" aria-label="Map View Mode">
                <button type="button" class="seg-btn ${mapTypeId === 'roadmap' ? 'is-active' : ''}" data-action="set-map-type" data-value="roadmap">${escapeHtml(t('mapModeRoadmap', lang))}</button>
                <button type="button" class="seg-btn ${mapTypeId === 'hybrid' ? 'is-active' : ''}" data-action="set-map-type" data-value="hybrid">${escapeHtml(t('mapModeHybrid', lang))}</button>
                <button type="button" class="seg-btn ${mapTypeId === 'satellite' ? 'is-active' : ''}" data-action="set-map-type" data-value="satellite">${escapeHtml(t('mapModeSatellite', lang))}</button>
                <button type="button" class="seg-btn ${mapTypeId === 'terrain' ? 'is-active' : ''}" data-action="set-map-type" data-value="terrain">${escapeHtml(t('mapModeTerrain', lang))}</button>
              </div>

              <button type="button" class="btn btn-outline btn-sm" data-action="load-region-pins">
                ${escapeHtml(t('mapLoadRegionPins', lang))}
              </button>
            </div>

            <form class="map-places-search-form" data-action="search-map-places">
              <input
                type="search"
                name="query"
                class="input-control"
                value="${escapeHtml(searchQuery || '')}"
                placeholder="${escapeHtml(t('mapSearchPlaceholder', lang))}"
                aria-label="${escapeHtml(t('mapSearchPlaceholder', lang))}"
              />
              <button type="submit" class="btn btn-primary btn-sm">${escapeHtml(t('mapSearchBtn', lang))}</button>
              ${
                searchResults.length || searchAttempted
                  ? `<button type="button" class="btn btn-ghost btn-sm" data-action="clear-map-search">${escapeHtml(t('mapClearSearch', lang))}</button>`
                  : ''
              }
            </form>

            ${statusBannerMarkup}

            <div class="google-map-shell">
              <div id="google-map-slot" class="google-map-slot"></div>
            </div>

            ${searchResultsMarkup}

            <div class="map-pin-list">
              ${regionDestList
                .slice(0, 8)
                .map((d) => {
                  const label = lang === 'en' && d.namaEn ? d.namaEn : d.nama;
                  const active = selectedDest && d.id === selectedDest.id;
                  return `<button type="button" class="map-chip-btn ${active ? 'is-active' : ''}" data-action="select-map-dest" data-id="${escapeHtml(d.id)}">${escapeHtml(label)}</button>`;
                })
                .join('')}
            </div>
          </div>

          <div class="map-detail-column">
            ${selectedDestMarkup}
          </div>
        </div>

        <div class="section-divider-space"></div>

        <div class="recommender-box">
          <div class="recommender-header">
            <h3>${escapeHtml(t('pkgRecommenderTitle', lang))}</h3>
          </div>

          <div class="recommender-controls">
            <label class="form-field">
              <span>${escapeHtml(t('pkgBudgetLabel', lang))}</span>
              <input type="number" class="input-control mono-num" min="250000" step="100000" value="${escapeHtml(pkgFilters.maxBudget)}" data-action="pkg-filter-budget" />
            </label>

            <label class="form-field">
              <span>${escapeHtml(t('pkgDurationLabel', lang))}</span>
              <select class="input-control" data-action="pkg-filter-duration">
                <option value="all" ${pkgFilters.duration === 'all' ? 'selected' : ''}>${escapeHtml(t('pkgDurationAny', lang))}</option>
                <option value="1-2" ${pkgFilters.duration === '1-2' ? 'selected' : ''}>1–2 ${lang === 'en' ? 'Days' : 'Hari'}</option>
                <option value="3" ${pkgFilters.duration === '3' ? 'selected' : ''}>3 ${lang === 'en' ? 'Days' : 'Hari'}</option>
                <option value="4-5" ${pkgFilters.duration === '4-5' ? 'selected' : ''}>4–5 ${lang === 'en' ? 'Days' : 'Hari'}</option>
              </select>
            </label>

            <label class="form-field">
              <span>${escapeHtml(t('pkgInterestLabel', lang))}</span>
              <select class="input-control" data-action="pkg-filter-interest">
                <option value="all" ${pkgFilters.interest === 'all' ? 'selected' : ''}>${escapeHtml(t('pkgInterestAll', lang))}</option>
                ${CATEGORIES.map((c) => `<option value="${escapeHtml(c)}" ${pkgFilters.interest === c ? 'selected' : ''}>${escapeHtml(translateCategory(c, lang))}</option>`).join('')}
              </select>
            </label>

            <label class="form-field">
              <span>${escapeHtml(t('pkgRegionLabel', lang))}</span>
              <select class="input-control" data-action="pkg-filter-region">
                <option value="all" ${pkgFilters.region === 'all' ? 'selected' : ''}>${escapeHtml(t('filterRegionAll', lang))}</option>
                ${REGIONS.map((r) => `<option value="${escapeHtml(r)}" ${pkgFilters.region === r ? 'selected' : ''}>${escapeHtml(r)}</option>`).join('')}
              </select>
            </label>
          </div>

          <div class="packages-grid">
            ${packagesMarkup}
          </div>
        </div>
      </div>
    </section>
  `;
}
