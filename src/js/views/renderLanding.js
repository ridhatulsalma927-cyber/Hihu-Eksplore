import { t } from '../i18n.js';
import { escapeHtml } from '../utils.js';

export function renderHeaderAndUtility(state) {
  const { lang } = state.config;
  const favCount = state.favorit.length;

  return `
    <header class="site-header">
      <div class="container header-inner">
        <a href="#top" class="brand-wordmark" data-nav="top">${escapeHtml(t('brand', lang))}</a>

        <nav class="main-nav" aria-label="Navigasi Utama">
          <a href="#destinasi" class="nav-link" data-nav="destinasi">${escapeHtml(t('navDestinations', lang))}</a>
          <a href="#kuliner-inap" class="nav-link" data-nav="kuliner-inap">${escapeHtml(t('navCulinaryStay', lang))}</a>
          <a href="#peta-paket" class="nav-link" data-nav="peta-paket">${escapeHtml(t('navMapPackages', lang))}</a>
          <a href="#itinerary" class="nav-link" data-nav="itinerary">${escapeHtml(t('navItinerary', lang))}</a>
          <a href="#dashboard" class="nav-link" data-nav="dashboard">${escapeHtml(t('navDashboard', lang))}</a>
        </nav>

        <div class="header-cta-wrap">
          ${
            state.authUser
              ? `
                <button type="button" class="btn btn-outline btn-sm header-user-btn" data-action="open-auth-modal" title="${escapeHtml(state.authUser.email)}">
                  <span class="user-avatar-chip" aria-hidden="true">${escapeHtml((state.authUser.name || 'U').trim().charAt(0).toUpperCase())}</span>
                  <span class="header-user-name">${escapeHtml(state.authUser.name)}</span>
                </button>
              `
              : `
                <button type="button" class="btn btn-outline btn-sm" data-action="open-auth-modal">
                  ${escapeHtml(t('authLoginBtn', lang))}
                </button>
              `
          }
          <a href="#itinerary" class="btn btn-primary" data-nav="itinerary">${escapeHtml(t('navPrimaryCta', lang))}</a>
          <button type="button" class="mobile-menu-btn" data-action="toggle-mobile-menu" aria-label="Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      ${state.ui.mobileMenuOpen ? `
        <div class="mobile-nav-drawer">
          <a href="#destinasi" class="mobile-nav-link" data-nav="destinasi">${escapeHtml(t('navDestinations', lang))}</a>
          <a href="#kuliner-inap" class="mobile-nav-link" data-nav="kuliner-inap">${escapeHtml(t('navCulinaryStay', lang))}</a>
          <a href="#peta-paket" class="mobile-nav-link" data-nav="peta-paket">${escapeHtml(t('navMapPackages', lang))}</a>
          <a href="#itinerary" class="mobile-nav-link" data-nav="itinerary">${escapeHtml(t('navItinerary', lang))}</a>
          <a href="#dashboard" class="mobile-nav-link" data-nav="dashboard">${escapeHtml(t('navDashboard', lang))}</a>
          <button type="button" class="mobile-nav-link mobile-auth-link" data-action="open-auth-modal">
            ${state.authUser ? `${escapeHtml(t('authProfileBtn', lang))}: ${escapeHtml(state.authUser.name)}` : escapeHtml(t('authLoginBtn', lang))}
          </button>
        </div>
      ` : ''}
    </header>

    <div class="utility-ribbon" id="top">
      <div class="container utility-inner">
        <p class="utility-note">${escapeHtml(t('utilityNote', lang))}</p>
        <div class="utility-controls">
          ${
            state.authUser
              ? `
                <button type="button" class="utility-btn is-user" data-action="open-auth-modal" title="${escapeHtml(state.authUser.email)}">
                  <span>${escapeHtml(state.authUser.name)}</span>
                  <span class="mono-count">(${escapeHtml(state.authUser.role)})</span>
                </button>
                <button type="button" class="utility-btn" data-action="logout-user">
                  ${escapeHtml(t('authLogoutBtn', lang))}
                </button>
              `
              : `
                <button type="button" class="utility-btn" data-action="open-auth-modal">
                  ${escapeHtml(t('authLoginBtn', lang))} / ${escapeHtml(t('authTabRegister', lang))}
                </button>
              `
          }
          <button type="button" class="utility-btn" data-action="open-favorites">
            <span>${escapeHtml(t('favoritesLabel', lang))}</span>
            <span class="mono-count">(${favCount})</span>
          </button>
          <div class="segmented-switch" role="group" aria-label="${escapeHtml(t('langSwitchLabel', lang))}">
            <button type="button" class="seg-btn ${lang === 'id' ? 'is-active' : ''}" data-action="set-lang" data-lang="id">ID</button>
            <button type="button" class="seg-btn ${lang === 'en' ? 'is-active' : ''}" data-action="set-lang" data-lang="en">EN</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderLandingHeroAndTrust(state) {
  const { lang } = state.config;
  const destCount = state.destinasi.length;
  const umkmCount = state.kuliner.length;

  const fact2Val = lang === 'en'
    ? `${destCount} Spots · ${umkmCount} UMKM`
    : `${destCount} Destinasi · ${umkmCount} UMKM`;

  return `
    <section class="hero-section">
      <div class="container">
        <div class="hero-grid">
          <div class="hero-copy">
            <p class="editorial-kicker">${escapeHtml(t('heroEyebrow', lang))}</p>
            <h1 class="hero-title">${escapeHtml(t('heroTitle', lang))}</h1>
            <p class="hero-subtitle">${escapeHtml(t('heroSubtitle', lang))}</p>
            <div class="hero-actions">
              <a href="#destinasi" class="btn btn-primary btn-lg" data-nav="destinasi">${escapeHtml(t('heroPrimaryBtn', lang))}</a>
              <a href="#peta-paket" class="btn btn-outline btn-lg" data-nav="peta-paket">${escapeHtml(t('heroSecondaryBtn', lang))}</a>
            </div>
          </div>

          <figure class="hero-media">
            <div class="img-fallback-frame hero-frame">
              <img src="/src/assets/images/hero_baiturrahman_aceh_1795590639116.jpg" alt="${escapeHtml(t('heroTitle', lang))}" referrerpolicy="no-referrer" />
            </div>
            <figcaption class="figure-caption">
              ${lang === 'en'
                ? 'Fig. 1 — Masjid Raya Baiturrahman & Banda Aceh golden-hour courtyard.'
                : 'Foto 1 — Pelataran Masjid Raya Baiturrahman Banda Aceh pada senja hari.'}
            </figcaption>
          </figure>
        </div>

        <div class="aceh-motif-divider" aria-hidden="true">
          <svg viewBox="0 0 1200 24" preserveAspectRatio="none">
            <line x1="0" y1="12" x2="540" y2="12" stroke="#D88AA5" stroke-width="1" stroke-opacity="0.55"/>
            <polygon points="560,12 572,4 584,12 572,20" fill="none" stroke="#D88AA5" stroke-width="1.2"/>
            <polygon points="588,12 600,2 612,12 600,22" fill="#BE185D" fill-opacity="0.2" stroke="#D88AA5" stroke-width="1.4"/>
            <polygon points="616,12 628,4 640,12 628,20" fill="none" stroke="#D88AA5" stroke-width="1.2"/>
            <line x1="660" y1="12" x2="1200" y2="12" stroke="#D88AA5" stroke-width="1" stroke-opacity="0.55"/>
          </svg>
        </div>

        <div class="hero-facts-strip">
          <div class="fact-cell">
            <span class="fact-label">${escapeHtml(t('heroFact1Label', lang))}</span>
            <span class="fact-value">${escapeHtml(t('heroFact1Value', lang))}</span>
          </div>
          <div class="fact-cell">
            <span class="fact-label">${escapeHtml(t('heroFact2Label', lang))}</span>
            <span class="fact-value mono-num">${escapeHtml(fact2Val)}</span>
          </div>
          <div class="fact-cell">
            <span class="fact-label">${escapeHtml(t('heroFact3Label', lang))}</span>
            <span class="fact-value">${escapeHtml(t('heroFact3Value', lang))}</span>
          </div>
          <div class="fact-cell">
            <span class="fact-label">${escapeHtml(t('heroFact4Label', lang))}</span>
            <span class="fact-value">${escapeHtml(t('heroFact4Value', lang))}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="trust-band">
      <div class="container">
        <h2 class="trust-heading">${escapeHtml(t('trustTitle', lang))}</h2>
        <div class="trust-grid">
          <article class="trust-item">
            <h3>${escapeHtml(t('trustCard1Title', lang))}</h3>
            <p>${escapeHtml(t('trustCard1Desc', lang))}</p>
          </article>
          <article class="trust-item">
            <h3>${escapeHtml(t('trustCard2Title', lang))}</h3>
            <p>${escapeHtml(t('trustCard2Desc', lang))}</p>
          </article>
          <article class="trust-item">
            <h3>${escapeHtml(t('trustCard3Title', lang))}</h3>
            <p>${escapeHtml(t('trustCard3Desc', lang))}</p>
          </article>
        </div>
      </div>
    </section>
  `;
}
