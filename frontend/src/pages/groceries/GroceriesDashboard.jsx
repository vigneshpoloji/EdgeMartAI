import useCatalogueCart from '../../sellers/useCatalogueCart';
import useBuyerCatalogue from '../../sellers/useBuyerCatalogue';
import { DepartmentOffers, DeliveryEstimate } from '../../components/ShoppingBenefits';
import { DepartmentPhoto, ProductPhoto } from '../../components/DepartmentPhoto';
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, BookmarkPlus, Check, CheckCheck, ChevronDown, Coffee, Droplet, Heart, HelpCircle, LayoutGrid, ListChecks, Minus, Nut, Package, Plus, Search, ShoppingBasket, SlidersHorizontal, Sun, Trash2, Wheat, X } from 'lucide-react';
import { GROCERIES_CATEGORIES, GROCERIES_PRODUCTS } from '../../data';
import CheckoutLifecycle from '../../components/CheckoutLifecycle';
import './groceries.css';

const STORAGE = 'edgemart-pantry-club-v1';

const money = value =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

const packLabel = pack => pack.label.replace(/\s*\(Save[^)]*\)/gi, '').trim();

const savings = pack =>
  Math.max(0, (pack.originalPrice || pack.price) - pack.price);

const keyFor = (id, pack) => `${id}:${pack}`;

const motion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth';

const LABELS = {
  g1: {
    title: 'Sunflower cooking oil',
    kind: 'oil',
    colour: 'yellow',
    label: 'SUNFLOWER',
    caption: 'A kitchen constant',
  },
  g2: {
    title: 'Sharbati whole wheat atta',
    kind: 'atta',
    colour: 'peach',
    label: 'WHOLE WHEAT',
    caption: 'For the everyday table',
  },
  g3: {
    title: 'Dark roast coffee beans',
    kind: 'coffee',
    colour: 'blue',
    label: 'DARK ROAST',
    caption: 'Your morning ritual',
  },
  g4: {
    title: 'Wild forest honey',
    kind: 'honey',
    colour: 'honey',
    label: 'FOREST HONEY',
    caption: 'A little golden goodness',
  },
  g5: {
    title: 'Roasted California almonds',
    kind: 'almonds',
    colour: 'green',
    label: 'ALMONDS',
    caption: 'The snack shelf staple',
  },
};

const nativeCatalogue = GROCERIES_PRODUCTS.map(p => ({
  ...p,
  ...LABELS[p.id],
  title: LABELS[p.id]?.title || p.name,
}));



const EDITS = [
  {
    id: 'breakfast',
    title: 'The breakfast shelf',
    description:
      'Dark roast coffee + forest honey. Two little reasons to enjoy your morning.',
    lines: [
      ['g3', 0],
      ['g4', 0],
    ],
    icon: Coffee,
    colour: 'blue',
  },
  {
    id: 'refill',
    title: 'The everyday refill',
    description:
      'Cooking oil, whole wheat atta and almonds. Give your everyday shelf a little attention.',
    lines: [
      ['g1', 0],
      ['g2', 0],
      ['g5', 0],
    ],
    icon: Wheat,
    colour: 'peach',
  },
];

function unitPrice(pack) {
  const match = packLabel(pack).match(/(\d+(?:\.\d+)?)\s*(kg|g|l)\b/i);
  if (!match || Number(match[1]) <= 0) return null;
  const unit = match[2].toLowerCase(),
    amount = Number(match[1]) / (unit === 'g' ? 1000 : 1);
  return `${money(pack.price / amount)} / ${unit === 'l' ? 'L' : 'kg'}`;
}





// Generic package artwork: no mismatched product photography or invented brand packaging.
function PackArt({ product }) { const photos={oil:'/images/products/g1.jpg',coffee:'/images/products/g3.jpg',honey:'/images/products/g4.jpg'}; return <ProductPhoto department="groceries" src={product.sellerProduct ? product.image : photos[product.kind]} label={product.title} className="pc-pack-art"/>; }

function Quantity({ label, quantity, onChange }) {
  return (
    <div className="pc-quantity">
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

function Modal({
  title,
  children,
  onClose,
  drawer = false,
  wide = false,
  bare = false,
}) {
  const ref = useRef(null),
    close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const previous = document.activeElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();

    const onKey = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close.current();
      }
      if (event.key !== 'Tab') return;
      const targets = [
        ...ref.current.querySelectorAll(
          'button,input,select,summary,a[href],[tabindex="0"]'
        ),
      ].filter(n => !n.disabled && n.getClientRects().length);
      const first = targets[0],
        last = targets[targets.length - 1];
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
      className={`pc-overlay ${drawer ? 'pc-overlay-drawer' : ''}`}
      onClick={onClose}
    >
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`pc-modal ${drawer ? 'pc-drawer' : ''} ${wide ? 'pc-modal-wide' : ''} ${bare ? 'pc-modal-bare' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {!bare && (
          <header className="pc-modal-head">
            <div>
              <span className="pc-eyebrow">PANTRY CLUB / EDGEMART</span>
              <h2>{title}</h2>
            </div>
            <button
              className="pc-icon"
              aria-label={`Close ${title}`}
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </header>
        )}
        {children}
      </section>
    </div>
  );
}

function catalogueTools(PRODUCTS) {
const AISLES = GROCERIES_CATEGORIES.map(c => ({
  ...c,
  title:
    {
      all: 'The whole pantry',
      oils: 'Oils & ghee',
      staples: 'Everyday staples',
      dryfruits: 'Nuts & seeds',
      beverages: 'Tea & coffee',
      spices: 'Spices & masalas',
    }[c.id] || c.name,
  Icon:
    {
      all: ShoppingBasket,
      oils: Droplet,
      staples: Wheat,
      dryfruits: Nut,
      beverages: Coffee,
      spices: Package,
    }[c.id] || Package,
  count:
    c.id === 'all'
      ? PRODUCTS.length
      : PRODUCTS.filter(p => p.subCategory === c.id).length,
}));
function resolveLine(key) {
  const [id, value] = String(key).split(':'),
    index = Number(value);
  const product = PRODUCTS.find(p => p.id === id);
  return product &&
    Number.isInteger(index) &&
    product.packSizes[index] &&
    key === keyFor(id, index)
    ? { key, product, index, pack: product.packSizes[index] }
    : null;
}
function readSaved() {
  const empty = { cart: {}, favorites: [], list: [], budget: '' };
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE) || '{}'),
      cart = {};
    Object.entries(data.cart || {}).forEach(([key, quantity]) => {
      if (
        resolveLine(key) &&
        Number.isInteger(quantity) &&
        quantity > 0 &&
        quantity <= 20
      )
        cart[key] = quantity;
    });
    const list = [],
      seen = new Set();
    if (Array.isArray(data.list))
      data.list.forEach(line => {
        if (line && resolveLine(line.key) && !seen.has(line.key)) {
          seen.add(line.key);
          list.push({ key: line.key, done: line.done === true });
        }
      });
    return {
      cart,
      list,
      favorites: Array.isArray(data.favorites)
        ? [
            ...new Set(
              data.favorites.filter(id => PRODUCTS.some(p => p.id === id))
            ),
          ]
        : [],
      budget:
        /^\d{1,6}$/.test(String(data.budget)) &&
        Number(data.budget) > 0 &&
        Number(data.budget) <= 100000
          ? String(data.budget)
          : '',
    };
  } catch {
    return empty;
  }
}
return {AISLES,resolveLine,readSaved};
}
export default function GroceriesDashboard({ onBackToLanding }) {
  const PRODUCTS = useBuyerCatalogue('groceries',nativeCatalogue,'Groceries');
  const {AISLES,resolveLine,readSaved} = useMemo(()=>catalogueTools(PRODUCTS),[PRODUCTS]);

  const [initial] = useState(readSaved);
  const [cart, setCart] = useCatalogueCart(initial.cart, PRODUCTS),
    [favorites, setFavorites] = useState(initial.favorites);
  const [list, setList] = useState(initial.list),
    [budget, setBudget] = useState(initial.budget);
  const [packs, setPacks] = useState({}),
    [query, setQuery] = useState(''),
    [category, setCategory] = useState('all');
  const [sort, setSort] = useState('featured'),
    [brand, setBrand] = useState('all'),
    [priceCap, setPriceCap] = useState('all'),
    [savedOnly, setSavedOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false),
    [panel, setPanel] = useState(null),
    [toast, setToast] = useState(''),
    [checkout, setCheckout] = useState(null);
  const [listProduct, setListProduct] = useState(PRODUCTS[0]?.id||''),
    [listPack, setListPack] = useState(0);

  const catalog = useRef(null),
    budgetInput = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE,
        JSON.stringify({ cart, favorites, list, budget })
      );
    } catch {
      /* Continue when storage is unavailable. */
    }
  }, [cart, favorites, list, budget]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const packIndex = p => packs[p.id] || 0,
    selectedPack = p => p.packSizes[packIndex(p)];
  const browse = () =>
    catalog.current?.scrollIntoView({ behavior: motion(), block: 'start' });
  const reset = () => {
    setCategory('all');
    setQuery('');
    setSort('featured');
    setBrand('all');
    setPriceCap('all');
    setSavedOnly(false);
  };

  const toggleFavorite = p =>
    setFavorites(prev =>
      prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
    );

  const changeQuantity = (p, index, delta) =>
    setCart(prev => {
      const key = keyFor(p.id, index),
        next = { ...prev },
        quantity = Math.max(0, Math.min(20, (next[key] || 0) + delta));
      if (quantity) next[key] = quantity;
      else delete next[key];
      return next;
    });

  const add = (p, index = packIndex(p)) => {
    if(p.inStock===false)return;
    changeQuantity(p, index, 1);
    setToast(`${p.title} added to your basket.`);
  };

  const lines = Object.entries(cart).map(([key, quantity]) => ({
    ...resolveLine(key),
    quantity,
  }));
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce(
    (sum, line) => sum + line.pack.price * line.quantity,
    0
  );
  const savedAmount = lines.reduce(
    (sum, line) => sum + savings(line.pack) * line.quantity,
    0
  );
  const budgetValue = Number(budget),
    remaining = budgetValue - subtotal;
  const incomplete = list.filter(line => !line.done).length;
  const filterCount =
    Number(brand !== 'all') + Number(priceCap !== 'all') + Number(savedOnly);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const results = PRODUCTS.filter(
      p =>
        (category === 'all' || p.subCategory === category) &&
        (!term ||
          [p.name, p.title, p.brand, p.label]
            .join(' ')
            .toLowerCase()
            .includes(term)) &&
        (brand === 'all' || p.brand === brand) &&
        (!savedOnly || favorites.includes(p.id)) &&
        (priceCap === 'all' ||
          p.packSizes[packs[p.id] || 0].price <= Number(priceCap))
    );
    const price = p => p.packSizes[packs[p.id] || 0].price;
    if (sort === 'low') results.sort((a, b) => price(a) - price(b));
    if (sort === 'high') results.sort((a, b) => price(b) - price(a));
    if (sort === 'savings')
      results.sort(
        (a, b) =>
          savings(b.packSizes[packs[b.id] || 0]) -
          savings(a.packSizes[packs[a.id] || 0])
      );
    return results;
  }, [category, query, brand, savedOnly, favorites, priceCap, packs, sort, PRODUCTS]);

  const addPacks = (keys, message) => {
    const eligible = [...new Set(keys)].filter(
      key => resolveLine(key) && (cart[key] || 0) < 20
    );
    if (!eligible.length) {
      setToast(
        'These packs are already at the limit of 20. Adjust your basket first.'
      );
      return;
    }
    setCart(prev => {
      const next = { ...prev };
      eligible.forEach(key => {
        next[key] = Math.min(20, (next[key] || 0) + 1);
      });
      return next;
    });
    setToast(
      eligible.length === keys.length
        ? message
        : `${eligible.length} packs added. Other packs have reached the limit of 20.`
    );
  };

  const addToList = (p, index) => {
    const key = keyFor(p.id, index);
    if (list.some(line => line.key === key)) {
      setToast('That pack is already on your restock checklist.');
      return;
    }
    setList(prev => [...prev, { key, done: false }]);
    setToast(`${p.title} saved to your restock checklist.`);
  };

  const beginCheckout = () => {
    if (!lines.length) return;
    setPanel(null);
    setCheckout({
      lines: lines.map(line => ({ id: line.product.id, name: line.product.title, category: 'groceries', image: line.product.image, price: line.pack.price, quantity: line.quantity, variant: packLabel(line.pack), options: { pack: line.index } })),
      id: 'pantry-club-basket',
      category: 'groceries',
      returnDays: 0,
      price: subtotal,
      name: lines
        .map(
          line => `${line.product.title} — ${packLabel(line.pack)} × ${line.quantity}`
        )
        .join(' | '),
      image: lines[0].product.image,
      groceryMeta: {
        unit: lines
          .map(line => `${packLabel(line.pack)} × ${line.quantity}`)
          .join('; '),
        packSize: `${count} packs`,
        shelfLife: 'Refer to each product label',
      },
    });
  };

  const detail =
    panel?.kind === 'detail' ? PRODUCTS.find(p => p.id === panel.id) : null;
  const chosenListProduct = PRODUCTS.find(p => p.id === listProduct)||PRODUCTS[0];
  useEffect(()=>{if(!PRODUCTS.some(p=>p.id===listProduct)){setListProduct(PRODUCTS[0]?.id||'');setListPack(0);}},[PRODUCTS,listProduct]);

  return (
    <div className="pc-page">
      <aside className="pc-sidebar" aria-label="Pantry navigation">
        <button
          className="pc-logo"
          aria-label="Pantry Club home"
          onClick={() => window.scrollTo({ top: 0, behavior: motion() })}
        >
          <span className="pc-logo-mark">
            <ShoppingBasket size={24} />
          </span>
          <span>
            pantry
            <br />
            club<span className="pc-logo-dot">.</span>
            <small>BY EDGEMART</small>
          </span>
        </button>
        <span className="pc-sidebar-caption">YOUR EVERYDAY SPACE</span>
        <nav>
          <button
            className={!savedOnly ? 'is-active' : ''}
            onClick={() => {
              reset();
              browse();
            }}
          >
            <LayoutGrid size={17} />
            Explore the pantry
            <ArrowRight size={14} />
          </button>
          <button
            className={savedOnly ? 'is-active' : ''}
            onClick={() => {
              reset();
              setSavedOnly(true);
              browse();
            }}
          >
            <Heart size={17} />
            My favourites<b>{favorites.length}</b>
          </button>
          <button onClick={() => setPanel({ kind: 'list' })}>
            <ListChecks size={17} />
            Restock checklist<b>{incomplete}</b>
          </button>
        </nav>
        <span className="pc-sidebar-caption pc-aisle-caption">TAKE AN AISLE</span>
        <div className="pc-side-aisles">
          {AISLES.filter(a => a.id !== 'all').map(aisle => (
            <button
              key={aisle.id}
              className={category === aisle.id ? 'is-selected' : ''}
              onClick={() => {
                reset();
                setCategory(aisle.id);
                browse();
              }}
            >
              <span>
                <aisle.Icon size={15} />
              </span>
              {aisle.title}
              <small>{aisle.count}</small>
            </button>
          ))}
        </div>
        <div className="pc-sidebar-note">
          <Sun size={26} />
          <strong>
            A well-stocked shelf.
            <br />A little peace of mind.
          </strong>
          <p>
            Make space for the things
            <br />
            you reach for every day.
          </p>
        </div>
        <div className="pc-sidebar-bottom">
          <button onClick={() => setPanel({ kind: 'help' })}>
            <HelpCircle size={17} />
            Shopping guide
          </button>
          <button onClick={onBackToLanding}>
            <ArrowLeft size={17} />
            All departments
          </button>
        </div>
      </aside>

      <div className="pc-workspace">
        <header className="pc-header">
          <div className="pc-mobile-logo">
            <ShoppingBasket size={21} />
            <span>
              pantry club<span>.</span>
            </span>
          </div>
          <div className="pc-header-title">
            <span className="pc-eyebrow">THE EVERYDAY EDIT</span>
            <strong>Your pantry, thoughtfully stocked.</strong>
          </div>
          <form
            className="pc-search"
            onSubmit={e => {
              e.preventDefault();
              browse();
            }}
          >
            <Search size={18} />
            <input
              type="search"
              aria-label="Search groceries"
              placeholder="Find your everyday favourites…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                aria-label="Clear grocery search"
                onClick={() => setQuery('')}
              >
                <X size={15} />
              </button>
            )}
          </form>
          <div className="pc-header-actions">
            <button
              className="pc-icon pc-checklist-shortcut"
              aria-label={`Open restock checklist (${incomplete} remaining)`}
              onClick={() => setPanel({ kind: 'list' })}
            >
              <ListChecks size={20} />
            </button>
            <button
              className="pc-icon"
              aria-label={`Open favourites (${favorites.length})`}
              aria-pressed={savedOnly}
              onClick={() => {
                reset();
                setSavedOnly(true);
                browse();
              }}
            >
              <Heart size={20} />
            </button>
            <button
              className="pc-basket-button"
              aria-label={`Open pantry basket (${count} ${count === 1 ? 'pack' : 'packs'})`}
              onClick={() => setPanel({ kind: 'cart' })}
            >
              <ShoppingBasket size={19} />
              <span>Basket</span>
              <b>{count}</b>
            </button>
          </div>
        </header>

        <main className="pc-main">
          <div className="pc-breadcrumb">
            <span>EDGEMART</span>
            <span>/</span>
            <strong>GROCERIES & PANTRY</strong>
            <span className="pc-breadcrumb-end">
              
              Good things, every day
            </span>
          </div>

          <section className="pc-hero">
            <div className="pc-hero-copy">
              <span className="pc-hero-label">
                <span />
                THE WELL-STOCKED LIFE
              </span>
              <h1>
                Small rituals.
                <br />
                <span>Full pantry.</span>
              </h1>
              <p>
                From your first cup to the last little snack.
                <br />
                Everyday essentials, with a little more intention.
              </p>
              <div className="pc-hero-buttons">
                <button
                  className="pc-button pc-button-blue"
                  onClick={() => {
                    reset();
                    browse();
                  }}
                >
                  Explore the pantry
                  <ArrowUpRight size={17} />
                </button>
                <button
                  className="pc-hero-list"
                  onClick={() => setPanel({ kind: 'list' })}
                >
                  <ListChecks size={18} />
                  Make a restock list
                </button>
              </div>
              <div className="pc-hero-fine">
                <span>
                  <Check size={13} />
                  Choose your pack
                </span>
                <span>
                  <Check size={13} />
                  Save your favourites
                </span>
              </div>
            </div>
            <div className="pc-hero-art em-photo-hero"><DepartmentPhoto department="groceries" eager/></div>
          </section>

          <section className="pc-utility-grid" aria-label="Pantry tools">
            <button
              className="pc-utility pc-utility-list"
              onClick={() => setPanel({ kind: 'list' })}
            >
              <span className="pc-utility-icon">
                <ListChecks size={23} />
              </span>
              <div>
                <span className="pc-eyebrow">A LITTLE ORGANISATION</span>
                <h2>Your next restock</h2>
                <p>
                  {incomplete
                    ? `${incomplete} ${incomplete === 1 ? 'pack' : 'packs'} on your checklist`
                    : 'Keep an easy list for later'}
                </p>
              </div>
              <ArrowUpRight size={20} />
            </button>
            <button
              className="pc-utility pc-utility-saved"
              onClick={() => {
                reset();
                setSavedOnly(true);
                browse();
              }}
            >
              <span className="pc-utility-icon">
                <Heart size={23} />
              </span>
              <div>
                <span className="pc-eyebrow">YOUR OWN LITTLE EDIT</span>
                <h2>Everyday favourites</h2>
                <p>
                  {favorites.length
                    ? `${favorites.length} saved ${favorites.length === 1 ? 'essential' : 'essentials'}`
                    : 'A heart keeps it close'}
                </p>
              </div>
              <ArrowUpRight size={20} />
            </button>
            <button
              className="pc-utility pc-utility-budget"
              onClick={() => {
                budgetInput.current?.scrollIntoView({
                  behavior: motion(),
                  block: 'center',
                });
                budgetInput.current?.focus({ preventScroll: true });
              }}
            >
              <span className="pc-utility-icon">
                <ShoppingBasket size={23} />
              </span>
              <div>
                <span className="pc-eyebrow">SHOP WITH A PLAN</span>
                <h2>A basket that fits</h2>
                <p>
                  {budgetValue > 0
                    ? `Your basket budget: ${money(budgetValue)}`
                    : 'Set your own basket budget'}
                </p>
              </div>
              <ArrowUpRight size={20} />
            </button>
          </section>

          <section ref={catalog} className="pc-catalog" aria-label="Shop groceries">
            <div className="pc-section-title">
              <div>
                <span className="pc-eyebrow">REACH FOR THE GOOD STUFF</span>
                <h2>
                  {savedOnly ? 'Your favourites.' : 'On the pantry shelf.'}
                  <span>{filtered.length}</span>
                </h2>
              </div>
              <button
                className="pc-guide-link"
                onClick={() => setPanel({ kind: 'help' })}
              >
                A little shopping help
                <HelpCircle size={15} />
              </button>
            </div>

            <div className="pc-categories" role="group" aria-label="Grocery aisles">
              {AISLES.map(aisle => (
                <button
                  key={aisle.id}
                  className={category === aisle.id ? 'is-active' : ''}
                  aria-pressed={category === aisle.id}
                  onClick={() => setCategory(aisle.id)}
                >
                  <span>
                    <aisle.Icon size={15} />
                  </span>
                  {aisle.title}
                  <small>{aisle.count}</small>
                </button>
              ))}
            </div>

            <div className="pc-toolbar">
              <span>
                {filtered.length} {filtered.length === 1 ? 'essential' : 'essentials'}
                {category !== 'all'
                  ? ` in ${AISLES.find(a => a.id === category).title.toLowerCase()}`
                  : ' to make it your own'}
              </span>
              <div>
                <button
                  className={`pc-filter-button ${filterCount ? 'is-active' : ''}`}
                  aria-expanded={filtersOpen}
                  aria-controls="pc-filter-panel"
                  onClick={() => setFiltersOpen(!filtersOpen)}
                >
                  <SlidersHorizontal size={15} />
                  Filters{filterCount > 0 && <b>{filterCount}</b>}
                </button>
                <label className="pc-sort">
                  <span className="pc-sr-only">Sort groceries</span>
                  <select
                    aria-label="Sort groceries"
                    value={sort}
                    onChange={e => setSort(e.target.value)}
                  >
                    <option value="featured">The pantry edit</option>
                    <option value="low">Price: low to high</option>
                    <option value="high">Price: high to low</option>
                    <option value="savings">Biggest listed saving</option>
                  </select>
                  <ChevronDown size={14} />
                </label>
              </div>
            </div>

            {filtersOpen && (
              <div id="pc-filter-panel" className="pc-filter-panel">
                <label>
                  Listed brand
                  <select
                    aria-label="Filter by grocery brand"
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                  >
                    <option value="all">All listed brands</option>
                    {[...new Set(PRODUCTS.map(p => p.brand))].map(b => (
                      <option value={b} key={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Selected pack price
                  <select
                    aria-label="Maximum grocery pack price"
                    value={priceCap}
                    onChange={e => setPriceCap(e.target.value)}
                  >
                    <option value="all">Any price</option>
                    <option value="250">Up to ₹250</option>
                    <option value="500">Up to ₹500</option>
                    <option value="750">Up to ₹750</option>
                  </select>
                </label>
                <button
                  className={`pc-saved-toggle ${savedOnly ? 'is-active' : ''}`}
                  aria-pressed={savedOnly}
                  onClick={() => setSavedOnly(!savedOnly)}
                >
                  <Heart size={15} />
                  Saved only
                </button>
                <button className="pc-text-button" onClick={reset}>
                  Reset filters
                  <X size={13} />
                </button>
              </div>
            )}

            {(query || category !== 'all' || filterCount > 0) && (
              <div className="pc-selection-note">
                <span>
                  {query ? `Searching for “${query}”` : 'Your pantry selection'}
                  {savedOnly ? ' · Saved essentials' : ''}
                </span>
                <button onClick={reset}>
                  Clear selection
                  <X size={12} />
                </button>
              </div>
            )}

            <DepartmentOffers department="groceries"/>
{filtered.length > 0 ? (
              <div className="pc-products">
                {filtered.map((p, index) => {
                  const pack = selectedPack(p),
                    quantity = cart[keyFor(p.id, packIndex(p))] || 0;
                  const discount =
                    pack.originalPrice > pack.price
                      ? Math.round((savings(pack) / pack.originalPrice) * 100)
                      : 0;
                  return (
                    <article
                      className="pc-product"
                      key={p.id}
                      style={{ '--pc-delay': `${index * 45}ms` }}
                    >
                      <div className={`pc-product-art pc-tone-${p.colour}`}>
                        <button
                          className="pc-art-button"
                          aria-label={`View ${p.title} details`}
                          onClick={() => setPanel({ kind: 'detail', id: p.id })}
                        >
                          <PackArt product={p} pack={pack} />
                        </button>
                        {discount > 0 && (
                          <span className="pc-saving-badge">
                            {discount}% less
                            <small>than listed price</small>
                          </span>
                        )}
                        <button
                          className={`pc-heart ${favorites.includes(p.id) ? 'is-saved' : ''}`}
                          aria-label={`${favorites.includes(p.id) ? 'Unsave' : 'Save'} ${p.title}`}
                          aria-pressed={favorites.includes(p.id)}
                          onClick={() => toggleFavorite(p)}
                        >
                          <Heart size={17} />
                        </button>
                      </div>
                      <div className="pc-product-copy">
                        <span className="pc-product-caption">{p.caption}</span>
                        <button
                          className="pc-product-title"
                          onClick={() => setPanel({ kind: 'detail', id: p.id })}
                        >
                          <h3>{p.title}</h3>
                          <ArrowUpRight size={14} />
                        </button>
                        <p className="pc-product-brand">{p.brand}</p>
                        <label className="pc-pack-select">
                          <span className="pc-sr-only">Pack size for {p.title}</span>
                          <select
                            aria-label={`Pack size for ${p.title}`}
                            value={packIndex(p)}
                            onChange={e =>
                              setPacks(prev => ({
                                ...prev,
                                [p.id]: Number(e.target.value),
                              }))
                            }
                          >
                            {p.packSizes.map((pack, i) => (
                              <option key={i} value={i}>
                                {packLabel(pack)}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={13} />
                        </label>
                        <span className="pc-unit-price">
                          {unitPrice(pack) || 'Selected catalogue pack'}
                        </span>
                        <div className="pc-product-buy">
                          <div className="pc-price">
                            <strong>{money(pack.price)}</strong>
                            {savings(pack) > 0 && (
                              <del>{money(pack.originalPrice)}</del>
                            )}
                          </div>
                          {quantity ? (
                            <Quantity
                              label={`${p.title}, ${packLabel(pack)}`}
                              quantity={quantity}
                              onChange={delta =>
                                changeQuantity(p, packIndex(p), delta)
                              }
                            />
                          ) : (
                            <button
                              className="pc-add"
                              aria-label={`Add ${p.title} to basket`}
                              onClick={() => add(p)}
                             disabled={(p.inStock === false) || p.inStock === false}>
                              Add
                              <Plus size={15} />
                            </button>
                          )}
                        </div>
                        <button
                          className="pc-restock-product"
                          aria-label={`Add ${p.title}, ${packLabel(pack)} to restock checklist`}
                          onClick={() => addToList(p, packIndex(p))}
                         disabled={p.inStock === false}>
                          <BookmarkPlus size={13} />
                          Save for a restock
                        </button>
                      <DeliveryEstimate department="groceries" product={p}/></div>
                    </article>
                  );
                })}
                <article className="pc-shelf-note">
                  
                  <span className="pc-eyebrow">YOUR PANTRY, YOUR PACE</span>
                  <h3>
                    A good shelf
                    <br />
                    starts with
                    <br />
                    <span>a little list.</span>
                  </h3>
                  <p>
                    Save the packs you’ll reach for next. Tick them off when you’re
                    ready.
                  </p>
                  <button onClick={() => setPanel({ kind: 'list' })}>
                    Build your restock list
                    <ArrowUpRight size={17} />
                  </button>
                </article>
              </div>
            ) : (
              <div className="pc-empty">
                <Search size={32} />
                <h3>
                  {savedOnly && !favorites.length
                    ? 'Keep your everyday favourites.'
                    : category === 'spices' && !query && !filterCount
                      ? 'This aisle is waiting to be stocked.'
                      : 'A little too specific?'}
                </h3>
                <p>
                  {savedOnly && !favorites.length
                    ? 'Tap a heart on any product to start your own collection.'
                    : category === 'spices'
                      ? 'There are no spices in the current catalogue. Explore the other pantry aisles.'
                      : 'Try another search or clear your selection to see the whole shelf.'}
                </p>
                <button className="pc-button pc-button-blue" onClick={reset}>
                  Explore all essentials
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
            <p className="pc-catalog-note">
              Representative pantry photographs · Existing catalogue prices and
              listed brands · Confirm the actual packaging and availability with the
              retailer.
            </p>
          </section>

          <section className="pc-budget-panel" aria-label="Basket budget planner">
            <div className="pc-budget-heading">
              <span className="pc-utility-icon">
                <ShoppingBasket size={24} />
              </span>
              <div>
                <span className="pc-eyebrow">YOUR BASKET, YOUR BUDGET</span>
                <h2>Keep the everyday in balance.</h2>
                <p>Track the product subtotal against a limit you choose.</p>
              </div>
            </div>
            <div className="pc-budget-control">
              <label htmlFor="pc-budget">My basket budget</label>
              <div>
                <span>₹</span>
                <input
                  ref={budgetInput}
                  id="pc-budget"
                  aria-label="Basket budget in rupees"
                  type="number"
                  min="1"
                  max="100000"
                  step="1"
                  placeholder="Set a limit"
                  value={budget}
                  onChange={e => {
                    const v = e.target.value;
                    if (
                      v === '' ||
                      (/^\d+$/.test(v) &&
                        Number(v) > 0 &&
                        Number(v) <= 100000)
                    )
                      setBudget(v);
                  }}
                />
                <button
                  className="pc-icon"
                  aria-label="Clear basket budget"
                  disabled={!budget}
                  onClick={() => setBudget('')}
                >
                  <X size={14} />
                </button>
              </div>
              {!budget && (
                <button
                  className="pc-budget-example"
                  onClick={() => setBudget('1000')}
                >
                  Try a ₹1,000 budget
                  <ArrowRight size={12} />
                </button>
              )}
            </div>
            <div className="pc-budget-summary">
              <div>
                <span>Basket subtotal</span>
                <strong>{money(subtotal)}</strong>
              </div>
              {budgetValue > 0 ? (
                <>
                  <div
                    className={`pc-budget-track ${remaining < 0 ? 'is-over' : ''}`}
                    role="progressbar"
                    aria-label="Basket budget used"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.min(
                      100,
                      Math.round((subtotal / budgetValue) * 100)
                    )}
                    aria-valuetext={`${money(subtotal)} of ${money(budgetValue)}`}
                  >
                    <span
                      style={{
                        width: `${Math.min(100, (subtotal / budgetValue) * 100)}%`,
                      }}
                    />
                  </div>
                  <small className={remaining < 0 ? 'pc-budget-over' : ''}>
                    {remaining < 0
                      ? `${money(-remaining)} over your chosen budget`
                      : `${money(remaining)} left in your chosen budget`}
                  </small>
                </>
              ) : (
                <small>Set a budget to see your progress.</small>
              )}
              <p>
                Product prices only. EdgeMart checkout shows its own delivery
                charges and discounts.
              </p>
            </div>
          </section>

          <section className="pc-edits-section">
            <div className="pc-section-title">
              <div>
                <span className="pc-eyebrow">A LITTLE LESS DECIDING</span>
                <h2>Thoughtful shelf edits.</h2>
              </div>
              <p>
                Simple combinations.
                <br />
                Individual catalogue packs.
              </p>
            </div>
            <div className="pc-edits">
              {EDITS.filter(edit=>edit.lines.every(([id,index])=>PRODUCTS.find(p=>p.id===id)?.packSizes?.[index])).map(edit => {
                const total = edit.lines.reduce(
                    (sum, [id, i]) =>
                      sum + PRODUCTS.find(p => p.id === id).packSizes[i].price,
                    0
                  ),
                  Icon = edit.icon;
                return (
                  <article
                    className={`pc-edit pc-edit-${edit.colour}`}
                    key={edit.id}
                  >
                    <div className="pc-edit-top">
                      <Icon size={29} strokeWidth={1.5} />
                      <span>{edit.lines.length} PACKS / THE SHELF EDIT</span>
                    </div>
                    <h3>{edit.title}</h3>
                    <p>{edit.description}</p>
                    <div className="pc-edit-packs">
                      {edit.lines.map(([id, i]) => {
                        const p = PRODUCTS.find(p => p.id === id);
                        return (
                          <span key={id}>
                            {p.title} · {packLabel(p.packSizes[i])}
                          </span>
                        );
                      })}
                    </div>
                    <div className="pc-edit-bottom">
                      <strong>
                        {money(total)}
                        <small>Listed pack total</small>
                      </strong>
                      <button
                        aria-label={`Add ${edit.title} to basket`}
                        onClick={() =>
                          addPacks(
                            edit.lines.map(([id, i]) => keyFor(id, i)),
                            `${edit.title} added. Review the packs in your basket.`
                          )
                        }
                      >
                        Add the edit
                        <Plus size={16} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <footer className="pc-footer">
            <span>
              <ShoppingBasket size={17} />
              pantry club<span>BY EDGEMART</span>
            </span>
            <p>Little essentials. Everyday possibilities.</p>
            <button onClick={onBackToLanding}>
              All departments
              <ArrowUpRight size={15} />
            </button>
          </footer>
        </main>
      </div>

      {count > 0 && (
        <div className="pc-cart-tray">
          <span className="pc-cart-tray-icon">
            <ShoppingBasket size={22} />
            <b>{count}</b>
          </span>
          <div>
            <strong>{money(subtotal)}</strong>
            <small>
              {count} {count === 1 ? 'pack' : 'packs'} in your basket
            </small>
          </div>
          <button
            className="pc-button pc-button-blue"
            onClick={() => setPanel({ kind: 'cart' })}
          >
            Review basket
            <ArrowRight size={17} />
          </button>
        </div>
      )}

      {toast && (
        <div className="pc-toast" role="status">
          <Check size={17} />
          <span>{toast}</span>
          <button
            className="pc-icon"
            aria-label="Dismiss pantry message"
            onClick={() => setToast('')}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {panel?.kind === 'cart' && (
        <Modal
          key="cart"
          title="Your pantry basket"
          drawer
          onClose={() => setPanel(null)}
        >
          {lines.length ? (
            <>
              <div className="pc-cart-lines">
                {lines.map(line => (
                  <article className="pc-cart-line" key={line.key}>
                    <div className={`pc-cart-art pc-tone-${line.product.colour}`}>
                      <PackArt product={line.product} pack={line.pack} />
                    </div>
                    <div className="pc-cart-copy">
                      <h3>{line.product.title}</h3>
                      <p>{packLabel(line.pack)}</p>
                      <div>
                        <Quantity
                          label={`${line.product.title}, ${packLabel(line.pack)}`}
                          quantity={line.quantity}
                          onChange={delta =>
                            changeQuantity(line.product, line.index, delta)
                          }
                        />
                        <strong>
                          {money(line.pack.price * line.quantity)}
                        </strong>
                      </div>
                    </div>
                    <button
                      className="pc-icon pc-cart-remove"
                      aria-label={`Remove ${line.product.title}, ${packLabel(line.pack)}`}
                      onClick={() =>
                        setCart(prev => {
                          const next = { ...prev };
                          delete next[line.key];
                          return next;
                        })
                      }
                    >
                      <X size={15} />
                    </button>
                  </article>
                ))}
              </div>
              <div className="pc-cart-summary">
                <div>
                  <span>Product subtotal</span>
                  <strong>{money(subtotal)}</strong>
                </div>
                <div className="pc-cart-savings">
                  <span>Saving vs. listed prices</span>
                  <span>{money(savedAmount)}</span>
                </div>
                {budgetValue > 0 && (
                  <p className={remaining < 0 ? 'pc-budget-over' : ''}>
                    {remaining < 0
                      ? `${money(-remaining)} over`
                      : `${money(remaining)} left in`}{' '}
                    your {money(budgetValue)} basket budget.
                  </p>
                )}
                <p>
                  Delivery and discounts appear in the existing demo checkout.
                  No real order or payment is created.
                </p>
                <button
                  className="pc-button pc-button-blue pc-full"
                  onClick={beginCheckout}
                >
                  Continue to checkout
                  <ArrowRight size={17} />
                </button>
                <button
                  className="pc-text-button pc-clear-cart"
                  onClick={() => setCart({})}
                >
                  <Trash2 size={14} />
                  Clear basket
                </button>
              </div>
            </>
          ) : (
            <div className="pc-empty-basket">
              <ShoppingBasket size={36} />
              <h3>A little room for the essentials.</h3>
              <p>
                Pick a product and choose your pack.
                <br />
                Your basket stays saved in this browser.
              </p>
              <button
                className="pc-button pc-button-blue"
                onClick={() => {
                  setPanel(null);
                  browse();
                }}
              >
                Explore the pantry
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </Modal>
      )}

      {detail && (
        <Modal
          key={detail.id}
          title="A closer look"
          wide
          onClose={() => setPanel(null)}
        >
          <div className="pc-detail">
            <div className={`pc-detail-art pc-tone-${detail.colour}`}>
              <PackArt product={detail} pack={selectedPack(detail)} />
              <span>REPRESENTATIVE PHOTO</span>
            </div>
            <div className="pc-detail-copy">
              <span className="pc-eyebrow">{detail.caption}</span>
              <h3>{detail.name}</h3>
              <p>Listed brand: {detail.brand}</p>
              <dl>
                <div>
                  <dt>Selected pack</dt>
                  <dd>{packLabel(selectedPack(detail))}</dd>
                </div>
                <div>
                  <dt>Listed shelf life</dt>
                  <dd>{detail.shelfLife}</dd>
                </div>
                <div>
                  <dt>Catalogue storage note</dt>
                  <dd>{detail.storage}</dd>
                </div>
              </dl>
              <label>
                Choose your pack
                <select
                  aria-label={`Detail pack size for ${detail.title}`}
                  value={packIndex(detail)}
                  onChange={e =>
                    setPacks(prev => ({
                      ...prev,
                      [detail.id]: Number(e.target.value),
                    }))
                  }
                >
                  {detail.packSizes.map((pack, i) => (
                    <option key={i} value={i}>
                      {packLabel(pack)} — {money(pack.price)}
                    </option>
                  ))}
                </select>
              </label>
              <span className="pc-detail-unit">
                {unitPrice(selectedPack(detail))}
              </span>
              <div className="pc-detail-buy">
                <div className="pc-price">
                  <strong>{money(selectedPack(detail).price)}</strong>
                  <del>{money(selectedPack(detail).originalPrice)}</del>
                  <small>
                    Save {money(savings(selectedPack(detail)))}
                  </small>
                </div>
                {cart[keyFor(detail.id, packIndex(detail))] ? (
                  <Quantity
                    label={`${detail.title}, ${packLabel(selectedPack(detail))}`}
                    quantity={cart[keyFor(detail.id, packIndex(detail))]}
                    onChange={delta =>
                      changeQuantity(detail, packIndex(detail), delta)
                    }
                  />
                ) : (
                  <button
                    className="pc-button pc-button-blue"
                    onClick={() => add(detail)}
                   disabled={detail.inStock === false}>
                    Add to basket
                    <Plus size={16} />
                  </button>
                )}
              </div>
              <button
                className="pc-text-button"
                onClick={() => addToList(detail, packIndex(detail))}
              >
                <BookmarkPlus size={15} />
                Save this pack for a restock
              </button>
              <p className="pc-detail-note">
                Listed catalogue information. Check the actual pack for
                ingredients, allergens, best-before date and storage
                instructions.
              </p>
              <button
                className="pc-text-button"
                onClick={() => setPanel({ kind: 'cart' })}
              >
                Review your basket
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </Modal>
      )}

      {panel?.kind === 'list' && (
        <Modal
          key="list"
          title="Your restock checklist"
          onClose={() => setPanel(null)}
        >
          <div className="pc-list-body">
            <div className="pc-list-intro">
              <ListChecks size={25} />
              <p>
                A little list for your next pantry run.
                <br />
                <span>
                  Check off packs yourself. Your list is saved in this browser.
                </span>
              </p>
            </div>
            <form
              className="pc-list-form"
              onSubmit={e => {
                e.preventDefault();
                if(!chosenListProduct)return;
                addToList(chosenListProduct, listPack);
              }}
            >
              <label>
                Choose an essential
                <select
                  aria-label="Restock product"
                  value={listProduct}
                  onChange={e => {
                    setListProduct(e.target.value);
                    setListPack(0);
                  }}
                >
                  {PRODUCTS.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Choose a pack
                <select
                  aria-label="Restock pack size"
                  value={listPack}
                  onChange={e => setListPack(Number(e.target.value))}
                >
                  {(chosenListProduct?.packSizes||[]).map((pack, i) => (
                    <option key={i} value={i}>
                      {packLabel(pack)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="pc-button pc-button-blue"
                aria-label="Add selected pack to restock checklist"
                disabled={!chosenListProduct}
              >
                <Plus size={16} />
              </button>
            </form>
            {list.length ? (
              <>
                <div className="pc-list-count">
                  <span>
                    {list.length - incomplete} of {list.length} checked off
                  </span>
                  <button
                    className="pc-text-button"
                    disabled={!list.some(l => l.done)}
                    onClick={() =>
                      setList(prev => prev.filter(l => !l.done))
                    }
                  >
                    Clear completed
                    <CheckCheck size={13} />
                  </button>
                </div>
                <div className="pc-list-items">
                  {list.map(line => {
                    const resolved = resolveLine(line.key);
                    return (
                      <div
                        className={`pc-list-item ${line.done ? 'is-done' : ''}`}
                        key={line.key}
                      >
                        <label>
                          <input
                            type="checkbox"
                            aria-label={`Mark ${resolved.product.title}, ${packLabel(resolved.pack)} complete`}
                            checked={line.done}
                            onChange={() =>
                              setList(prev =>
                                prev.map(l =>
                                  l.key === line.key
                                    ? { ...l, done: !l.done }
                                    : l
                                )
                              )
                            }
                          />
                          <span>
                            <strong>{resolved.product.title}</strong>
                            <small>
                              {packLabel(resolved.pack)} ·{' '}
                              {money(resolved.pack.price)}
                            </small>
                          </span>
                        </label>
                        <button
                          className="pc-icon"
                          aria-label={`Remove ${resolved.product.title}, ${packLabel(resolved.pack)} from restock checklist`}
                          onClick={() =>
                            setList(prev =>
                              prev.filter(l => l.key !== line.key)
                            )
                          }
                        >
                          <X size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <button
                  className="pc-button pc-button-blue pc-full"
                  disabled={!incomplete}
                  onClick={() =>
                    addPacks(
                      list.filter(l => !l.done).map(l => l.key),
                      `${incomplete} checklist ${incomplete === 1 ? 'pack' : 'packs'} added to your basket.`
                    )
                  }
                >
                  Add unchecked packs to basket
                  <ShoppingBasket size={17} />
                </button>
                <p className="pc-list-fine">
                  Adds one of each unchecked pack. Completion is manual; this
                  action keeps your checklist.
                </p>
                <button
                  className="pc-text-button pc-list-review"
                  onClick={() => setPanel({ kind: 'cart' })}
                >
                  Review basket ({count})
                  <ArrowRight size={15} />
                </button>
              </>
            ) : (
              <div className="pc-list-empty">
                <BookmarkPlus size={30} />
                <h3>Your next pantry run starts here.</h3>
                <p>
                  Choose an essential above or save a pack
                  <br />
                  from a product card to start your checklist.
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {panel?.kind === 'help' && (
        <Modal
          key="help"
          title="A little shopping help"
          onClose={() => setPanel(null)}
        >
          <div className="pc-help-body">
            {[
              [
                'How do pack prices work?',
                'Each selected pack has its own catalogue price. Unit prices are rounded comparisons per kilogram or litre. Different pack sizes stay on separate basket lines, with a maximum of 20 of each pack. Savings are calculated from the listed original pack price; inconsistent promotional text in pack labels is omitted.',
              ],
              [
                'What can I do with a restock checklist?',
                'Save a specific product pack from a card or add it in the checklist. Tick items off manually, remove individual packs, clear completed entries or add one of every unchecked pack to the basket. Adding packs does not mark the checklist complete.',
              ],
              [
                'How does the basket budget work?',
                'Choose a limit between ₹1 and ₹1,00,000. The budget bar compares your product subtotal against that limit. Delivery charges and demo discounts are excluded. This is a personal shopping tool, with no credit or payment feature.',
              ],
              [
                'What is a shelf edit?',
                'An edit adds the specific individual packs shown at their catalogue prices. There is no extra bundle discount. You can adjust or remove each pack in your basket.',
              ],
              [
                'Are these actual pack photographs?',
                'These are representative grocery photographs. Product names, listed brands, sizes, storage notes and prices come from the existing catalogue. Verify actual packaging, ingredients, allergens, dates and availability with the retailer. The spices aisle currently has no catalogue products.',
              ],
              [
                'What is saved and what does checkout do?',
                'Basket quantities, favourites, checklist entries and your chosen budget stay in this browser when local storage is available. They are not synced to an account. Checkout opens the existing EdgeMart simulation, with demonstration charges and delivery screens. No real order or payment occurs. Closing or cancelling preserves your basket.',
              ],
            ].map(([title, text]) => (
              <details key={title}>
                <summary>
                  {title}
                  <ChevronDown size={16} />
                </summary>
                <p>{text}</p>
              </details>
            ))}
            <div className="pc-help-note">
              <Sun size={27} />
              <span>Small rituals. A thoughtfully stocked pantry.</span>
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
