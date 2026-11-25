import { t } from '../i18n.js';
import { escapeHtml, formatRupiahNumeric } from '../utils.js';

export function renderDashboardSection(state) {
  const { lang } = state.config;
  const { activeTab, search } = state.ui.dashboard;
  const query = search.trim().toLowerCase();
  const isCurator = state.authUser?.role === 'Kurator Katalog';

  const tabs = [
    { id: 'destinasi', label: t('dashTabDest', lang), count: state.destinasi.length },
    { id: 'kuliner', label: t('dashTabKuliner', lang), count: state.kuliner.length },
    { id: 'akomodasi', label: t('dashTabAkomodasi', lang), count: state.akomodasi.length },
    { id: 'paket', label: t('dashTabPaket', lang), count: state.paketWisata.length },
  ];

  let rowsMarkup = '';
  let tableHeaders = '';

  if (activeTab === 'destinasi') {
    tableHeaders = `
      <th>${lang === 'en' ? 'Name' : 'Nama Destinasi'}</th>
      <th>${lang === 'en' ? 'Region' : 'Wilayah'}</th>
      <th>${lang === 'en' ? 'Category' : 'Kategori'}</th>
      <th class="num-col">${lang === 'en' ? 'Est. Cost' : 'Biaya (Simulasi)'}</th>
      <th>${lang === 'en' ? 'Verification' : 'Verifikasi'}</th>
      <th class="act-col">${lang === 'en' ? 'Actions' : 'Aksi'}</th>
    `;
    const list = state.destinasi.filter((d) =>
      !query || `${d.nama} ${d.wilayah} ${d.kategori}`.toLowerCase().includes(query)
    );
    rowsMarkup = list
      .map(
        (d) => `
      <tr>
        <td><strong>${escapeHtml(d.nama)}</strong>${d.unggulan ? ` <span class="meta-gold">· ${escapeHtml(t('featuredTag', lang))}</span>` : ''}</td>
        <td>${escapeHtml(d.wilayah)}</td>
        <td>${escapeHtml(d.kategori)}</td>
        <td class="num-col mono-num">${escapeHtml(formatRupiahNumeric(d.estimasiBiaya))}</td>
        <td class="muted-cell">${escapeHtml(d.statusVerifikasi)}</td>
        <td class="act-col">
          <button type="button" class="btn btn-outline btn-xs" ${isCurator ? `data-action="open-crud-modal" data-entity="destinasi" data-id="${escapeHtml(d.id)}"` : 'disabled'}>${escapeHtml(t('dashEdit', lang))}</button>
          <button type="button" class="btn btn-ghost btn-xs danger-text" ${isCurator ? `data-action="delete-crud-item" data-entity="destinasi" data-id="${escapeHtml(d.id)}"` : 'disabled'}>${escapeHtml(t('dashDelete', lang))}</button>
        </td>
      </tr>`
      )
      .join('');
  } else if (activeTab === 'kuliner') {
    tableHeaders = `
      <th>${lang === 'en' ? 'Culinary / UMKM Name' : 'Nama Kuliner / UMKM'}</th>
      <th>${lang === 'en' ? 'Region' : 'Wilayah'}</th>
      <th>${lang === 'en' ? 'Halal Status' : 'Status Halal'}</th>
      <th class="num-col">${lang === 'en' ? 'Price' : 'Harga (Simulasi)'}</th>
      <th class="act-col">${lang === 'en' ? 'Actions' : 'Aksi'}</th>
    `;
    const list = state.kuliner.filter((k) =>
      !query || `${k.nama} ${k.wilayah} ${k.statusSertifikasiHalal}`.toLowerCase().includes(query)
    );
    rowsMarkup = list
      .map(
        (k) => `
      <tr>
        <td><strong>${escapeHtml(k.nama)}</strong></td>
        <td>${escapeHtml(k.wilayah)}</td>
        <td>${escapeHtml(k.statusSertifikasiHalal)}</td>
        <td class="num-col mono-num">${escapeHtml(formatRupiahNumeric(k.harga))}</td>
        <td class="act-col">
          <button type="button" class="btn btn-outline btn-xs" ${isCurator ? `data-action="open-crud-modal" data-entity="kuliner" data-id="${escapeHtml(k.id)}"` : 'disabled'}>${escapeHtml(t('dashEdit', lang))}</button>
          <button type="button" class="btn btn-ghost btn-xs danger-text" ${isCurator ? `data-action="delete-crud-item" data-entity="kuliner" data-id="${escapeHtml(k.id)}"` : 'disabled'}>${escapeHtml(t('dashDelete', lang))}</button>
        </td>
      </tr>`
      )
      .join('');
  } else if (activeTab === 'akomodasi') {
    tableHeaders = `
      <th>${lang === 'en' ? 'Accommodation Name' : 'Nama Akomodasi'}</th>
      <th>${lang === 'en' ? 'Region' : 'Wilayah'}</th>
      <th class="num-col">${lang === 'en' ? 'Rate / Night' : 'Harga / Malam'}</th>
      <th>${lang === 'en' ? 'Muslim Facilities' : 'Fasilitas Ramah Muslim'}</th>
      <th class="act-col">${lang === 'en' ? 'Actions' : 'Aksi'}</th>
    `;
    const list = state.akomodasi.filter((a) =>
      !query || `${a.nama} ${a.wilayah}`.toLowerCase().includes(query)
    );
    rowsMarkup = list
      .map(
        (a) => `
      <tr>
        <td><strong>${escapeHtml(a.nama)}</strong></td>
        <td>${escapeHtml(a.wilayah)}</td>
        <td class="num-col mono-num">${escapeHtml(formatRupiahNumeric(a.hargaPerMalam))}</td>
        <td class="muted-cell mono-num">${(a.fasilitasRamahMuslim || []).length} ${lang === 'en' ? 'items' : 'item'}</td>
        <td class="act-col">
          <button type="button" class="btn btn-outline btn-xs" ${isCurator ? `data-action="open-crud-modal" data-entity="akomodasi" data-id="${escapeHtml(a.id)}"` : 'disabled'}>${escapeHtml(t('dashEdit', lang))}</button>
          <button type="button" class="btn btn-ghost btn-xs danger-text" ${isCurator ? `data-action="delete-crud-item" data-entity="akomodasi" data-id="${escapeHtml(a.id)}"` : 'disabled'}>${escapeHtml(t('dashDelete', lang))}</button>
        </td>
      </tr>`
      )
      .join('');
  } else {
    tableHeaders = `
      <th>${lang === 'en' ? 'Package Name' : 'Nama Paket Wisata'}</th>
      <th>${lang === 'en' ? 'Region' : 'Wilayah'}</th>
      <th class="num-col">${lang === 'en' ? 'Duration' : 'Durasi'}</th>
      <th class="num-col">${lang === 'en' ? 'Est. Cost' : 'Estimasi Biaya'}</th>
      <th class="act-col">${lang === 'en' ? 'Actions' : 'Aksi'}</th>
    `;
    const list = state.paketWisata.filter((p) =>
      !query || `${p.nama} ${p.wilayahUtama}`.toLowerCase().includes(query)
    );
    rowsMarkup = list
      .map(
        (p) => `
      <tr>
        <td><strong>${escapeHtml(p.nama)}</strong></td>
        <td>${escapeHtml(p.wilayahUtama)}</td>
        <td class="num-col mono-num">${p.durasi} ${lang === 'en' ? 'd' : 'hari'}</td>
        <td class="num-col mono-num">${escapeHtml(formatRupiahNumeric(p.estimasiBiaya))}</td>
        <td class="act-col">
          <button type="button" class="btn btn-outline btn-xs" ${isCurator ? `data-action="open-crud-modal" data-entity="paket" data-id="${escapeHtml(p.id)}"` : 'disabled'}>${escapeHtml(t('dashEdit', lang))}</button>
          <button type="button" class="btn btn-ghost btn-xs danger-text" ${isCurator ? `data-action="delete-crud-item" data-entity="paket" data-id="${escapeHtml(p.id)}"` : 'disabled'}>${escapeHtml(t('dashDelete', lang))}</button>
        </td>
      </tr>`
      )
      .join('');
  }

  return `
    <section id="dashboard" class="page-section">
      <div class="container">
        <div class="section-header">
          <p class="section-index">${escapeHtml(t('dashSectionIndex', lang))}</p>
          <h2 class="section-title">${escapeHtml(t('dashSectionTitle', lang))}</h2>
          <p class="section-desc">${escapeHtml(t('dashSectionDesc', lang))}</p>
        </div>

        <div class="dashboard-shell">
          <div class="dash-auth-bar ${isCurator ? 'is-unlocked' : ''}">
            ${
              isCurator
                ? `<span class="dash-auth-status">✓ ${escapeHtml(t('dashCuratorActive', lang))}: <strong>${escapeHtml(state.authUser.name)}</strong></span>`
                : `
                  <span class="dash-auth-status">${escapeHtml(t('dashCuratorLocked', lang))}</span>
                  <button type="button" class="btn btn-primary btn-xs" data-action="open-curator-modal">${escapeHtml(t('dashCuratorBtn', lang))}</button>
                `
            }
          </div>

          <div class="dashboard-topbar">
            <div class="filter-group" role="tablist">
              ${tabs
                .map(
                  (tab) => `
                <button type="button" class="filter-tab ${activeTab === tab.id ? 'is-active' : ''}" data-action="switch-dash-tab" data-tab="${tab.id}">
                  ${escapeHtml(tab.label)} <span class="mono-num">(${tab.count})</span>
                </button>`
                )
                .join('')}
            </div>

            <div class="dashboard-actions">
              <input type="search" class="input-control dash-search" value="${escapeHtml(search)}" placeholder="${escapeHtml(t('dashSearchPlaceholder', lang))}" data-action="search-dash" />
              <button type="button" class="btn btn-primary btn-sm" ${isCurator ? `data-action="open-crud-modal" data-entity="${escapeHtml(activeTab)}" data-id=""` : 'disabled'}>
                + ${escapeHtml(t('dashAddNew', lang))}
              </button>
              <button type="button" class="btn btn-outline btn-sm" ${isCurator ? 'data-action="reset-seed-data"' : 'disabled'}>
                ${escapeHtml(t('dashResetSeed', lang))}
              </button>
            </div>
          </div>

          <div class="table-scroll-wrap">
            <table class="data-table">
              <thead>
                <tr>${tableHeaders}</tr>
              </thead>
              <tbody>
                ${rowsMarkup || `<tr><td colspan="6" class="empty-table-cell">${lang === 'en' ? 'No matching rows.' : 'Tidak ada data yang cocok.'}</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  `;
}
