import useCatalogueCart from '../../sellers/useCatalogueCart';
import useBuyerCatalogue from '../../sellers/useBuyerCatalogue';
import { DepartmentOffers, DeliveryEstimate } from '../../components/ShoppingBenefits';
import { DepartmentPhoto } from '../../components/DepartmentPhoto';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Gem, Heart, HelpCircle, Menu, Minus, Plus, Scale, Search, ShoppingBag, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { JEWELLERY_CATEGORIES, JEWELLERY_PRODUCTS } from '../../data';
import CheckoutLifecycle from '../../components/CheckoutLifecycle';
import './jewellery.css';

const STORAGE_KEY = 'edgemart-aurel-v1';

const money = value =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

const PRESENTATION = {
  j1: {
    short: 'The Blossom ring',
    image: '/images/products/j1.jpg',
    mood: 'A golden beginning',
    edit: 'classics',
  },
  j2: {
    short: 'The Celestial pendant',
    image: '/images/products/j3.jpg',
    mood: 'Everyday, elevated',
    edit: 'everyday',
  },
  j3: {
    short: 'The Heritage earrings',
    image: '/images/products/j2.jpg',
    mood: 'For your grand entrance',
    edit: 'occasion',
  },
  j4: {
    short: 'The Filigree bangle',
    image: '/images/products/aurel-bangle.jpg',
    mood: 'A beautiful constant',
    edit: 'classics',
  },
};

const nativeCatalogue = JEWELLERY_PRODUCTS.map(item => ({
  ...item,
  ...PRESENTATION[item.id],
  short: PRESENTATION[item.id]?.short || item.name,
  image: PRESENTATION[item.id]?.image || item.image,
}));

const EDITS = [
  {
    id: 'everyday',
    number: '01',
    title: 'Everyday radiance',
    text: 'Small rituals. Extraordinary details.',
    image: '/images/india/jewellery-edit-everyday.jpg',
    label: 'Explore everyday pieces',
  },
  {
    id: 'occasion',
    number: '02',
    title: 'An occasion to remember',
    text: 'A little drama, beautifully worn.',
    image: '/images/india/jewellery-edit-occasion.jpg',
    label: 'Explore occasion pieces',
  },
  {
    id: 'classics',
    number: '03',
    title: 'Forever in gold',
    text: 'The pieces you return to, always.',
    image: '/images/india/jewellery-edit-classics.jpg',
    label: 'Explore gold classics',
  },
];

const lineKey = (id, size) => `${id}:${size}`;



function JewelImage({product,className='',eager=false,...props}) {const [failed,setFailed]=useState(false);const src=product.image;useEffect(()=>setFailed(false),[src]);return failed || !src ? <div className={className || 'aj-product-photo'}><span className="em-photo-unavailable">Photo not available</span></div> : <img src={src} alt={product.name} className={className} loading={eager?'eager':'lazy'} {...props} onError={()=>setFailed(true)}/>;}

function Modal({ title, onClose, children, wide = false, drawer = false }) {
  const ref = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const focused = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();

    const handleKey = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close.current();
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
      focused?.focus?.();
    };
  }, []);

  return (
    <div
      className={`aj-overlay ${drawer ? 'aj-overlay-drawer' : ''}`}
      onClick={onClose}
    >
      <section
        className={`aj-modal ${wide ? 'aj-modal-wide' : ''} ${drawer ? 'aj-drawer' : ''}`}
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={event => event.stopPropagation()}
      >
        <header className="aj-modal-head">
          <div>
            <span className="aj-eyebrow">THE AURÉL ATELIER</span>
            <h2>{title}</h2>
          </div>
          <button className="aj-icon" aria-label={`Close ${title}`} onClick={onClose}>
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
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const bag = {};
    Object.values(saved.bag || {}).forEach(line => {
      const product = PRODUCTS.find(item => item.id === line?.id);
      if (
        product?.sizes.includes(line.size) &&
        Number.isInteger(line.quantity) &&
        line.quantity > 0 &&
        line.quantity <= 10
      ) {
        bag[lineKey(line.id, line.size)] = {
          id: line.id,
          size: line.size,
          quantity: line.quantity,
        };
      }
    });
    return {
      bag,
      favorites: Array.isArray(saved.favorites)
        ? [...new Set(saved.favorites.filter(id => PRODUCTS.some(item => item.id === id)))]
        : [],
    };
  } catch {
    return { bag: {}, favorites: [] };
  }
}
return {readSaved};
}
export default function JewelleryDashboard({ onBackToLanding }) {
  const PRODUCTS = useBuyerCatalogue('jewellery',nativeCatalogue,'Jewellery');
  const {readSaved} = useMemo(()=>catalogueTools(PRODUCTS),[PRODUCTS]);

  const [saved] = useState(readSaved);
  const [bag, setBag] = useCatalogueCart(saved.bag, PRODUCTS);
  const [favorites, setFavorites] = useState(saved.favorites);
  const [compare, setCompare] = useState([]);
  const [category, setCategory] = useState('all');
  const [edit, setEdit] = useState('all');
  const [query, setQuery] = useState(()=>new URLSearchParams(window.location.search).get('q') || '');
  const [purity, setPurity] = useState('all');
  const [metal, setMetal] = useState('all');
  const [budget, setBudget] = useState('all');
  const [sort, setSort] = useState('featured');
  const [savedOnly, setSavedOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [panel, setPanel] = useState(null);
  const [size, setSize] = useState('');
  const [checkout, setCheckout] = useState(null);
  const [toast, setToast] = useState('');

  const catalog = useRef(null);
  const search = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ bag, favorites }));
    } catch {
      /* Browsing remains available when storage is disabled. */
    }
  }, [bag, favorites]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3600);
    return () => clearTimeout(timer);
  }, [toast]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const result = PRODUCTS.filter(
      product =>
        (category === 'all' || product.subCategory === category) &&
        (edit === 'all' || product.edit === edit) &&
        (purity === 'all' || product.purity === purity) &&
        (metal === 'all' || product.metal === metal) &&
        (budget === 'all' || product.price <= Number(budget)) &&
        (!savedOnly || favorites.includes(product.id)) &&
        (!term ||
          [
            product.name,
            product.short,
            product.collection,
            product.metal,
            product.purity,
          ]
            .join(' ')
            .toLowerCase()
            .includes(term))
    );

    if (sort === 'low') result.sort((a, b) => a.price - b.price);
    if (sort === 'high') result.sort((a, b) => b.price - a.price);
    if (sort === 'rating')
      result.sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount);

    return result;
  }, [category, edit, purity, metal, budget, savedOnly, favorites, query, sort, PRODUCTS]);

  const lines = Object.values(bag).map(line => ({
    ...line,
    product: PRODUCTS.find(item => item.id === line.id),
  }));
  const bagCount = lines.reduce((total, line) => total + line.quantity, 0);
  const subtotal = lines.reduce(
    (total, line) => total + line.product.price * line.quantity,
    0
  );
  const activeProduct =
    panel?.kind === 'product'
      ? PRODUCTS.find(product => product.id === panel.id)
      : null;
  const filterCount = [
    category !== 'all',
    edit !== 'all',
    purity !== 'all',
    metal !== 'all',
    budget !== 'all',
    savedOnly,
    Boolean(query.trim()),
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
    setEdit('all');
    setQuery('');
    setPurity('all');
    setMetal('all');
    setBudget('all');
    setSavedOnly(false);
    setSort('featured');
  };

  const showSaved = () => {
    reset();
    setSavedOnly(true);
    setMenuOpen(false);
    scrollCatalog();
  };

  const openProduct = product => {
    setSize(product.sizes[0] || '');
    setPanel({ kind: 'product', id: product.id });
  };

  const toggleFavorite = id =>
    setFavorites(previous =>
      previous.includes(id)
        ? previous.filter(item => item !== id)
        : [...previous, id]
    );

  const toggleCompare = id => {
    if (compare.includes(id))
      setCompare(previous => previous.filter(item => item !== id));
    else if (compare.length < 3) setCompare(previous => [...previous, id]);
    else setToast('Your comparison holds 3 pieces. Remove one to add another.');
  };

  const addToBag = (product, chosenSize) => {
    if(product.inStock===false)return;
    if (!product.sizes.includes(chosenSize)) {
      setToast('Please select an available size.');
      return;
    }
    const key = lineKey(product.id, chosenSize);
    if (bag[key]?.quantity >= 10) {
      setToast('You can add up to 10 of each piece and size.');
      return;
    }
    setBag(previous => ({
      ...previous,
      [key]: {
        id: product.id,
        size: chosenSize,
        quantity: (previous[key]?.quantity || 0) + 1,
      },
    }));
    setToast(`${product.short} added to your bag.`);
  };

  const updateQuantity = (line, delta) =>
    setBag(previous => {
      const key = lineKey(line.id, line.size),
        next = { ...previous };
      const quantity = (next[key]?.quantity || 0) + delta;
      if (quantity <= 0) delete next[key];
      else if (quantity <= 10) next[key] = { ...next[key], quantity };
      return next;
    });

  const startCheckout = () => {
    if (!lines.length) return;
    const item = {
      lines: lines.map(line => ({ id: line.product.id, name: line.product.name, category: 'jewellery', image: line.product.image, price: line.product.price, quantity: line.quantity, variant: `Size ${line.size}`, options: { size: line.size } })),
      ...lines[0].product,
      name: lines
        .map(line => `${line.product.short} · size ${line.size} × ${line.quantity}`)
        .join(' / '),
      price: subtotal,
      category: 'jewellery',
      jewelMeta: {
        purity: [...new Set(lines.map(line => line.product.purity))].join(' / '),
        certAgency: [...new Set(lines.map(line => line.product.certAgency))].join('; '),
      },
    };
    setPanel(null);
    setCheckout(item);
  };

  return (
    <div className="aj-page">
      <a className="aj-skip" href="#aj-collection">
        Skip to collection
      </a>
      <div className="aj-utility">
        <span>EDGEMART · THE JEWELLERY ATELIER</span>
        <span>PRECIOUS DETAILS. PERSONAL STORIES.</span>
      </div>
      <header className="aj-header">
        <button
          className="aj-back"
          onClick={onBackToLanding}
          aria-label="Back to EdgeMart"
        >
          <ArrowLeft size={16} />
          <span>EdgeMart</span>
        </button>
        <button
          className="aj-wordmark"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                ? 'auto'
                : 'smooth',
            })
          }
          aria-label="Aurél home"
        >
          AURÉL<span>FINE JEWELLERY EDIT</span>
        </button>
        <nav className="aj-nav" aria-label="Jewellery navigation">
          <button onClick={scrollCatalog}>The collection</button>
          <a href="#aj-edits">The curated edit</a>
          <button onClick={() => setPanel({ kind: 'help' })}>Atelier notes</button>
        </nav>
        <div className="aj-header-actions">
          <button
            className="aj-icon"
            aria-label="Search jewellery"
            onClick={() => {
              scrollCatalog();
              search.current?.focus({ preventScroll: true });
            }}
          >
            <Search size={20} />
          </button>
          <button
            className="aj-icon"
            aria-label={`Saved pieces (${favorites.length})`}
            onClick={showSaved}
          >
            <Heart size={20} />
            {favorites.length > 0 && (
              <span className="aj-count">{favorites.length}</span>
            )}
          </button>
          <button
            className="aj-icon"
            aria-label={`Open shopping bag (${bagCount})`}
            onClick={() => setPanel({ kind: 'bag' })}
          >
            <ShoppingBag size={20} />
            <span className="aj-count">{bagCount}</span>
          </button>
          <button
            className="aj-icon aj-menu-button"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>
      {menuOpen && (
        <nav className="aj-mobile-nav" aria-label="Mobile jewellery navigation">
          <button
            onClick={() => {
              scrollCatalog();
              setMenuOpen(false);
            }}
          >
            The collection
          </button>
          <a
            href="#aj-edits"
            onClick={() => setMenuOpen(false)}
          >
            The curated edit
          </a>
          <button
            onClick={() => {
              setPanel({ kind: 'help' });
              setMenuOpen(false);
            }}
          >
            Atelier notes
          </button>
          <button onClick={onBackToLanding}>
            <ArrowLeft size={16} /> Back to EdgeMart
          </button>
        </nav>
      )}
      <main>
        <section className="aj-hero" aria-labelledby="aj-hero-title">
          <div className="aj-hero-copy">
            <span className="aj-eyebrow">
              <span className="aj-line" /> THE SIGNATURE COLLECTION
            </span>
            <h1 id="aj-hero-title">
              A little gold.
              <br />
              A lasting
              <br />
              <em>impression.</em>
            </h1>
            <p>
              For the everyday rituals and the once-in-a-lifetime moments. Discover
              pieces that feel beautifully like you.
            </p>
            <div className="aj-hero-actions">
              <button
                className="aj-button aj-button-gold"
                onClick={() => {
                  reset();
                  scrollCatalog();
                }}
              >
                Discover the collection <ArrowUpRight size={19} />
              </button>
              <button className="aj-text-link" onClick={showSaved}>
                Your saved pieces <Heart size={16} />
              </button>
            </div>
            <div className="aj-hero-foot">
              <span>01 — THE GOLDEN CHAPTER</span>
              <span>
                <Gem size={15} /> A personal jewellery edit
              </span>
            </div>
          </div>
          <div className="aj-hero-art">
            <DepartmentPhoto department="jewellery" eager/>
            
            <div className="aj-hero-note">
              <span className="aj-eyebrow">IN THE SPOTLIGHT</span>
              <button
                disabled={!PRODUCTS.length}
                onClick={() =>
                  openProduct(
                    PRODUCTS.find(product => product.id === 'j2') || PRODUCTS[0]
                  )
                }
              >
                Everyday radiance <ArrowUpRight size={20} />
              </button>
              <span>Rose gold · 18 KT catalogue selection</span>
            </div>
            <span className="aj-art-caption">STYLE PHOTOGRAPHY</span>
          </div>
        </section>
        <div className="aj-values">
          <div>
            <Gem size={21} />
            <span>
              Know your piece
              <small>Metal, purity & weight in every detail</small>
            </span>
          </div>
          <div>
            <Heart size={21} />
            <span>
              A collection of your own
              <small>Save the pieces you love</small>
            </span>
          </div>
          <div>
            <Scale size={21} />
            <span>
              Consider every detail
              <small>Compare up to three favourites</small>
            </span>
          </div>
        </div>
        <section
          className="aj-catalog aj-container"
          id="aj-collection"
          ref={catalog}
          aria-labelledby="aj-catalog-title"
        >
          <div className="aj-section-head">
            <div>
              <span className="aj-eyebrow">THE JEWELLERY WARDROBE</span>
              <h2 id="aj-catalog-title">Find your signature.</h2>
            </div>
            <span className="aj-section-aside">
              A small collection.
              <br />
              A world of possibility.
            </span>
          </div>
          <div className="aj-categories" aria-label="Jewellery categories">
            {JEWELLERY_CATEGORIES.map(item => (
              <button
                key={item.id}
                className={category === item.id ? 'is-active' : ''}
                aria-pressed={category === item.id}
                onClick={() => setCategory(item.id)}
              >
                {item.name}
              </button>
            ))}
          </div>
          <div className="aj-toolbar">
            <label className="aj-search">
              <Search size={18} />
              <input
                ref={search}
                type="search"
                aria-label="Search collection"
                placeholder="Find a piece, metal or collection…"
                value={query}
                onChange={event => setQuery(event.target.value)}
              />
              {query && (
                <button
                  className="aj-icon"
                  aria-label="Clear search"
                  onClick={() => setQuery('')}
                >
                  <X size={16} />
                </button>
              )}
            </label>
            <button
              className={`aj-filter-toggle ${filtersOpen ? 'is-active' : ''}`}
              aria-expanded={filtersOpen}
              aria-controls="aj-filters"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <SlidersHorizontal size={17} /> Refine{' '}
              {filterCount > 0 && <span>{filterCount}</span>}
            </button>
            <label className="aj-sort">
              <span>Sort by</span>
              <select
                aria-label="Sort collection"
                value={sort}
                onChange={event => setSort(event.target.value)}
              >
                <option value="featured">Featured</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
                <option value="rating">Top rated</option>
              </select>
            </label>
          </div>
          {filtersOpen && (
            <div className="aj-filters" id="aj-filters">
              <label>
                Purity
                <select
                  value={purity}
                  aria-label="Filter by purity"
                  onChange={event => setPurity(event.target.value)}
                >
                  <option value="all">All purities</option>
                  {[...new Set(PRODUCTS.map(item => item.purity))].map(value => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label>
                Metal
                <select
                  value={metal}
                  aria-label="Filter by metal"
                  onChange={event => setMetal(event.target.value)}
                >
                  <option value="all">All metals</option>
                  {[...new Set(PRODUCTS.map(item => item.metal))].map(value => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label>
                Price range
                <select
                  value={budget}
                  aria-label="Filter by budget"
                  onChange={event => setBudget(event.target.value)}
                >
                  <option value="all">All prices</option>
                  <option value="40000">Under ₹40,000</option>
                  <option value="60000">Up to ₹60,000</option>
                  <option value="80000">Up to ₹80,000</option>
                </select>
              </label>
              <label>
                Curated edit
                <select
                  value={edit}
                  aria-label="Filter by curated edit"
                  onChange={event => setEdit(event.target.value)}
                >
                  <option value="all">Every edit</option>
                  {EDITS.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="aj-check">
                <input
                  type="checkbox"
                  checked={savedOnly}
                  onChange={event => setSavedOnly(event.target.checked)}
                />{' '}
                Saved pieces only
              </label>
            </div>
          )}
          <div className="aj-results">
            <span aria-live="polite">
              {visible.length} {visible.length === 1 ? 'piece' : 'pieces'}
              {savedOnly ? ' in your saved collection' : ' in the collection'}
            </span>
            {filterCount > 0 && (
              <button onClick={reset}>
                Reset filters <X size={13} />
              </button>
            )}
            <button
              className="aj-compare-link"
              onClick={() => setPanel({ kind: 'compare' })}
            >
              <Scale size={16} /> Compare ({compare.length}/3)
            </button>
          </div>
          <DepartmentOffers department="jewellery"/>
{visible.length ? (
            <div className="aj-grid">
              {visible.map((product, index) => (
                <article
                  key={product.id}
                  className="aj-product"
                  style={{ '--aj-delay': `${index * 65}ms` }}
                >
                  <div className="aj-product-image">
                    <button
                      className="aj-image-open"
                      aria-label={`View ${product.short}`}
                      onClick={() => openProduct(product)}
                    >
                      <JewelImage product={product} loading="lazy" />
                      <span className="aj-image-cta">
                        Discover the piece <ArrowUpRight size={17} />
                      </span>
                    </button>
                    <span className="aj-purity-tag">{product.purity}</span>
                    <button
                      className={`aj-save ${favorites.includes(product.id) ? 'is-saved' : ''}`}
                      aria-label={`${favorites.includes(product.id) ? 'Unsave' : 'Save'} ${product.short}`}
                      aria-pressed={favorites.includes(product.id)}
                      onClick={() => toggleFavorite(product.id)}
                    >
                      <Heart
                        size={19}
                        fill={
                          favorites.includes(product.id) ? 'currentColor' : 'none'
                        }
                      />
                    </button>
                  </div>
                  <div className="aj-product-copy">
                    <div className="aj-product-top">
                      <span>{product.mood}</span>
                      <span className="aj-rating">
                        
                        {product.sellerProduct ? 'New' : product.rating}
                      </span>
                    </div>
                    <h3>
                      <button onClick={() => openProduct(product)}>
                        {product.short}
                      </button>
                    </h3>
                    <p>
                      {product.metal} · {product.grossWeight}
                    </p>
                    <div className="aj-price">
                      <strong>{money(product.price)}</strong>
                      {product.originalPrice > product.price && (
                        <del>{money(product.originalPrice)}</del>
                      )}
                    </div>
                    <div className="aj-product-bottom">
                      <button
                        className="aj-view-button"
                        onClick={() => openProduct(product)}
                      >
                        View & select size <ArrowRight size={16} />
                      </button>
                      <button
                        className={`aj-compare-button ${compare.includes(product.id) ? 'is-active' : ''}`}
                        aria-label={`${compare.includes(product.id) ? 'Remove' : 'Compare'} ${product.short}`}
                        aria-pressed={compare.includes(product.id)}
                        onClick={() => toggleCompare(product.id)}
                      >
                        {compare.includes(product.id) ? (
                          <Check size={16} />
                        ) : (
                          <Scale size={16} />
                        )}
                      </button>
                    </div>
                  <DeliveryEstimate department="jewellery" product={product}/></div>
                </article>
              ))}
            </div>
          ) : (
            <div className="aj-empty">
              <Gem size={34} />
              <h3>
                {savedOnly && !favorites.length
                  ? 'Your jewellery story starts here.'
                  : 'The right piece is still waiting.'}
              </h3>
              <p>
                {savedOnly && !favorites.length
                  ? 'Tap the heart on a piece to keep it in your personal collection.'
                  : 'Try a different search or broaden your selection.'}
              </p>
              <button className="aj-button aj-button-dark" onClick={reset}>
                Explore all jewellery <ArrowRight size={17} />
              </button>
            </div>
          )}
          <p className="aj-catalog-note">
            Catalogue prices and specifications. Photography is illustrative; final
            design, certification and availability require retailer confirmation.
          </p>
        </section>
        <section
          className="aj-edits aj-container"
          id="aj-edits"
          aria-labelledby="aj-edits-title"
        >
          <div className="aj-section-head">
            <div>
              <span className="aj-eyebrow">CURATED FOR YOUR MOMENTS</span>
              <h2 id="aj-edits-title">A mood. A moment. An edit.</h2>
            </div>
            
          </div>
          <div className="aj-edit-grid">
            {EDITS.map(item => (
              <button
                className={`aj-edit aj-edit-${item.id}`}
                key={item.id}
                aria-label={item.label}
                onClick={() => {
                  reset();
                  setEdit(item.id);
                  scrollCatalog();
                }}
              >
                <img src={item.image} alt="" loading="lazy" />
                <div className="aj-edit-shade" />
                <span className="aj-edit-number">{item.number} / THE EDIT</span>
                <div className="aj-edit-copy">
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  <span>
                    Explore the edit <ArrowUpRight size={19} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
        <section className="aj-journal aj-container">
          <div className="aj-journal-art"><DepartmentPhoto department="jewellery" audience="journal"/></div>
          <div className="aj-journal-copy">
            <span className="aj-eyebrow">A MORE CONSIDERED COLLECTION</span>
            <h2>
              Beautiful choices
              <br />
              begin with <em>the details.</em>
            </h2>
            <p>
              Explore the available sizes, read each piece’s specifications and
              keep your favourites side by side. Make the collection your own, one
              detail at a time.
            </p>
            <button
              className="aj-text-link"
              onClick={() => setPanel({ kind: 'help' })}
            >
              Open the jewellery guide <ArrowUpRight size={18} />
            </button>
          </div>
          <span className="aj-journal-index">IV</span>
        </section>
      </main>
      <footer className="aj-footer">
        <div className="aj-container">
          <div className="aj-footer-main">
            <div>
              <span className="aj-footer-logo">AURÉL</span>
              <p>The jewellery edit by EdgeMart.</p>
            </div>
            <button onClick={scrollCatalog}>
              Discover jewellery <ArrowUpRight size={16} />
            </button>
            <button onClick={showSaved}>
              Your saved collection <Heart size={16} />
            </button>
            <button onClick={() => setPanel({ kind: 'help' })}>
              Atelier notes <HelpCircle size={16} />
            </button>
          </div>
          <div className="aj-footer-bottom">
            <span>PERSONAL PIECES. LASTING IMPRESSIONS.</span>
            <span>Browser-saved selection · EdgeMart checkout</span>
          </div>
        </div>
      </footer>
      {compare.length > 0 && (
        <div className="aj-compare-tray">
          <Scale size={20} />
          <span>
            <strong>
              {compare.length} {compare.length === 1 ? 'piece' : 'pieces'} selected
            </strong>
            <small>Consider them side by side</small>
          </span>
          <button
            className="aj-button aj-button-gold"
            onClick={() => setPanel({ kind: 'compare' })}
          >
            Compare <ArrowRight size={16} />
          </button>
          <button
            className="aj-icon"
            aria-label="Clear comparison"
            onClick={() => setCompare([])}
          >
            <X size={18} />
          </button>
        </div>
      )}
      {toast && (
        <div className="aj-toast" role="status">
          <Check size={17} />
          <span>{toast}</span>
          <button
            className="aj-icon"
            aria-label="Dismiss message"
            onClick={() => setToast('')}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {activeProduct && (
        <Modal
          key={activeProduct.id}
          title={activeProduct.short}
          onClose={() => setPanel(null)}
          wide
        >
          <div className="aj-detail">
            <div className="aj-detail-visual">
              <JewelImage product={activeProduct} />
              <p>Style photography · illustrative</p>
            </div>
            <div className="aj-detail-copy">
              <span className="aj-eyebrow">{activeProduct.collection}</span>
              <h3>{activeProduct.name}</h3>
              <div className="aj-detail-rating">
                 {activeProduct.sellerProduct ? 'New' : activeProduct.rating}{' '}
                <span>({activeProduct.reviewsCount} catalogue reviews)</span>
              </div>
              <div className="aj-price aj-detail-price">
                <strong>{money(activeProduct.price)}</strong>
                {activeProduct.originalPrice > activeProduct.price && (
                  <del>{money(activeProduct.originalPrice)}</del>
                )}
              </div>
              <div className="aj-detail-specs">
                <div>
                  <span>Metal</span>
                  <strong>{activeProduct.metal}</strong>
                </div>
                <div>
                  <span>Purity</span>
                  <strong>{activeProduct.purity}</strong>
                </div>
                <div>
                  <span>Gross weight</span>
                  <strong>{activeProduct.grossWeight}</strong>
                </div>
                <div>
                  <span>Stone details</span>
                  <strong>
                    {activeProduct.diamondWeight === 'N/A'
                      ? 'No stone details listed'
                      : activeProduct.diamondWeight}
                  </strong>
                </div>
              </div>
              <fieldset className="aj-sizes">
                <legend>
                  Select size <span>{size}</span>
                </legend>
                <div>
                  {activeProduct.sizes.map(value => (
                    <button
                      key={value}
                      aria-label={`Select size ${value}`}
                      aria-pressed={size === value}
                      className={size === value ? 'is-active' : ''}
                      onClick={() => setSize(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </fieldset>
              <details className="aj-accordion">
                <summary>
                  Size & fit notes <ChevronDown size={15} />
                </summary>
                <p>
                  {activeProduct.subCategory === 'rings' ||
                  activeProduct.subCategory === 'bangles'
                    ? 'These are the retailer’s listed size options. Check your existing well-fitting jewellery or confirm a measurement with the retailer before choosing. No diameter conversion is supplied in this catalogue.'
                    : 'The listed option describes this piece’s length or drop. Review it with the retailer before ordering.'}
                </p>
              </details>
              <details className="aj-accordion">
                <summary>
                  Price & catalogue details <ChevronDown size={15} />
                </summary>
                <p>
                  Catalogue making-charge rate:{' '}
                  <strong>{activeProduct.makingCharges}</strong>. This is a listed
                  rate, not a calculated invoice. The catalogue does not provide
                  separate metal, stone or tax amounts.
                </p>
                <p>
                  Certification listed: {activeProduct.certAgency}. Verify the
                  relevant documentation with the retailer.
                </p>
                <p>
                  Listed return window: {activeProduct.returnDays} days. Final terms
                  and availability require confirmation.
                </p>
              </details>
              <div className="aj-detail-actions">
                <button
                  className="aj-button aj-button-dark"
                  onClick={() => addToBag(activeProduct, size)}
                 disabled={activeProduct.inStock === false}>
                  <ShoppingBag size={18} /> Add to shopping bag
                </button>
                <button
                  className={`aj-icon aj-detail-heart ${favorites.includes(activeProduct.id) ? 'is-saved' : ''}`}
                  aria-label={`${favorites.includes(activeProduct.id) ? 'Unsave' : 'Save'} ${activeProduct.short}`}
                  aria-pressed={favorites.includes(activeProduct.id)}
                  onClick={() => toggleFavorite(activeProduct.id)}
                >
                  <Heart
                    size={20}
                    fill={
                      favorites.includes(activeProduct.id)
                        ? 'currentColor'
                        : 'none'
                    }
                  />
                </button>
              </div>
              <button
                className="aj-text-link aj-open-bag"
                onClick={() => setPanel({ kind: 'bag' })}
              >
                View your shopping bag ({bagCount}) <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </Modal>
      )}
      {panel?.kind === 'bag' && (
        <Modal title="Your shopping bag" onClose={() => setPanel(null)} drawer>
          {lines.length ? (
            <>
              <div className="aj-bag-lines">
                {lines.map(line => (
                  <article
                    className="aj-bag-line"
                    key={lineKey(line.id, line.size)}
                  >
                    <JewelImage product={line.product} />
                    <div>
                      <h3>{line.product.short}</h3>
                      <p>
                        {line.product.purity} · Size {line.size}
                      </p>
                      <strong>
                        {money(line.product.price * line.quantity)}
                      </strong>
                      <div className="aj-quantity">
                        <button
                          aria-label={`Decrease ${line.product.short} size ${line.size}`}
                          onClick={() => updateQuantity(line, -1)}
                        >
                          <Minus size={14} />
                        </button>
                        <span aria-label="Quantity">{line.quantity}</span>
                        <button
                          aria-label={`Increase ${line.product.short} size ${line.size}`}
                          disabled={line.quantity >= 10}
                          onClick={() => updateQuantity(line, 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    <button
                      className="aj-icon"
                      aria-label={`Remove ${line.product.short} size ${line.size} from bag`}
                      onClick={() =>
                        setBag(previous => {
                          const next = { ...previous };
                          delete next[lineKey(line.id, line.size)];
                          return next;
                        })
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </article>
                ))}
              </div>
              <div className="aj-bag-total">
                <div>
                  <span>
                    {bagCount} {bagCount === 1 ? 'piece' : 'pieces'} · Subtotal
                  </span>
                  <strong>{money(subtotal)}</strong>
                </div>
                <p>
                  Review delivery charges and apply your offer in the shared
                  discounts. No real payment or order is created.
                </p>
                <button
                  className="aj-button aj-button-dark"
                  onClick={startCheckout}
                >
                  Continue to checkout <ArrowRight size={18} />
                </button>
                <button className="aj-text-link" onClick={() => setBag({})}>
                  Empty shopping bag <Trash2 size={14} />
                </button>
              </div>
            </>
          ) : (
            <div className="aj-empty">
              <ShoppingBag size={36} />
              <h3>A little space for something special.</h3>
              <p>
                Choose a piece and its size to begin your personal selection.
              </p>
              <button
                className="aj-button aj-button-dark"
                onClick={() => {
                  setPanel(null);
                  scrollCatalog();
                }}
              >
                Discover the collection <ArrowRight size={17} />
              </button>
            </div>
          )}
        </Modal>
      )}
      {panel?.kind === 'compare' && (
        <Modal
          title="Consider every detail"
          onClose={() => setPanel(null)}
          wide
        >
          {compare.length ? (
            <div className="aj-comparison-scroll">
              <table className="aj-comparison">
                <caption>
                  Compare up to three jewellery pieces using catalogue
                  specifications.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">The details</th>
                    {compare.map(id => {
                      const product = PRODUCTS.find(item => item.id === id);
                      return (
                        <th scope="col" key={id}>
                          <JewelImage product={product} />
                          <h3>{product.short}</h3>
                          <button
                            onClick={() => toggleCompare(id)}
                            aria-label={`Remove ${product.short} from comparison`}
                          >
                            Remove <X size={13} />
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Price', product => money(product.price)],
                    ['Metal', product => product.metal],
                    ['Purity', product => product.purity],
                    ['Gross weight', product => product.grossWeight],
                    [
                      'Stone details',
                      product =>
                        product.diamondWeight === 'N/A'
                          ? 'Not listed'
                          : product.diamondWeight,
                    ],
                    ['Making-charge rate', product => product.makingCharges],
                    ['Available sizes', product => product.sizes.join(' · ')],
                  ].map(([label, getValue]) => (
                    <tr key={label}>
                      <th scope="row">{label}</th>
                      {compare.map(id => (
                        <td key={id}>
                          {getValue(PRODUCTS.find(item => item.id === id))}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <th scope="row">Your next step</th>
                    {compare.map(id => (
                      <td key={id}>
                        <button
                          className="aj-button aj-button-dark"
                          onClick={() =>
                            openProduct(PRODUCTS.find(item => item.id === id))
                          }
                        >
                          View piece <ArrowUpRight size={15} />
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="aj-empty">
              <Scale size={36} />
              <h3>The beauty is in the details.</h3>
              <p>
                Use the scale icon on any piece to add it to your comparison. You
                can select up to three.
              </p>
              <button
                className="aj-button aj-button-dark"
                onClick={() => {
                  setPanel(null);
                  scrollCatalog();
                }}
              >
                Explore the collection <ArrowRight size={17} />
              </button>
            </div>
          )}
        </Modal>
      )}
      {panel?.kind === 'help' && (
        <Modal title="The atelier notes" onClose={() => setPanel(null)}>
          <div className="aj-help">
            <p className="aj-help-intro">
              A few thoughtful details for your jewellery journey.
            </p>
            {[
              [
                'How do I choose a size?',
                'Open a piece to see its available sizes and fit notes. Ring and bangle sizes follow the catalogue’s labels. Confirm fit with the retailer; this catalogue does not provide a measurement conversion.',
              ],
              [
                'What can I compare?',
                'Choose the scale icon on up to three pieces, then open Compare to see their price, metal, purity, weight, stone details, making-charge rate and available sizes side by side.',
              ],
              [
                'Where are my saved pieces?',
                'The heart icon saves a piece to this browser. Use the heart in the header to see your saved collection. Your favourites and shopping bag persist on this device when browser storage is available.',
              ],
              [
                'Are prices and certification live?',
                'This is a catalogue selection, not a live gold-rate feed. Prices, specifications and certification statements come from the existing catalogue. Confirm current prices, design, availability and certification documents with the retailer.',
              ],
              [
                'Does checkout place a real order?',
                'Checkout opens EdgeMart’s existing simulated shopping flow. Its payment and order stages are demonstrations. No real order, payment, appointment or delivery is created. Closing checkout keeps your selection in the bag.',
              ],
            ].map(([title, text]) => (
              <details className="aj-accordion" key={title}>
                <summary>
                  {title}
                  <ChevronDown size={16} />
                </summary>
                <p>{text}</p>
              </details>
            ))}
            <div className="aj-help-note">
              <Gem size={22} />
              <p>
                Your collection is personal. Keep the details close, and choose at
                your own pace.
              </p>
            </div>
          </div>
        </Modal>
      )}
      {checkout && <CheckoutLifecycle
          item={checkout}
          quantity={1} onComplete={() => { setBag({}); }}
          onBack={() => {
            setCheckout(null);
            setPanel({ kind: 'bag' });
          }}
          onClose={() => setCheckout(null)}
        />}
    </div>
  );
}

