import { t } from '../i18n.js';
import {
  calculateItineraryBudget,
  escapeHtml,
  formatRupiah,
  formatRupiahNumeric,
} from '../utils.js';

export function renderItinerarySection(state) {
  const { lang } = state.config;
  const itin = state.itinerary;
  const days = Math.max(1, Math.min(5, Number(itin.jumlahHari) || 1));
  const activeDay = Math.min(days, Math.max(1, Number(state.ui.activeItineraryDay) || 1));

  const budget = calculateItineraryBudget(itin, state.akomodasi);

  const dayTabs = Array.from({ length: days }, (_, i) => {
    const dayNum = i + 1;
    const count = (itin.daftarAktivitas || []).filter((a) => Number(a.hari) === dayNum).length;
    return `
      <button type="button" class="filter-tab ${activeDay === dayNum ? 'is-active' : ''}" data-action="select-itin-day" data-day="${dayNum}">
        ${escapeHtml(t('itinDayTab', lang))} ${dayNum} <span class="mono-num">(${count})</span>
      </button>
    `;
  }).join('');

  const dayActivities = (itin.daftarAktivitas || []).filter((a) => Number(a.hari) === activeDay);

  const activitiesMarkup = dayActivities.length
    ? dayActivities
        .map(
          (act) => `
          <div class="itin-activity-row">
            <div class="itin-act-time mono-num">${escapeHtml(act.waktu || '09:00')}</div>
            <div class="itin-act-main">
              <div class="itin-act-title">${escapeHtml(act.judul)}</div>
              <div class="itin-act-meta">
                <span>${escapeHtml(act.wilayah || 'Aceh')}</span>
                <span aria-hidden="true">·</span>
                <span class="mono-num">${escapeHtml(formatRupiah(act.estimasiBiaya, lang))} / ${lang === 'en' ? 'person' : 'org'}</span>
              </div>
            </div>
            <button type="button" class="btn btn-ghost btn-sm" data-action="remove-itin-activity" data-id="${escapeHtml(act.id)}">
              ${escapeHtml(t('dashDelete', lang))}
            </button>
          </div>
        `
        )
        .join('')
    : `<div class="empty-state-box compact"><p>${escapeHtml(t('itinEmptyDay', lang))}</p></div>`;

  const catalogOptions = state.destinasi
    .map((d) => {
      const label = lang === 'en' && d.namaEn ? d.namaEn : d.nama;
      return `<option value="${escapeHtml(d.id)}">${escapeHtml(label)} (${escapeHtml(d.wilayah)} · ${escapeHtml(formatRupiah(d.estimasiBiaya, lang))})</option>`;
    })
    .join('');

  const stayOptions = state.akomodasi
    .map(
      (a) =>
        `<option value="${escapeHtml(a.id)}" ${itin.akomodasiId === a.id ? 'selected' : ''}>${escapeHtml(a.nama)} — ${escapeHtml(a.wilayah)} (${escapeHtml(formatRupiahNumeric(a.hargaPerMalam))}/mlm)</option>`
    )
    .join('');

  return `
    <section id="itinerary" class="page-section section-tinted">
      <div class="container">
        <div class="section-header">
          <p class="section-index">${escapeHtml(t('itinSectionIndex', lang))}</p>
          <h2 class="section-title">${escapeHtml(t('itinSectionTitle', lang))}</h2>
          <p class="section-desc">${escapeHtml(t('itinSectionDesc', lang))}</p>
        </div>

        <div class="itin-layout-grid">
          <div class="itin-planner-panel">
            <div class="itin-config-grid">
              <label class="form-field span-2">
                <span>${escapeHtml(t('itinTripName', lang))}</span>
                <input type="text" class="input-control" value="${escapeHtml(itin.namaPerjalanan)}" data-action="itin-update-field" data-field="namaPerjalanan" />
              </label>

              <label class="form-field">
                <span>${escapeHtml(t('itinStartDate', lang))}</span>
                <input type="date" class="input-control mono-num" value="${escapeHtml(itin.tanggalMulai)}" data-action="itin-update-field" data-field="tanggalMulai" />
              </label>

              <label class="form-field">
                <span>${escapeHtml(t('itinDays', lang))}</span>
                <select class="input-control mono-num" data-action="itin-update-field" data-field="jumlahHari">
                  ${[1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${days === n ? 'selected' : ''}>${n} ${lang === 'en' ? (n > 1 ? 'Days' : 'Day') : 'Hari'}</option>`).join('')}
                </select>
              </label>

              <label class="form-field">
                <span>${escapeHtml(t('itinTravelers', lang))}</span>
                <input type="number" class="input-control mono-num" min="1" max="30" value="${escapeHtml(itin.jumlahWisatawan)}" data-action="itin-update-field" data-field="jumlahWisatawan" />
              </label>

              <label class="form-field span-2">
                <span>${escapeHtml(t('itinStaySelect', lang))}</span>
                <select class="input-control" data-action="itin-update-field" data-field="akomodasiId">
                  <option value="">${escapeHtml(t('itinNoStay', lang))}</option>
                  ${stayOptions}
                </select>
              </label>

              <label class="form-field">
                <span>${escapeHtml(t('itinMealPerDay', lang))}</span>
                <input type="number" class="input-control mono-num" min="0" step="10000" value="${escapeHtml(itin.estimasiKonsumsiHarian)}" data-action="itin-update-field" data-field="estimasiKonsumsiHarian" />
              </label>

              <label class="form-field">
                <span>${escapeHtml(t('itinTransportTotal', lang))}</span>
                <input type="number" class="input-control mono-num" min="0" step="25000" value="${escapeHtml(itin.estimasiTransport)}" data-action="itin-update-field" data-field="estimasiTransport" />
              </label>
            </div>

            <div class="itin-days-bar" role="tablist">
              ${dayTabs}
            </div>

            <div class="itin-activities-list">
              ${activitiesMarkup}
            </div>

            <div class="itin-add-forms">
              <form class="itin-inline-form" data-action="itin-add-catalog-activity">
                <label class="form-field grow">
                  <span>${escapeHtml(t('itinAddFromCatalog', lang))} (${escapeHtml(t('itinDayTab', lang))} ${activeDay})</span>
                  <select name="destId" class="input-control">
                    ${catalogOptions}
                  </select>
                </label>
                <label class="form-field time-field">
                  <span>${lang === 'en' ? 'Time' : 'Jam'}</span>
                  <input type="time" name="waktu" class="input-control mono-num" value="10:00" />
                </label>
                <button type="submit" class="btn btn-primary btn-sm">${escapeHtml(t('itinAddBtn', lang))}</button>
              </form>

              <form class="itin-inline-form" data-action="itin-add-custom-activity">
                <label class="form-field grow">
                  <span>${escapeHtml(t('itinAddCustomTitle', lang))} (${escapeHtml(t('itinDayTab', lang))} ${activeDay})</span>
                  <input type="text" name="judul" class="input-control" required placeholder="${escapeHtml(t('itinCustomNamePlaceholder', lang))}" />
                </label>
                <label class="form-field time-field">
                  <span>${lang === 'en' ? 'Time' : 'Jam'}</span>
                  <input type="time" name="waktu" class="input-control mono-num" value="14:00" />
                </label>
                <label class="form-field cost-field">
                  <span>${escapeHtml(t('itinCustomCostPlaceholder', lang))}</span>
                  <input type="number" name="estimasiBiaya" class="input-control mono-num" min="0" step="5000" value="0" />
                </label>
                <button type="submit" class="btn btn-outline btn-sm">${escapeHtml(t('itinAddBtn', lang))}</button>
              </form>
            </div>
          </div>

          <aside class="budget-calculator-panel">
            <h3>${escapeHtml(t('itinBudgetTitle', lang))}</h3>
            <p class="budget-disclaimer">${escapeHtml(t('itinBudgetDisclaimer', lang))}</p>

            <dl class="budget-ledger">
              <div class="budget-row">
                <dt>${escapeHtml(t('itinCostDest', lang))} (${budget.travelers} ${lang === 'en' ? 'pax' : 'org'})</dt>
                <dd class="mono-num">${escapeHtml(formatRupiahNumeric(budget.destinationTotal))}</dd>
              </div>
              <div class="budget-row">
                <dt>${escapeHtml(t('itinCostStay', lang))} (${budget.nights} ${lang === 'en' ? 'nights' : 'malam'} × ${budget.roomsNeeded} ${lang === 'en' ? 'rooms' : 'kamar'})</dt>
                <dd class="mono-num">${escapeHtml(formatRupiahNumeric(budget.stayTotal))}</dd>
              </div>
              <div class="budget-row">
                <dt>${escapeHtml(t('itinCostMeals', lang))} (${budget.days} ${lang === 'en' ? 'days' : 'hari'} × ${budget.travelers} ${lang === 'en' ? 'pax' : 'org'})</dt>
                <dd class="mono-num">${escapeHtml(formatRupiahNumeric(budget.mealsTotal))}</dd>
              </div>
              <div class="budget-row">
                <dt>${escapeHtml(t('itinCostTransport', lang))}</dt>
                <dd class="mono-num">${escapeHtml(formatRupiahNumeric(budget.transportTotal))}</dd>
              </div>
              <div class="budget-row is-subtotal">
                <dt>${escapeHtml(t('itinCostPerPerson', lang))}</dt>
                <dd class="mono-num">${escapeHtml(formatRupiahNumeric(budget.perPerson))}</dd>
              </div>
              <div class="budget-row is-total">
                <dt>${escapeHtml(t('itinCostGrandTotal', lang))}</dt>
                <dd class="mono-num">${escapeHtml(formatRupiahNumeric(budget.grandTotal))}</dd>
              </div>
            </dl>

            <div class="budget-actions">
              <button type="button" class="btn btn-primary" data-action="export-itinerary-json">${escapeHtml(t('itinExportBtn', lang))}</button>
              <button type="button" class="btn btn-outline" data-action="print-itinerary">${escapeHtml(t('itinPrintBtn', lang))}</button>
              <button type="button" class="btn btn-ghost" data-action="reset-itinerary">${escapeHtml(t('itinResetBtn', lang))}</button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  `;
}
