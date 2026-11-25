import { CATEGORIES, REGIONS } from '../data.js';
import { t, translateCategory } from '../i18n.js';
import { escapeHtml, formatRupiah } from '../utils.js';

export function getFilteredDestinations(state) {
  const { search, region, category, sort } = state.ui.destFilters;
  const query = search.trim().toLowerCase();

  const filtered = state.destinasi.filter((d) => {
    if (region !== 'all' && d.wilayah !== region) return false;
    if (category !== 'all' && d.kategori !== category) return false;
    if (query) {
      const haystack = [
        d.nama,
        d.namaEn,
        d.wilayah,
        d.kategori,
        d.deskripsi,
        d.deskripsiEn,
        d.alamat,
        ...(d.fasilitas || []),
        ...(d.fasilitasIbadah || []),
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  filtered.sort((a, b) => {
    if (sort === 'cost-asc') return (a.estimasiBiaya || 0) - (b.estimasiBiaya || 0);
    if (sort === 'cost-desc') return (b.estimasiBiaya || 0) - (a.estimasiBiaya || 0);
    if (sort === 'name-asc') return (a.nama || '').localeCompare(b.nama || '', 'id');
    // featured first
    const featDiff = (b.unggulan ? 1 : 0) - (a.unggulan ? 1 : 0);
    if (featDiff !== 0) return featDiff;
    return (a.nama || '').localeCompare(b.nama || '', 'id');
  });

  return filtered;
}

export function renderCatalogSection(state) {
  const { lang } = state.config;
  const { search, region, category, sort } = state.ui.destFilters;
  const items = getFilteredDestinations(state);

  const favIds = new Set(
    state.favorit.filter((f) => f.tipeItem === 'destinasi').map((f) => f.itemId)
  );

  const regionTabs = [
    `<button type="button" class="filter-tab ${region === 'all' ? 'is-active' : ''}" data-action="filter-dest-region" data-value="all">${escapeHtml(t('filterRegionAll', lang))}</button>`,
    ...REGIONS.map(
      (r) =>
        `<button type="button" class="filter-tab ${region === r ? 'is-active' : ''}" data-action="filter-dest-region" data-value="${escapeHtml(r)}">${escapeHtml(r)}</button>`
    ),
  ].join('');

  const categoryTabs = [
    `<button type="button" class="filter-tab ${category === 'all' ? 'is-active' : ''}" data-action="filter-dest-category" data-value="all">${escapeHtml(t('filterCategoryAll', lang))}</button>`,
    ...CATEGORIES.map(
      (c) =>
        `<button type="button" class="filter-tab ${category === c ? 'is-active' : ''}" data-action="filter-dest-category" data-value="${escapeHtml(c)}">${escapeHtml(translateCategory(c, lang))}</button>`
    ),
  ].join('');

  const cardsMarkup = items.length
    ? items
        .map((d) => {
          const title = lang === 'en' && d.namaEn ? d.namaEn : d.nama;
          const desc = lang === 'en' && d.deskripsiEn ? d.deskripsiEn : d.deskripsi;
          const isFav = favIds.has(d.id);
          const prayerHighlight = (d.fasilitasIbadah && d.fasilitasIbadah[0]) || '';

          return `
            <article class="catalog-card" data-dest-id="${escapeHtml(d.id)}">
              <div class="card-media img-fallback-frame" data-fallback-title="${escapeHtml(title)}">
                <img src="${escapeHtml(d.imageUrl || '/src/assets/images/dest_mosque_aceh_1795590639134.jpg')}" alt="${escapeHtml(title)}" loading="lazy" referrerpolicy="no-referrer" />
              </div>

              <div class="card-body">
                <div class="card-meta-line">
                  <span>${escapeHtml(d.wilayah)}</span>
                  <span aria-hidden="true">·</span>
                  <span>${escapeHtml(translateCategory(d.kategori, lang))}</span>
                  ${d.unggulan ? `<span aria-hidden="true">·</span><span class="meta-gold">${escapeHtml(t('featuredTag', lang))}</span>` : ''}
                </div>

                <h3 class="card-title">${escapeHtml(title)}</h3>
                <p class="card-desc">${escapeHtml(desc)}</p>

                <div class="card-prayer-line">
                  <strong>${lang === 'en' ? 'Prayer Access:' : 'Fasilitas Ibadah:'}</strong>
                  <span>${escapeHtml(prayerHighlight)}</span>
                </div>

                <div class="card-verification-note">${escapeHtml(d.statusVerifikasi)}</div>

                <div class="card-price-row">
                  <span class="mono-price">${escapeHtml(formatRupiah(d.estimasiBiaya, lang))}</span>
                  <span class="price-sim-note">${escapeHtml(t('simPriceNote', lang))}</span>
                </div>

                <div class="card-actions">
                  <button type="button" class="btn btn-primary btn-sm" data-action="open-dest-detail" data-id="${escapeHtml(d.id)}">${escapeHtml(t('btnDetail', lang))}</button>
                  <button type="button" class="btn btn-outline btn-sm" data-action="quick-add-itinerary" data-id="${escapeHtml(d.id)}">${escapeHtml(t('btnAddPlan', lang))}</button>
                  <button type="button" class="btn btn-ghost btn-sm ${isFav ? 'is-favorited' : ''}" data-action="toggle-favorite" data-id="${escapeHtml(d.id)}" data-type="destinasi" aria-pressed="${isFav}">
                    ${isFav ? '♥ ' + escapeHtml(t('btnFavorited', lang)) : '♡ ' + escapeHtml(t('btnFavorite', lang))}
                  </button>
                </div>
              </div>
            </article>
          `;
        })
        .join('')
    : `
      <div class="empty-state-box">
        <p>${escapeHtml(t('emptyDestinations', lang))}</p>
        <button type="button" class="btn btn-outline" data-action="reset-dest-filters">${escapeHtml(t('resetFilters', lang))}</button>
      </div>
    `;

  return `
    <section id="destinasi" class="page-section">
      <div class="container">
        <div class="section-header">
          <p class="section-index">${escapeHtml(t('destSectionIndex', lang))}</p>
          <h2 class="section-title">${escapeHtml(t('destSectionTitle', lang))}</h2>
          <p class="section-desc">${escapeHtml(t('destSectionDesc', lang))}</p>
        </div>

        <div class="filter-toolbar">
          <div class="search-sort-row">
            <label class="search-field">
              <span class="sr-only">${escapeHtml(t('searchPlaceholder', lang))}</span>
              <input type="search" id="dest-search-input" class="input-control" value="${escapeHtml(search)}" placeholder="${escapeHtml(t('searchPlaceholder', lang))}" data-action="search-dest" />
            </label>

            <label class="sort-field">
              <span class="sr-only">Sort</span>
              <select class="input-control" data-action="sort-dest">
                <option value="featured" ${sort === 'featured' ? 'selected' : ''}>${escapeHtml(t('sortFeatured', lang))}</option>
                <option value="cost-asc" ${sort === 'cost-asc' ? 'selected' : ''}>${escapeHtml(t('sortCostAsc', lang))}</option>
                <option value="cost-desc" ${sort === 'cost-desc' ? 'selected' : ''}>${escapeHtml(t('sortCostDesc', lang))}</option>
                <option value="name-asc" ${sort === 'name-asc' ? 'selected' : ''}>${escapeHtml(t('sortNameAsc', lang))}</option>
              </select>
            </label>
          </div>

          <div class="filter-group" role="group" aria-label="Filter Wilayah">
            ${regionTabs}
          </div>

          <div class="filter-group" role="group" aria-label="Filter Kategori">
            ${categoryTabs}
          </div>
        </div>

        <div class="results-summary">
          <span class="mono-num">${items.length}</span>
          <span>${lang === 'en' ? 'destinations shown' : 'destinasi ditampilkan'}</span>
        </div>

        <div class="catalog-grid">
          ${cardsMarkup}
        </div>
      </div>
    </section>
  `;
}
