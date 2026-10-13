import useCatalogueCart from '../../sellers/useCatalogueCart';
import useBuyerCatalogue from '../../sellers/useBuyerCatalogue';
import { DepartmentOffers, DeliveryEstimate } from '../../components/ShoppingBenefits';
import { DepartmentPhoto, ProductPhoto } from '../../components/DepartmentPhoto';
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Activity, ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, CircleHelp, FileText, Heart, Leaf, Minus, Package, Pill, Plus, Search, ShoppingBag, SlidersHorizontal, ThermometerSnowflake, Trash2, Upload, X } from 'lucide-react';
import { PHARMACY_CATEGORIES, PHARMACY_PRODUCTS } from '../../data';
import CheckoutLifecycle from '../../components/CheckoutLifecycle';
import './pharmacy.css';

const STORAGE_KEY = 'edgemart-luma-care-v1';

const money = value =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

const PRESENTATION = {
  ph1: { title: 'Metformin 500mg', kind: 'tablets', tone: 'mint' },
  ph2: { title: 'Insulin Glargine 100 IU/mL', kind: 'cartridge', tone: 'blue' },
  ph3: { title: 'Bluetooth BP monitor', kind: 'device', tone: 'peach' },
  ph4: { title: 'Zincovit multivitamins', kind: 'tablets', tone: 'lavender' },
  ph5: { title: 'Dabur Chyawanprash', kind: 'jar', tone: 'sand' },
};

const nativeCatalogue = PHARMACY_PRODUCTS.map(item => ({
  ...item,
  ...PRESENTATION[item.id],
  title: PRESENTATION[item.id]?.title || item.name,
}));

const categoryIcons = {
  all: Package,
  medicines: Pill,
  devices: Activity,
  wellness: Package,
  ayurveda: Leaf,
};

const discount = item =>
  item.originalPrice > item.price
    ? Math.round((1 - item.price / item.originalPrice) * 100)
    : 0;



// Healthcare photos are representative; verify the exact pack with the seller.
function ProductArt({ product }) { return <ProductPhoto department="pharmacy" src={product.image?.startsWith('/images/hero-') ? null : product.image} label={product.title} className="lc-product-art"/>; }

function Quantity({ product, quantity, changeQuantity }) {
  return (
    <div className="lc-quantity">
      <button
        aria-label={`Decrease ${product.title}`}
        onClick={() => changeQuantity(product.id, -1)}
      >
        <Minus size={14} />
      </button>
      <span aria-label={`${product.title} quantity`}>{quantity}</span>
      <button
        aria-label={`Increase ${product.title}`}
        disabled={quantity >= 20}
        onClick={() => changeQuantity(product.id, 1)}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

function Modal({ title, children, onClose, wide = false, drawer = false }) {
  const ref = useRef(null),
    closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previousFocus = document.activeElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();

    const handleKey = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
      }
      if (event.key !== 'Tab') return;
      const targets = [
        ...ref.current.querySelectorAll(
          'button, a[href], input, select, summary, [tabindex="0"]'
        ),
      ].filter(item => !item.disabled && item.getClientRects().length);
      const first = targets[0],
        last = targets[targets.length - 1];

      if (!first) {
        event.preventDefault();
        return;
      }
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === ref.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || document.activeElement === ref.current)
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', handleKey);
      previousFocus?.focus?.();
    };
  }, []);

  return (
    <div
      className={`lc-overlay ${drawer ? 'lc-overlay-drawer' : ''}`}
      onClick={onClose}
    >
      <section
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`lc-modal ${wide ? 'lc-modal-wide' : ''} ${drawer ? 'lc-drawer' : ''}`}
        onClick={event => event.stopPropagation()}
      >
        <header className="lc-modal-head">
          <div>
            <span className="lc-eyebrow">LUMA CARE / EDGEMART</span>
            <h2>{title}</h2>
          </div>
          <button
            className="lc-icon"
            aria-label={`Close ${title}`}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function catalogueTools(PRODUCTS) {
function readSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const cart = {};
    Object.entries(saved.cart || {}).forEach(([id, quantity]) => {
      if (
        PRODUCTS.some(item => item.id === id) &&
        Number.isInteger(quantity) &&
        quantity > 0 &&
        quantity <= 20
      )
        cart[id] = quantity;
    });
    return {
      cart,
      favorites: Array.isArray(saved.favorites)
        ? [...new Set(saved.favorites.filter(id => PRODUCTS.some(item => item.id === id)))]
        : [],
    };
  } catch {
    return { cart: {}, favorites: [] };
  }
}
return {readSaved};
}
export default function PharmacyDashboard({ onBackToLanding }) {
  const PRODUCTS = useBuyerCatalogue('pharmacy',nativeCatalogue,'Pharmacy');
  const {readSaved} = useMemo(()=>catalogueTools(PRODUCTS),[PRODUCTS]);

  const [saved] = useState(readSaved);
  const [cart, setCart] = useCatalogueCart(saved.cart, PRODUCTS),
    [favorites, setFavorites] = useState(saved.favorites);
  const [category, setCategory] = useState('all'),
    [query, setQuery] = useState('');
  const [rxFilter, setRxFilter] = useState('all'),
    [brand, setBrand] = useState('all'),
    [budget, setBudget] = useState('all');
  const [savedOnly, setSavedOnly] = useState(false),
    [sort, setSort] = useState('featured'),
    [filterOpen, setFilterOpen] = useState(false);
  const [panel, setPanel] = useState(null),
    [checkout, setCheckout] = useState(null),
    [toast, setToast] = useState('');
  const [rxFile, setRxFile] = useState(null),
    [rxPreview, setRxPreview] = useState(''),
    [rxError, setRxError] = useState(''),
    [rxBusy, setRxBusy] = useState(false);

  const catalog = useRef(null),
    searchRef = useRef(null),
    fileRequest = useRef(0);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ cart, favorites }));
    } catch {
      /* Storage is optional. Prescription files are never persisted here. */
    }
  }, [cart, favorites]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3400);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!rxFile || !rxFile.type.startsWith('image/')) {
      setRxPreview('');
      return;
    }
    const url = URL.createObjectURL(rxFile);
    setRxPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [rxFile]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const result = PRODUCTS.filter(
      item =>
        (category === 'all' || item.subCategory === category) &&
        (rxFilter === 'all' ||
          (rxFilter === 'rx' ? item.rxRequired : !item.rxRequired)) &&
        (brand === 'all' || item.brand === brand) &&
        (budget === 'all' || item.price <= Number(budget)) &&
        (!savedOnly || favorites.includes(item.id)) &&
        (!term ||
          [
            item.name,
            item.title,
            item.brand,
            item.saltComposition,
            item.manufacturer,
            item.packSize,
          ]
            .join(' ')
            .toLowerCase()
            .includes(term))
    );

    if (sort === 'low') result.sort((a, b) => a.price - b.price);
    if (sort === 'high') result.sort((a, b) => b.price - a.price);
    if (sort === 'saving') result.sort((a, b) => discount(b) - discount(a));
    return result;
  }, [category, query, rxFilter, brand, budget, savedOnly, favorites, sort, PRODUCTS]);

  const lines = Object.entries(cart).map(([id, quantity]) => ({
    product: PRODUCTS.find(item => item.id === id),
    quantity,
  }));
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0
  );
  const savings = lines.reduce(
    (sum, line) =>
      sum +
      Math.max(0, line.product.originalPrice - line.product.price) * line.quantity,
    0
  );
  const hasRx = lines.some(line => line.product.rxRequired);
  const detail =
    panel?.kind === 'product' ? PRODUCTS.find(item => item.id === panel.id) : null;
  const activeFilters = [
    category !== 'all',
    Boolean(query.trim()),
    rxFilter !== 'all',
    brand !== 'all',
    budget !== 'all',
    savedOnly,
  ].filter(Boolean).length;

  const scrollCatalog = () =>
    catalog.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
      block: 'start',
    });

  const reset = () => {
    setCategory('all');
    setQuery('');
    setRxFilter('all');
    setBrand('all');
    setBudget('all');
    setSavedOnly(false);
    setSort('featured');
  };

  const browseCategory = value => {
    reset();
    setCategory(value);
    scrollCatalog();
  };

  const showSaved = () => {
    reset();
    setSavedOnly(true);
    scrollCatalog();
  };

  const changeQuantity = (id, delta) =>
    setCart(previous => {
      const next = { ...previous },
        quantity = (previous[id] || 0) + delta;
      if (quantity <= 0) delete next[id];
      else if (quantity <= 20) next[id] = quantity;
      return next;
    });

  const add = product => {
    if(product.inStock===false)return;
    if ((cart[product.id] || 0) >= 20) {
      setToast('The demo cart limit is 20 packs per item.');
      return;
    }
    changeQuantity(product.id, 1);
    setToast(`${product.title} added to your cart.`);
  };

  const favorite = id =>
    setFavorites(previous =>
      previous.includes(id)
        ? previous.filter(item => item !== id)
        : [...previous, id]
    );

  const selectPrescription = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const request = ++fileRequest.current;
    setRxError('');
    const extensions = {
      'application/pdf': /\.pdf$/i,
      'image/jpeg': /\.jpe?g$/i,
      'image/png': /\.png$/i,
    };

    if (!extensions[file.type]?.test(file.name)) {
      setRxError('Choose a PDF, JPG or PNG file.');
      return;
    }
    if (!file.size || file.size > 10 * 1024 * 1024) {
      setRxError('Choose a non-empty file no larger than 10 MB.');
      return;
    }

    setRxBusy(true);
    try {
      const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
      const valid =
        file.type === 'application/pdf'
          ? [37, 80, 68, 70, 45].every((value, index) => bytes[index] === value)
          : file.type === 'image/png'
            ? [137, 80, 78, 71, 13, 10, 26, 10].every(
                (value, index) => bytes[index] === value
              )
            : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;

      if (request !== fileRequest.current) return;
      if (!valid) {
        setRxError(
          'The file content does not match its type. Choose a valid PDF or image.'
        );
        return;
      }
      setRxFile(file);
    } catch {
      if (request === fileRequest.current)
        setRxError('This file could not be read. Please choose it again.');
    } finally {
      if (request === fileRequest.current) setRxBusy(false);
    }
  };

  const removePrescription = () => {
    fileRequest.current += 1;
    setRxFile(null);
    setRxError('');
    setRxBusy(false);
  };

  const beginCheckout = () => {
    if (!lines.length) return;
    if (hasRx && !rxFile) {
      setRxError(
        'Select a file for the Rx-labelled items before continuing with this demo.'
      );
      setPanel({ kind: 'rx', checkout: true });
      return;
    }

    setCheckout({
      lines: lines.map(line => ({ id: line.product.id, name: line.product.name, category: 'pharmacy', image: line.product.image, price: line.product.price, quantity: line.quantity, rxRequired: line.product.rxRequired, variant: line.product.dosageForm || '' })),
      ...lines[0].product,
      id: 'luma-demo-cart',
      name: lines.map(line => `${line.product.name} × ${line.quantity}`).join(' / '),
      price: subtotal,
      category: 'pharmacy',
      pharmaMeta: {
        salt: lines.map(line => line.product.saltComposition).join(' / '),
        dosage: lines.map(line => line.product.dosageForm).join(' / '),
        rxRequired: hasRx,
        scheduleH: lines.some(line => line.product.scheduleH),
      },
      coldChain: lines.some(line => line.product.coldChain),
      returnDays: Math.min(...lines.map(line => line.product.returnDays || 0)),
    });
    setPanel(null);
  };

  return (
    <div className="lc-page">
      <a href="#lc-catalog" className="lc-skip">
        Skip to pharmacy catalogue
      </a>
      <div className="lc-topline">
        <span>EDGEMART / YOUR PERSONAL CARE HUB</span>
        <span>
          <span className="lc-dot" /> A little clarity goes a long way.
        </span>
      </div>
      <header className="lc-header">
        <button
          className="lc-logo"
          aria-label="Luma care home"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                ? 'auto'
                : 'smooth',
            })
          }
        >
          <span className="lc-logo-mark">
            <Plus size={25} strokeWidth={3} />
          </span>
          <span>
            luma<span className="lc-logo-care">care</span>
          </span>
        </button>
        <nav aria-label="Pharmacy navigation">
          <button onClick={scrollCatalog}>The catalogue</button>
          <button
            onClick={() => {
              setRxError('');
              setPanel({ kind: 'rx' });
            }}
          >
            Prescriptions
          </button>
          <button onClick={showSaved}>My saved list</button>
        </nav>
        <div className="lc-header-actions">
          <button
            className="lc-icon lc-header-search"
            aria-label="Search pharmacy"
            onClick={() => {
              scrollCatalog();
              searchRef.current?.focus({ preventScroll: true });
            }}
          >
            <Search size={20} />
          </button>
          <button
            className="lc-icon"
            aria-label="Open pharmacy help"
            onClick={() => setPanel({ kind: 'help' })}
          >
            <CircleHelp size={21} />
          </button>
          <button
            className="lc-cart-button"
            aria-label={`Open pharmacy cart (${count})`}
            onClick={() => setPanel({ kind: 'cart' })}
          >
            <ShoppingBag size={19} />
            <span>My cart</span>
            <b>{count}</b>
          </button>
          <button
            className="lc-worlds"
            onClick={onBackToLanding}
            aria-label="Back to EdgeMart"
          >
            <ArrowLeft size={16} />
            <span>All worlds</span>
          </button>
        </div>
      </header>
      <main className="lc-container">
        <div className="lc-page-intro">
          <span>
            <span className="lc-dot" /> THE PHARMACY EDIT
          </span>
          <button onClick={() => setPanel({ kind: 'help' })}>
            A clearer shopping experience <ArrowUpRight size={14} />
          </button>
        </div>
        <section className="lc-hero-grid" aria-labelledby="lc-hero-title">
          <div className="lc-hero">
            <div className="lc-hero-copy">
              <span className="lc-eyebrow">
                 EVERYDAY CARE, THOUGHTFULLY ARRANGED
              </span>
              <h1 id="lc-hero-title">
                A little more ease.
                <br />A lot more <span>care.</span>
              </h1>
              <p>
                Medicines, wellness essentials and home devices. A calm space to
                find the details and keep your selection together.
              </p>
              <button
                className="lc-button lc-button-dark"
                onClick={() => {
                  reset();
                  scrollCatalog();
                }}
              >
                Explore the catalogue <ArrowUpRight size={18} />
              </button>
              <div className="lc-hero-caption">
                <span>
                  <Package size={14} /> Pack details at a glance
                </span>
                <span>
                  <Heart size={14} /> Your own saved list
                </span>
              </div>
            </div>
            <div className="lc-hero-visual em-photo-hero"><DepartmentPhoto department="pharmacy" eager/></div>
            <span className="lc-hero-index">01 / CARE STARTS HERE</span>
          </div>
          <aside className="lc-rx-card">
            <div className="lc-rx-top">
              <span className="lc-eyebrow">YOUR PRESCRIPTION SPACE</span>
              <span className="lc-rx-label">Rx</span>
            </div>
            <img className="em-prescription-photo" src="/images/products/p3.jpg" alt="Medical equipment photograph" loading="lazy"/>
            <h2>
              {rxFile
                ? 'Your file is selected.'
                : 'Keep your prescription close.'}
            </h2>
            <p>
              {rxFile
                ? 'Available for preview in this session. Selection does not mean pharmacist approval.'
                : 'Choose a PDF or image for a local preview. No file is sent or reviewed by a pharmacist.'}
            </p>
            <button
              className="lc-button lc-button-mint"
              onClick={() => {
                setRxError('');
                setPanel({ kind: 'rx' });
              }}
            >
              {rxFile ? 'View selected file' : 'Select prescription'}{' '}
              <ArrowRight size={17} />
            </button>
            <span className="lc-rx-foot">
              <FileText size={12} /> PDF, JPG, PNG · Up to 10 MB
            </span>
          </aside>
        </section>
        <section className="lc-shortcuts" aria-label="Pharmacy shortcuts">
          <button
            className="lc-shortcut lc-shortcut-blue"
            onClick={() => browseCategory('devices')}
          >
            <span className="lc-shortcut-icon">
              <Activity size={23} />
            </span>
            <span>
              <strong>Home devices</strong>
              <small>Explore the device catalogue</small>
            </span>
            <ArrowUpRight size={17} />
          </button>
          <button
            className="lc-shortcut lc-shortcut-mint"
            onClick={() => browseCategory('wellness')}
          >
            <span className="lc-shortcut-icon">
              
            </span>
            <span>
              <strong>Wellness essentials</strong>
              <small>View vitamins & supplements</small>
            </span>
            <ArrowUpRight size={17} />
          </button>
          <button
            className="lc-shortcut lc-shortcut-peach"
            onClick={showSaved}
          >
            <span className="lc-shortcut-icon">
              <Heart size={23} />
            </span>
            <span>
              <strong>Your saved list</strong>
              <small>
                {favorites.length
                  ? `${favorites.length} items kept close`
                  : 'Keep your favourites together'}
              </small>
            </span>
            <ArrowUpRight size={17} />
          </button>
        </section>
        <section
          className="lc-catalog-section"
          id="lc-catalog"
          ref={catalog}
          aria-labelledby="lc-catalog-title"
        >
          <div className="lc-section-head">
            <div>
              <span className="lc-eyebrow">A LITTLE LESS SEARCHING</span>
              <h2 id="lc-catalog-title">Your care shelf.</h2>
            </div>
            <p>
              Find a product. Read the details.
              <br />
              Build your own selection.
            </p>
          </div>
          <div className="lc-catalog-layout">
            <aside
              className={`lc-sidebar ${filterOpen ? 'is-open' : ''}`}
              id="lc-filters"
            >
              <div className="lc-sidebar-title">
                Browse categories <Package size={15} />
              </div>
              <nav aria-label="Pharmacy categories">
                {PHARMACY_CATEGORIES.map(item => {
                  const Icon = categoryIcons[item.id] || Package;
                  return (
                    <button
                      key={item.id}
                      aria-pressed={category === item.id}
                      className={category === item.id ? 'is-active' : ''}
                      onClick={() => setCategory(item.id)}
                    >
                      <Icon size={17} />
                      <span>{item.name}</span>
                      <span className="lc-category-count">
                        {item.id === 'all'
                          ? PRODUCTS.length
                          : PRODUCTS.filter(
                              product => product.subCategory === item.id
                            ).length}
                      </span>
                    </button>
                  );
                })}
              </nav>
              <div className="lc-sidebar-separator" />
              <div className="lc-sidebar-title">
                Refine your shelf <SlidersHorizontal size={15} />
              </div>
              <label className="lc-filter-label">
                Prescription label
                <select
                  aria-label="Filter prescription status"
                  value={rxFilter}
                  onChange={event => setRxFilter(event.target.value)}
                >
                  <option value="all">All products</option>
                  <option value="rx">Rx-labelled only</option>
                  <option value="nonrx">Without Rx label</option>
                </select>
              </label>
              <label className="lc-filter-label">
                Brand
                <select
                  aria-label="Filter pharmacy brand"
                  value={brand}
                  onChange={event => setBrand(event.target.value)}
                >
                  <option value="all">All brands</option>
                  {[...new Set(PRODUCTS.map(item => item.brand))].map(value => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className="lc-filter-label">
                Budget
                <select
                  aria-label="Filter pharmacy budget"
                  value={budget}
                  onChange={event => setBudget(event.target.value)}
                >
                  <option value="all">All prices</option>
                  <option value="200">Up to ₹200</option>
                  <option value="500">Up to ₹500</option>
                  <option value="1500">Up to ₹1,500</option>
                </select>
              </label>
              <label className="lc-check">
                <input
                  type="checkbox"
                  checked={savedOnly}
                  onChange={event => setSavedOnly(event.target.checked)}
                />{' '}
                My saved items only
              </label>
              {activeFilters > 0 && (
                <button className="lc-reset" onClick={reset}>
                  Reset all filters <X size={14} />
                </button>
              )}
              <div className="lc-sidebar-note">
                <FileText size={21} />
                <h3>A note on Rx items</h3>
                <p>
                  Prescription labels come from the catalogue. A selected file is
                  a local preview, not a clinical review.
                </p>
                <button onClick={() => setPanel({ kind: 'help' })}>
                  How it works <ArrowRight size={13} />
                </button>
              </div>
            </aside>
            <div className="lc-shelf">
              <div className="lc-toolbar">
                <label className="lc-search">
                  <Search size={18} />
                  <input
                    ref={searchRef}
                    type="search"
                    aria-label="Search pharmacy catalogue"
                    placeholder="Search product, brand or listed composition…"
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                  />
                  {query && (
                    <button
                      className="lc-icon"
                      aria-label="Clear pharmacy search"
                      onClick={() => setQuery('')}
                    >
                      <X size={16} />
                    </button>
                  )}
                </label>
                <button
                  className="lc-mobile-filter"
                  aria-expanded={filterOpen}
                  aria-controls="lc-filters"
                  onClick={() => setFilterOpen(!filterOpen)}
                >
                  <SlidersHorizontal size={18} /> Filters{' '}
                  {activeFilters > 0 && <b>{activeFilters}</b>}
                </button>
              </div>
              <div className="lc-results">
                <span aria-live="polite">
                  <strong>{filtered.length}</strong>{' '}
                  {filtered.length === 1 ? 'item' : 'items'}
                  {savedOnly ? ' in your saved list' : ' on your shelf'}
                </span>
                <label>
                  Sort by
                  <select
                    aria-label="Sort pharmacy catalogue"
                    value={sort}
                    onChange={event => setSort(event.target.value)}
                  >
                    <option value="featured">Featured</option>
                    <option value="low">Price: low to high</option>
                    <option value="high">Price: high to low</option>
                    <option value="saving">Largest % saving</option>
                  </select>
                </label>
              </div>
              {activeFilters > 0 && (
                <div className="lc-active-filters">
                  <span>
                    {category !== 'all'
                      ? PHARMACY_CATEGORIES.find(item => item.id === category)?.name
                      : savedOnly
                        ? 'Your saved list'
                        : 'Filtered selection'}
                  </span>
                  <button onClick={reset}>
                    Clear selection <X size={13} />
                  </button>
                </div>
              )}
              <DepartmentOffers department="pharmacy"/>
{filtered.length ? (
                <div className="lc-product-grid">
                  {filtered.map(item => (
                    <article
                      className={`lc-product lc-tone-${item.tone}`}
                      key={item.id}
                    >
                      <div className="lc-product-media">
                        <button
                          className="lc-product-open"
                          aria-label={`View ${item.title}`}
                          onClick={() =>
                            setPanel({ kind: 'product', id: item.id })
                          }
                        >
                          <ProductArt product={item} />
                        </button>
                        {discount(item) > 0 && (
                          <span className="lc-discount">
                            {discount(item)}% OFF
                          </span>
                        )}
                        <button
                          className={`lc-save ${favorites.includes(item.id) ? 'is-saved' : ''}`}
                          aria-label={`${favorites.includes(item.id) ? 'Unsave' : 'Save'} ${item.title}`}
                          aria-pressed={favorites.includes(item.id)}
                          onClick={() => favorite(item.id)}
                        >
                          <Heart
                            size={17}
                            fill={
                              favorites.includes(item.id)
                                ? 'currentColor'
                                : 'none'
                            }
                          />
                        </button>
                        <span className="lc-illustration-label">
                          REPRESENTATIVE PHOTO
                        </span>
                      </div>
                      <div className="lc-product-body">
                        <div className="lc-product-status">
                          {item.rxRequired ? (
                            <span className="lc-rx-badge">Rx required</span>
                          ) : (
                            <span className="lc-catalog-badge">
                              Catalogue selection
                            </span>
                          )}
                          {item.coldChain && (
                            <span
                              className="lc-cold-badge"
                              title="Cold-chain flagged in catalogue"
                            >
                              <ThermometerSnowflake size={12} /> Cold-chain
                            </span>
                          )}
                        </div>
                        <span className="lc-brand">{item.brand}</span>
                        <h3>
                          <button
                            onClick={() =>
                              setPanel({ kind: 'product', id: item.id })
                            }
                          >
                            {item.title}
                          </button>
                        </h3>
                        <p className="lc-pack">{item.packSize}</p>
                        <button
                          className="lc-detail-link"
                          onClick={() =>
                            setPanel({ kind: 'product', id: item.id })
                          }
                        >
                          View product details <ArrowUpRight size={13} />
                        </button>
                        <div className="lc-product-footer">
                          <div className="lc-price">
                            <strong>{money(item.price)}</strong>
                            {item.originalPrice > item.price && (
                              <del>{money(item.originalPrice)}</del>
                            )}
                          </div>
                          {cart[item.id] ? (
                            <Quantity
                              product={item}
                              quantity={cart[item.id] || 0}
                              changeQuantity={changeQuantity}
                            />
                          ) : (
                            <button
                              className="lc-add"
                              aria-label={`Add ${item.title} to cart`}
                              onClick={() => add(item)}
                             disabled={item.inStock === false}>
                              Add <Plus size={15} />
                            </button>
                          )}
                        </div>
                      <DeliveryEstimate department="pharmacy" product={item}/></div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="lc-empty">
                  <Search size={32} />
                  <h3>
                    {savedOnly && !favorites.length
                      ? 'Your list is ready for a little care.'
                      : 'Let’s try a different selection.'}
                  </h3>
                  <p>
                    {savedOnly && !favorites.length
                      ? 'Use the heart on any item to keep it in your saved list.'
                      : 'Search a different name or composition, or clear your filters.'}
                  </p>
                  <button className="lc-button lc-button-dark" onClick={reset}>
                    Browse all products <ArrowRight size={17} />
                  </button>
                </div>
              )}
              <p className="lc-catalog-note">
                Catalogue information and prices. Pack photographs are
                representative; confirm the actual product, formulation and
                packaging with the retailer. This page does not provide treatment
                or dosage advice.
              </p>
            </div>
          </div>
        </section>
        <section className="lc-how">
          <div>
            <span className="lc-eyebrow">A MORE CONSIDERED EXPERIENCE</span>
            <h2>Clarity at every step.</h2>
            <button
              className="lc-text-link"
              onClick={() => setPanel({ kind: 'help' })}
            >
              Explore the care-hub guide <ArrowUpRight size={17} />
            </button>
          </div>
          <div className="lc-how-step">
            <span>01</span>
            <h3>Find your item</h3>
            <p>
              Search the catalogue by product, brand or listed composition.
            </p>
          </div>
          <div className="lc-how-step">
            <span>02</span>
            <h3>Know the details</h3>
            <p>
              Check the pack size, product form and prescription label.
            </p>
          </div>
          <div className="lc-how-step">
            <span>03</span>
            <h3>Keep it together</h3>
            <p>
              Save favourites and review your whole cart before demo checkout.
            </p>
          </div>
        </section>
      </main>
      <footer className="lc-footer">
        <div className="lc-container">
          <div className="lc-footer-main">
            <div>
              <span className="lc-footer-logo">
                luma<span>care +</span>
              </span>
              <p>Your personal care hub by EdgeMart.</p>
            </div>
            <button onClick={onBackToLanding}>
              <ArrowLeft size={15} /> Back to all worlds
            </button>
            <button onClick={() => setPanel({ kind: 'help' })}>
              Care-hub guide <CircleHelp size={16} />
            </button>
          </div>
          <div className="lc-footer-bottom">
            <span>THOUGHTFULLY ARRANGED. CLEARLY PRESENTED.</span>
            <span>Local prescription preview · EdgeMart checkout</span>
          </div>
        </div>
      </footer>
      {count > 0 && (
        <div className="lc-cart-tray">
          <span className="lc-tray-icon">
            <ShoppingBag size={20} />
            <b>{count}</b>
          </span>
          <span>
            <strong>{money(subtotal)}</strong>
            <small>
              {count} {count === 1 ? 'pack' : 'packs'} in your selection
            </small>
          </span>
          <button
            className="lc-button lc-button-mint"
            onClick={() => setPanel({ kind: 'cart' })}
          >
            Review cart <ArrowRight size={16} />
          </button>
        </div>
      )}
      {toast && (
        <div className="lc-toast" role="status">
          <Check size={17} />
          <span>{toast}</span>
          <button
            className="lc-icon"
            aria-label="Dismiss pharmacy message"
            onClick={() => setToast('')}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {detail && (
        <Modal
          key={detail.id}
          title="Product details"
          onClose={() => setPanel(null)}
          wide
        >
          <div className="lc-detail">
            <div className={`lc-detail-art lc-tone-${detail.tone}`}>
              <ProductArt product={detail} />
              <span>Illustrative pack · Confirm actual packaging</span>
            </div>
            <div className="lc-detail-copy">
              <div className="lc-product-status">
                {detail.rxRequired && (
                  <span className="lc-rx-badge">
                    Rx required · Catalogue label
                  </span>
                )}
                {detail.coldChain && (
                  <span className="lc-cold-badge">
                    <ThermometerSnowflake size={13} /> Cold-chain flagged
                  </span>
                )}
              </div>
              <span className="lc-brand">{detail.brand}</span>
              <h3>{detail.name}</h3>
              <dl className="lc-specs">
                <div>
                  <dt>Manufacturer</dt>
                  <dd>{detail.manufacturer}</dd>
                </div>
                <div>
                  <dt>
                    {detail.subCategory === 'devices'
                      ? 'Listed device technology'
                      : 'Listed composition'}
                  </dt>
                  <dd>{detail.saltComposition}</dd>
                </div>
                <div>
                  <dt>Product form</dt>
                  <dd>{detail.dosageForm}</dd>
                </div>
                <div>
                  <dt>Pack size</dt>
                  <dd>{detail.packSize}</dd>
                </div>
              </dl>
              <p className="lc-detail-note">
                These are catalogue details, not verified clinical guidance.
                Confirm the exact formulation, prescription and suitability with
                the retailer or a qualified healthcare professional.
              </p>
              <div className="lc-detail-bottom">
                <div className="lc-price">
                  <strong>{money(detail.price)}</strong>
                  <del>{money(detail.originalPrice)}</del>
                </div>
                {cart[detail.id] ? (
                  <Quantity
                    product={detail}
                    quantity={cart[detail.id] || 0}
                    changeQuantity={changeQuantity}
                  />
                ) : (
                  <button
                    className="lc-button lc-button-dark"
                    onClick={() => add(detail)}
                   disabled={detail.inStock === false}>
                    Add to cart <Plus size={17} />
                  </button>
                )}
              </div>
              <button
                className="lc-text-link"
                onClick={() => setPanel({ kind: 'cart' })}
              >
                Review your cart ({count}) <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </Modal>
      )}
      {panel?.kind === 'rx' && (
        <Modal
          title="Your prescription space"
          onClose={() => setPanel(null)}
        >
          <div className="lc-rx-modal-body">
            <div className="lc-local-note">
              <FileText size={20} />
              <p>
                <strong>A local preview, just for this session.</strong> Your
                file is not uploaded or reviewed by a pharmacist. It is not an
                approved prescription.
              </p>
            </div>
            <label className={`lc-upload-zone ${rxBusy ? 'is-busy' : ''}`}>
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                aria-label="Select prescription file"
                onChange={selectPrescription}
                disabled={rxBusy}
              />
              <span className="lc-upload-icon">
                <Upload size={25} />
              </span>
              <strong>
                {rxBusy
                  ? 'Checking file format…'
                  : rxFile
                    ? 'Choose a different file'
                    : 'Choose a prescription file'}
              </strong>
              <span>PDF, JPG or PNG · Maximum 10 MB</span>
            </label>
            {rxError && (
              <p role="alert" className="lc-rx-error">
                {rxError}
              </p>
            )}
            {rxFile && (
              <div className="lc-file-selected">
                {rxPreview && (
                  <img src={rxPreview} alt="Selected prescription preview" />
                )}
                <div className="lc-file-summary">
                  <span className="lc-file-icon">
                    <FileText size={23} />
                  </span>
                  <div>
                    <strong>{rxFile.name}</strong>
                    <span>
                      {(rxFile.size / 1024 / 1024).toFixed(2)} MB · Selected
                      locally · Not reviewed
                    </span>
                  </div>
                  <button
                    className="lc-icon"
                    aria-label="Remove selected prescription"
                    onClick={removePrescription}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            )}
            <div className="lc-rx-explain">
              <span>01</span>
              <p>Choose a clear file to preview in this session.</p>
              <span>02</span>
              <p>
                The demo checks the file format and size, not medical validity.
              </p>
              <span>03</span>
              <p>
                A real pharmacy service would need a licensed review before
                dispensing Rx medicines.
              </p>
            </div>
            <button
              className="lc-button lc-button-dark lc-full"
              disabled={rxBusy || (panel.checkout && !rxFile)}
              onClick={panel.checkout ? beginCheckout : () => setPanel(null)}
            >
              {panel.checkout
                ? 'Continue to checkout'
                : 'Return to your care shelf'}
              <ArrowRight size={17} />
            </button>
          </div>
        </Modal>
      )}
      {panel?.kind === 'cart' && (
        <Modal
          title="Your care cart"
          onClose={() => setPanel(null)}
          drawer
        >
          {lines.length ? (
            <>
              <div className="lc-cart-lines">
                {lines.map(({ product, quantity }) => (
                  <article className="lc-cart-line" key={product.id}>
                    <div className={`lc-cart-art lc-tone-${product.tone}`}>
                      <ProductArt product={product} />
                    </div>
                    <div className="lc-cart-line-copy">
                      <h3>{product.title}</h3>
                      <p>{product.packSize}</p>
                      {product.rxRequired && (
                        <span className="lc-rx-badge">Rx required</span>
                      )}
                      <div className="lc-cart-line-bottom">
                        <Quantity
                          product={product}
                          quantity={quantity}
                          changeQuantity={changeQuantity}
                        />
                        <strong>{money(product.price * quantity)}</strong>
                      </div>
                    </div>
                    <button
                      className="lc-icon"
                      aria-label={`Remove ${product.title} from cart`}
                      onClick={() =>
                        setCart(previous => {
                          const next = { ...previous };
                          delete next[product.id];
                          return next;
                        })
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </article>
                ))}
              </div>
              {hasRx && (
                <button
                  className="lc-cart-rx-status"
                  onClick={() => {
                    setRxError('');
                    setPanel({ kind: 'rx' });
                  }}
                >
                  <FileText size={18} />
                  <span>
                    {rxFile
                      ? 'File selected locally · Not reviewed'
                      : 'Rx-labelled items in your cart'}
                    <small>
                      {rxFile
                        ? 'View your file preview'
                        : 'Select a prescription file for the demo'}
                    </small>
                  </span>
                  <ArrowRight size={15} />
                </button>
              )}
              <div className="lc-cart-total">
                <div>
                  <span>Catalogue subtotal</span>
                  <strong>{money(subtotal)}</strong>
                </div>
                <div className="lc-cart-savings">
                  <span>Difference from listed original prices</span>
                  <span>{money(savings)}</span>
                </div>
                <p>
                  Checkout is a simulation. Its delivery charges and discounts
                  are calculated in the demo. No real order, payment or
                  pharmacist review occurs.
                </p>
                <button
                  className="lc-button lc-button-dark lc-full"
                  onClick={beginCheckout}
                >
                  Continue to checkout <ArrowRight size={17} />
                </button>
                <button
                  className="lc-text-link lc-empty-cart"
                  onClick={() => setCart({})}
                >
                  Empty cart <Trash2 size={13} />
                </button>
              </div>
            </>
          ) : (
            <div className="lc-empty">
              <ShoppingBag size={34} />
              <h3>A fresh start for your care shelf.</h3>
              <p>Your cart is empty. Explore the catalogue to begin a selection.</p>
              <button
                className="lc-button lc-button-dark"
                onClick={() => {
                  setPanel(null);
                  scrollCatalog();
                }}
              >
                Browse the catalogue <ArrowRight size={17} />
              </button>
            </div>
          )}
        </Modal>
      )}
      {panel?.kind === 'help' && (
        <Modal
          title="The care-hub guide"
          onClose={() => setPanel(null)}
        >
          <div className="lc-help">
            <p>Simple answers for a clearer shopping experience.</p>
            {[
              [
                'How do I find a product?',
                'Search by product name, brand, manufacturer or listed composition. Categories and filters narrow the catalogue; they do not recommend treatment or substitute medicines.',
              ],
              [
                'What does the Rx label mean here?',
                'The Rx flag is supplied by the existing product catalogue. For this demo, Rx-labelled cart items require a locally selected file before checkout. The file format check is not prescription approval or a clinical review.',
              ],
              [
                'Where does my prescription file go?',
                'It stays in memory for this page session. Image files can be previewed locally. No file is sent to a server or saved alongside your cart. Refreshing or leaving the page clears the file selection.',
              ],
              [
                'Are these the actual product packs?',
                'The page uses representative healthcare photographs; these do not identify a manufacturer or exact medicine pack. Confirm the real product, packaging, formulation and availability with the retailer.',
              ],
              [
                'Will my saved list and cart stay?',
                'Favourites and product quantities are saved in this browser when local storage is available. They are not synced to a user account. Prescription files are not included.',
              ],
              [
                'Does checkout create an order?',
                'Checkout opens the existing EdgeMart demonstration. No real payment, order, delivery or pharmacist review is performed. Closing or cancelling the demo keeps your cart.',
              ],
            ].map(([title, text]) => (
              <details className="lc-accordion" key={title}>
                <summary>
                  {title}
                  <ChevronDown size={16} />
                </summary>
                <p>{text}</p>
              </details>
            ))}
            <div className="lc-help-note">
              <Plus size={25} />
              <p>
                Product details first. A clearer selection, at your own pace.
              </p>
            </div>
          </div>
        </Modal>
      )}
      {checkout && <CheckoutLifecycle
            item={checkout}
            quantity={1} onComplete={() => { setCart({}); }}
            onBack={() => {
              setCheckout(null);
              setPanel({ kind: 'cart' });
            }}
            onClose={() => setCheckout(null)}
          />}
    </div>
  );
}
