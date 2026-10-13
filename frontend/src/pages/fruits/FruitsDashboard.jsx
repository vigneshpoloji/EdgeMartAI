import useCatalogueCart from '../../sellers/useCatalogueCart';
import useBuyerCatalogue from '../../sellers/useBuyerCatalogue';
import { DepartmentOffers, DeliveryEstimate } from '../../components/ShoppingBenefits';
import { DepartmentPhoto } from '../../components/DepartmentPhoto';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Clock, Heart, HelpCircle, LayoutGrid, Leaf, List, MapPin, Minus, Package, Plus, Search, ShieldCheck, ShoppingBag, SlidersHorizontal, Trash2, Truck, X } from 'lucide-react';
import { FRUITS_CATEGORIES, FRUITS_PRODUCTS as nativeCatalogue } from '../../data';
import CheckoutLifecycle from '../../components/CheckoutLifecycle';
import './fruits.css';

const STORAGE_KEY = 'edgemart-orchard-v1';

// The original f1/f2 photographs depict oranges/strawberries respectively.
const DISPLAY_IMAGES = {
  f1: '/images/products/orchard-apple.jpg',
  f2: '/images/products/f1.jpg',
  f3: '/images/products/orchard-banana.jpg',
  f4: '/images/products/f2.jpg',
  f5: '/images/india/fruits-f5.jpg',
};

const money = value =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

const lineKey = (id, pack) => `${id}:${pack}`;

const shortName = product =>
  product.name.replace(/\s*\([^)]*\)/g, '').replace('Punchkart ', '');

const discount = pack =>
  pack.originalPrice > pack.price
    ? Math.round((1 - pack.price / pack.originalPrice) * 100)
    : 0;



function ProductImage({product,className='',eager=false,...props}) {const [failed,setFailed]=useState(false);const src=DISPLAY_IMAGES[product.id] || product.image;useEffect(()=>setFailed(false),[src]);return failed || !src ? <div className={className || 'of-product-photo'}><span className="em-photo-unavailable">Photo not available</span></div> : <img src={src} alt={product.name} className={className} loading={eager?'eager':'lazy'} {...props} onError={()=>setFailed(true)}/>;}

function Dialog({ title, onClose, children, drawer = false, wide = false }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();

    const onKey = event => {
      if (event.key === 'Escape') closeRef.current();
      if (event.key !== 'Tab') return;
      const elements = [
        ...ref.current.querySelectorAll(
          'button, a[href], input, select, textarea, summary, [tabindex="0"]'
        ),
      ].filter(
        element => !element.disabled && element.getClientRects().length > 0
      );
      const first = elements[0],
        last = elements[elements.length - 1];
      if (!first) {
        event.preventDefault();
        return;
      }
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === ref.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          document.activeElement === ref.current)
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, []);

  return (
    <div
      className={`of-backdrop ${drawer ? 'of-backdrop-drawer' : ''}`}
      onClick={onClose}
    >
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`of-dialog ${drawer ? 'of-drawer' : ''} ${wide ? 'of-dialog-wide' : ''}`}
        onClick={event => event.stopPropagation()}
      >
        <div className="of-dialog-heading">
          <h2>{title}</h2>
          <button
            className="of-icon-btn"
            onClick={onClose}
            aria-label={`Close ${title}`}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function catalogueTools(FRUITS_PRODUCTS) {
function readPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const favorites = Array.isArray(saved.favorites)
      ? saved.favorites.filter(id =>
          FRUITS_PRODUCTS.some(product => product.id === id)
        )
      : [];
    const cart = {};
    Object.values(saved.cart || {}).forEach(line => {
      const product = FRUITS_PRODUCTS.find(item => item.id === line?.id);
      if (
        product &&
        Number.isInteger(line.pack) &&
        product.packSizes[line.pack] &&
        Number.isInteger(line.quantity) &&
        line.quantity > 0 &&
        line.quantity <= 99
      ) {
        cart[lineKey(line.id, line.pack)] = line;
      }
    });
    return {
      favorites,
      cart,
      pin: /^[1-9]\d{5}$/.test(saved.pin) ? saved.pin : '',
    };
  } catch {
    return { favorites: [], cart: {}, pin: '' };
  }
}
return {readPreferences};
}
export default function FruitsDashboard({ onBackToLanding }) {
  const FRUITS_PRODUCTS = useBuyerCatalogue('fruits',nativeCatalogue,'Fruits');
  const {readPreferences} = useMemo(()=>catalogueTools(FRUITS_PRODUCTS),[FRUITS_PRODUCTS]);

  const [preferences] = useState(readPreferences);
  const [cart, setCart] = useCatalogueCart(preferences.cart, FRUITS_PRODUCTS);
  const [favorites, setFavorites] = useState(preferences.favorites);
  const [pin, setPin] = useState(preferences.pin);
  const [pinDraft, setPinDraft] = useState(preferences.pin);
  const [pinError, setPinError] = useState('');
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState(()=>new URLSearchParams(window.location.search).get('q') || '');
  const [view, setView] = useState('market');
  const [layout, setLayout] = useState('grid');
  const [sort, setSort] = useState('featured');
  const [budget, setBudget] = useState('all');
  const [dealsOnly, setDealsOnly] = useState(false);
  const [topRated, setTopRated] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [packs, setPacks] = useState({});
  const [panel, setPanel] = useState(null);
  const [activeProduct, setActiveProduct] = useState(null);
  const [checkout, setCheckout] = useState(null);
  const [notice, setNotice] = useState('');
  const catalogRef = useRef(null);
  const box = FRUITS_PRODUCTS.find(product => product.subCategory === 'boxes');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ cart, favorites, pin }));
    } catch {
      /* Shopping continues when browser storage is unavailable. */
    }
  }, [cart, favorites, pin]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  const getPack = product => packs[product.id] ?? 0;
  const lines = Object.values(cart).map(line => {
    const product = FRUITS_PRODUCTS.find(item => item.id === line.id);
    return { ...line, product, tier: product.packSizes[line.pack] };
  });
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce(
    (sum, line) => sum + line.tier.price * line.quantity,
    0
  );
  const savings = lines.reduce(
    (sum, line) =>
      sum +
      Math.max(
        0,
        (line.tier.originalPrice || line.tier.price) - line.tier.price
      ) *
        line.quantity,
    0
  );
  const delivery = subtotal >= 999 ? 0 : 49;

  const visibleProducts = useMemo(() => {
    const result = FRUITS_PRODUCTS.filter(product => {
      const pack = product.packSizes[packs[product.id] ?? 0];
      const text =
        `${product.name} ${product.origin} ${product.nutrients} ${product.botanical}`.toLowerCase();
      return (
        (category === 'all' || product.subCategory === category) &&
        text.includes(query.trim().toLowerCase()) &&
        (view !== 'saved' || favorites.includes(product.id)) &&
        (budget === 'all' || pack.price <= Number(budget)) &&
        (!dealsOnly || discount(pack) >= 25) &&
        (!topRated || product.rating >= 4.9)
      );
    });

    return result.sort((a, b) => {
      const ap = a.packSizes[packs[a.id] ?? 0],
        bp = b.packSizes[packs[b.id] ?? 0];
      if (sort === 'price-low') return ap.price - bp.price;
      if (sort === 'price-high') return bp.price - ap.price;
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'savings') return discount(bp) - discount(ap);
      return 0;
    });
  }, [
    category,
    query,
    view,
    favorites,
    budget,
    dealsOnly,
    topRated,
    sort,
    packs,
  , FRUITS_PRODUCTS]);

  const updateQuantity = (product, pack, delta) => {
    if(delta>0 && product.inStock===false)return;
    const key = lineKey(product.id, pack);
    setCart(previous => {
      const quantity = Math.min(99, (previous[key]?.quantity || 0) + delta);
      const next = { ...previous };
      if (quantity <= 0) delete next[key];
      else next[key] = { id: product.id, pack, quantity };
      return next;
    });
  };

  const toggleFavorite = product => {
    const exists = favorites.includes(product.id);
    setFavorites(previous =>
      exists
        ? previous.filter(id => id !== product.id)
        : [...previous, product.id]
    );
    setNotice(
      exists
        ? 'Removed from your saved picks.'
        : 'Added to your saved picks.'
    );
  };

  const resetFilters = () => {
    setCategory('all');
    setQuery('');
    setBudget('all');
    setDealsOnly(false);
    setTopRated(false);
    setSort('featured');
  };

  const browse = (nextCategory = 'all') => {
    resetFilters();
    setCategory(nextCategory);
    setView('market');
    catalogRef.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
      block: 'start',
    });
  };

  const launchCheckout = () => {
    if (!lines.length) return;
    setPanel(null);
    setCheckout({
      lines: lines.map(line => ({ id: line.product.id, name: shortName(line.product), category: 'fruits', image: DISPLAY_IMAGES[line.id] || line.product.image, price: line.tier.price, quantity: line.quantity, variant: line.tier.label, options: { pack: line.pack } })),
      id: 'bundle_fruit_cart',
      category: 'fruits',
      returnDays: 0,
      name: lines
        .map(
          line =>
            `${shortName(line.product)} · ${line.tier.label} × ${line.quantity}`
        )
        .join(' + '),
      price: subtotal,
      image: DISPLAY_IMAGES[lines[0].id] || lines[0].product.image,
    });
  };

  const back = () =>
    onBackToLanding
      ? onBackToLanding()
      : window.location.assign('/landing.html');

  const quantityControl = (product, pack) => {
    const quantity = cart[lineKey(product.id, pack)]?.quantity || 0;
    return quantity ? (
      <div className="of-stepper">
        <button
          aria-label={`Remove one ${shortName(product)}, ${product.packSizes[pack].label}`}
          onClick={() => updateQuantity(product, pack, -1)}
        >
          <Minus size={15} />
        </button>
        <span aria-live="polite">{quantity}</span>
        <button
          disabled={(quantity >= 99) || product.inStock === false}
          aria-label={`Add one ${shortName(product)}, ${product.packSizes[pack].label}`}
          onClick={() => updateQuantity(product, pack, 1)}
        >
          <Plus size={15} />
        </button>
      </div>
    ) : (
      <button
        className="of-add"
        onClick={() => {
          updateQuantity(product, pack, 1);
          setNotice('Fresh pick added to your basket.');
        }}
        aria-label={`Add ${shortName(product)}, ${product.packSizes[pack].label} to basket`}
       disabled={product.inStock === false}>
        <Plus size={15} /> Add
      </button>
    );
  };

  const packSelector = product => (
    <label className="of-pack-label">
      <span className="of-sr-only">Pack size for {shortName(product)}</span>
      <select
        value={getPack(product)}
        onChange={event =>
          setPacks(previous => ({
            ...previous,
            [product.id]: Number(event.target.value),
          }))
        }
      >
        {product.packSizes.map((pack, index) => (
          <option key={pack.label} value={index}>
            {pack.label}
          </option>
        ))}
      </select>
      <ChevronDown size={13} aria-hidden="true" />
    </label>
  );

  const activeFilters =
    Number(budget !== 'all') + Number(dealsOnly) + Number(topRated);

  return (
    <div className="of-app">
      <a className="of-skip" href="#orchard-catalog">
        Skip to fresh picks
      </a>
      <aside className="of-sidebar">
        <button
          className="of-brand"
          onClick={back}
          aria-label="EdgeMart, back to all worlds"
        >
          <span className="of-brand-mark">
            <Leaf size={24} />
          </span>
          <span>
            EdgeMart<small>THE FRUIT EDIT</small>
          </span>
        </button>
        <div className="of-sidebar-label">YOUR DAILY GOODNESS</div>
        <nav className="of-side-nav" aria-label="Fruit dashboard">
          <button
            aria-label="Discover fruits"
            className={view === 'market' ? 'is-active' : ''}
            aria-current={view === 'market' ? 'page' : undefined}
            onClick={() => setView('market')}
          >
            <LayoutGrid size={19} />
            <span>Discover fruits</span>
            <ArrowRight size={15} />
          </button>
          <button
            aria-label={`Saved picks, ${favorites.length} favorites`}
            className={view === 'saved' ? 'is-active' : ''}
            aria-current={view === 'saved' ? 'page' : undefined}
            onClick={() => {
              resetFilters();
              setView('saved');
            }}
          >
            <Heart size={19} />
            <span>Saved picks</span>
            <b>{favorites.length}</b>
          </button>
          <button
            aria-label={`My basket, ${count} packs`}
            onClick={() => setPanel('cart')}
          >
            <ShoppingBag size={19} />
            <span>My basket</span>
            <b>{count}</b>
          </button>
          <button
            aria-label="Delivery details"
            onClick={() => {
              setPinDraft(pin);
              setPinError('');
              setPanel('delivery');
            }}
          >
            <MapPin size={19} />
            <span>Delivery details</span>
          </button>
        </nav>
        <div className="of-sidebar-note">
          <span className="of-note-icon">
            
          </span>
          <small>A BETTER EVERYDAY</small>
          <h3>
            Good things
            <br />
            grow here.
          </h3>
          <p>
            Find your favorite fruits and make room for a little freshness.
          </p>
          <button onClick={() => browse('boxes')}>
            Explore fruit boxes <ArrowRight size={15} />
          </button>
        </div>
        <div className="of-side-bottom">
          <button onClick={() => setPanel('help')}>
            <HelpCircle size={18} /> Help & freshness guide
          </button>
          <button onClick={back}>
            <ArrowLeft size={18} /> Back to all worlds
          </button>
          <div>
            <span className="of-status-dot" /> Your personal fruit market
          </div>
        </div>
      </aside>

      <div className="of-workspace">
        <header className="of-header">
          <div className="of-header-title">
            <span>
              THE ORCHARD / {view === 'saved' ? 'SAVED PICKS' : 'DISCOVER'}
            </span>
            <strong>
              Fresh looks good on you<span className="of-greeting-dot">.</span>
            </strong>
          </div>
          <label className="of-search">
            <Search size={18} />
            <span className="of-sr-only">
              Search fruits, origins or nutrients
            </span>
            <input
              type="search"
              aria-label="Search fruits, origins or nutrients"
              placeholder="Search fruits, farms, goodness…"
              value={query}
              onChange={event => setQuery(event.target.value)}
            />
            <kbd aria-hidden="true">⌕</kbd>
          </label>
          <button
            className="of-delivery-button"
            onClick={() => {
              setPinDraft(pin);
              setPinError('');
              setPanel('delivery');
            }}
          >
            <MapPin size={18} />
            <span>
              <small>DELIVER TO</small>
              <strong>
                {pin || 'Set your PIN'} <ChevronDown size={12} />
              </strong>
            </span>
          </button>
          <button
            className="of-header-basket of-icon-btn"
            onClick={() => setPanel('cart')}
            aria-label={`Open basket, ${count} packs`}
          >
            <ShoppingBag size={21} />
            <b>{count}</b>
          </button>
        </header>

        <main className="of-main">
          <div className="of-welcome">
            <div>
              <span className="of-eyebrow">
                <span className="of-status-dot" /> A FRESH START, EVERY DAY
              </span>
              <h1>
                {view === 'saved'
                  ? 'Your taste. Your favorites.'
                  : 'Welcome to your little orchard.'}
              </h1>
            </div>
            <span className="of-welcome-note">
              <Leaf size={15} /> Curated for a fresher everyday
            </span>
          </div>

          <section className="of-hero" aria-label="The fresh fruit collection">
            <div className="of-hero-copy">
              <span className="of-hero-tag">
                 THE FRESH LIFE COLLECTION
              </span>
              <h2>
                A little fresher.
                <br />A lot <em>better.</em>
              </h2>
              <p>
                From orchard classics to beautiful fruit boxes.
                <br className="of-desktop-break" /> Find something good for your
                everyday.
              </p>
              <button className="of-primary of-hero-cta" onClick={() => browse()}>
                Explore fresh picks <ArrowRight size={17} />
              </button>
              <div className="of-hero-foot">
                <span>
                  <ShieldCheck size={15} /> Know your origin
                </span>
                <span>
                  <Package size={15} /> Pick your perfect pack
                </span>
              </div>
            </div>
            <div className="of-hero-image">
              <DepartmentPhoto department="fruits" eager/>
              <div className="of-image-shade" />
              <span className="of-image-label">NATURE'S COLOR PALETTE</span>
              <div className="of-harvest-card">
                <span>
                  <Leaf size={19} />
                </span>
                <div>
                  <strong>Small rituals. Big goodness.</strong>
                  <small>Your daily dose of something fresh.</small>
                </div>
              </div>
            </div>
            <span className="of-hero-number" aria-hidden="true">
              01 / THE ORCHARD
            </span>
          </section>

          <section className="of-stats" aria-label="Your shopping overview">
            {[
              {
                icon: Leaf,
                value: String(FRUITS_PRODUCTS.length).padStart(2, '0'),
                label: 'Curated selections',
                detail: 'A little of everything',
                tone: 'sage',
              },
              {
                icon: Heart,
                value: String(favorites.length).padStart(2, '0'),
                label: 'Your saved picks',
                detail: 'Good taste, remembered',
                tone: 'rose',
              },
              {
                icon: ShoppingBag,
                value: String(count).padStart(2, '0'),
                label: 'Packs in your basket',
                detail: 'Ready when you are',
                tone: 'gold',
              },
              {
                icon: Package,
                value: money(savings),
                label: 'Your basket savings',
                detail: 'Compared with list prices',
                tone: 'sage',
              },
            ].map(stat => (
              <div className="of-stat" key={stat.label}>
                <span className={`of-stat-icon ${stat.tone}`}>
                  <stat.icon size={20} />
                </span>
                <div>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                  <small>{stat.detail}</small>
                </div>
              </div>
            ))}
          </section>

          <div className="of-content-grid">
            <section
              className="of-catalog"
              id="orchard-catalog"
              ref={catalogRef}
              aria-labelledby="of-catalog-title"
            >
              <div className="of-section-heading">
                <div>
                  <span className="of-eyebrow">HANDPICKED, JUST FOR YOU</span>
                  <h2 id="of-catalog-title">
                    {view === 'saved' ? 'Your saved picks' : 'The fresh edit'}{' '}
                    <span>({visibleProducts.length})</span>
                  </h2>
                </div>
                <button
                  className={`of-filter-toggle ${showFilters || activeFilters ? 'is-active' : ''}`}
                  aria-expanded={showFilters}
                  aria-controls="of-filters"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal size={15} /> Filters{' '}
                  {activeFilters > 0 && <b>{activeFilters}</b>}
                </button>
              </div>

              <nav className="of-categories" aria-label="Fruit categories">
                {FRUITS_CATEGORIES.map(item => (
                  <button
                    key={item.id}
                    className={category === item.id ? 'is-active' : ''}
                    aria-pressed={category === item.id}
                    onClick={() => setCategory(item.id)}
                  >
                    <span>{item.icon}</span>
                    {item.id === 'all'
                      ? 'All fruits'
                      : item.id === 'boxes'
                        ? 'Fruit boxes'
                        : item.id === 'exotic'
                          ? 'Exotics & melons'
                          : item.id === 'citrus'
                            ? 'Citrus & berries'
                            : 'Everyday favorites'}
                  </button>
                ))}
              </nav>

              {showFilters && (
                <div className="of-filters" id="of-filters">
                  <label>
                    Pack budget
                    <select
                      value={budget}
                      onChange={event => setBudget(event.target.value)}
                    >
                      <option value="all">Any price</option>
                      <option value="100">Up to ₹100</option>
                      <option value="200">Up to ₹200</option>
                      <option value="500">Up to ₹500</option>
                    </select>
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={dealsOnly}
                      onChange={event => setDealsOnly(event.target.checked)}
                    />{' '}
                    25%+ savings
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={topRated}
                      onChange={event => setTopRated(event.target.checked)}
                    />{' '}
                    Rated 4.9+
                  </label>
                  <button className="of-text-button" onClick={resetFilters}>
                    Reset filters
                  </button>
                </div>
              )}

              <div className="of-catalog-toolbar">
                <span>
                  {query
                    ? `Results for “${query}”`
                    : view === 'saved'
                      ? 'Keep your favorites close.'
                      : 'A good day starts with a fresh pick.'}
                </span>
                <div>
                  <label className="of-sort">
                    <span className="of-sr-only">Sort products</span>
                    <select
                      value={sort}
                      onChange={event => setSort(event.target.value)}
                    >
                      <option value="featured">Featured</option>
                      <option value="price-low">Price: low to high</option>
                      <option value="price-high">Price: high to low</option>
                      <option value="rating">Highest rated</option>
                      <option value="savings">Biggest savings</option>
                    </select>
                  </label>
                  <div className="of-view-toggle">
                    <button
                      aria-label="Grid view"
                      aria-pressed={layout === 'grid'}
                      className={layout === 'grid' ? 'is-active' : ''}
                      onClick={() => setLayout('grid')}
                    >
                      <LayoutGrid size={16} />
                    </button>
                    <button
                      aria-label="List view"
                      aria-pressed={layout === 'list'}
                      className={layout === 'list' ? 'is-active' : ''}
                      onClick={() => setLayout('list')}
                    >
                      <List size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <DepartmentOffers department="fruits"/>
{visibleProducts.length ? (
                <div
                  className={`of-products ${layout === 'list' ? 'of-products-list' : ''}`}
                >
                  {visibleProducts.map((product, index) => {
                    const packIndex = getPack(product),
                      tier = product.packSizes[packIndex];
                    return (
                      <article
                        className="of-product"
                        key={product.id}
                        style={{
                          '--of-delay': `${Math.min(index, 5) * 50}ms`,
                        }}
                      >
                        <div
                          className={`of-product-media of-media-${product.subCategory}`}
                        >
                          <button
                            className="of-product-image-button"
                            onClick={() => setActiveProduct(product)}
                            aria-label={`View ${shortName(product)} details`}
                          >
                            <ProductImage product={product} loading="lazy" />
                          </button>
                          {discount(tier) > 0 && (
                            <span className="of-discount">
                              {discount(tier)}% OFF
                            </span>
                          )}
                          <button
                            className={`of-favorite ${favorites.includes(product.id) ? 'is-saved' : ''}`}
                            onClick={() => toggleFavorite(product)}
                            aria-label={`Save ${shortName(product)}`}
                            aria-pressed={favorites.includes(product.id)}
                          >
                            <Heart
                              size={17}
                              fill={
                                favorites.includes(product.id)
                                  ? 'currentColor'
                                  : 'none'
                              }
                            />
                          </button>
                          <span className="of-product-ripeness">
                            <span className="of-status-dot" />{' '}
                            {product.ripeness}
                          </span>
                        </div>
                        <div className="of-product-info">
                          <div className="of-product-topline">
                            <span>
                              {product.subCategory === 'boxes'
                                ? 'THE SIGNATURE EDIT'
                                : 'ORCHARD FAVORITE'}
                            </span>
                            <span className="of-rating">
                              {' '}
                              {product.sellerProduct ? 'New' : product.rating.toFixed(1)}
                            </span>
                          </div>
                          <h3>
                            <button onClick={() => setActiveProduct(product)}>
                              {shortName(product)}
                            </button>
                          </h3>
                          <p className="of-origin">
                            <MapPin size={12} />
                            {product.origin}
                          </p>
                          {packSelector(product)}
                          <div className="of-product-footer">
                            <div>
                              <strong>{money(tier.price)}</strong>
                              {tier.originalPrice > tier.price && (
                                <s>{money(tier.originalPrice)}</s>
                              )}
                              <small>per selected pack</small>
                            </div>
                            {quantityControl(product, packIndex)}
                          </div>
                        <DeliveryEstimate department="fruits" product={product}/></div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="of-empty">
                  <Search size={30} />
                  <h3>
                    {view === 'saved' && !favorites.length
                      ? 'Your favorites start here.'
                      : 'No fresh picks match just yet.'}
                  </h3>
                  <p>
                    {view === 'saved' && !favorites.length
                      ? 'Tap the heart on any fruit to save it for later.'
                      : 'Try another category, search, or pack budget. More varieties can be added to the catalog.'}
                  </p>
                  <button
                    className="of-primary"
                    onClick={() => {
                      resetFilters();
                      setView('market');
                    }}
                  >
                    Explore all fruits <ArrowRight size={16} />
                  </button>
                </div>
              )}

              <div className="of-catalog-footer">
                <Leaf size={16} />
                <span>
                  A little care goes a long way. Explore origin, nutrition, and
                  storage tips in every quick view.
                </span>
              </div>
            </section>

            <aside
              className="of-right-rail"
              aria-label="Fruit box and basket summary"
            >
              {box && (
                <section className="of-box-edit">
                  <span className="of-eyebrow">
                     THE WELLNESS EDIT
                  </span>
                  <h2>
                    One box.
                    <br />
                    <em>So much goodness.</em>
                  </h2>
                  <div className="of-box-image">
                    <ProductImage product={box} loading="lazy" />
                    <span>THE DAILY RITUAL</span>
                  </div>
                  <p>
                    Apples, oranges, bananas & grapes.
                    <br />
                    Your favorites, beautifully together.
                  </p>
                  <div className="of-box-price">
                    <strong>{money(box.packSizes[0].price)}</strong>
                    <span>standard box</span>
                  </div>
                  <button onClick={() => setActiveProduct(box)}>
                    Discover the box <ArrowRight size={16} />
                  </button>
                </section>
              )}

              <section className="of-basket-summary">
                <div className="of-rail-heading">
                  <ShoppingBag size={18} />
                  <h3>Your fresh basket</h3>
                  <span>{count}</span>
                </div>
                {count ? (
                  <>
                    <p>
                      {count} {count === 1 ? 'pack' : 'packs'} of everyday
                      goodness.
                    </p>
                    <div className="of-mini-lines">
                      {lines.slice(0, 2).map(line => (
                        <div key={lineKey(line.id, line.pack)}>
                          <span>{shortName(line.product)}</span>
                          <b>× {line.quantity}</b>
                        </div>
                      ))}
                      {lines.length > 2 && (
                        <small>+ {lines.length - 2} more selections</small>
                      )}
                    </div>
                    <div className="of-subtotal">
                      <span>Subtotal</span>
                      <strong>{money(subtotal)}</strong>
                    </div>
                    <button
                      className="of-primary"
                      onClick={() => setPanel('cart')}
                    >
                      Review basket <ArrowRight size={16} />
                    </button>
                  </>
                ) : (
                  <div className="of-basket-empty">
                    <span>
                      <ShoppingBag size={24} />
                    </span>
                    <p>A fresh start is one pick away.</p>
                    <small>Add something delicious to begin.</small>
                  </div>
                )}
                <div className="of-rail-note">
                  <ShieldCheck size={14} /> Saved on this browser for next time
                </div>
              </section>

              <button
                className="of-guide-card"
                onClick={() => setPanel('help')}
              >
                <span className="of-guide-icon">
                  <Leaf size={21} />
                </span>
                <span>
                  <strong>Keep the good fresh.</strong>
                  <small>Your fruit storage guide</small>
                </span>
                <ArrowRight size={16} />
              </button>
            </aside>
          </div>

          <footer className="of-footer">
            <span>
              <Leaf size={15} /> EdgeMart · The fruit edit
            </span>
            <span>Picked with care. Enjoyed every day.</span>
            <button onClick={() => setPanel('help')}>
              Need a little help? <ArrowRight size={13} />
            </button>
          </footer>
        </main>
      </div>

      {count > 0 && (
        <button className="of-mobile-basket" onClick={() => setPanel('cart')}>
          <ShoppingBag size={19} />
          <span>
            {count} packs · {money(subtotal)}
          </span>
          Review basket <ArrowRight size={17} />
        </button>
      )}

      <div className="of-notice" role="status" aria-live="polite">
        {notice && (
          <span>
            <Check size={16} />
            {notice}
          </span>
        )}
      </div>

      {activeProduct && (
        <Dialog
          title="A closer look"
          onClose={() => setActiveProduct(null)}
          wide
        >
          <div className="of-detail-layout">
            <div className="of-detail-media">
              <ProductImage product={activeProduct} />
              <div>
                <Leaf size={17} /> {activeProduct.ripeness}
              </div>
            </div>
            <div className="of-detail-info">
              <span className="of-eyebrow">{activeProduct.tag}</span>
              <h3>{shortName(activeProduct)}</h3>
              <em>{activeProduct.botanical}</em>
              <div className="of-detail-rating">
                {' '}
                {activeProduct.sellerProduct ? 'New' : activeProduct.rating.toFixed(1)}{' '}
                <span>
                  · {activeProduct.reviewsCount.toLocaleString('en-IN')} catalog
                  reviews
                </span>
              </div>
              <div className="of-detail-facts">
                <div>
                  <MapPin size={17} />
                  <span>
                    <small>ORIGIN</small>
                    {activeProduct.origin}
                  </span>
                </div>
                <div>
                  <Leaf size={17} />
                  <span>
                    <small>NUTRITION HIGHLIGHTS</small>
                    {activeProduct.nutrients}
                  </span>
                </div>
                <div>
                  <Clock size={17} />
                  <span>
                    <small>STORAGE & SHELF LIFE</small>
                    {activeProduct.shelfLife}
                  </span>
                </div>
              </div>
              {activeProduct.comboItems && (
                <div className="of-box-contents">
                  <strong>Inside your fruit box</strong>
                  {activeProduct.comboItems.map(item => (
                    <span key={item}>
                      <Check size={13} />
                      {item}
                    </span>
                  ))}
                </div>
              )}
              {packSelector(activeProduct)}
              <div className="of-detail-buy">
                <div>
                  <strong>
                    {money(
                      activeProduct.packSizes[getPack(activeProduct)].price
                    )}
                  </strong>
                  <small>per selected pack</small>
                </div>
                {quantityControl(activeProduct, getPack(activeProduct))}
              </div>
              <button
                className="of-text-button"
                onClick={() => toggleFavorite(activeProduct)}
              >
                <Heart
                  size={15}
                  fill={
                    favorites.includes(activeProduct.id)
                      ? 'currentColor'
                      : 'none'
                  }
                />
                {favorites.includes(activeProduct.id)
                  ? 'Saved to your picks'
                  : 'Save for later'}
              </button>
            </div>
          </div>
        </Dialog>
      )}

      {panel === 'cart' && (
        <Dialog
          title="Your fresh basket"
          onClose={() => setPanel(null)}
          drawer
        >
          {lines.length ? (
            <>
              <div className="of-cart-lines">
                {lines.map(line => (
                  <article
                    className="of-cart-line"
                    key={lineKey(line.id, line.pack)}
                  >
                    <ProductImage product={line.product} />
                    <div>
                      <h3>{shortName(line.product)}</h3>
                      <p>{line.tier.label}</p>
                      <strong>
                        {money(line.tier.price * line.quantity)}
                      </strong>
                      <div className="of-cart-line-controls">
                        {quantityControl(line.product, line.pack)}
                        <button
                          className="of-icon-btn"
                          aria-label={`Remove ${shortName(line.product)}, ${line.tier.label} from basket`}
                          onClick={() =>
                            setCart(previous => {
                              const next = { ...previous };
                              delete next[lineKey(line.id, line.pack)];
                              return next;
                            })
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <div className="of-delivery-progress">
                <Truck size={17} />
                <span>
                  {subtotal >= 999
                    ? 'Your basket qualifies for free delivery.'
                    : `Add ${money(999 - subtotal)} for free delivery.`}
                </span>
                <progress
                  value={Math.min(subtotal, 999)}
                  max="999"
                  aria-label="Progress to free delivery"
                />
              </div>
              <div className="of-cart-totals">
                <div>
                  <span>Subtotal ({count} packs)</span>
                  <strong>{money(subtotal)}</strong>
                </div>
                <div>
                  <span>Delivery estimate</span>
                  <strong>{delivery ? money(delivery) : 'FREE'}</strong>
                </div>
                <div className="of-total">
                  <span>Estimated total</span>
                  <strong>{money(subtotal + delivery)}</strong>
                </div>
                {savings > 0 && (
                  <p>
                     You save {money(savings)} against list
                    prices.
                  </p>
                )}
              </div>
              <button
                className="of-primary of-checkout-button"
                onClick={launchCheckout}
              >
                Continue to checkout <ArrowRight size={17} />
              </button>
              <p className="of-checkout-note">
                Final discounts and delivery details appear in the existing
                checkout. Checkout currently uses the app's demo order flow.
              </p>
              <button className="of-text-button" onClick={() => setCart({})}>
                <Trash2 size={14} /> Clear basket
              </button>
            </>
          ) : (
            <div className="of-empty">
              <ShoppingBag size={35} />
              <h3>Make room for goodness.</h3>
              <p>Your basket is waiting for its first fresh pick.</p>
              <button
                className="of-primary"
                onClick={() => {
                  setPanel(null);
                  browse();
                }}
              >
                Discover fruits <ArrowRight size={16} />
              </button>
            </div>
          )}
        </Dialog>
      )}

      {panel === 'delivery' && (
        <Dialog title="Your delivery preference" onClose={() => setPanel(null)}>
          <div className="of-info-intro">
            <MapPin size={24} />
            <p>
              Save your delivery PIN for this browser. You can enter your full
              address during checkout.
            </p>
          </div>
          <form
            className="of-pin-form"
            onSubmit={event => {
              event.preventDefault();
              if (!/^[1-9]\d{5}$/.test(pinDraft)) {
                setPinError('Enter a valid six-digit Indian PIN code.');
                return;
              }
              setPin(pinDraft);
              setPanel(null);
              setNotice(
                'Delivery PIN saved. Add your full address at checkout.'
              );
            }}
          >
            <label htmlFor="of-pin">Delivery PIN code</label>
            <input
              id="of-pin"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={6}
              value={pinDraft}
              onChange={event => {
                setPinDraft(event.target.value.replace(/\D/g, ''));
                setPinError('');
              }}
              aria-invalid={Boolean(pinError)}
              aria-describedby="of-pin-note"
              placeholder="e.g. 500049"
            />
            <p id="of-pin-note" className={pinError ? 'of-error' : ''}>
              {pinError ||
                'Saving a PIN does not verify delivery availability. Checkout confirms the address.'}
            </p>
            <button className="of-primary" type="submit">
              Save delivery PIN <Check size={16} />
            </button>
          </form>
          <div className="of-delivery-info">
            <Truck size={19} />
            <div>
              <strong>Simple delivery pricing</strong>
              <p>
                ₹49 below ₹999. Free delivery from ₹999, before checkout
                discounts.
              </p>
            </div>
          </div>
        </Dialog>
      )}

      {panel === 'help' && (
        <Dialog title="A little freshness guidance" onClose={() => setPanel(null)}>
          <div className="of-info-intro">
            <Leaf size={25} />
            <p>
              Good fruit deserves a little care. Open any product for its
              specific origin, nutrients, and shelf life.
            </p>
          </div>
          {[
            {
              title: 'How do I keep my fruit fresh?',
              text: 'Follow the storage guidance in each product quick view. Keep chilled fruits refrigerated and wash just before eating. Store bananas at room temperature.',
            },
            {
              title: 'Can I choose more than one pack size?',
              text: 'Yes. Pick a pack size, add it, then select another. Each size stays as its own basket line with a separate quantity and price.',
            },
            {
              title: 'Will my basket and favorites be remembered?',
              text: 'They are saved locally in this browser. They are not connected to an account or synced between devices. Private browsing or clearing storage can remove them.',
            },
            {
              title: 'How does checkout work?',
              text: 'Your basket is sent to the existing checkout as one bundle with all pack names and quantities. The current checkout demonstrates address, payment, and delivery stages; it does not connect to a live payment or order service.',
            },
          ].map(faq => (
            <details className="of-faq" key={faq.title}>
              <summary>
                {faq.title}
                <Plus size={16} />
              </summary>
              <p>{faq.text}</p>
            </details>
          ))}
        </Dialog>
      )}

      {checkout && <CheckoutLifecycle
              item={checkout}
              quantity={1} onComplete={() => { setCart({}); }}
              onBack={() => {
                setCheckout(null);
                setPanel('cart');
              }}
              onClose={() => setCheckout(null)}
            />}
      
    </div>
  );
}
