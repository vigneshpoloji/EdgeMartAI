import useCatalogueCart from '../../sellers/useCatalogueCart';
import useBuyerCatalogue from '../../sellers/useBuyerCatalogue';
import { DepartmentOffers, DeliveryEstimate } from '../../components/ShoppingBenefits';
import { DepartmentPhoto, ProductPhoto } from '../../components/DepartmentPhoto';
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChefHat, Clock, Heart, HelpCircle, Leaf, Minus, Plus, Search, ShoppingBag, SlidersHorizontal, Trash2, Utensils, X } from 'lucide-react';
import { FOOD_CATEGORIES, FOOD_PRODUCTS } from '../../data';
import CheckoutLifecycle from '../../components/CheckoutLifecycle';
import './food.css';

const STORAGE = 'edgemart-supper-club-v1';

const scrollBehavior = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth';

const money = n =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);

const DETAILS = {
  fd1: {
    title: 'The Margherita',
    subtitle: 'Wood-fired sourdough · buffalo mozzarella',
    kind: 'pizza',
    colour: 'peach',
  },
  fd2: {
    title: 'Butter masala bowl',
    subtitle: 'Paneer · slow-cooked tomato · kasuri methi',
    kind: 'curry',
    colour: 'rose',
  },
  fd3: {
    title: 'Dum chicken biryani',
    subtitle: 'Aged basmati · saffron · Hyderabadi spices',
    kind: 'rice',
    colour: 'yellow',
  },
  fd4: {
    title: 'Smoked paneer tikka',
    subtitle: 'Charcoal grill · hung curd · Kashmiri chilli',
    kind: 'tikka',
    colour: 'sage',
  },
  fd5: {
    title: 'Jamun & rabdi',
    subtitle: 'Warm gulab jamun · chilled saffron rabdi',
    kind: 'sweet',
    colour: 'lavender',
  },
};

const nativeCatalogue = FOOD_PRODUCTS.map(d => ({
  ...d,
  image: `/images/india/food-${d.id}.jpg`,
  ...DETAILS[d.id],
  allergens: Array.isArray(d.allergens)
    ? d.allergens
    : String(d.allergens || '')
        .split(',')
        .map(a => a.trim())
        .filter(Boolean),
}));

const CATEGORIES = FOOD_CATEGORIES.map(c => ({
  ...c,
  title:
    {
      all: 'Everything',
      starters: 'Small plates',
      main: 'Comfort bowls',
      biryani: 'Biryani',
      pizzas: 'Pizza',
      desserts: 'Something sweet',
    }[c.id] || c.name,
}));

const PAIRINGS = [
  {
    title: 'Pizza. Sweet. Repeat.',
    description: 'A Margherita and a little jamun & rabdi. An evening well spent.',
    ids: ['fd1', 'fd5'],
    colour: 'rose',
    label: 'THE MOVIE-NIGHT EDIT',
  },
  {
    title: 'A little spice, a lot of comfort.',
    description: 'Butter masala meets smoky paneer tikka. Make room at the table.',
    ids: ['fd2', 'fd4'],
    colour: 'sage',
    label: 'THE COMFORT EDIT',
  },
];

const baseConfig = dish => ({
  id: dish.id,
  portion: 0,
  spice: dish.customizations.spices[0],
  addons: [],
  note: '',
  quantity: 1,
});

const configKey = c =>
  JSON.stringify([
    c.id,
    c.portion,
    c.spice,
    [...c.addons].sort((a, b) => a - b),
    c.note.trim(),
  ]);









// Food photography is representative of the menu, rather than the delivered meal.
function DishArt({ dish }) { return <ProductPhoto department="food" src={dish.image} label={dish.title} className="sc-dish-art"/>; }

function Modal({ title, onClose, children, drawer = false, bare = false }) {
  const ref = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();

    const onKey = e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close.current();
      }
      if (e.key !== 'Tab') return;
      const items = [
        ...ref.current.querySelectorAll(
          'button,input,select,textarea,a[href],[tabindex="0"]'
        ),
      ].filter(n => !n.disabled && n.getClientRects().length);

      const first = items[0];
      const last = items[items.length - 1];

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

    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, []);

  return (
    <div
      className={`sc-overlay ${drawer ? 'sc-overlay-drawer' : ''}`}
      onClick={onClose}
    >
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`sc-modal ${drawer ? 'sc-drawer' : ''} ${bare ? 'sc-modal-bare' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {!bare && (
          <header className="sc-modal-head">
            <div>
              <span className="sc-eyebrow">SUPPER CLUB / EDGEMART</span>
              <h2>{title}</h2>
            </div>
            <button
              className="sc-icon"
              aria-label={`Close ${title}`}
              onClick={onClose}
            >
              <X size={21} />
            </button>
          </header>
        )}
        {children}
      </section>
    </div>
  );
}

function Quantity({ value, onChange, label, min = 1 }) {
  return (
    <div className="sc-quantity">
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        disabled={value <= min}
        onClick={() => onChange(-1)}
      >
        <Minus size={14} />
      </button>
      <span aria-label={`${label} quantity`}>{value}</span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        disabled={value >= 20}
        onClick={() => onChange(1)}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

function Customizer({ config, editing, onConfirm, onClose }) {
  const DISHES = useBuyerCatalogue('food',nativeCatalogue,'Food');
  const {dishFor,unitPrice,validConfig,loadSaved} = useMemo(()=>catalogueTools(DISHES),[DISHES]);

  const [choice, setChoice] = useState(config);
  const [error, setError] = useState('');
  const dish = dishFor(choice);
  const options = dish?.customizations;

  const change = value => {
    setChoice(c => ({ ...c, ...value }));
    setError('');
  };

  if (!dish) return <Modal title="Dish unavailable" onClose={onClose}><p>This dish is no longer available from a nearby kitchen. Close this panel to browse the current menu.</p></Modal>;

  return (
    <Modal
      title={editing ? `Edit ${dish.title}` : `Make ${dish.title} yours`}
      onClose={onClose}
    >
      <div className="sc-custom-grid">
        <aside className={`sc-custom-about sc-${dish.colour}`}>
          <DishArt dish={dish} />
          <span className="sc-art-label">REPRESENTATIVE PHOTO</span>
          <div className="sc-diet">
            <span className={dish.isVeg ? 'sc-veg-dot' : 'sc-nonveg-dot'} />
            {dish.sellerProduct ? dish.details?.diet || 'Diet not specified' : dish.isVeg ? 'Vegetarian' : 'Non-vegetarian'}
            <span>· {dish.tag}</span>
          </div>
          <h3>{dish.name}</h3>
          <p>{dish.description}</p>
          <p className="sc-prep">
            <Clock size={15} /> Catalogue prep time: {dish.prepTime}
          </p>
          <div className="sc-allergens">
            <strong>Listed base-dish allergens</strong>
            <p>{dish.allergens.join(', ')}</p>
            <small>
              Add-on ingredients are not fully specified. Confirm ingredients
              with the retailer before ordering if you have an allergy.
            </small>
          </div>
        </aside>
        <form
          className="sc-custom-controls"
          onSubmit={e => {
            e.preventDefault();
            const message = onConfirm({ ...choice, note: choice.note.trim() });
            if (message) setError(message);
          }}
        >
          <fieldset>
            <legend>
              <span>01</span> Choose your portion
            </legend>
            {options.portions.map((p, i) => (
              <label
                className={`sc-choice ${choice.portion === i ? 'sc-chosen' : ''}`}
                key={p.label}
              >
                <input
                  type="radio"
                  name="portion"
                  checked={choice.portion === i}
                  onChange={() => change({ portion: i })}
                />
                <span>{p.label}</span>
                <b>{money(dish.price + p.priceDelta)}</b>
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>
              <span>02</span> Your flavour profile
            </legend>
            <div className="sc-spice-options">
              {options.spices.map(s => (
                <label
                  className={choice.spice === s ? 'sc-chosen' : ''}
                  key={s}
                >
                  <input
                    type="radio"
                    name="spice"
                    checked={choice.spice === s}
                    onChange={() => change({ spice: s })}
                  />
                  <span>{s}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>
              <span>03</span> A little extra <small>Optional</small>
            </legend>
            {options.addons.map((a, i) => (
              <label
                className={`sc-choice ${choice.addons.includes(i) ? 'sc-chosen' : ''}`}
                key={a.name}
              >
                <input
                  type="checkbox"
                  checked={choice.addons.includes(i)}
                  onChange={e =>
                    change({
                      addons: e.target.checked
                        ? [...choice.addons, i]
                        : choice.addons.filter(n => n !== i),
                    })
                  }
                />
                <span>{a.name}</span>
                <b>+{money(a.price)}</b>
              </label>
            ))}
          </fieldset>
          <label className="sc-note-label" htmlFor="sc-kitchen-note">
            A note for the kitchen <small>Optional · {choice.note.length}/180</small>
          </label>
          <textarea
            id="sc-kitchen-note"
            value={choice.note}
            maxLength={180}
            placeholder="Any preferences? Requests need retailer confirmation."
            onChange={e => change({ note: e.target.value })}
            rows={2}
          />
          <div className="sc-custom-summary">
            <span>
              Per meal <strong>{money(unitPrice(choice))}</strong>
            </span>
            <Quantity
              value={choice.quantity}
              label="meal"
              onChange={n => change({ quantity: choice.quantity + n })}
            />
          </div>
          {error && (
            <p className="sc-error" role="alert">
              {error}
            </p>
          )}
          <button className="sc-primary sc-full" type="submit">
            {editing ? 'Save meal changes' : 'Add to my order'}{' '}
            <span>
              {money(unitPrice(choice) * choice.quantity)}{' '}
              <ArrowRight size={17} />
            </span>
          </button>
        </form>
      </div>
    </Modal>
  );
}

function catalogueTools(DISHES) {
const dishFor = c => DISHES.find(d => d.id === c.id);
const unitPrice = c => {
  const d = dishFor(c);
  return (
    d.price +
    d.customizations.portions[c.portion].priceDelta +
    c.addons.reduce((sum, i) => sum + d.customizations.addons[i].price, 0)
  );
};
function validConfig(c) {
  const d = c && dishFor(c);
  if (
    !d ||
    !Number.isInteger(c.portion) ||
    !d.customizations.portions[c.portion] ||
    !d.customizations.spices.includes(c.spice) ||
    !Array.isArray(c.addons) ||
    !c.addons.every(i => Number.isInteger(i) && d.customizations.addons[i]) ||
    !Number.isInteger(c.quantity) ||
    c.quantity < 1 ||
    c.quantity > 20
  )
    return null;

  return {
    id: c.id,
    portion: c.portion,
    spice: c.spice,
    addons: [...new Set(c.addons)].sort((a, b) => a - b),
    note: typeof c.note === 'string' ? c.note.trim().slice(0, 180) : '',
    quantity: c.quantity,
  };
}
function loadSaved() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE) || '{}');
    const cart = [];
    if (Array.isArray(data.cart)) {
      data.cart.forEach(raw => {
        const c = validConfig(raw);
        if (!c) return;
        const same = cart.find(l => configKey(l) === configKey(c));
        if (same) {
          same.quantity = Math.min(20, same.quantity + c.quantity);
        } else {
          cart.push(c);
        }
      });
    }
    return {
      cart,
      favorites: Array.isArray(data.favorites)
        ? [...new Set(data.favorites.filter(id => DISHES.some(d => d.id === id)))]
        : [],
    };
  } catch {
    return { cart: [], favorites: [] };
  }
}
return {dishFor,unitPrice,validConfig,loadSaved};
}
export default function FoodDashboard({ onBackToLanding }) {
  const DISHES = useBuyerCatalogue('food',nativeCatalogue,'Food');
  const {dishFor,unitPrice,validConfig,loadSaved} = useMemo(()=>catalogueTools(DISHES),[DISHES]);

  const [initial] = useState(loadSaved);
  const [cart, setCart] = useCatalogueCart(initial.cart, DISHES);
  const [favorites, setFavorites] = useState(initial.favorites);
  const [query, setQuery] = useState(()=>new URLSearchParams(window.location.search).get('q') || '');
  const [category, setCategory] = useState('all');
  const [vegOnly, setVegOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [cap, setCap] = useState('all');
  const [sort, setSort] = useState('featured');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [panel, setPanel] = useState(null);
  const [customizer, setCustomizer] = useState(null);
  const [checkout, setCheckout] = useState(null);
  const [toast, setToast] = useState('');

  const menu = useRef(null);
  const edits = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify({ cart, favorites }));
    } catch {
      /* Browsing and ordering still work without storage. */
    }
  }, [cart, favorites]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(timeout);
  }, [toast]);

  const total = cart.reduce((sum, c) => sum + unitPrice(c) * c.quantity, 0);
  const count = cart.reduce((sum, c) => sum + c.quantity, 0);

  const scrollTo = ref =>
    ref.current?.scrollIntoView({
      behavior: scrollBehavior(),
      block: 'start',
    });

  const resetFilters = () => {
    setQuery('');
    setCategory('all');
    setVegOnly(false);
    setSavedOnly(false);
    setCap('all');
    setSort('featured');
  };

  const filtered = useMemo(() => {
    const result = DISHES.filter(
      d =>
        (category === 'all' || d.subCategory === category) &&
        (!vegOnly || d.isVeg) &&
        (!savedOnly || favorites.includes(d.id)) &&
        (cap === 'all' || d.price <= Number(cap)) &&
        `${d.name} ${d.title} ${d.description}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())
    );

    if (sort === 'price-low') result.sort((a, b) => a.price - b.price);
    if (sort === 'price-high') result.sort((a, b) => b.price - a.price);
    if (sort === 'prep')
      result.sort((a, b) => parseInt(a.prepTime) - parseInt(b.prepTime));

    return result;
  }, [category, query, vegOnly, savedOnly, cap, sort, favorites, DISHES]);

  const favorite = id => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
    );
  };

  function confirm(c) {
    const key = configKey(c);
    const others = cart.filter(l => configKey(l) !== customizer?.editingKey);
    const match = others.find(l => configKey(l) === key);

    if ((match?.quantity || 0) + c.quantity > 20) {
      return 'You can add up to 20 of the same customised meal. Reduce the quantity to continue.';
    }

    setCart(
      match
        ? others.map(l =>
            configKey(l) === key
              ? { ...l, quantity: l.quantity + c.quantity }
              : l
          )
        : [...others, c]
    );

    setCustomizer(null);
    if (customizer?.editingKey) setPanel('cart');
    setToast(
      customizer?.editingKey
        ? 'Your meal changes are saved.'
        : `${dishFor(c).title} added to your order.`
    );
    return null;
  }

  function addPairing(pair) {
    const additions = pair.ids.map(id =>
      baseConfig(DISHES.find(d => d.id === id))
    );

    if (
      additions.some(
        c =>
          (cart.find(l => configKey(l) === configKey(c))?.quantity || 0) >= 20
      )
    ) {
      setToast('One of these meals has reached the 20-meal limit.');
      return;
    }

    setCart(prev => {
      const next = [...prev];
      additions.forEach(c => {
        const i = next.findIndex(l => configKey(l) === configKey(c));
        if (i < 0) next.push(c);
        else next[i] = { ...next[i], quantity: next[i].quantity + 1 };
      });
      return next;
    });

    setToast(
      'Both dishes added with their standard portions and flavours. You can edit them in your order.'
    );
  }

  function adjust(key, amount) {
    setCart(prev =>
      prev.map(c =>
        configKey(c) === key
          ? { ...c, quantity: Math.min(20, Math.max(1, c.quantity + amount)) }
          : c
      )
    );
  }

  function beginCheckout() {
    if (!cart.length) return;
    const details = cart.map(c => {
      const d = dishFor(c);
      return `${c.quantity} × ${d.name} — ${d.customizations.portions[c.portion].label}; ${c.spice}${c.addons.length ? `; extras: ${c.addons.map(i => d.customizations.addons[i].name).join(', ')}` : ''}${c.note ? `; kitchen note: ${c.note}` : ''}`;
    });

    setCheckout({
      lines: cart.map(c => ({ id: c.id, name: dishFor(c).name, category: 'food', image: dishFor(c).image, price: unitPrice(c), quantity: c.quantity, variant: [dishFor(c).customizations.portions[c.portion].label, c.spice, ...c.addons.map(i => dishFor(c).customizations.addons[i].name), c.note].filter(Boolean).join(' · '), options: { portion: c.portion, spice: c.spice, addons: c.addons, kitchenNote: c.note } })),
      id: 'supper-club-order',
      name: details.join(' | '),
      price: total,
      category: 'food',
      foodMeta: {
        portion: details.join(' | '),
        spiceLevel: cart.map(c => `${dishFor(c).title}: ${c.spice}`).join(' / '),
        allergens: `${[...new Set(cart.flatMap(c => dishFor(c).allergens))].join(', ')} (base dishes only; add-on ingredients require retailer confirmation)`,
        prepTime: cart.map(c => `${dishFor(c).title}: ${dishFor(c).prepTime}`).join(' / '),
      },
    });
    setPanel(null);
  }

  return (
    <div className="sc-page">
      <div className="sc-topbar">
        <span>A GOOD EVENING STARTS AT THE TABLE.</span>
        <span>
           YOUR TASTE. YOUR WAY.
        </span>
      </div>

      <header className="sc-header">
        <button
          className="sc-back"
          onClick={onBackToLanding}
          aria-label="All departments"
        >
          <ArrowLeft size={17} />
          <span>EdgeMart</span>
        </button>
        <button
          className="sc-wordmark"
          onClick={() => window.scrollTo({ top: 0, behavior: scrollBehavior() })}
          aria-label="Supper Club home"
        >
          supper<span>club</span>
          <i>COME HUNGRY. STAY HAPPY.</i>
        </button>
        <div className="sc-header-actions">
          <button
            className="sc-icon sc-help-trigger"
            aria-label="Ordering guide"
            onClick={() => setPanel('guide')}
          >
            <HelpCircle size={21} />
          </button>
          <button
            className="sc-order-button"
            onClick={() => setPanel('cart')}
            aria-label={`My order, ${count} meals`}
          >
            <ShoppingBag size={18} />
            <span>My order</span>
            <b>{count}</b>
          </button>
        </div>
      </header>

      <nav className="sc-nav" aria-label="Food navigation">
        <button
          onClick={() => {
            setSavedOnly(false);
            scrollTo(menu);
          }}
        >
          Our menu
        </button>
        <button onClick={() => scrollTo(edits)}>Perfect pairings</button>
        <button
          className={savedOnly ? 'sc-active' : ''}
          onClick={() => {
            resetFilters();
            setSavedOnly(true);
            scrollTo(menu);
          }}
        >
          <Heart size={14} /> My favourites <span>{favorites.length}</span>
        </button>
        <button onClick={() => setPanel('guide')}>
          How it works <ArrowUpRight size={13} />
        </button>
      </nav>

      <main>
        <section className="sc-hero">
          <div className="sc-hero-copy">
            <span className="sc-eyebrow">
              <span className="sc-small-star"></span> THE LITTLE JOY OF A GREAT MEAL
            </span>
            <h1>
              Eat well.
              <br />
              <em>Stay awhile.</em>
            </h1>
            <p>
              Big flavours. Comforting classics. A little something sweet. Find
              your kind of happy, one plate at a time.
            </p>
            <button
              className="sc-primary"
              onClick={() => {
                resetFilters();
                scrollTo(menu);
              }}
            >
              Find your favourite <ArrowUpRight size={19} />
            </button>
            <div className="sc-hero-foot">
              <span>
                <ChefHat size={19} /> Make every meal yours
              </span>
              <span>Portions, spice & all the extras.</span>
            </div>
          </div>
          <div className="sc-hero-visual">
            
            
            <DepartmentPhoto department="food" eager/>
            
            
            <button
              className="sc-featured-ticket"
              disabled={!DISHES.length}
              onClick={() => setCustomizer({ config: baseConfig((DISHES[2] || DISHES[0])) })}
            >
              <span>
                <small>MEET YOUR NEXT FAVOURITE</small>
                <strong>{(DISHES[2]||DISHES[0])?.name||'Your next favourite is on its way'}</strong>
                <i>{DISHES.length?`From ${money((DISHES[2]||DISHES[0]).price)}`:'Published menus will appear here'}</i>
              </span>
              <span className="sc-ticket-arrow">
                <ArrowUpRight size={24} />
              </span>
            </button>
          </div>
        </section>

        <div className="sc-marquee" aria-hidden="true">
          <span>MADE FOR YOUR CRAVINGS</span>
          <span></span>
          <span>A LITTLE EXTRA, ALWAYS</span>
          <span></span>
          <span>GOOD FOOD. GOOD COMPANY.</span>
          <span></span>
          <span>MAKE ROOM FOR DESSERT</span>
        </div>

        <section
          className="sc-menu-section"
          ref={menu}
          aria-labelledby="sc-menu-heading"
        >
          <div className="sc-section-head">
            <div>
              <span className="sc-eyebrow">A MENU FOR EVERY MOOD</span>
              <h2 id="sc-menu-heading">
                What sounds <em>good?</em>
              </h2>
            </div>
            <p>
              Five dishes. Plenty of possibilities.
              <br />
              Pick a plate, then make it yours.
            </p>
          </div>

          <div className="sc-menu-tools">
            <label className="sc-search">
              <Search size={18} />
              <input
                type="search"
                aria-label="Search the menu"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Pizza, paneer, something sweet…"
              />
              {query && (
                <button aria-label="Clear search" onClick={() => setQuery('')}>
                  <X size={16} />
                </button>
              )}
            </label>
            <label className="sc-veg-toggle">
              <input
                type="checkbox"
                checked={vegOnly}
                onChange={e => setVegOnly(e.target.checked)}
              />
              <Leaf size={15} /> Veg only
            </label>
            <button
              className={`sc-filter-button ${filtersOpen ? 'sc-active' : ''}`}
              aria-expanded={filtersOpen}
              aria-controls="sc-filter-controls"
              onClick={() => setFiltersOpen(v => !v)}
            >
              <SlidersHorizontal size={17} /> Refine
            </button>
          </div>

          <div className="sc-categories" role="group" aria-label="Menu categories">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                className={category === c.id ? 'sc-selected' : ''}
                aria-pressed={category === c.id}
                onClick={() => setCategory(c.id)}
              >
                {c.title}
                <span>
                  {c.id === 'all'
                    ? DISHES.length
                    : DISHES.filter(d => d.subCategory === c.id).length}
                </span>
              </button>
            ))}
          </div>

          {filtersOpen && (
            <div id="sc-filter-controls" className="sc-filter-controls">
              <label>
                Starting price
                <select
                  aria-label="Maximum starting price"
                  value={cap}
                  onChange={e => setCap(e.target.value)}
                >
                  <option value="all">Any price</option>
                  <option value="200">Up to ₹200</option>
                  <option value="300">Up to ₹300</option>
                  <option value="400">Up to ₹400</option>
                </select>
              </label>
              <label>
                Sort the menu
                <select
                  aria-label="Sort dishes"
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                >
                  <option value="featured">Menu order</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                  <option value="prep">Catalogue prep: shortest first</option>
                </select>
              </label>
              <label className="sc-saved-toggle">
                <input
                  type="checkbox"
                  checked={savedOnly}
                  onChange={e => setSavedOnly(e.target.checked)}
                />{' '}
                Only my favourites
              </label>
              <button className="sc-text-button" onClick={resetFilters}>
                Reset all
              </button>
              <small>Starting prices exclude larger portions and extras.</small>
            </div>
          )}

          <div className="sc-results">
            <span>
              {filtered.length} {filtered.length === 1 ? 'dish' : 'dishes'} to fall
              for{savedOnly ? ' · your favourites' : ''}
            </span>
            <span>All prices in INR · customisation available</span>
          </div>

          <DepartmentOffers department="food"/>
<div className="sc-menu-grid">
            {filtered.map((d, index) => (
              <article
                className="sc-dish-card"
                key={d.id}
                style={{ '--sc-delay': `${index * 60}ms` }}
              >
                <div className={`sc-dish-visual sc-${d.colour}`}>
                  <span className="sc-card-tag">{d.tag}</span>
                  <button
                    className={`sc-heart ${favorites.includes(d.id) ? 'sc-saved' : ''}`}
                    aria-label={`${favorites.includes(d.id) ? 'Unsave' : 'Save'} ${d.title}`}
                    aria-pressed={favorites.includes(d.id)}
                    onClick={() => favorite(d.id)}
                  >
                    <Heart
                      size={19}
                      fill={favorites.includes(d.id) ? 'currentColor' : 'none'}
                    />
                  </button>
                  <button
                    className="sc-art-button"
                    aria-label={`View and customise ${d.title}`}
                    onClick={() => setCustomizer({ config: baseConfig(d) })}
                   disabled={d.inStock === false}>
                    <DishArt dish={d} />
                  </button>
                  <span className="sc-illustrated">REPRESENTATIVE PHOTO</span>
                </div>
                <div className="sc-dish-copy">
                  <div className="sc-dish-meta">
                    <span className="sc-diet">
                      <span
                        className={d.isVeg ? 'sc-veg-dot' : 'sc-nonveg-dot'}
                      />
                      {d.sellerProduct ? d.details?.diet || 'DIET NOT SPECIFIED' : d.isVeg ? 'VEG' : 'NON-VEG'}
                    </span>
                    <span>
                      <Clock size={12} /> {d.prepTime} prep*
                    </span>
                  </div>
                  <h3>{d.title}</h3>
                  <p>{d.subtitle}</p>
                  <div className="sc-card-bottom">
                    <div>
                      <small>STARTS AT</small>
                      <strong>{money(d.price)}</strong>
                    </div>
                    <button
                      className="sc-add"
                      aria-label={`Customise ${d.title}`}
                      onClick={() => setCustomizer({ config: baseConfig(d) })}
                     disabled={d.inStock === false}>
                      Make it yours <Plus size={17} />
                    </button>
                  </div>
                <DeliveryEstimate department="food" product={d}/></div>
              </article>
            ))}
          </div>

          {!filtered.length && (
            <div className="sc-empty">
              <Utensils size={34} />
              <h3>No dishes on this table yet.</h3>
              <p>Try a different search or clear your filters.</p>
              <button className="sc-primary" onClick={resetFilters}>
                Explore the full menu <ArrowRight size={17} />
              </button>
            </div>
          )}

          <p className="sc-catalogue-note">
            *Prep times are catalogue estimates, not live availability or delivery
            promises. Illustrations show representative servings.
          </p>
        </section>

        <section
          className="sc-pairings-section"
          ref={edits}
          aria-labelledby="sc-pairings-heading"
        >
          <div className="sc-section-head">
            <div>
              <span className="sc-eyebrow">GOOD THINGS COME TOGETHER</span>
              <h2 id="sc-pairings-heading">
                Better <em>together.</em>
              </h2>
            </div>
            <p>
              Two plates, one good idea.
              <br />
              Standard portions. No hidden bundle markup.
            </p>
          </div>
          <div className="sc-pairings">
            {PAIRINGS.filter(pair=>pair.ids.every(id=>DISHES.some(d=>d.id===id))).map(pair => (
              <article
                className={`sc-pairing sc-${pair.colour}`}
                key={pair.title}
              >
                <div className="sc-pair-art">
                  {pair.ids.map(id => (
                    <DishArt
                      dish={DISHES.find(d => d.id === id)}
                      key={id}
                    />
                  ))}
                </div>
                <div>
                  <span className="sc-eyebrow">{pair.label}</span>
                  <h3>{pair.title}</h3>
                  <p>{pair.description}</p>
                  <button
                    className="sc-pair-button"
                    onClick={() => addPairing(pair)}
                  >
                    Add both ·{' '}
                    {money(
                      pair.ids.reduce(
                        (sum, id) => sum + DISHES.find(d => d.id === id).price,
                        0
                      )
                    )}
                    <ArrowUpRight size={18} />
                  </button>
                  <small>
                    Standard portions & flavours · extras optional in your order
                  </small>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="sc-how">
          <div>
            <span className="sc-eyebrow">THE SUPPER CLUB WAY</span>
            <h2>
              Your taste.
              <br />
              <em>Your table.</em>
            </h2>
          </div>
          <div className="sc-how-steps">
            <article>
              <span>01</span>
              <h3>Follow your cravings.</h3>
              <p>
                Browse the menu, find a favourite and save it for another evening.
              </p>
            </article>
            <article>
              <span>02</span>
              <h3>Make it personal.</h3>
              <p>
                Choose portions, spice levels and extras. Every choice stays with
                your meal.
              </p>
            </article>
            <article>
              <span>03</span>
              <h3>Take a seat.</h3>
              <p>
                Review your order and explore the demo checkout. No real payment or
                delivery.
              </p>
            </article>
          </div>
        </section>
      </main>

      <footer className="sc-footer">
        <div className="sc-footer-brand">
          supper<em>club</em>
          <span>GOOD FOOD IS A LITTLE KIND OF HAPPY.</span>
        </div>
        <div>
          <button onClick={onBackToLanding}>
            Explore EdgeMart <ArrowUpRight size={14} />
          </button>
          <button onClick={() => setPanel('guide')}>
            Ordering & ingredients guide
          </button>
          <small>EdgeMart food catalogue · Demo ordering experience</small>
        </div>
        <span className="sc-footer-star" aria-hidden="true">
          
        </span>
      </footer>

      {count > 0 && !panel && !customizer && !checkout && (
        <button className="sc-order-tray" onClick={() => setPanel('cart')}>
          <span>
            <ShoppingBag size={19} />
            <b>
              {count} {count === 1 ? 'meal' : 'meals'}
            </b>
            <small>Your evening, sorted.</small>
          </span>
          <span>
            View my order <strong>{money(total)}</strong>
            <ArrowRight size={17} />
          </span>
        </button>
      )}

      {toast && (
        <div className="sc-toast" role="status">
          <Check size={17} />
          <span>{toast}</span>
          <button aria-label="Dismiss notification" onClick={() => setToast('')}>
            <X size={15} />
          </button>
        </div>
      )}

      {customizer && (
        <Customizer
          key={customizer.editingKey || customizer.config.id}
          config={customizer.config}
          editing={Boolean(customizer.editingKey)}
          onConfirm={confirm}
          onClose={() => {
            setCustomizer(null);
            if (customizer.editingKey) setPanel('cart');
          }}
        />
      )}

      {panel === 'cart' && (
        <Modal
          key="cart"
          title="Your evening order"
          drawer
          onClose={() => setPanel(null)}
        >
          {!cart.length ? (
            <div className="sc-empty">
              <ShoppingBag size={36} />
              <h3>There's a seat for your favourites.</h3>
              <p>Add something delicious to get started.</p>
              <button
                className="sc-primary"
                onClick={() => {
                  setPanel(null);
                  scrollTo(menu);
                }}
              >
                Explore the menu <ArrowRight size={17} />
              </button>
            </div>
          ) : (
            <>
              <div className="sc-cart-intro">
                <span>
                  {count} {count === 1 ? 'meal' : 'meals'} · {cart.length} custom{' '}
                  {cart.length === 1 ? 'selection' : 'selections'}
                </span>
                <p>Every portion, spice level and extra is saved here.</p>
              </div>
              <div className="sc-cart-lines">
                {cart.map(c => {
                  const d = dishFor(c);
                  const key = configKey(c);
                  return (
                    <article className="sc-cart-line" key={key}>
                      <div className={`sc-cart-art sc-${d.colour}`}>
                        <DishArt dish={d} />
                      </div>
                      <div className="sc-cart-line-copy">
                        <div className="sc-line-heading">
                          <h3>{d.title}</h3>
                          <button
                            className="sc-icon"
                            aria-label={`Remove ${d.title}, ${c.spice}`}
                            onClick={() =>
                              setCart(prev =>
                                prev.filter(l => configKey(l) !== key)
                              )
                            }
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <p>
                          {d.customizations.portions[c.portion].label} · {c.spice}
                        </p>
                        {c.addons.length > 0 && (
                          <p>
                            +{' '}
                            {c.addons
                              .map(i => d.customizations.addons[i].name)
                              .join(', ')}
                          </p>
                        )}
                        {c.note && (
                          <p className="sc-line-note">
                            Kitchen note: {c.note}
                          </p>
                        )}
                        <button
                          className="sc-text-button"
                          aria-label={`Edit ${d.title}, ${c.spice}`}
                          onClick={() => {
                            setPanel(null);
                            setCustomizer({
                              config: { ...c, addons: [...c.addons] },
                              editingKey: key,
                            });
                          }}
                        >
                          Edit meal
                        </button>
                        <div className="sc-line-price">
                          <Quantity
                            value={c.quantity}
                            label={`${d.title}, ${c.spice}`}
                            onChange={n => adjust(key, n)}
                          />
                          <span>
                            <strong>
                              {money(unitPrice(c) * c.quantity)}
                            </strong>
                            <small>{money(unitPrice(c))} per meal</small>
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="sc-cart-summary">
                <div>
                  <span>Food subtotal</span>
                  <strong>{money(total)}</strong>
                </div>
                <p>
                  Delivery fees, tips and discounts appear in the shared demo
                  checkout. Your meals stay saved if you leave it.
                </p>
                <button
                  className="sc-primary sc-full"
                  onClick={beginCheckout}
                >
                  Continue to checkout <ArrowRight size={18} />
                </button>
                <small>No real order, payment or delivery is placed.</small>
              </div>
            </>
          )}
        </Modal>
      )}

      {panel === 'guide' && (
        <Modal
          key="guide"
          title="A little ordering guide"
          onClose={() => setPanel(null)}
        >
          <div className="sc-guide">
            <article>
              <ChefHat />
              <div>
                <h3>Make it your kind of meal.</h3>
                <p>
                  The starting price covers the first portion. Larger portions and
                  selected extras change the price. Pairings add two standard
                  dishes at their listed prices.
                </p>
              </div>
            </article>
            <article>
              <ShoppingBag />
              <div>
                <h3>Keep every choice.</h3>
                <p>
                  Different portions, spice levels, extras and kitchen notes create
                  separate cart entries. Identical choices combine, with a limit
                  of 20 of each customised meal. Edit or remove any meal in your
                  order.
                </p>
              </div>
            </article>
            <article>
              <Leaf />
              <div>
                <h3>Know your ingredients.</h3>
                <p>
                  Vegetarian labels and listed base-dish allergens come from the
                  catalogue. Add-on ingredients are not fully specified. Kitchen
                  notes are requests and need retailer confirmation.
                </p>
              </div>
            </article>
            <article>
              <Clock />
              <div>
                <h3>Take the times as estimates.</h3>
                <p>
                  Prep times come from the catalogue. This page has no live kitchen,
                  stock or delivery service. Dish artwork is representative, not a
                  photograph of the delivered serving.
                </p>
              </div>
            </article>
            <article>
              <Heart />
              <div>
                <h3>Come back to your favourites.</h3>
                <p>
                  Your customised meals and favourites are saved in this browser
                  when local storage is available. They do not sync to another
                  device or account.
                </p>
              </div>
            </article>
            <article>
              <HelpCircle />
              <div>
                <h3>A demonstration of checkout.</h3>
                <p>
                  The existing five-step checkout lets you explore address, food
                  preferences, payment and tracking screens. Its timing, delivery,
                  payment and compliance information is demonstration data. No real
                  order is sent and your basket is preserved when you close or
                  cancel.
                </p>
              </div>
            </article>
          </div>
        </Modal>
      )}

      {checkout && <CheckoutLifecycle
              item={checkout}
              quantity={1} onComplete={() => { setCart([]); }}
              onBack={() => {
                setCheckout(null);
                setPanel('cart');
              }}
              onClose={() => setCheckout(null)}
            />}
    </div>
  );
}
