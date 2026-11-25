import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { buildMapsSearchUrl } from './utils.js';

const ATTRIBUTION_ID = 'gmp_mcp_codeassist_v1_aistudio';

let quotaGuardsInstalled = false;
let optionsConfigured = false;
let librariesPromise = null;
let libs = null;

let mapCanvasEl = null;
let mapInstance = null;
let sharedInfoWindow = null;

// Session-scoped in-memory cache of resolved Place locations (never persisted beyond session)
const resolvedPlaceCache = new Map();
const destinationMarkers = new Map(); // destId -> { marker, dest, place }
let searchMarkers = []; // { id, marker, place }

export function installQuotaDefenseGuards() {
  if (quotaGuardsInstalled || typeof window === 'undefined') return;
  quotaGuardsInstalled = true;

  window.gm_authFailure = () => {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  };

  const origError = console.error;
  console.error = (...args) => {
    origError.apply(console, args);
    const msg = args.map((a) => String(a)).join(' ');
    if (msg.includes('OverQuotaMapError') || msg.includes('QuotaExceededError')) {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    }
  };
}

function isQuotaError(err) {
  if (!err) return false;
  const status = err.status || err.code;
  if (status === 429 || status === 'OVER_QUERY_LIMIT' || status === 'RESOURCE_EXHAUSTED') {
    return true;
  }
  const msg = String(err.message || err);
  return (
    msg.includes('OVER_QUERY_LIMIT') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('Quota') ||
    msg.includes('OverQuotaMapError') ||
    msg.includes('429')
  );
}

function getMapsApiKey() {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
}

export function hasMapsApiKey() {
  return Boolean(getMapsApiKey());
}

export function getPersistentMapElement() {
  if (!mapCanvasEl) {
    mapCanvasEl = document.createElement('div');
    mapCanvasEl.id = 'google-map-canvas';
    mapCanvasEl.className = 'google-map-canvas';
    mapCanvasEl.setAttribute('role', 'region');
    mapCanvasEl.setAttribute('aria-label', 'Peta Interaktif Aceh — Google Maps');
  }
  return mapCanvasEl;
}

export function isMapInitialized() {
  return Boolean(mapInstance);
}

async function ensureLibraries(lang = 'id') {
  const apiKey = getMapsApiKey();
  if (!apiKey) {
    throw new Error('MISSING_API_KEY');
  }

  if (!optionsConfigured) {
    setOptions({
      key: apiKey,
      v: 'weekly',
      language: lang === 'en' ? 'en' : 'id',
      region: 'ID',
    });
    optionsConfigured = true;
  }

  if (!librariesPromise) {
    librariesPromise = Promise.all([
      importLibrary('maps'),
      importLibrary('marker'),
      importLibrary('places'),
      importLibrary('core'),
    ])
      .then(([mapsLib, markerLib, placesLib, coreLib]) => {
        libs = {
          Map: mapsLib.Map,
          InfoWindow: mapsLib.InfoWindow,
          AdvancedMarkerElement: markerLib.AdvancedMarkerElement,
          PinElement: markerLib.PinElement,
          Place: placesLib.Place,
          LatLngBounds: coreLib.LatLngBounds,
        };
        return libs;
      })
      .catch((err) => {
        librariesPromise = null;
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        throw err;
      });
  }

  return librariesPromise;
}

async function searchPlaceByQuery(textQuery, lang = 'id', locationBias = null) {
  const { Place } = await ensureLibraries(lang);
  const request = {
    textQuery,
    fields: ['id', 'displayName', 'location', 'formattedAddress'],
    language: lang === 'en' ? 'en' : 'id',
    region: 'id',
    maxResultCount: 1,
    internalUsageAttributionIds: [ATTRIBUTION_ID],
  };

  if (locationBias) {
    request.locationBias = locationBias;
  }

  try {
    const response = await Place.searchByText(request);
    return response?.places?.[0] || null;
  } catch (err) {
    if (isQuotaError(err)) {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    }
    throw err;
  }
}

async function resolveDestinationPlace(dest, lang = 'id') {
  if (!dest) return null;
  if (resolvedPlaceCache.has(dest.id)) {
    return resolvedPlaceCache.get(dest.id);
  }

  const query = `${dest.nama}, ${dest.wilayah}, Aceh, Indonesia`;
  const place = await searchPlaceByQuery(query, lang);
  if (place && place.location) {
    resolvedPlaceCache.set(dest.id, place);
    return place;
  }

  // Fallback query with region anchor if exact venue name didn't return a location
  const regionFallback = await searchPlaceByQuery(`${dest.wilayah}, Aceh, Indonesia`, lang);
  if (regionFallback && regionFallback.location) {
    resolvedPlaceCache.set(dest.id, regionFallback);
    return regionFallback;
  }

  return null;
}

function buildInfoWindowDom({ title, address, subtitle, mapsUrl, lang }) {
  const container = document.createElement('div');
  container.className = 'gmp-infowindow';

  const heading = document.createElement('h4');
  heading.className = 'gmp-iw-title';
  heading.textContent = title || '';
  container.appendChild(heading);

  if (subtitle) {
    const meta = document.createElement('p');
    meta.className = 'gmp-iw-meta';
    meta.textContent = subtitle;
    container.appendChild(meta);
  }

  if (address) {
    const addr = document.createElement('p');
    addr.className = 'gmp-iw-address';
    addr.textContent = address;
    container.appendChild(addr);
  }

  if (mapsUrl) {
    const link = document.createElement('a');
    link.className = 'gmp-iw-link';
    link.href = mapsUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = lang === 'en' ? 'Open in Google Maps ↗' : 'Buka di Google Maps ↗';
    container.appendChild(link);
  }

  return container;
}

function createPin(PinElement, { selected = false, isSearch = false, label = '' } = {}) {
  if (isSearch) {
    return new PinElement({
      background: '#a21caf',
      borderColor: '#701a75',
      glyphColor: '#ffffff',
      glyphText: label || '★',
      scale: selected ? 1.18 : 1.0,
    });
  }

  return new PinElement({
    background: selected ? '#831843' : '#db2777',
    borderColor: selected ? '#500724' : '#9d174d',
    glyphColor: '#ffffff',
    glyphText: label || '',
    scale: selected ? 1.22 : 1.0,
  });
}

function openDestinationInfoWindow(dest, place, marker, lang) {
  if (!sharedInfoWindow || !mapInstance || !marker) return;
  const title = lang === 'en' && dest.namaEn ? dest.namaEn : dest.nama;
  const subtitle = `${dest.wilayah} · ${dest.kategori}`;
  const address = place?.formattedAddress || dest.alamat || '';
  const mapsUrl = dest.mapsUrl || buildMapsSearchUrl(`${dest.nama} ${dest.wilayah} Aceh`);

  sharedInfoWindow.setContent(
    buildInfoWindowDom({ title, address, subtitle, mapsUrl, lang })
  );
  sharedInfoWindow.open({
    map: mapInstance,
    anchor: marker,
    shouldFocus: false,
  });
}

function upsertDestinationMarker(dest, place, { selectedDestId, lang, onSelectDest }) {
  if (!mapInstance || !libs || !place?.location) return null;
  const { AdvancedMarkerElement, PinElement } = libs;
  const isSelected = dest.id === selectedDestId;
  const title = lang === 'en' && dest.namaEn ? dest.namaEn : dest.nama;

  let entry = destinationMarkers.get(dest.id);
  if (!entry) {
    const marker = new AdvancedMarkerElement({
      map: mapInstance,
      position: place.location,
      title,
    });
    const pin = createPin(PinElement, { selected: isSelected, label: '•' });
    marker.append(pin);

    marker.addEventListener('click', () => {
      openDestinationInfoWindow(dest, place, marker, lang);
      mapInstance.panTo(place.location);
      if (typeof onSelectDest === 'function') {
        onSelectDest(dest.id);
      }
    });

    entry = { marker, dest, place };
    destinationMarkers.set(dest.id, entry);
  } else {
    entry.dest = dest;
    entry.place = place;
    entry.marker.map = mapInstance;
    entry.marker.title = title;
    entry.marker.replaceChildren(
      createPin(PinElement, { selected: isSelected, label: '•' })
    );
  }

  return entry;
}

export function refreshMarkerHighlights(selectedDestId, visibleIdsSet = null) {
  if (!libs) return;
  const { PinElement } = libs;
  destinationMarkers.forEach(({ marker, dest }, destId) => {
    const isVisible = !visibleIdsSet || visibleIdsSet.has(destId);
    marker.map = isVisible ? mapInstance : null;
    if (isVisible) {
      marker.replaceChildren(
        createPin(PinElement, { selected: destId === selectedDestId, label: '•' })
      );
    }
  });
}

export async function initOrFocusDestinationMap({
  destinations,
  selectedDest,
  selectedRegion = 'all',
  lang = 'id',
  mapTypeId = 'roadmap',
  onSelectDest,
  onStatusChange,
}) {
  if (!hasMapsApiKey()) {
    onStatusChange?.('missing-key');
    return;
  }

  const targetDest = selectedDest || destinations[0];
  if (!targetDest) return;

  onStatusChange?.('loading');

  try {
    const { Map, InfoWindow } = await ensureLibraries(lang);
    let place = await resolveDestinationPlace(targetDest, lang);

    // If map is not yet created, bootstrap center purely from Google Maps Places API
    if (!mapInstance) {
      let initialCenter = place?.location;
      if (!initialCenter) {
        const acehPlace = await searchPlaceByQuery('Banda Aceh, Aceh, Indonesia', lang);
        initialCenter = acehPlace?.location || null;
      }

      if (!initialCenter) {
        onStatusChange?.('error');
        return;
      }

      const mapEl = getPersistentMapElement();
      mapInstance = new Map(mapEl, {
        center: initialCenter,
        zoom: place?.location ? 14 : 11,
        mapId: 'DEMO_MAP_ID',
        mapTypeId: mapTypeId || 'roadmap',
        gestureHandling: 'cooperative',
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        internalUsageAttributionIds: [ATTRIBUTION_ID],
      });

      sharedInfoWindow = new InfoWindow({ maxWidth: 310 });
    } else if (mapTypeId && mapInstance.getMapTypeId() !== mapTypeId) {
      mapInstance.setMapTypeId(mapTypeId);
    }

    if (place?.location) {
      const entry = upsertDestinationMarker(targetDest, place, {
        selectedDestId: targetDest.id,
        lang,
        onSelectDest,
      });

      const visibleIds = new Set(
        destinations
          .filter((d) => selectedRegion === 'all' || d.wilayah === selectedRegion)
          .map((d) => d.id)
      );
      visibleIds.add(targetDest.id);
      refreshMarkerHighlights(targetDest.id, visibleIds);

      mapInstance.panTo(place.location);
      if ((mapInstance.getZoom() || 0) < 12) {
        mapInstance.setZoom(13);
      }

      if (entry) {
        openDestinationInfoWindow(targetDest, place, entry.marker, lang);
      }
    }

    onStatusChange?.('ready');
  } catch (err) {
    if (isQuotaError(err)) {
      onStatusChange?.('quota');
    } else {
      onStatusChange?.('error');
    }
  }
}

export async function loadRegionDestinationsOnMap({
  destinations,
  selectedRegion,
  selectedDestId,
  lang = 'id',
  onSelectDest,
  onStatusChange,
}) {
  if (!hasMapsApiKey()) {
    onStatusChange?.('missing-key');
    return;
  }

  const targetList = destinations
    .filter((d) => selectedRegion === 'all' || d.wilayah === selectedRegion)
    .slice(0, 6);

  if (!targetList.length) return;

  onStatusChange?.('loading');

  try {
    const { LatLngBounds } = await ensureLibraries(lang);
    if (!mapInstance) {
      await initOrFocusDestinationMap({
        destinations,
        selectedDest: targetList[0],
        selectedRegion,
        lang,
        onSelectDest,
        onStatusChange,
      });
    }

    const bounds = new LatLngBounds();
    let count = 0;

    for (const dest of targetList) {
      const place = await resolveDestinationPlace(dest, lang);
      if (place?.location) {
        upsertDestinationMarker(dest, place, {
          selectedDestId,
          lang,
          onSelectDest,
        });
        bounds.extend(place.location);
        count += 1;
      }
    }

    const visibleIds = new Set(targetList.map((d) => d.id));
    refreshMarkerHighlights(selectedDestId, visibleIds);

    if (count > 1 && mapInstance) {
      mapInstance.fitBounds(bounds, 48);
    } else if (count === 1 && mapInstance) {
      const onlyPlace = resolvedPlaceCache.get(targetList[0].id);
      if (onlyPlace?.location) {
        mapInstance.panTo(onlyPlace.location);
        mapInstance.setZoom(13);
      }
    }

    onStatusChange?.('ready');
  } catch (err) {
    if (isQuotaError(err)) {
      onStatusChange?.('quota');
    } else {
      onStatusChange?.('error');
    }
  }
}

export function clearSearchMarkers() {
  searchMarkers.forEach(({ marker }) => {
    marker.map = null;
  });
  searchMarkers = [];
}

export async function searchMuslimFriendlyPlacesOnMap({
  query,
  lang = 'id',
  onStatusChange,
}) {
  const trimmed = String(query || '').trim();
  if (!trimmed) return [];
  if (!hasMapsApiKey()) {
    onStatusChange?.('missing-key');
    return [];
  }

  onStatusChange?.('loading');

  try {
    const { Place, AdvancedMarkerElement, PinElement, LatLngBounds } =
      await ensureLibraries(lang);

    if (!mapInstance) {
      const anchor = await searchPlaceByQuery('Banda Aceh, Aceh, Indonesia', lang);
      if (!anchor?.location) {
        onStatusChange?.('error');
        return [];
      }
      const { Map, InfoWindow } = libs;
      mapInstance = new Map(getPersistentMapElement(), {
        center: anchor.location,
        zoom: 12,
        mapId: 'DEMO_MAP_ID',
        mapTypeId: 'roadmap',
        gestureHandling: 'cooperative',
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        internalUsageAttributionIds: [ATTRIBUTION_ID],
      });
      sharedInfoWindow = new InfoWindow({ maxWidth: 310 });
    }

    const request = {
      textQuery: trimmed.toLowerCase().includes('aceh') || trimmed.toLowerCase().includes('sabang')
        ? trimmed
        : `${trimmed} Aceh, Indonesia`,
      fields: ['id', 'displayName', 'location', 'formattedAddress'],
      locationBias: mapInstance.getCenter() || undefined,
      language: lang === 'en' ? 'en' : 'id',
      region: 'id',
      maxResultCount: 6,
      internalUsageAttributionIds: [ATTRIBUTION_ID],
    };

    const { places = [] } = await Place.searchByText(request);
    clearSearchMarkers();

    if (!places.length) {
      onStatusChange?.('ready');
      return [];
    }

    const bounds = new LatLngBounds();
    const results = [];

    places.forEach((place, idx) => {
      if (!place?.location) return;
      const title = place.displayName || trimmed;
      const address = place.formattedAddress || '';
      const mapsUrl = buildMapsSearchUrl(`${title} ${address}`);

      const marker = new AdvancedMarkerElement({
        map: mapInstance,
        position: place.location,
        title,
      });
      marker.append(
        createPin(PinElement, {
          isSearch: true,
          label: String(idx + 1),
        })
      );

      marker.addEventListener('click', () => {
        if (!sharedInfoWindow) return;
        sharedInfoWindow.setContent(
          buildInfoWindowDom({
            title,
            address,
            subtitle: lang === 'en' ? 'Google Maps Place Result' : 'Hasil Pencarian Google Maps',
            mapsUrl,
            lang,
          })
        );
        sharedInfoWindow.open({
          map: mapInstance,
          anchor: marker,
          shouldFocus: false,
        });
        mapInstance.panTo(place.location);
      });

      searchMarkers.push({ id: place.id, marker, place });
      bounds.extend(place.location);

      results.push({
        id: place.id,
        index: idx + 1,
        displayName: title,
        formattedAddress: address,
        mapsUrl,
      });
    });

    if (results.length > 1) {
      mapInstance.fitBounds(bounds, 48);
    } else if (results.length === 1 && searchMarkers[0]?.place?.location) {
      mapInstance.panTo(searchMarkers[0].place.location);
      mapInstance.setZoom(14);
    }

    onStatusChange?.('ready');
    return results;
  } catch (err) {
    if (isQuotaError(err)) {
      onStatusChange?.('quota');
    } else {
      onStatusChange?.('error');
    }
    return [];
  }
}

export function focusSearchMarkerById(placeId, lang = 'id') {
  const match = searchMarkers.find((item) => item.id === placeId);
  if (!match || !mapInstance || !sharedInfoWindow) return;
  const { place, marker } = match;
  const title = place.displayName || '';
  const address = place.formattedAddress || '';
  const mapsUrl = buildMapsSearchUrl(`${title} ${address}`);

  mapInstance.panTo(place.location);
  if ((mapInstance.getZoom() || 0) < 14) {
    mapInstance.setZoom(14);
  }
  sharedInfoWindow.setContent(
    buildInfoWindowDom({
      title,
      address,
      subtitle: lang === 'en' ? 'Google Maps Place Result' : 'Hasil Pencarian Google Maps',
      mapsUrl,
      lang,
    })
  );
  sharedInfoWindow.open({
    map: mapInstance,
    anchor: marker,
    shouldFocus: false,
  });
}

export function setAcehMapType(mapTypeId) {
  if (mapInstance && mapTypeId) {
    mapInstance.setMapTypeId(mapTypeId);
  }
}
