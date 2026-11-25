export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatRupiah(amount, lang = 'id') {
  const num = Number(amount) || 0;
  if (num === 0) {
    return lang === 'en' ? 'Free / Donation' : 'Gratis / Infaq';
  }
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(num));
}

export function formatRupiahNumeric(amount) {
  const num = Number(amount) || 0;
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(num));
}

export function buildMapsSearchUrl(queryText) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryText || 'Aceh Indonesia')}`;
}

export function buildWhatsAppUrl(phone, message) {
  const cleanPhone = String(phone || '6281200000000').replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message || '')}`;
}

export function generateId(prefix = 'item') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function calculateItineraryBudget(itinerary, accommodations = []) {
  const days = Math.max(1, Math.min(5, Number(itinerary.jumlahHari) || 1));
  const travelers = Math.max(1, Number(itinerary.jumlahWisatawan) || 1);
  const nights = Math.max(0, days - 1);

  const activities = Array.isArray(itinerary.daftarAktivitas)
    ? itinerary.daftarAktivitas.filter((a) => Number(a.hari) <= days)
    : [];

  const destinationPerPerson = activities.reduce(
    (sum, act) => sum + Math.max(0, Number(act.estimasiBiaya) || 0),
    0
  );
  const destinationTotal = destinationPerPerson * travelers;

  const selectedStay = accommodations.find((a) => a.id === itinerary.akomodasiId);
  const roomsNeeded = Math.ceil(travelers / 2);
  const stayTotal = selectedStay && nights > 0
    ? (Number(selectedStay.hargaPerMalam) || 0) * nights * roomsNeeded
    : 0;

  const mealPerDay = Math.max(0, Number(itinerary.estimasiKonsumsiHarian) || 0);
  const mealsTotal = mealPerDay * days * travelers;

  const transportTotal = Math.max(0, Number(itinerary.estimasiTransport) || 0);

  const grandTotal = destinationTotal + stayTotal + mealsTotal + transportTotal;
  const perPerson = grandTotal / travelers;

  return {
    days,
    nights,
    roomsNeeded,
    travelers,
    selectedStay,
    destinationTotal,
    stayTotal,
    mealsTotal,
    transportTotal,
    grandTotal,
    perPerson,
  };
}

export function recommendPackages(packages, criteria, lang = 'id') {
  const maxBudget = Number(criteria.maxBudget) || Infinity;
  const durationFilter = criteria.duration || 'all';
  const interestFilter = criteria.interest || 'all';
  const regionFilter = criteria.region || 'all';

  const matches = [];

  for (const pkg of packages) {
    const cost = Number(pkg.estimasiBiaya) || 0;
    const dur = Number(pkg.durasi) || 1;
    const interests = Array.isArray(pkg.minat) ? pkg.minat : [];

    // Hard rules
    if (cost > maxBudget) continue;

    if (durationFilter === '1-2' && dur > 2) continue;
    if (durationFilter === '3' && dur !== 3) continue;
    if (durationFilter === '4-5' && dur < 4) continue;

    if (interestFilter !== 'all' && !interests.includes(interestFilter)) continue;
    if (regionFilter !== 'all' && pkg.wilayahUtama !== regionFilter) continue;

    // Transparent rule explanations (no arbitrary AI percentage)
    const reasons = [];
    reasons.push(
      lang === 'en'
        ? `Within budget (${formatRupiahNumeric(cost)} <= ${formatRupiahNumeric(maxBudget)})`
        : `Sesuai anggaran (${formatRupiahNumeric(cost)} <= ${formatRupiahNumeric(maxBudget)})`
    );
    reasons.push(
      lang === 'en'
        ? `${dur}-day itinerary structure`
        : `Durasi terencana ${dur} hari`
    );
    if (interestFilter !== 'all') {
      reasons.push(
        lang === 'en'
          ? `Matches interest: ${interestFilter}`
          : `Fokus minat: ${interestFilter}`
      );
    } else if (interests.length > 0) {
      reasons.push(
        lang === 'en'
          ? `Covers: ${interests.slice(0, 3).join(', ')}`
          : `Mencakup: ${interests.slice(0, 3).join(', ')}`
      );
    }

    // Deterministic relevance ordering: closer budget fit & more matching destinations
    const budgetUtilization = maxBudget === Infinity ? 0 : cost / maxBudget;
    matches.push({
      pkg,
      reasons,
      sortScore: interests.length * 10 + budgetUtilization * 5,
    });
  }

  matches.sort((a, b) => b.sortScore - a.sortScore);
  return matches;
}
