import useCatalogueCart from '../../sellers/useCatalogueCart';
import useBuyerCatalogue from '../../sellers/useBuyerCatalogue';
import { DepartmentOffers, DeliveryEstimate } from '../../components/ShoppingBenefits';
import { DepartmentPhoto, ProductPhoto } from '../../components/DepartmentPhoto';
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Drumstick, Fish, Flame, Heart, Minus, Package, Plus, Search, ShoppingBag, SlidersHorizontal, Trash2, Utensils, X } from 'lucide-react';
import { MEAT_PRODUCTS } from '../../data';
import CheckoutLifecycle from '../../components/CheckoutLifecycle';
import './meat.css';

const STORAGE = 'edgemart-ember-tide-v1';

const money = n =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);

const LABELS = {
  m1: {
    title: 'Lamb curry cut',
    note: 'Bone-in · Shoulder & ribs',
    art: 'lamb',
    edit: 'The slow Sunday',
    tone: 'rose',
  },
  m2: {
    title: 'Chicken curry cut',
    note: 'Skinless · Mixed cuts',
    art: 'chicken',
    edit: 'The everyday favourite',
    tone: 'sand',
  },
  m3: {
    title: 'Atlantic salmon steaks',
    note: 'Bone-in · Centre cut',
    art: 'fish',
    edit: 'A little sea on your plate',
    tone: 'sea',
  },
  m4: {
    title: 'Chicken breast fillets',
    note: 'Boneless · Skinless',
    art: 'breast',
    edit: 'The versatile staple',
    tone: 'sand',
  },
  m5: {
    title: 'Peri-peri chicken wings',
    note: 'Marinated · Ready to cook',
    art: 'wings',
    edit: 'Bring a little heat',
    tone: 'spice',
  },
};

const nativeCatalogue = MEAT_PRODUCTS.map(p => ({
  ...p,
  ...LABELS[p.id],
  title: LABELS[p.id]?.title || p.name,
}));

const CATEGORIES = [
  ['all', 'The whole counter', 'All five favourites', Utensils],
  ['chicken', 'Chicken', 'Everyday essentials', Drumstick],
  ['mutton', 'Lamb & goat', 'Rich, hearty cuts', Flame],
  ['fish', 'Seafood', 'From the blue', Fish],
  ['ready', 'Ready to cook', 'Already marinated', Package],
];

const EDITS = [
  {
    title: 'The curry-night duo',
    copy: 'Lamb curry cut + chicken curry cut. Two classics for your next kitchen session.',
    lines: [
      ['m1', 0],
      ['m2', 0],
    ],
    label: '2 packs · 500g each',
    tone: 'orange',
  },
  {
    title: 'The weekend line-up',
    copy: 'Boneless chicken breast + peri-peri wings. Keep your next get-together interesting.',
    lines: [
      ['m4', 0],
      ['m5', 0],
    ],
    label: '2 packs · 500g + 350g',
    tone: 'sea',
  },
];

const lineKey = (id, pack) => `${id}:${pack}`;

const saving = p => Math.max(0, (p.originalPrice || p.price) - p.price);

const scrollBehavior = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth';



// Use representative counter photographs without claiming exact product packaging.
function CutArt({ product: p }) { const photos={chicken:'/images/products/m2.jpg',breast:'/images/products/m2.jpg',fish:'/images/products/m3.jpg',wings:'/images/products/ember-wings.jpg'}; return <ProductPhoto department="meat" src={p.sellerProduct ? p.image : photos[p.art]} label={p.title} className="et-cut-art"/>; }

function Quantity({ label, quantity, onChange }) {
  return (
    <div className="et-quantity">
      <button
        aria-label={`Decrease ${label}`}
        onClick={() => onChange(-1)}
      >
        <Minus size={14} />
      </button>
      <span aria-label={`${label} quantity`}>{quantity}</span>
      <button
        aria-label={`Increase ${label}`}
        onClick={() => onChange(1)}
        disabled={quantity >= 20}
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
    const previous = document.activeElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();

    const keydown = e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRef.current();
      }
      if (e.key !== 'Tab') return;
      const targets = [
        ...ref.current.querySelectorAll(
          'button,a[href],input,select,summary,[tabindex="0"]'
        ),
      ].filter(n => !n.disabled && n.getClientRects().length),
        first = targets[0],
        last = targets[targets.length - 1];

      if (!first) {
        e.preventDefault();
        return;
      }
      if (
        e.shiftKey &&
        (document.activeElement === first || document.activeElement === ref.current)
      ) {
        e.preventDefault();
        last.focus();
      } else if (
        !e.shiftKey &&
        (document.activeElement === last || document.activeElement === ref.current)
      ) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', keydown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', keydown);
      previous?.focus?.();
    };
  }, []);

  return (
    <div
      className={`et-overlay ${drawer ? 'et-overlay-drawer' : ''}`}
      onClick={onClose}
    >
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`et-modal ${wide ? 'et-modal-wide' : ''} ${drawer ? 'et-drawer' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <header className="et-modal-head">
          <div>
            <span className="et-eyebrow">EMBER & TIDE / EDGEMART</span>
            <h2>{title}</h2>
          </div>
          <button className="et-icon" aria-label={`Close ${title}`} onClick={onClose}>
            <X size={21} />
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
    const data = JSON.parse(localStorage.getItem(STORAGE) || '{}'),
      cart = {};
    Object.entries(data.cart || {}).forEach(([key, q]) => {
      const [id, v] = key.split(':'),
        i = Number(v),
        p = PRODUCTS.find(p => p.id === id);
      if (
        p &&
        key === lineKey(id, i) &&
        Number.isInteger(i) &&
        p.packSizes[i] &&
        Number.isInteger(q) &&
        q > 0 &&
        q <= 20
      )
        cart[key] = q;
    });
    return {
      cart,
      favorites: Array.isArray(data.favorites)
        ? [...new Set(data.favorites.filter(id => PRODUCTS.some(p => p.id === id)))]
        : [],
    };
  } catch {
    return { cart: {}, favorites: [] };
  }
}
return {readSaved};
}
export default function MeatDashboard({ onBackToLanding }) {
  const PRODUCTS = useBuyerCatalogue('meat',nativeCatalogue,'Meat');
  const {readSaved} = useMemo(()=>catalogueTools(PRODUCTS),[PRODUCTS]);

  const [saved] = useState(readSaved);
  const [cart, setCart] = useCatalogueCart(saved.cart, PRODUCTS),
    [favorites, setFavorites] = useState(saved.favorites),
    [packs, setPacks] = useState({});
  const [category, setCategory] = useState('all'),
    [query, setQuery] = useState(''),
    [cut, setCut] = useState('all'),
    [budget, setBudget] = useState('all'),
    [sort, setSort] = useState('featured'),
    [savedOnly, setSavedOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false),
    [panel, setPanel] = useState(null),
    [checkout, setCheckout] = useState(null),
    [toast, setToast] = useState('');

  const catalog = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify({ cart, favorites }));
    } catch {
      /* Storage is optional. */
    }
  }, [cart, favorites]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const pi = p => packs[p.id] || 0,
    selected = p => p.packSizes[pi(p)];

  const browse = () =>
    catalog.current?.scrollIntoView({
      behavior: scrollBehavior(),
      block: 'start',
    });

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const result = PRODUCTS.filter(
      p =>
        (category === 'all' || p.subCategory === category) &&
        (!term ||
          [p.name, p.title, p.cutType, p.origin, p.note]
            .join(' ')
            .toLowerCase()
            .includes(term)) &&
        (!savedOnly || favorites.includes(p.id)) &&
        (budget === 'all' ||
          p.packSizes[packs[p.id] || 0].price <= Number(budget)) &&
        (cut === 'all' ||
          (cut === 'boneless'
            ? /boneless/i.test(p.cutType)
            : cut === 'bone-in'
              ? ['m1', 'm2', 'm3', 'm5'].includes(p.id)
              : p.subCategory === 'ready'))
    );
    const price = p => p.packSizes[packs[p.id] || 0].price;
    if (sort === 'low') result.sort((a, b) => price(a) - price(b));
    if (sort === 'high') result.sort((a, b) => price(b) - price(a));
    if (sort === 'saving')
      result.sort(
        (a, b) =>
          saving(b.packSizes[packs[b.id] || 0]) -
          saving(a.packSizes[packs[a.id] || 0])
      );
    return result;
  }, [category, query, savedOnly, favorites, budget, cut, packs, sort, PRODUCTS]);

  const lines = Object.entries(cart).map(([key, quantity]) => {
    const [id, i] = key.split(':'),
      product = PRODUCTS.find(p => p.id === id);
    return {
      key,
      product,
      index: Number(i),
      pack: product.packSizes[Number(i)],
      quantity,
    };
  });

  const count = lines.reduce((s, l) => s + l.quantity, 0),
    subtotal = lines.reduce((s, l) => s + l.pack.price * l.quantity, 0),
    savings = lines.reduce((s, l) => s + saving(l.pack) * l.quantity, 0);

  const activeFilters =
    Number(cut !== 'all') +
    Number(budget !== 'all') +
    Number(savedOnly) +
    Number(!!query.trim());

  const change = (p, index, delta) => {
    const key = lineKey(p.id, index);
    setCart(prev => {
      const next = { ...prev },
        q = Math.min(20, Math.max(0, (next[key] || 0) + delta));
      if (q) next[key] = q;
      else delete next[key];
      return next;
    });
  };

  const add = (p, index = pi(p)) => {
    if(p.inStock===false)return;
    change(p, index, 1);
    setToast(`${p.title} added to your cut list.`);
  };

  const favorite = p =>
    setFavorites(prev =>
      prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
    );

  const reset = () => {
    setCategory('all');
    setQuery('');
    setCut('all');
    setBudget('all');
    setSavedOnly(false);
    setSort('featured');
  };

  const addEdit = edit => {
    const available = edit.lines.filter(
      ([id, index]) => (cart[lineKey(id, index)] || 0) < 20
    );
    if (!available.length) {
      setToast(
        'Both packs are already at the limit of 20. Adjust your cut list first.'
      );
      return;
    }
    setCart(prev => {
      const next = { ...prev };
      available.forEach(([id, index]) => {
        const key = lineKey(id, index);
        next[key] = Math.min(20, (next[key] || 0) + 1);
      });
      return next;
    });
    setToast(
      available.length === edit.lines.length
        ? `${edit.title} added. Review both packs in your cut list.`
        : 'One pack added. The other pack is already at the limit of 20.'
    );
  };

  const beginCheckout = () => {
    if (!lines.length) return;
    setPanel(null);
    setCheckout({
      lines: lines.map(line => ({ id: line.product.id, name: line.product.title, category: 'meat', image: line.product.image, price: line.pack.price, quantity: line.quantity, variant: line.pack.label, options: { pack: line.index } })),
      id: 'ember-tide-selection',
      name: lines
        .map(l => `${l.product.title} — ${l.pack.label} × ${l.quantity}`)
        .join(' | '),
      price: subtotal,
      category: 'meat',
      image: '/images/products/ember-wings.jpg',
      returnDays: 0,
      meatMeta: {
        netWeight: lines.map(l => `${l.pack.label} × ${l.quantity}`).join('; '),
        grossWeight: 'Varies by cut and pack; confirm with retailer',
        cutType: 'Mixed selection',
        cert: 'Refer to individual catalogue details',
      },
    });
  };

  const detail =
    panel?.kind === 'detail' ? PRODUCTS.find(p => p.id === panel.id) : null;

  const cartContents = compact => (
    <>
      {lines.length ? (
        <>
          <div
            className={`et-cart-lines ${compact ? 'et-cart-lines-compact' : ''}`}
          >
            {lines.map(l => (
              <article className="et-cart-line" key={l.key}>
                <div className={`et-cart-art et-tone-${l.product.tone}`}>
                  <CutArt product={l.product} />
                </div>
                <div className="et-cart-copy">
                  <h3>{l.product.title}</h3>
                  <p>{l.pack.label}</p>
                  <div className="et-cart-line-bottom">
                    <Quantity
                      label={`${l.product.title}, ${l.pack.label}`}
                      quantity={l.quantity}
                      onChange={d => change(l.product, l.index, d)}
                    />
                    <strong>{money(l.pack.price * l.quantity)}</strong>
                  </div>
                </div>
                <button
                  className="et-icon et-remove"
                  aria-label={`Remove ${l.product.title}, ${l.pack.label}`}
                  onClick={() =>
                    setCart(prev => {
                      const next = { ...prev };
                      delete next[l.key];
                      return next;
                    })
                  }
                >
                  <X size={15} />
                </button>
              </article>
            ))}
          </div>
          <div className="et-cart-total">
            <div>
              <span>Product subtotal</span>
              <strong>{money(subtotal)}</strong>
            </div>
            <div className="et-cart-savings">
              <span>Listed price savings</span>
              <span>{money(savings)}</span>
            </div>
            <p>
              Delivery and discounts appear in demo checkout. No real order or
              payment is created.
            </p>
            <button
              className="et-button et-button-orange et-full"
              onClick={beginCheckout}
            >
              EdgeMart checkout <ArrowRight size={17} />
            </button>
            <button
              className="et-text-link et-empty-cart"
              onClick={() => setCart({})}
            >
              Clear cut list <Trash2 size={13} />
            </button>
          </div>
        </>
      ) : (
        <div className="et-empty-basket">
          <ShoppingBag size={32} />
          <h3>A great meal starts here.</h3>
          <p>
            Choose a cut and a pack size.
            <br />
            We’ll keep your selection together.
          </p>
          {!compact && (
            <button
              className="et-button et-button-orange"
              onClick={() => {
                setPanel(null);
                browse();
              }}
            >
              Explore the cuts <ArrowRight size={17} />
            </button>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="et-page">
      <div className="et-announcement">
        <span>THE MEAT & SEAFOOD COUNTER</span>
        <span>Good food. Great company. Your next kitchen story.</span>
        <button onClick={() => setPanel({ kind: 'guide' })}>
          Meet your cuts <ArrowUpRight size={13} />
        </button>
      </div>
      <header className="et-header">
        <div className="et-container et-header-inner">
          <button
            className="et-brand"
            aria-label="Ember and Tide home"
            onClick={() => window.scrollTo({ top: 0, behavior: scrollBehavior() })}
          >
            <span className="et-brand-mark">
              <Flame size={24} />
              <span />
            </span>
            <span>
              ember <i>&</i> tide
              <small>THE EDGEMART COUNTER</small>
            </span>
          </button>
          <nav aria-label="Meat dashboard navigation">
            <button className="et-nav-active" onClick={browse}>
              Shop the cuts
            </button>
            <button
              onClick={() =>
                document
                  .getElementById('et-kitchen-edits')
                  ?.scrollIntoView({ behavior: scrollBehavior() })
              }
            >
              Kitchen edits
            </button>
            <button onClick={() => setPanel({ kind: 'guide' })}>Cut guide</button>
          </nav>
          <div className="et-header-actions">
            <button
              className="et-icon"
              aria-label={`Saved cuts (${favorites.length})`}
              onClick={() => {
                setSavedOnly(!savedOnly);
                browse();
              }}
              aria-pressed={savedOnly}
            >
              <Heart size={20} />
              {favorites.length > 0 && <b>{favorites.length}</b>}
            </button>
            <button
              className="et-header-cart"
              onClick={() => setPanel({ kind: 'cart' })}
              aria-label={`Open cut list (${count} ${count === 1 ? 'pack' : 'packs'})`}
            >
              <ShoppingBag size={19} />
              <span>Cut list</span>
              <b>{count}</b>
            </button>
            <button
              className="et-worlds"
              onClick={onBackToLanding}
              aria-label="Back to all departments"
            >
              <ArrowLeft size={17} />
            </button>
          </div>
        </div>
      </header>
      <main>
        <section className="et-hero et-container">
          <div className="et-hero-copy">
            <span className="et-eyebrow">
               FROM COUNTER TO KITCHEN
            </span>
            <h1>
              Great cuts.
              <br />
              Better <span>dinners.</span>
            </h1>
            <p>
              From the comfort of a slow curry to the excitement of a weekend
              feast. Find your cut. Make it your own.
            </p>
            <div className="et-hero-actions">
              <button className="et-button et-button-orange" onClick={browse}>
                Find your favourite cut <ArrowUpRight size={19} />
              </button>
              <button
                className="et-hero-guide"
                onClick={() => setPanel({ kind: 'guide' })}
              >
                <span>
                  <Utensils size={18} />
                </span>
                A little cut knowledge
              </button>
            </div>
            <div className="et-hero-foot">
              <span>
                <Package size={17} />
                Choose your pack
              </span>
              <span>
                <Heart size={17} />
                Keep your favourites
              </span>
              <span>
                <ShoppingBag size={17} />
                Build your feast
              </span>
            </div>
          </div>
          <div className="et-hero-image">
            <DepartmentPhoto department="meat" eager/>
            <div className="et-hero-image-shade" />
            
            <div className="et-hero-caption">
              <div>
                <span>THE WEEKEND MOOD</span>
                <strong>
                  Something worth
                  <br />
                  gathering around.
                </strong>
                <small>Serving inspiration · Not the actual product</small>
              </div>
              <button
                className="et-hero-image-button"
                aria-label="Browse ready-to-cook cuts"
                onClick={() => {
                  reset();
                  setCategory('ready');
                  browse();
                }}
              >
                <ArrowUpRight size={25} />
              </button>
            </div>
          </div>
        </section>
        <div className="et-counter-strip">
          <div className="et-container">
            <span>
              CHICKEN <Drumstick size={17} />
            </span>
            <span>
              LAMB <Flame size={17} />
            </span>
            <span>
              SEAFOOD <Fish size={17} />
            </span>
            <span>
              READY TO COOK 
            </span>
            <span>
              YOUR KITCHEN, YOUR WAY <Utensils size={17} />
            </span>
          </div>
        </div>
        <section
          ref={catalog}
          id="et-counter"
          className="et-catalog et-container"
          aria-label="Shop the meat catalogue"
        >
          <div className="et-section-heading">
            <div>
              <span className="et-eyebrow">A CUT FOR EVERY OCCASION</span>
              <h2>At the counter.</h2>
            </div>
            <p>
              Five favourites. A whole lot of possibility.
              <br />
              Pick a cut, then choose the pack that fits.
            </p>
          </div>
          <div
            className="et-categories"
            role="group"
            aria-label="Product categories"
          >
            {CATEGORIES.map(([id, title, sub, Icon], i) => (
              <button
                key={id}
                className={`et-category ${category === id ? 'is-active' : ''}`}
                aria-pressed={category === id}
                onClick={() => setCategory(id)}
              >
                <span className="et-category-number">0{i + 1}</span>
                <Icon size={23} />
                <strong>{title}</strong>
                <small>{sub}</small>
                <ArrowUpRight size={16} className="et-category-arrow" />
              </button>
            ))}
          </div>
          <div className="et-shop-layout">
            <div className="et-shelf">
              <div className="et-toolbar">
                <label className="et-search">
                  <Search size={18} />
                  <input
                    type="search"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search cuts, names or origin…"
                    aria-label="Search meat and seafood"
                  />
                  {query && (
                    <button
                      aria-label="Clear search"
                      onClick={() => setQuery('')}
                    >
                      <X size={15} />
                    </button>
                  )}
                </label>
                <button
                  className={`et-filter-button ${filtersOpen || activeFilters ? 'is-active' : ''}`}
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  aria-expanded={filtersOpen}
                  aria-controls="et-filter-panel"
                >
                  <SlidersHorizontal size={17} />
                  Filters {activeFilters > 0 && <b>{activeFilters}</b>}
                </button>
                <label className="et-sort">
                  <span className="et-sr-only">Sort products</span>
                  <select
                    aria-label="Sort products"
                    value={sort}
                    onChange={e => setSort(e.target.value)}
                  >
                    <option value="featured">Counter favourites</option>
                    <option value="low">Price: low to high</option>
                    <option value="high">Price: high to low</option>
                    <option value="saving">Biggest price saving</option>
                  </select>
                  <ChevronDown size={14} />
                </label>
              </div>
              {filtersOpen && (
                <div id="et-filter-panel" className="et-filter-panel">
                  <label>
                    Cut preference
                    <select
                      aria-label="Cut preference"
                      value={cut}
                      onChange={e => setCut(e.target.value)}
                    >
                      <option value="all">All cut types</option>
                      <option value="boneless">Boneless</option>
                      <option value="bone-in">Bone-in</option>
                      <option value="marinated">Marinated</option>
                    </select>
                  </label>
                  <label>
                    Selected pack price
                    <select
                      aria-label="Maximum pack price"
                      value={budget}
                      onChange={e => setBudget(e.target.value)}
                    >
                      <option value="all">Any price</option>
                      <option value="250">Up to ₹250</option>
                      <option value="500">Up to ₹500</option>
                      <option value="1000">Up to ₹1,000</option>
                    </select>
                  </label>
                  <button
                    className={`et-saved-filter ${savedOnly ? 'is-active' : ''}`}
                    onClick={() => setSavedOnly(!savedOnly)}
                    aria-pressed={savedOnly}
                  >
                    <Heart size={16} />
                    Saved only ({favorites.length})
                  </button>
                  <button className="et-text-link" onClick={reset}>
                    Reset all <X size={14} />
                  </button>
                </div>
              )}
              <div className="et-results">
                <span>
                  {filtered.length} {filtered.length === 1 ? 'cut' : 'cuts'}
                  {savedOnly ? ' in your saved list' : ' on the counter'}
                </span>
                <span>
                  {activeFilters > 0 || category !== 'all' ? (
                    <button onClick={reset}>
                      Clear selection <X size={12} />
                    </button>
                  ) : (
                    'Illustrated cuts · Catalogue prices'
                  )}
                </span>
              </div>
              <DepartmentOffers department="meat"/>
{filtered.length ? (
                <div className="et-product-grid">
                  {filtered.map((p, i) => {
                    const pack = selected(p),
                      index = pi(p),
                      q = cart[lineKey(p.id, index)] || 0;
                    return (
                      <article
                        className="et-product"
                        key={p.id}
                        style={{ '--et-delay': `${i * 45}ms` }}
                      >
                        <div className={`et-product-visual et-tone-${p.tone}`}>
                          <button
                            className="et-art-button"
                            onClick={() => setPanel({ kind: 'detail', id: p.id })}
                            aria-label={`View ${p.title} details`}
                          >
                            <CutArt product={p} />
                          </button>
                          <span className="et-product-number">
                            {p.sellerProduct ? 'PRODUCT / YOUR COUNTER' : `CUT / ${p.id.replace('m', '0')}`}
                          </span>
                          <button
                            className={`et-heart ${favorites.includes(p.id) ? 'is-saved' : ''}`}
                            aria-label={`${favorites.includes(p.id) ? 'Unsave' : 'Save'} ${p.title}`}
                            aria-pressed={favorites.includes(p.id)}
                            onClick={() => favorite(p)}
                          >
                            <Heart size={17} />
                          </button>
                          <span className="et-cut-label">
                            {p.sellerProduct && p.subCategory === 'other' ? 'COUNTER SELECTION' : p.subCategory === 'ready'
                              ? 'MARINATED'
                              : p.art === 'fish'
                                ? 'SEAFOOD'
                                : p.art === 'lamb'
                                  ? 'LAMB'
                                  : 'CHICKEN'}
                          </span>
                        </div>
                        <div className="et-product-copy">
                          <span className="et-product-edit">{p.edit}</span>
                          <button
                            className="et-product-title"
                            onClick={() => setPanel({ kind: 'detail', id: p.id })}
                          >
                            <h3>{p.title}</h3>
                            <ArrowUpRight size={15} />
                          </button>
                          <p>{p.note}</p>
                          <label className="et-pack-select">
                            <span className="et-sr-only">
                              Pack size for {p.title}
                            </span>
                            <select
                              aria-label={`Pack size for ${p.title}`}
                              value={index}
                              onChange={e =>
                                setPacks(prev => ({
                                  ...prev,
                                  [p.id]: Number(e.target.value),
                                }))
                              }
                            >
                              {p.packSizes.map((pack, i) => (
                                <option key={pack.label} value={i}>
                                  {pack.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={14} />
                          </label>
                          <div className="et-product-buy">
                            <div className="et-price">
                              <strong>{money(pack.price)}</strong>
                              {saving(pack) > 0 && (
                                <del>{money(pack.originalPrice)}</del>
                              )}
                              <small>
                                {saving(pack) > 0
                                  ? `Save ${money(saving(pack))}`
                                  : 'Selected pack'}
                              </small>
                            </div>
                            {q ? (
                              <Quantity
                                label={`${p.title}, ${pack.label}`}
                                quantity={q}
                                onChange={d => change(p, index, d)}
                              />
                            ) : (
                              <button
                                className="et-add"
                                aria-label={`Add ${p.title} to cut list`}
                                onClick={() => add(p)}
                               disabled={(p.inStock === false) || p.inStock === false}>
                                Add <Plus size={15} />
                              </button>
                            )}
                          </div>
                        <DeliveryEstimate department="meat" product={p}/></div>
                      </article>
                    );
                  })}
                  <article className="et-guide-card">
                    <span className="et-eyebrow">COUNTER NOTES / 06</span>
                    <Utensils size={38} strokeWidth={1.2} />
                    <h3>
                      A little knowledge.
                      <br />
                      A better choice.
                    </h3>
                    <p>
                      Bone-in or boneless? A small pack or a family tray? Get to
                      know your options.
                    </p>
                    <button
                      className="et-text-link"
                      onClick={() => setPanel({ kind: 'guide' })}
                    >
                      Explore the cut guide <ArrowUpRight size={17} />
                    </button>
                  </article>
                </div>
              ) : (
                <div className="et-empty">
                  <Search size={32} />
                  <h3>
                    {savedOnly && !favorites.length
                      ? 'Keep the cuts you love.'
                      : 'No cuts in this selection.'}
                  </h3>
                  <p>
                    {savedOnly && !favorites.length
                      ? 'Tap a heart to start your own saved collection.'
                      : 'Try a different search or clear the filters to browse the whole counter.'}
                  </p>
                  <button className="et-button et-button-orange" onClick={reset}>
                    Back to the whole counter <ArrowRight size={17} />
                  </button>
                </div>
              )}
              <p className="et-catalog-note">
                Cut photographs are representative. Sizes and prices come from
                the existing catalogue; confirm actual products and availability
                with the retailer.
              </p>
            </div>
            <aside className="et-counter-basket" aria-label="Live cut list">
              <div className="et-basket-head">
                <div>
                  <span className="et-eyebrow">YOUR NEXT GREAT MEAL</span>
                  <h2>The cut list.</h2>
                </div>
                <b>{count}</b>
              </div>
              {cartContents(true)}
              <div className="et-basket-foot">
                <Heart size={14} />
                <span>Your list stays in this browser.</span>
              </div>
            </aside>
          </div>
        </section>
        <section
          id="et-kitchen-edits"
          className="et-kitchen et-container"
        >
          <div className="et-section-heading">
            <div>
              <span className="et-eyebrow">LESS PLANNING. MORE POSSIBILITY.</span>
              <h2>The kitchen edits.</h2>
            </div>
            <p>
              Thoughtful combinations, one easy selection.
              <br />
              Each edit adds two separate catalogue packs.
            </p>
          </div>
          <div className="et-edits">
            {EDITS.filter(edit=>edit.lines.every(([id,index])=>PRODUCTS.find(p=>p.id===id)?.packSizes?.[index])).map((edit, i) => {
              const total = edit.lines.reduce(
                (sum, [id, index]) =>
                  sum + PRODUCTS.find(p => p.id === id).packSizes[index].price,
                0
              );
              return (
                <article
                  className={`et-edit et-edit-${edit.tone}`}
                  key={edit.title}
                >
                  <div className="et-edit-number">
                    0{i + 1}
                    <span>THE KITCHEN EDIT</span>
                  </div>
                  <div className="et-edit-copy">
                    <span className="et-eyebrow">{edit.label}</span>
                    <h3>{edit.title}</h3>
                    <p>{edit.copy}</p>
                    <button
                      className="et-edit-add"
                      onClick={() => addEdit(edit)}
                    >
                      Add the edit <ArrowUpRight size={17} />
                      <strong>{money(total)}</strong>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
        <section className="et-bottom-story et-container">
          <Flame size={38} strokeWidth={1.1} />
          <h2>
            Good food starts with
            <br />
            <span>a little inspiration.</span>
          </h2>
          <p>
            Keep your favourites close.
            <br />
            Make every meal a story worth sharing.
          </p>
          <button
            className="et-round-link"
            aria-label="Return to meat catalogue"
            onClick={browse}
          >
            <ArrowUpRight size={28} />
          </button>
        </section>
      </main>
      <footer className="et-footer">
        <div className="et-container">
          <div className="et-footer-top">
            <span>
              ember <i>&</i> tide
              <small>A counter full of possibility. By EdgeMart.</small>
            </span>
            <button onClick={onBackToLanding}>
              <ArrowLeft size={16} />
              All departments
            </button>
            <button onClick={() => setPanel({ kind: 'guide' })}>
              Shopping & cut guide <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="et-footer-bottom">
            <span>FROM COUNTER TO KITCHEN.</span>
            <span>Saved locally · EdgeMart checkout</span>
          </div>
        </div>
      </footer>
      {count > 0 && (
        <div className="et-mobile-tray">
          <span>
            <strong>{money(subtotal)}</strong>
            <small>
              {count} {count === 1 ? 'pack' : 'packs'} in your cut list
            </small>
          </span>
          <button
            className="et-button et-button-orange"
            onClick={() => setPanel({ kind: 'cart' })}
          >
            Review list <ArrowRight size={17} />
          </button>
        </div>
      )}
      {toast && (
        <div className="et-toast" role="status">
          <Check size={18} />
          <span>{toast}</span>
          <button
            className="et-icon"
            aria-label="Dismiss meat dashboard message"
            onClick={() => setToast('')}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {detail && (
        <Modal
          key={detail.id}
          title="Know your cut"
          wide
          onClose={() => setPanel(null)}
        >
          <div className="et-detail">
            <div className={`et-detail-art et-tone-${detail.tone}`}>
              <CutArt product={detail} />
              <span>REPRESENTATIVE PHOTO</span>
            </div>
            <div className="et-detail-copy">
              <span className="et-eyebrow">{detail.edit}</span>
              <h3>{detail.name}</h3>
              <p>{detail.note}</p>
              <dl className="et-specs">
                {[
                  ['Listed cut', detail.cutType],
                  ['Selected pack', selected(detail).label],
                  ['Catalogue origin', detail.origin],
                  ['Catalogue packaging', detail.packaging],
                  ['Listed temperature zone', detail.temperatureZone],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <label className="et-detail-pack">
                Choose your pack
                <select
                  aria-label={`Detail pack size for ${detail.title}`}
                  value={pi(detail)}
                  onChange={e =>
                    setPacks(prev => ({
                      ...prev,
                      [detail.id]: Number(e.target.value),
                    }))
                  }
                >
                  {detail.packSizes.map((pack, i) => (
                    <option key={pack.label} value={i}>
                      {pack.label} — {money(pack.price)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="et-detail-buy">
                <div className="et-price">
                  <strong>{money(selected(detail).price)}</strong>
                  <del>{money(selected(detail).originalPrice)}</del>
                </div>
                {cart[lineKey(detail.id, pi(detail))] ? (
                  <Quantity
                    label={`${detail.title}, ${selected(detail).label}`}
                    quantity={cart[lineKey(detail.id, pi(detail))]}
                    onChange={d => change(detail, pi(detail), d)}
                  />
                ) : (
                  <button
                    className="et-button et-button-orange"
                    onClick={() => add(detail)}
                   disabled={detail.inStock === false}>
                    Add to cut list <Plus size={17} />
                  </button>
                )}
              </div>
              <p className="et-detail-note">
                Catalogue information. Confirm the actual cut, weight, storage
                instructions and retailer certification before ordering.
              </p>
              <button
                className="et-text-link"
                onClick={() => setPanel({ kind: 'cart' })}
              >
                Review your cut list ({count}) <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </Modal>
      )}
      {panel?.kind === 'cart' && (
        <Modal title="Your cut list" drawer onClose={() => setPanel(null)}>
          {cartContents(false)}
        </Modal>
      )}
      {panel?.kind === 'guide' && (
        <Modal
          title="A little cut knowledge"
          onClose={() => setPanel(null)}
        >
          <div className="et-guide-body">
            <p>Find the right catalogue option for your kitchen plans.</p>
            {[
              [
                'Bone-in or boneless?',
                'The lamb curry cut, mixed chicken curry cut, salmon steaks and wings contain bones. Chicken breast fillets are the boneless option in this catalogue. Use the cut filter to narrow your selection.',
              ],
              [
                'How do I choose a pack?',
                'Each product offers its listed sizes. Prices, savings, sorting and budget filters follow your selected pack. Different sizes of the same cut are separate basket lines. Quantities are limited to 20 of each pack.',
              ],
              [
                'What is a kitchen edit?',
                'An edit adds one pack of each of its two listed products at their catalogue prices. It does not apply an extra bundle discount. You can change quantities or remove either pack in your cut list.',
              ],
              [
                'Are these photographs of the actual cuts?',
                'The catalogue uses representative meat photographs. The hero photograph is serving inspiration. Verify the actual cut, pack weight, packaging, certification and availability with the retailer.',
              ],
              [
                'Will my cut list stay here?',
                'Your pack quantities and saved favourites are kept in this browser when local storage is available. They are not synced to an account. Use Clear cut list to empty your basket.',
              ],
              [
                'Does checkout place a real order?',
                'Checkout opens the existing EdgeMart simulation. Its charges, discounts, delivery and cold-chain steps are demonstration screens. No actual order or payment occurs. Closing or cancelling the demo keeps your cut list.',
              ],
            ].map(([title, text]) => (
              <details className="et-accordion" key={title}>
                <summary>
                  {title}
                  <ChevronDown size={17} />
                </summary>
                <p>{text}</p>
              </details>
            ))}
            <div className="et-guide-note">
              <Utensils size={25} />
              <span>Your cut. Your pack. Your kitchen story.</span>
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
