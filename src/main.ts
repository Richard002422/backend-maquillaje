import './style.css'
import { LOOKS, PRODUCTS } from './data.ts'

type AiCategory = 'Natural' | 'Radiante' | 'Diario'

type AiLookPreset = {
  id: string
  label: string
  category: AiCategory
  sourceLookId: string
  previewGradient: string
}

const AI_LOOK_PRESETS: AiLookPreset[] = [
  {
    id: 'glow-natural',
    label: 'Glow Natural',
    category: 'Natural',
    sourceLookId: 'natural',
    previewGradient: 'linear-gradient(135deg, #f6e7dc 0%, #eabfae 45%, #d7a48e 100%)',
  },
  {
    id: 'soft-radiance',
    label: 'Soft Radiance',
    category: 'Radiante',
    sourceLookId: 'minimal',
    previewGradient: 'linear-gradient(135deg, #f9f1ec 0%, #f0d1c5 50%, #dfa5b0 100%)',
  },
  {
    id: 'daily-fresh',
    label: 'Daily Fresh',
    category: 'Diario',
    sourceLookId: 'natural',
    previewGradient: 'linear-gradient(135deg, #f8eee6 0%, #e7d2c8 50%, #cfb2a2 100%)',
  },
  {
    id: 'editorial-glow',
    label: 'Editorial Glow',
    category: 'Radiante',
    sourceLookId: 'editorial',
    previewGradient: 'linear-gradient(135deg, #2f2233 0%, #8f3d66 50%, #e2b27f 100%)',
  },
  {
    id: 'city-day',
    label: 'City Day',
    category: 'Diario',
    sourceLookId: 'minimal',
    previewGradient: 'linear-gradient(135deg, #f5efea 0%, #e1d5cf 50%, #c7b6ad 100%)',
  },
]

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

type RecommendationApiProduct = {
  id: string
  name: string
  category: string
}

type RecommendationApiResponse = {
  source: 'ai' | 'fallback'
  productIds?: string[]
  products: RecommendationApiProduct[]
}

function productImageDataUri(name: string, swatch: string): string {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 220 150'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='${swatch}'/><stop offset='100%' stop-color='#ffffff'/></linearGradient></defs><rect width='220' height='150' fill='url(#g)'/><circle cx='110' cy='70' r='42' fill='rgba(255,255,255,0.78)'/><text x='110' y='80' text-anchor='middle' font-family='Outfit,Arial' font-size='28' fill='#4a4248'>${initials}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function ratingStars(rating: number): string {
  const full = Math.round(rating)
  return '★'.repeat(full).padEnd(5, '☆')
}

function looksHtml(): string {
  return LOOKS.map(
    (look) => `
    <article class="look-card" data-look-id="${look.id}">
      <div class="look-card__visual" style="background:${look.gradient}" aria-hidden="true"></div>
      <div class="look-card__body">
        <h3 class="look-card__title">${look.name}</h3>
        <p class="look-card__tagline">${look.tagline}</p>
        <button type="button" class="btn btn--ghost look-card__use">Usar en prueba</button>
      </div>
    </article>
  `,
  ).join('')
}

/** Slug único por URL (#/slug) para “página” de cada categoría. */
const MAKEUP_MENU: { label: string; filter: string; slug: string }[] = [
  { label: 'Ver todo el catálogo', filter: '', slug: 'catalogo' },
  { label: 'Labiales', filter: 'Labios', slug: 'labiales' },
  { label: 'Bases y primers', filter: 'Rostro', slug: 'bases-y-primers' },
  { label: 'Sombras de ojos', filter: 'Ojos', slug: 'sombras-de-ojos' },
  { label: 'Rubor e iluminadores', filter: 'Rostro', slug: 'rubor-e-iluminadores' },
  { label: 'Skincare', filter: 'Skincare', slug: 'skincare' },
  { label: 'Delineadores', filter: 'Ojos', slug: 'delineadores' },
  { label: 'Cejas y pestañas', filter: 'Ojos', slug: 'cejas-y-pestanas' },
]

const CATALOG_SLUG_LOOKUP = MAKEUP_MENU.reduce<Record<string, { filter: string; label: string }>>((acc, row) => {
  acc[row.slug] = { filter: row.filter, label: row.label }
  return acc
}, {})

const DEFAULT_CATALOG_TITLE = 'Productos destacados'
const DEFAULT_CATALOG_SUBTITLE = 'IA → prueba → recomendación → compra, todo dentro del mismo flujo.'

function makeupMenuHtml(): string {
  return MAKEUP_MENU.map(
    (item) => `
    <li class="nav-dropdown__item">
      <button type="button" class="nav-dropdown__link" data-nav-slug="${item.slug}">
        ${item.label}
      </button>
    </li>
  `,
  ).join('')
}

function productCardHtml(productId: string, featured = false): string {
  const p = PRODUCTS.find((item) => item.id === productId)
  if (!p) return ''
  return `
    <article class="product-card${featured ? ' product-card--featured' : ''}" data-product-id="${p.id}" data-product-category="${p.category}" data-search="${`${p.name} ${p.category}`.toLowerCase()}">
      <img class="product-card__image" src="${productImageDataUri(p.name, p.swatch)}" alt="${p.name}" loading="lazy" />
      <div class="product-card__content">
        <p class="product-card__cat">${p.category}</p>
        <h3 class="product-card__name">${p.name}</h3>
        <p class="product-card__rating" aria-label="Rating ${p.rating} de 5">${ratingStars(p.rating)} <span>${p.rating.toFixed(1)}</span></p>
        <p class="product-card__price">${p.price}</p>
      </div>
      <div class="product-card__actions">
        <button type="button" class="btn btn--icon product-card__favorite" data-action="toggle-favorite" data-product-id="${p.id}" aria-label="Añadir ${p.name} a favoritos">❤️</button>
        <button type="button" class="btn btn--add product-card__add" data-action="add-to-cart" data-product-id="${p.id}" aria-label="Añadir ${p.name} al carrito">+</button>
      </div>
    </article>
  `
}

function productsHtml(): string {
  return PRODUCTS.map((p) => productCardHtml(p.id)).join('')
}

function featuredProductsHtml(productIds: string[]): string {
  const uniqueIds = Array.from(new Set(productIds)).filter((id) => PRODUCTS.some((product) => product.id === id))
  const fallback = PRODUCTS.slice(0, 3).map((product) => product.id)
  const finalIds = (uniqueIds.length > 0 ? uniqueIds : fallback).slice(0, 3)
  return finalIds.map((id) => productCardHtml(id, true)).join('')
}

function aiPresetsHtml(): string {
  return AI_LOOK_PRESETS.map(
    (preset, index) => `
      <button
        type="button"
        class="ai-mini-preview${index === 0 ? ' ai-mini-preview--active' : ''}"
        data-ai-preset-id="${preset.id}"
        data-ai-look-id="${preset.sourceLookId}"
        data-ai-category="${preset.category}"
        aria-label="Vista previa ${preset.label}"
      >
        <span class="ai-mini-preview__face" style="background:${preset.previewGradient}" aria-hidden="true"></span>
        <span class="ai-mini-preview__name">${preset.label}</span>
      </button>
    `,
  ).join('')
}

function heroMiniPreviewsHtml(): string {
  return AI_LOOK_PRESETS.slice(0, 4)
    .map(
      (preset) => `
      <span class="hero-ai-card__preview" style="background:${preset.previewGradient}" aria-label="${preset.label}"></span>
    `,
    )
    .join('')
}

const appHtml = `
  <a href="#/" class="skip-link">Ir al contenido</a>
  <header class="site-header">
    <div class="site-header__inner">
      <a href="#/" class="logo" aria-label="Inicio — GlowLab IA">
        <span class="logo__mark" aria-hidden="true"></span>
        <span class="logo__text">GlowLab <em>IA</em></span>
      </a>
      <button type="button" class="hamburger" id="hamburger-menu" aria-label="Abrir menú de categorías" aria-expanded="false" aria-controls="nav-dropdown" aria-haspopup="true">
        <span class="hamburger__line" aria-hidden="true"></span>
        <span class="hamburger__line" aria-hidden="true"></span>
        <span class="hamburger__line" aria-hidden="true"></span>
      </button>
      <nav class="nav" aria-label="Principal">
        <a href="#/">Inicio</a>
        <a href="#/estilos">Estilos</a>
        <a href="#/prueba">Prueba virtual</a>
        <a href="#/catalogo">Catálogo</a>
      </nav>
      <div class="header-icons" aria-label="Acciones rápidas">
        <button type="button" class="btn btn--icon header-icons__btn" id="btn-search" aria-label="Buscar productos o looks">🔍</button>
        <button type="button" class="btn btn--icon header-icons__btn" id="btn-favorites" aria-label="Ver favoritos">❤️<span id="favorites-count" class="icon-badge" hidden>0</span></button>
        <button type="button" class="btn btn--icon header-icons__btn" id="btn-cart" aria-label="Ver carrito">🛍️<span id="cart-count" class="icon-badge">0</span></button>
      </div>
      <button type="button" class="btn btn--primary nav__cta" data-action="cta-header">Empezar</button>
    </div>
    <div id="nav-dropdown" class="nav-dropdown" role="dialog" aria-label="Tipos de maquillaje" hidden>
      <p class="nav-dropdown__heading">Maquillaje por categoría</p>
      <ul class="nav-dropdown__list">
        ${makeupMenuHtml()}
      </ul>
    </div>
    <div id="nav-dropdown-backdrop" class="nav-dropdown__backdrop" hidden aria-hidden="true"></div>
    <div class="header-search" id="header-search" hidden>
      <label for="search-input" class="sr-only">Buscar productos o looks</label>
      <input type="search" id="search-input" class="header-search__input" placeholder="Buscar looks, categorías o productos..." />
    </div>
  </header>

  <main id="contenido">
    <section id="inicio" class="hero" aria-labelledby="hero-title">
      <div class="hero__grid">
        <div class="hero__copy">
          <p class="eyebrow">Maquillaje asistido por IA</p>
          <h1 id="hero-title" class="hero__title">Tu mejor look, creado por <span>IA</span></h1>
          <p class="hero__lead">
            Descubre estilos que realzan tu belleza. Prueba looks, recibe recomendaciones personalizadas y encuentra productos perfectos para ti.
          </p>
          <div class="hero__actions">
            <a href="#/prueba" class="btn btn--primary">Probar ahora</a>
            <a href="#/estilos" class="btn btn--outline">Ver estilos</a>
          </div>
        </div>
        <div class="hero__visual" aria-hidden="true">
          <div class="hero__photo"></div>
          <div class="hero-ai-card">
            <p class="hero-ai-card__eyebrow">Tu look ideal</p>
            <h3 class="hero-ai-card__title">Glow Natural</h3>
            <div class="hero-ai-card__categories">
              <span>Natural</span>
              <span>Radiante</span>
              <span>Diario</span>
            </div>
            <div class="hero-ai-card__previews">
              ${heroMiniPreviewsHtml()}
            </div>
            <button type="button" class="btn btn--primary hero-ai-card__cta" id="btn-try-look-hero">✨ Probar este look</button>
          </div>
        </div>
      </div>
    </section>

    <section id="estilos" class="section section--looks" aria-labelledby="looks-title">
      <div class="section__head">
        <h2 id="looks-title" class="section__title">Estilos destacados</h2>
        <p class="section__subtitle">Cuatro direcciones creativas listas para aplicar sobre tu foto.</p>
      </div>
      <div class="looks-grid">
        ${looksHtml()}
      </div>
    </section>

    <section id="prueba" class="section section--tryon" aria-labelledby="tryon-title">
      <div class="tryon">
        <div class="tryon__intro">
          <h2 id="tryon-title" class="section__title">Prueba virtual</h2>
          <p class="section__subtitle">
            Selecciona una imagen frontal y un estilo. La generación con IA se conectará desde tu backend cuando lo tengas listo.
          </p>
        </div>
        <div class="tryon__panel">
          <div class="upload" id="upload-zone">
            <input type="file" id="photo-input" accept="image/*" class="upload__input" aria-label="Elegir foto" />
            <div class="upload__placeholder" id="upload-placeholder">
              <span class="upload__icon" aria-hidden="true">+</span>
              <span class="upload__text">Arrastra una foto o haz clic</span>
              <span class="upload__hint">JPG o PNG, rostro visible</span>
            </div>
            <img id="preview-img" class="upload__preview" alt="Vista previa de tu foto" hidden />
          </div>
          <div class="tryon__controls">
            <p class="field-label">Estilo activo</p>
            <div class="chips" id="style-chips" role="group" aria-label="Estilo de maquillaje">
              ${LOOKS.map(
                (l, i) =>
                  `<button type="button" class="chip${i === 0 ? ' chip--active' : ''}" data-look="${l.id}">${l.name}</button>`,
              ).join('')}
            </div>
            <button type="button" class="btn btn--primary btn--block" id="btn-generate">Generar vista previa</button>
            <p class="tryon__note">Vista previa simulada en el front: enlaza aquí tu API de IA cuando esté disponible.</p>
          </div>
        </div>
      </div>
    </section>

    <section id="catalogo" class="section" aria-labelledby="catalog-title">
      <nav id="catalog-breadcrumb" class="breadcrumb" aria-label="Ubicación" hidden>
        <a href="#/">Inicio</a>
      </nav>
      <div class="section__head">
        <h2 id="catalog-title" class="section__title">${DEFAULT_CATALOG_TITLE}</h2>
        <p id="catalog-subtitle" class="section__subtitle">${DEFAULT_CATALOG_SUBTITLE}</p>
      </div>
      <div class="conversion-bar" aria-label="Beneficios de compra">
        <article class="conversion-pill">
          <span class="conversion-pill__icon" aria-hidden="true">🚚</span>
          <div>
            <p class="conversion-pill__title">Envío gratis</p>
            <p class="conversion-pill__copy">En pedidos seleccionados y promociones IA.</p>
          </div>
        </article>
        <article class="conversion-pill">
          <span class="conversion-pill__icon" aria-hidden="true">↩️</span>
          <div>
            <p class="conversion-pill__title">Devoluciones fáciles</p>
            <p class="conversion-pill__copy">Proceso simple y rápido desde tu perfil.</p>
          </div>
        </article>
        <article class="conversion-pill">
          <span class="conversion-pill__icon" aria-hidden="true">🔒</span>
          <div>
            <p class="conversion-pill__title">Pagos seguros</p>
            <p class="conversion-pill__copy">Checkout protegido con cifrado y validación.</p>
          </div>
        </article>
      </div>
      <div class="featured-products" id="featured-products">
        ${featuredProductsHtml([])}
      </div>
      <p class="catalog-divider">Explora también el catálogo completo</p>
      <div class="products-grid">
        ${productsHtml()}
      </div>
    </section>

    <section id="favoritos" class="section section--favorites" aria-labelledby="favorites-title">
      <div class="section__head">
        <h2 id="favorites-title" class="section__title">Favoritos</h2>
        <p class="section__subtitle">Tu lista personalizada de productos guardados.</p>
      </div>
      <ul id="favorites-list" class="favorites-list">
        <li class="favorites-list__empty">Aún no tienes favoritos. Toca ❤️ en el catálogo.</li>
      </ul>
    </section>
  </main>

  <aside class="ai-floating-card" id="ai-floating-card" aria-live="polite">
    <p class="ai-floating-card__eyebrow">Módulo IA en tiempo real</p>
    <h3 class="ai-floating-card__title">Tu look ideal: <span id="ai-look-name">Glow Natural</span></h3>
    <div class="ai-floating-card__categories" role="group" aria-label="Categorías IA">
      <button type="button" class="ai-cat-pill ai-cat-pill--active" data-ai-category-pill="Natural">Natural</button>
      <button type="button" class="ai-cat-pill" data-ai-category-pill="Radiante">Radiante</button>
      <button type="button" class="ai-cat-pill" data-ai-category-pill="Diario">Diario</button>
    </div>
    <div class="ai-floating-card__carousel-wrap">
      <button type="button" class="ai-carousel-nav" id="ai-carousel-prev" aria-label="Look anterior">‹</button>
      <div class="ai-floating-card__carousel" id="ai-carousel">
        ${aiPresetsHtml()}
      </div>
      <button type="button" class="ai-carousel-nav" id="ai-carousel-next" aria-label="Siguiente look">›</button>
    </div>
    <button type="button" class="btn btn--primary btn--block" id="btn-try-look">Probar este look</button>
    <video id="ai-camera-preview" class="ai-camera-preview" autoplay playsinline muted hidden></video>
  </aside>

  <footer class="site-footer">
    <div class="site-footer__inner">
      <p class="site-footer__brand">GlowLab IA</p>
      <p class="site-footer__copy">Prototipo de interfaz · 2026</p>
    </div>
  </footer>

  <nav class="bottom-nav" aria-label="Navegación inferior">
    <button type="button" class="bottom-nav__item bottom-nav__item--active" data-bottom-nav="inicio">
      <span class="bottom-nav__icon" aria-hidden="true">🏠</span>
      <span class="bottom-nav__label">Inicio</span>
    </button>
    <button type="button" class="bottom-nav__item" data-bottom-nav="productos">
      <span class="bottom-nav__icon" aria-hidden="true">🛍️</span>
      <span class="bottom-nav__label">Productos</span>
    </button>
    <button type="button" class="bottom-nav__item bottom-nav__item--cta" data-bottom-nav="probar-look">
      <span class="bottom-nav__icon" aria-hidden="true">✨</span>
      <span class="bottom-nav__label">Probar look</span>
    </button>
    <button type="button" class="bottom-nav__item" data-bottom-nav="favoritos">
      <span class="bottom-nav__icon" aria-hidden="true">❤️</span>
      <span class="bottom-nav__label">Favoritos</span>
    </button>
    <button type="button" class="bottom-nav__item" data-bottom-nav="cuenta">
      <span class="bottom-nav__icon" aria-hidden="true">👤</span>
      <span class="bottom-nav__label">Cuenta</span>
    </button>
  </nav>

  <div id="toast" class="toast" role="status" aria-live="polite" hidden></div>
`

let toastTimer: ReturnType<typeof setTimeout> | undefined

function showToast(message: string): void {
  const el = document.getElementById('toast')
  if (!el) return
  el.textContent = message
  el.hidden = false
  el.classList.add('toast--visible')
  if (toastTimer !== undefined) window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    el.classList.remove('toast--visible')
    window.setTimeout(() => {
      el.hidden = true
    }, 300)
  }, 3200)
}

function init(): void {
  const root = document.querySelector<HTMLDivElement>('#app')
  if (!root) return
  root.innerHTML = appHtml

  let selectedLook = LOOKS[0]?.id ?? 'natural'
  const favoriteIds = new Set<string>()
  let cartCount = 0

  const cartCountEl = document.getElementById('cart-count')
  const favoritesCountEl = document.getElementById('favorites-count')
  const favoritesList = document.getElementById('favorites-list')
  const featuredProductsEl = document.getElementById('featured-products')
  const aiLookNameEl = document.getElementById('ai-look-name')
  const aiCameraPreview = document.getElementById('ai-camera-preview') as HTMLVideoElement | null
  let aiCurrentIndex = 0
  let cameraStream: MediaStream | null = null
  const cartProductIds: string[] = []
  let recommendationRequestToken = 0

  const updateCartCount = (): void => {
    if (cartCountEl) cartCountEl.textContent = String(cartCount)
  }

  const updateFavoritesUi = (): void => {
    if (favoritesCountEl) {
      favoritesCountEl.textContent = String(favoriteIds.size)
      favoritesCountEl.hidden = favoriteIds.size === 0
    }

    if (!favoritesList) return
    if (favoriteIds.size === 0) {
      favoritesList.innerHTML = '<li class="favorites-list__empty">Aún no tienes favoritos. Toca ❤️ en el catálogo.</li>'
      return
    }

    const favoriteProducts = PRODUCTS.filter((p) => favoriteIds.has(p.id))
    favoritesList.innerHTML = favoriteProducts
      .map((p) => `<li class="favorites-list__item"><span>${p.name}</span><span>${p.price}</span></li>`)
      .join('')

    document.querySelectorAll<HTMLButtonElement>('[data-action="toggle-favorite"]').forEach((button) => {
      const productId = button.dataset.productId ?? ''
      button.classList.toggle('product-card__favorite--active', favoriteIds.has(productId))
    })
  }

  const syncLookChips = (lookId: string): void => {
    selectedLook = lookId
    document.querySelectorAll('.chip').forEach((chip) => {
      chip.classList.toggle('chip--active', (chip as HTMLButtonElement).dataset.look === lookId)
    })
  }

  const applyAiPreset = (index: number): void => {
    const normalized = ((index % AI_LOOK_PRESETS.length) + AI_LOOK_PRESETS.length) % AI_LOOK_PRESETS.length
    aiCurrentIndex = normalized
    const preset = AI_LOOK_PRESETS[normalized]
    if (!preset) return

    if (aiLookNameEl) aiLookNameEl.textContent = preset.label
    syncLookChips(preset.sourceLookId)

    document.querySelectorAll('.ai-mini-preview').forEach((preview, previewIndex) => {
      preview.classList.toggle('ai-mini-preview--active', previewIndex === normalized)
    })
    document.querySelectorAll('.ai-cat-pill').forEach((pill) => {
      const category = (pill as HTMLButtonElement).dataset.aiCategoryPill
      pill.classList.toggle('ai-cat-pill--active', category === preset.category)
    })
  }

  const runAutoRecommendation = (): void => {
    const hour = new Date().getHours()
    let category: AiCategory = 'Natural'
    if (hour >= 18) category = 'Radiante'
    if (hour >= 8 && hour <= 16) category = 'Diario'
    const recommended = AI_LOOK_PRESETS.findIndex((preset) => preset.category === category)
    if (recommended >= 0) {
      applyAiPreset(recommended)
      showToast(`IA sugiere “${AI_LOOK_PRESETS[recommended]?.label ?? 'Glow Natural'}” para hoy.`)
    }
  }

  const categoryFromApiProduct = (product: RecommendationApiProduct | undefined): AiCategory => {
    if (!product) return 'Natural'
    const normalized = product.category.toLowerCase()
    if (normalized.includes('ojos')) return 'Radiante'
    if (normalized.includes('labios')) return 'Diario'
    return 'Natural'
  }

  const fetchBackendRecommendation = async (): Promise<void> => {
    const requestToken = recommendationRequestToken + 1
    recommendationRequestToken = requestToken
    const query = new URLSearchParams({
      look: selectedLook,
      cart: Array.from(new Set(cartProductIds)).join(','),
      limit: '5',
    })

    try {
      const response = await fetch(`${API_BASE_URL}/v1/recommendations?${query.toString()}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = (await response.json()) as RecommendationApiResponse
      if (recommendationRequestToken !== requestToken) return

      const category = categoryFromApiProduct(data.products[0])
      const presetIndex = AI_LOOK_PRESETS.findIndex(
        (preset) => preset.category === category && preset.sourceLookId === selectedLook,
      )
      const fallbackByCategory = AI_LOOK_PRESETS.findIndex((preset) => preset.category === category)
      applyAiPreset(presetIndex >= 0 ? presetIndex : Math.max(fallbackByCategory, 0))
      const featuredIds = data.productIds?.length ? data.productIds : data.products.map((p) => p.id)
      if (featuredProductsEl) featuredProductsEl.innerHTML = featuredProductsHtml(featuredIds)
      updateFavoritesUi()

      const topProducts = data.products
        .slice(0, 2)
        .map((p) => p.name)
        .join(', ')
      if (topProducts) {
        showToast(`IA (${data.source}) recomienda: ${topProducts}.`)
      } else {
        showToast(`IA (${data.source}) actualizó tu look recomendado.`)
      }
    } catch {
      if (recommendationRequestToken !== requestToken) return
      if (featuredProductsEl) featuredProductsEl.innerHTML = featuredProductsHtml([])
      updateFavoritesUi()
      runAutoRecommendation()
      showToast('No se pudo consultar la IA remota. Usando recomendación local.')
    }
  }

  document.querySelectorAll('.chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach((b) => b.classList.remove('chip--active'))
      btn.classList.add('chip--active')
      selectedLook = (btn as HTMLButtonElement).dataset.look ?? selectedLook
      void fetchBackendRecommendation()
    })
  })

  document.querySelectorAll('.look-card__use').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const card = (e.target as HTMLElement).closest('.look-card')
      const id = card?.getAttribute('data-look-id')
      if (!id) return
      syncLookChips(id)
      window.location.hash = '#/prueba'
      showToast(`Estilo «${LOOKS.find((l) => l.id === id)?.name ?? id}» seleccionado`)
      void fetchBackendRecommendation()
    })
  })

  const input = document.getElementById('photo-input') as HTMLInputElement | null
  const searchInput = document.getElementById('search-input') as HTMLInputElement | null
  const placeholder = document.getElementById('upload-placeholder')
  const preview = document.getElementById('preview-img') as HTMLImageElement | null
  let catalogCategoryFilter = ''

  const breadcrumbEl = document.getElementById('catalog-breadcrumb')
  const catalogTitleEl = document.getElementById('catalog-title')
  const catalogSubtitleEl = document.getElementById('catalog-subtitle')
  const featuredProductsWrap = document.getElementById('featured-products')

  const HOME_SCROLL_TARGETS: Record<string, string> = {
    estilos: 'estilos',
    prueba: 'prueba',
    inicio: 'inicio',
    favoritos: 'favoritos',
  }

  const normalizeHashSegments = (): string[] =>
    decodeURIComponent(window.location.hash.replace(/^#\/?/, ''))
      .split('/')
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean)

  const applyBrowseVisibility = (): void => {
    const query = searchInput?.value.trim().toLowerCase() ?? ''
    document.querySelectorAll<HTMLElement>('.look-card').forEach((card) => {
      const text = card.textContent?.toLowerCase() ?? ''
      card.hidden = query.length > 0 && !text.includes(query)
    })
    document.querySelectorAll<HTMLElement>('.product-card').forEach((card) => {
      const cat = card.dataset.productCategory ?? ''
      const searchText = card.getAttribute('data-search') ?? ''
      const matchesCat = catalogCategoryFilter === '' || cat === catalogCategoryFilter
      const matchesSearch = query === '' || searchText.includes(query)
      card.hidden = !(matchesCat && matchesSearch)
    })
  }

  const applyHomeChrome = (): void => {
    document.body.dataset.page = 'home'
    catalogCategoryFilter = ''
    breadcrumbEl?.setAttribute('hidden', '')
    if (breadcrumbEl) breadcrumbEl.innerHTML = ''
    if (catalogTitleEl) catalogTitleEl.textContent = DEFAULT_CATALOG_TITLE
    if (catalogSubtitleEl) catalogSubtitleEl.textContent = DEFAULT_CATALOG_SUBTITLE
    featuredProductsWrap?.removeAttribute('hidden')
    applyBrowseVisibility()
  }

  const applyCatalogSlugPage = (slug: string): void => {
    const meta = CATALOG_SLUG_LOOKUP[slug]
    if (!meta) return
    document.body.dataset.page = 'catalog'
    catalogCategoryFilter = meta.filter

    breadcrumbEl?.removeAttribute('hidden')
    if (breadcrumbEl) {
      const labelEscaped = escapeHtml(meta.label)
      breadcrumbEl.innerHTML = `
        <a href="#/">Inicio</a>
        <span class="breadcrumb__sep" aria-hidden="true">/</span>
        <a href="#/catalogo">Catálogo</a>
        <span class="breadcrumb__sep" aria-hidden="true">/</span>
        <span class="breadcrumb__current">${labelEscaped}</span>
      `
    }

    const isFullCatalog = slug === 'catalogo'
    if (catalogTitleEl) catalogTitleEl.textContent = isFullCatalog ? DEFAULT_CATALOG_TITLE : meta.label
    if (catalogSubtitleEl) {
      catalogSubtitleEl.textContent = isFullCatalog
        ? DEFAULT_CATALOG_SUBTITLE
        : `Productos recomendados y destacados para ${meta.label.toLowerCase()}. Añádelos al carrito desde esta página.`
    }

    if (featuredProductsWrap) {
      featuredProductsWrap.toggleAttribute('hidden', !isFullCatalog)
    }

    applyBrowseVisibility()
    void fetchBackendRecommendation()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function escapeHtml(s: string): string {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
    return s.replace(/[&<>"']/g, (char) => map[char] ?? char)
  }

  const syncBottomNavFromRoute = (firstSegment: string | undefined): void => {
    const catalogSlugs = new Set(Object.keys(CATALOG_SLUG_LOOKUP))
    const items = document.querySelectorAll<HTMLButtonElement>('[data-bottom-nav]')
    const pick = (key: string): void => {
      items.forEach((btn) => {
        btn.classList.toggle('bottom-nav__item--active', btn.dataset.bottomNav === key)
      })
    }
    if (!firstSegment) return pick('inicio')
    if (catalogSlugs.has(firstSegment)) return pick('productos')
    if (firstSegment === 'prueba') return pick('probar-look')
    if (firstSegment === 'favoritos') return pick('favoritos')
    if (firstSegment === 'cuenta') return pick('cuenta')
    if (HOME_SCROLL_TARGETS[firstSegment]) return pick('inicio')
    pick('inicio')
  }

  const applyRouteFromHash = (): void => {
    const segments = normalizeHashSegments()
    const head = segments[0]

    if (!head) {
      applyHomeChrome()
      void fetchBackendRecommendation()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      syncBottomNavFromRoute(undefined)
      return
    }

    if (head in CATALOG_SLUG_LOOKUP) {
      applyCatalogSlugPage(head)
      syncBottomNavFromRoute(head)
      return
    }

    if (head === 'cuenta') {
      applyHomeChrome()
      void fetchBackendRecommendation()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      syncBottomNavFromRoute('cuenta')
      showToast('Próximamente: zona Mi cuenta enlazada desde la URL.')
      return
    }

    const scrollId = HOME_SCROLL_TARGETS[head]
    if (scrollId) {
      applyHomeChrome()
      void fetchBackendRecommendation()
      syncBottomNavFromRoute(head)
      requestAnimationFrame(() => document.getElementById(scrollId)?.scrollIntoView({ behavior: 'smooth' }))
      return
    }

    window.location.hash = '#/'
  }

  const syncNavDropdownAnchor = (): void => {
    const inner = document.querySelector('.site-header__inner')
    if (!inner) return
    const bottomPx = `${inner.getBoundingClientRect().bottom}px`
    document.documentElement.style.setProperty('--nav-dropdown-top', bottomPx)
  }

  const closeNavDropdown = (): void => {
    document.getElementById('nav-dropdown')?.setAttribute('hidden', '')
    document.getElementById('nav-dropdown-backdrop')?.setAttribute('hidden', '')
    document.getElementById('hamburger-menu')?.setAttribute('aria-expanded', 'false')
  }

  const openNavDropdown = (): void => {
    syncNavDropdownAnchor()
    document.getElementById('nav-dropdown')?.removeAttribute('hidden')
    document.getElementById('nav-dropdown-backdrop')?.removeAttribute('hidden')
    document.getElementById('hamburger-menu')?.setAttribute('aria-expanded', 'true')
  }

  window.addEventListener('resize', syncNavDropdownAnchor)
  window.addEventListener('scroll', syncNavDropdownAnchor, { passive: true })

  input?.addEventListener('change', () => {
    const file = input.files?.[0]
    if (!file || !preview) return
    const url = URL.createObjectURL(file)
    preview.onload = () => URL.revokeObjectURL(url)
    preview.src = url
    preview.hidden = false
    placeholder?.setAttribute('hidden', '')
  })

  document.getElementById('btn-generate')?.addEventListener('click', () => {
    const hasPhoto = preview && !preview.hidden
    const lookName = LOOKS.find((l) => l.id === selectedLook)?.name ?? selectedLook
    if (!hasPhoto) {
      showToast('Primero sube una foto con tu rostro.')
      return
    }
    showToast(`Aquí iría la IA: «${lookName}» sobre tu imagen.`)
  })

  document.querySelectorAll('[data-action="cta-header"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.location.hash = '#/prueba'
    })
  })

  document.getElementById('hamburger-menu')?.addEventListener('click', (e) => {
    e.stopPropagation()
    const menu = document.getElementById('nav-dropdown')
    if (!menu || menu.hidden) openNavDropdown()
    else closeNavDropdown()
  })

  document.getElementById('nav-dropdown-backdrop')?.addEventListener('click', () => closeNavDropdown())

  document.querySelector('#nav-dropdown .nav-dropdown__list')?.addEventListener('click', (event) => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-nav-slug]')
    if (!btn) return
    const slug = btn.dataset.navSlug
    if (!slug) return
    closeNavDropdown()
    window.location.hash = `#/${slug}`
  })

  document.addEventListener(
    'click',
    (event) => {
      const dropdown = document.getElementById('nav-dropdown')
      if (!dropdown || dropdown.hidden) return
      const t = event.target as HTMLElement
      if (t.closest('.site-header')) return
      closeNavDropdown()
    },
    true,
  )

  document.getElementById('btn-search')?.addEventListener('click', () => {
    const searchPanel = document.getElementById('header-search')
    if (!searchPanel) return
    const willOpen = searchPanel.hidden
    searchPanel.hidden = !willOpen
    if (willOpen) {
      syncNavDropdownAnchor()
      searchInput?.focus()
      return
    }
    if (searchInput) searchInput.value = ''
    syncNavDropdownAnchor()
    applyBrowseVisibility()
  })

  searchInput?.addEventListener('input', () => {
    applyBrowseVisibility()
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNavDropdown()
  })

  document.getElementById('btn-favorites')?.addEventListener('click', () => {
    window.location.hash = '#/favoritos'
    showToast('Tus favoritos.')
  })

  document.getElementById('btn-cart')?.addEventListener('click', () => {
    window.location.hash = '#/catalogo'
    showToast(`Tienes ${cartCount} producto(s) en el carrito.`)
  })

  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    const favoriteButton = target.closest<HTMLButtonElement>('[data-action="toggle-favorite"]')
    if (favoriteButton) {
      const productId = favoriteButton.dataset.productId
      if (!productId) return
      if (favoriteIds.has(productId)) {
        favoriteIds.delete(productId)
        showToast('Producto eliminado de favoritos.')
      } else {
        favoriteIds.add(productId)
        showToast('Producto añadido a favoritos.')
      }
      updateFavoritesUi()
      return
    }

    const addButton = target.closest<HTMLButtonElement>('[data-action="add-to-cart"]')
    if (addButton) {
      cartCount += 1
      updateCartCount()
      const productId = addButton.dataset.productId
      if (productId) cartProductIds.push(productId)
      const productName = PRODUCTS.find((p) => p.id === productId)?.name ?? 'Producto'
      showToast(`${productName} añadido al carrito.`)
      void fetchBackendRecommendation()
    }
  })

  document.querySelectorAll('.ai-mini-preview').forEach((item, index) => {
    item.addEventListener('click', () => {
      applyAiPreset(index)
      void fetchBackendRecommendation()
    })
  })

  document.getElementById('ai-carousel-prev')?.addEventListener('click', () => {
    applyAiPreset(aiCurrentIndex - 1)
    void fetchBackendRecommendation()
  })

  document.getElementById('ai-carousel-next')?.addEventListener('click', () => {
    applyAiPreset(aiCurrentIndex + 1)
    void fetchBackendRecommendation()
  })

  document.querySelectorAll('.ai-cat-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      const category = (pill as HTMLButtonElement).dataset.aiCategoryPill as AiCategory | undefined
      if (!category) return
      const match = AI_LOOK_PRESETS.findIndex((preset) => preset.category === category)
      if (match >= 0) applyAiPreset(match)
      void fetchBackendRecommendation()
    })
  })

  document.getElementById('btn-try-look')?.addEventListener('click', async () => {
    const activePreset = AI_LOOK_PRESETS[aiCurrentIndex]
    if (!activePreset) return

    if (!navigator.mediaDevices?.getUserMedia) {
      showToast('Tu navegador no soporta acceso a cámara para simulación AR.')
      return
    }

    try {
      if (!cameraStream) {
        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        })
      }
      if (aiCameraPreview) {
        aiCameraPreview.srcObject = cameraStream
        aiCameraPreview.hidden = false
      }
      syncLookChips(activePreset.sourceLookId)
      window.location.hash = '#/prueba'
      showToast(`Simulación AR activada con «${activePreset.label}».`)
    } catch {
      showToast('No se pudo activar la cámara. Verifica permisos del navegador.')
    }
  })

  document.getElementById('btn-try-look-hero')?.addEventListener('click', () => {
    window.location.hash = '#/prueba'
    showToast('Look preparado. Continúa con tu prueba virtual.')
  })

  document.querySelectorAll<HTMLButtonElement>('[data-bottom-nav]').forEach((item) => {
    item.addEventListener('click', () => {
      const target = item.dataset.bottomNav
      if (target === 'inicio') {
        window.location.hash = '#/'
        return
      }
      if (target === 'productos') {
        window.location.hash = '#/catalogo'
        return
      }
      if (target === 'probar-look') {
        window.location.hash = '#/prueba'
        return
      }
      if (target === 'favoritos') {
        window.location.hash = '#/favoritos'
        return
      }
      window.location.hash = '#/cuenta'
    })
  })

  window.addEventListener('hashchange', applyRouteFromHash)

  applyAiPreset(0)
  updateCartCount()
  updateFavoritesUi()
  syncNavDropdownAnchor()
  applyRouteFromHash()
}

init()
