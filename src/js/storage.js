import {
  SEED_ACCOMMODATIONS,
  SEED_CULINARY,
  SEED_DESTINATIONS,
  SEED_ITINERARY,
  SEED_PACKAGES,
} from './data.js';

const STORAGE_KEYS = {
  destinasi: 'halalexplore_aceh_v1_destinasi',
  kuliner: 'halalexplore_aceh_v1_kuliner',
  akomodasi: 'halalexplore_aceh_v1_akomodasi',
  paketWisata: 'halalexplore_aceh_v1_paket',
  favorit: 'halalexplore_aceh_v1_favorit',
  itinerary: 'halalexplore_aceh_v1_itinerary',
  config: 'halalexplore_aceh_v1_config',
};

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function safeRead(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return clone(fallback);
    const parsed = JSON.parse(raw);
    return parsed ?? clone(fallback);
  } catch {
    return clone(fallback);
  }
}

function safeWrite(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

const LEGACY_IMAGE_MAP = {
  '/images/hero-aceh.svg': '/src/assets/images/hero_baiturrahman_aceh_1795590639116.jpg',
  '/images/baiturrahman.svg': '/src/assets/images/dest_mosque_aceh_1795590639134.jpg',
  '/images/tsunami-museum.svg': '/src/assets/images/dest_tsunami_museum_1795590640183.jpg',
  '/images/sabang-iboih.svg': '/src/assets/images/dest_sabang_iboih_1795590640334.jpg',
  '/images/kilometer-nol.svg': '/src/assets/images/dest_kilometer_nol_1795590640384.jpg',
  '/images/gayo-highlands.svg': '/src/assets/images/dest_gayo_highlands_1795590640695.jpg',
  '/images/rumoh-aceh.svg': '/src/assets/images/dest_rumoh_aceh_1795590641231.jpg',
  '/images/lampuuk-coast.svg': '/src/assets/images/dest_lampuuk_beach_1795590641357.jpg',
  '/images/kuliner-mie-aceh.svg': '/src/assets/images/cul_mie_aceh_1795590641312.jpg',
  '/images/kuliner-kopi-gayo.svg': '/src/assets/images/cul_kopi_gayo_1795590642290.jpg',
  '/images/kuliner-kue-tradisional.svg': '/src/assets/images/cul_kue_aceh_1795590642423.jpg',
  '/images/akomodasi-syariah.svg': '/src/assets/images/stay_syariah_hotel_1795590642816.jpg',
  '/images/akomodasi-resort.svg': '/src/assets/images/stay_sabang_villa_1795590643507.jpg',
};

function migrateLegacyImages(list, key) {
  if (!Array.isArray(list)) return list;
  let changed = false;
  const upgraded = list.map((item) => {
    if (item && item.imageUrl && LEGACY_IMAGE_MAP[item.imageUrl]) {
      changed = true;
      return { ...item, imageUrl: LEGACY_IMAGE_MAP[item.imageUrl] };
    }
    return item;
  });
  if (changed) safeWrite(key, upgraded);
  return upgraded;
}

export function loadInitialState() {
  const rawDestinasi = safeRead(STORAGE_KEYS.destinasi, SEED_DESTINATIONS);
  const rawKuliner = safeRead(STORAGE_KEYS.kuliner, SEED_CULINARY);
  const rawAkomodasi = safeRead(STORAGE_KEYS.akomodasi, SEED_ACCOMMODATIONS);
  const destinasi = migrateLegacyImages(rawDestinasi, STORAGE_KEYS.destinasi);
  const kuliner = migrateLegacyImages(rawKuliner, STORAGE_KEYS.kuliner);
  const akomodasi = migrateLegacyImages(rawAkomodasi, STORAGE_KEYS.akomodasi);
  const paketWisata = safeRead(STORAGE_KEYS.paketWisata, SEED_PACKAGES);
  const favorit = safeRead(STORAGE_KEYS.favorit, [
    {
      id: 'fav-seed-1',
      itemId: 'dest-01',
      tipeItem: 'destinasi',
      tanggalDitambahkan: '2026-11-24',
    },
    {
      id: 'fav-seed-2',
      itemId: 'dest-06',
      tipeItem: 'destinasi',
      tanggalDitambahkan: '2026-11-24',
    },
  ]);
  const itinerary = safeRead(STORAGE_KEYS.itinerary, SEED_ITINERARY);
  const config = safeRead(STORAGE_KEYS.config, { lang: 'id' });

  return {
    destinasi: Array.isArray(destinasi) && destinasi.length ? destinasi : clone(SEED_DESTINATIONS),
    kuliner: Array.isArray(kuliner) && kuliner.length ? kuliner : clone(SEED_CULINARY),
    akomodasi: Array.isArray(akomodasi) && akomodasi.length ? akomodasi : clone(SEED_ACCOMMODATIONS),
    paketWisata: Array.isArray(paketWisata) && paketWisata.length ? paketWisata : clone(SEED_PACKAGES),
    favorit: Array.isArray(favorit) ? favorit : [],
    itinerary: itinerary && typeof itinerary === 'object' ? itinerary : clone(SEED_ITINERARY),
    config: config && (config.lang === 'en' || config.lang === 'id') ? config : { lang: 'id' },
  };
}

export function saveEntity(entityKey, value) {
  if (STORAGE_KEYS[entityKey]) {
    safeWrite(STORAGE_KEYS[entityKey], value);
  }
}

export function resetCatalogSeedData() {
  const fresh = {
    destinasi: clone(SEED_DESTINATIONS),
    kuliner: clone(SEED_CULINARY),
    akomodasi: clone(SEED_ACCOMMODATIONS),
    paketWisata: clone(SEED_PACKAGES),
  };
  saveEntity('destinasi', fresh.destinasi);
  saveEntity('kuliner', fresh.kuliner);
  saveEntity('akomodasi', fresh.akomodasi);
  saveEntity('paketWisata', fresh.paketWisata);
  return fresh;
}

export function getFreshDefaultItinerary() {
  const fresh = clone(SEED_ITINERARY);
  saveEntity('itinerary', fresh);
  return fresh;
}
