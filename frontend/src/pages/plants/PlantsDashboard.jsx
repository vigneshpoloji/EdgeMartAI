import useCatalogueCart from '../../sellers/useCatalogueCart';
import useBuyerCatalogue from '../../sellers/useBuyerCatalogue';
import { DepartmentOffers, DeliveryEstimate } from '../../components/ShoppingBenefits';
import { DepartmentPhoto, ProductPhoto } from '../../components/DepartmentPhoto';
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, CircleHelp, Droplets, Heart, Leaf, Minus, PawPrint, Plus, Search, ShoppingBag, SlidersHorizontal, Sprout, Sun, Trash2, X } from 'lucide-react';
import {
  PLANTS_PRODUCTS,
  NURSERY_CLUB_PLANS,
  POT_OPTIONS,
  SOIL_ADDONS,
} from '../../data';
import CheckoutLifecycle from '../../components/CheckoutLifecycle';
import './plants.css';

const STORAGE = 'edgemart-root-ritual-v1';

const money = n =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);

const motion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth';

const SOURCE = {
  care: 'https://caldwell.ces.ncsu.edu/news/indoor-plant-care-101/',
  spiderPets:
    'https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants/spider-plant',
  snakePets:
    'https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants/snake-plant',
};

const PROFILES = {
  p1: {
    title: 'Bambino fiddle-leaf fig',
    caption: 'Big character. Beautiful, sculptural leaves.',
    image: '/images/products/pl3.jpg',
    tag: 'The statement plant',
    collection: 'statement',
    lights: ['bright'],
    light: 'Bright, indirect light',
    water: 'Moist, well-drained soil; avoid overwatering.',
    lowWater: false,
    petSafe: false,
    source: 'https://plants.ces.ncsu.edu/plants/ficus-lyrata/',
    petSource: 'https://plants.ces.ncsu.edu/plants/ficus-lyrata/',
  },
  p2: {
    title: 'Monstera deliciosa',
    caption: 'A little tropical drama for your favourite corner.',
    image: '/images/products/pl1.jpg',
    tag: 'Sculptural foliage',
    collection: 'statement',
    lights: ['bright', 'medium'],
    light: 'Moderate, filtered light',
    water: 'Let the top quarter to third of the soil dry between waterings.',
    lowWater: false,
    petSafe: false,
    source: 'https://plants.ces.ncsu.edu/plants/monstera-deliciosa/',
    petSource: 'https://plants.ces.ncsu.edu/plants/monstera-deliciosa/',
  },
  p3: {
    title: 'Golden snake plant',
    caption: 'Upright lines. A slower watering rhythm.',
    image: '/images/products/ritual-snake.jpg',
    tag: 'Low-water rhythm',
    collection: 'low-water',
    lights: ['bright', 'medium', 'lower'],
    light: 'Part sun; tolerates lower light',
    water: 'Let the soil dry between waterings; avoid standing water.',
    lowWater: true,
    petSafe: false,
    source: 'https://plants.ces.ncsu.edu/plants/dracaena-trifasciata/',
    petSource: SOURCE.snakePets,
  },
  p4: {
    title: 'Variegated spider plant',
    caption: 'Soft, arching leaves with a playful trailing habit.',
    image: '/images/products/ritual-spider.jpg',
    tag: 'The trailing favourite',
    collection: 'trailing',
    lights: ['bright', 'medium', 'lower'],
    light: 'Medium, indirect light; tolerates shade',
    water: 'Prefers moist, well-drained soil. Reduce watering in winter.',
    lowWater: false,
    petSafe: true,
    source:
      'https://plants.ces.ncsu.edu/plants/chlorophytum-comosum/common-name/spiderplant/',
    petSource: SOURCE.spiderPets,
  },
};

const nativeCatalogue = PLANTS_PRODUCTS.map(p => ({
  ...p,
  ...PROFILES[p.id],
}));

const POTS = [
  {
    id: 'nursery',
    name: 'Plant only · no planter upgrade',
    price: 0,
    style: 'nursery',
  },
  ...POT_OPTIONS.map((p, i) => ({
    ...p,
    style: ['clay', 'ceramic', 'selfwater'][i],
  })),
];

const COLLECTIONS = [
  { id: 'all', name: 'All plants' },
  { id: 'statement', name: 'Statement foliage' },
  { id: 'low-water', name: 'Less frequent watering' },
  { id: 'trailing', name: 'Trailing greens' },
];

const CLUB_PERKS = {
  club_starter: [
    'One curated plant each month',
    'Ceramic planter with drainage tray',
    'Monthly nutrient stick pack',
  ],
  club_enthusiast: [
    'Two plants each month',
    'Terracotta or self-watering planters',
    'Neem spray and potting mix',
  ],
};


const potFor = c => POTS.find(p => p.id === c.pot);
const keyFor = c => JSON.stringify([c.id, c.pot, [...c.addons].sort()]);

const baseChoice = plant => ({
  id: plant.id,
  pot: 'nursery',
  addons: [],
  quantity: 1,
});



function today() {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = type => parts.find(p => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

const dateLabel = date =>
  new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00+05:30`));

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const d = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(d.getTime()) &&
    d.toISOString().slice(0, 10) === value &&
    value <= today()
  );
}



function PotArt({ style, compact = false }) { return <ProductPhoto department="plants" src="/images/products/pl1.jpg" label={style + ' planter'} className={compact ? 'rr-pot-art rr-pot-compact' : 'rr-pot-art'}/>; }

function PlantImage({plant,className='',eager=false,...props}) {const [failed,setFailed]=useState(false);const src=plant?.image;useEffect(()=>setFailed(false),[src]);return failed || !src ? <div className={className || 'rr-plant-photo'}><span className="em-photo-unavailable">Photo not available</span></div> : <img src={src} alt={plant?.name||'Plant photograph'} className={className} loading={eager?'eager':'lazy'} {...props} onError={()=>setFailed(true)}/>;}

function Modal({ title, children, onClose, drawer = false, bare = false }) {
  const ref = useRef(null),
    close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const previous = document.activeElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();

    const onKey = e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close.current();
      }
      if (e.key !== 'Tab') return;
      const elements = [
        ...ref.current.querySelectorAll(
          'button,input,select,textarea,a[href],[tabindex="0"]'
        ),
      ].filter(n => !n.disabled && n.getClientRects().length);
      const first = elements[0],
        last = elements[elements.length - 1];

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
      className={`rr-overlay ${drawer ? 'rr-overlay-drawer' : ''}`}
      onClick={onClose}
    >
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`rr-modal ${drawer ? 'rr-drawer' : ''} ${bare ? 'rr-modal-bare' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {!bare && (
          <header className="rr-modal-head">
            <div>
              <span className="rr-eyebrow">ROOT & RITUAL / EDGEMART</span>
              <h2>{title}</h2>
            </div>
            <button
              className="rr-icon"
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

function Quantity({ quantity, label, onChange }) {
  return (
    <div className="rr-quantity">
      <button
        type="button"
        disabled={quantity <= 1}
        aria-label={`Decrease ${label}`}
        onClick={() => onChange(-1)}
      >
        <Minus size={14} />
      </button>
      <span aria-label={`${label} quantity`}>{quantity}</span>
      <button
        type="button"
        disabled={quantity >= 20}
        aria-label={`Increase ${label}`}
        onClick={() => onChange(1)}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

function CareFacts({ plant }) {
  return (
    <div className="rr-care-facts">
      <div>
        <Sun size={17} />
        <span>
          <small>LIGHT</small>
          {plant.light}
        </span>
      </div>
      <div>
        <Droplets size={17} />
        <span>
          <small>WATER</small>
          {plant.water}
        </span>
      </div>
      <div>
        <PawPrint size={17} />
        <span>
          <small>CATS & DOGS</small>
          {plant.petSafe === null ? 'Classification not supplied' : plant.petSafe ? 'Listed as non-toxic' : 'Toxic if ingested'}
          {plant.petSource && <a href={plant.petSource} target="_blank" rel="noreferrer">
            View classification <ArrowUpRight size={11} />
          </a>}
        </span>
      </div>
    </div>
  );
}

function Customizer({
  config,
  editing,
  onClose,
  onConfirm,
  onShelf,
  inShelf,
}) {
  const PLANTS = useBuyerCatalogue('plants',nativeCatalogue,'Plants');
  const {plantFor,unitPrice,loadSaved} = useMemo(()=>catalogueTools(PLANTS),[PLANTS]);

  const [choice, setChoice] = useState(config),
    [error, setError] = useState('');
  const plant = plantFor(choice),
    pot = potFor(choice),
    extras = choice.addons.reduce(
      (sum, id) => sum + SOIL_ADDONS.find(a => a.id === id).price,
      0
    );

  const change = value => {
    setChoice(prev => ({
      ...prev,
      ...value,
    }));
    setError('');
  };

  if (!plant) return <Modal title="Plant unavailable" onClose={onClose}><p>This plant is no longer available. Close this panel to browse the current catalogue.</p></Modal>;

  return (
    <Modal
      title={editing ? `Edit ${plant.title}` : `Meet ${plant.title}`}
      onClose={onClose}
    >
      <div className="rr-detail-grid">
        <aside className="rr-detail-about">
          <PlantImage plant={plant} eager />
          <p className="rr-reference">
            Species inspiration. Actual growth, markings and planters vary.
          </p>
          <span className="rr-eyebrow">{plant.botanicalName}</span>
          <h3>{plant.title}</h3>
          <p>{plant.caption}</p>
          <CareFacts plant={plant} />
          <dl className="rr-specs">
            <div>
              <dt>Catalogue height</dt>
              <dd>{plant.specs['Plant Height']}</dd>
            </div>
            <div>
              <dt>Catalogue pot size</dt>
              <dd>{plant.specs['Pot Diameter']}</dd>
            </div>
          </dl>
          <a
            className="rr-source-link"
            href={plant.source}
            target="_blank"
            rel="noreferrer"
          >
            Species care · NC State Extension <ArrowUpRight size={12} />
          </a>
          <button
            className="rr-secondary rr-full"
            disabled={inShelf}
            onClick={() => onShelf(plant.id)}
          >
            <Sprout size={16} />
            {inShelf
              ? 'Already on my care shelf'
              : 'I own this plant · add to care shelf'}
          </button>
        </aside>

        <form
          className="rr-custom-controls"
          onSubmit={e => {
            e.preventDefault();
            const message = onConfirm(choice);
            if (message) setError(message);
          }}
        >
          <span className="rr-eyebrow">A LITTLE PERSONAL TOUCH</span>
          <h3>Find its perfect home.</h3>
          <fieldset>
            <legend>
              <span>01</span> Choose your planter
            </legend>
            <div className="rr-pot-options">
              {POTS.map(p => (
                <label
                  key={p.id}
                  className={`rr-pot-option ${choice.pot === p.id ? 'rr-chosen' : ''}`}
                >
                  <input
                    type="radio"
                    name="planter"
                    checked={choice.pot === p.id}
                    onChange={() =>
                      change({
                        pot: p.id,
                      })
                    }
                  />
                  <PotArt style={p.style} compact />
                  <span>
                    {p.name}
                    <b>{p.price ? `+${money(p.price)}` : 'No extra charge'}</b>
                  </span>
                </label>
              ))}
            </div>
            <p className="rr-fine">
              Planter drawings are representative. The photo shows the plant
              species, not your selected planter.
            </p>
          </fieldset>
          <fieldset>
            <legend>
              <span>02</span> The little essentials <small>Optional</small>
            </legend>
            {SOIL_ADDONS.map(a => (
              <label
                className={`rr-addon ${choice.addons.includes(a.id) ? 'rr-chosen' : ''}`}
                key={a.id}
              >
                <input
                  type="checkbox"
                  checked={choice.addons.includes(a.id)}
                  onChange={e =>
                    change({
                      addons: e.target.checked
                        ? [...choice.addons, a.id]
                        : choice.addons.filter(id => id !== a.id),
                    })
                  }
                />
                <span>{a.name}</span>
                <b>+{money(a.price)}</b>
              </label>
            ))}
            <p className="rr-fine">
              Extras are optional supplies. Follow their product labels and your
              plant's needs.
            </p>
          </fieldset>
          <div className="rr-price-breakdown">
            <div>
              <span>Plant</span>
              <span>{money(plant.price)}</span>
            </div>
            <div>
              <span>Planter upgrade</span>
              <span>{money(pot.price)}</span>
            </div>
            <div>
              <span>Selected extras</span>
              <span>{money(extras)}</span>
            </div>
          </div>
          <div className="rr-custom-total">
            <div>
              <small>Per customised plant</small>
              <strong>{money(unitPrice(choice))}</strong>
            </div>
            <Quantity
              quantity={choice.quantity}
              label="plant"
              onChange={n =>
                change({
                  quantity: choice.quantity + n,
                })
              }
            />
          </div>
          {error && (
            <p role="alert" className="rr-error">
              {error}
            </p>
          )}
          <button type="submit" className="rr-primary rr-full">
            {editing ? 'Save plant changes' : 'Add to my basket'}
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

function catalogueTools(PLANTS) {
const plantFor = c => PLANTS.find(p => p.id === c.id);
const unitPrice = c =>
  plantFor(c).price +
  potFor(c).price +
  c.addons.reduce(
    (sum, id) => sum + SOIL_ADDONS.find(a => a.id === id).price,
    0
  );
function loadSaved() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE) || '{}'),
      cart = [],
      shelf = [];

    if (Array.isArray(raw.cart))
      raw.cart.forEach(c => {
        if (
          !c ||
          !plantFor(c) ||
          !potFor(c) ||
          !Array.isArray(c.addons) ||
          !c.addons.every(id => SOIL_ADDONS.some(a => a.id === id)) ||
          !Number.isInteger(c.quantity) ||
          c.quantity < 1 ||
          c.quantity > 20
        )
          return;

        const clean = {
          id: c.id,
          pot: c.pot,
          addons: [...new Set(c.addons)].sort(),
          quantity: c.quantity,
        };
        const existing = cart.find(l => keyFor(l) === keyFor(clean));
        if (existing)
          existing.quantity = Math.min(20, existing.quantity + clean.quantity);
        else cart.push(clean);
      });

    if (Array.isArray(raw.shelf))
      raw.shelf.forEach(c => {
        if (c && plantFor(c) && !shelf.some(s => s.id === c.id))
          shelf.push({
            id: c.id,
            nickname:
              typeof c.nickname === 'string' ? c.nickname.slice(0, 40) : '',
            note: typeof c.note === 'string' ? c.note.slice(0, 240) : '',
            checked: validDate(c.checked) ? c.checked : null,
          });
      });

    return {
      cart,
      shelf,
      favorites: Array.isArray(raw.favorites)
        ? [...new Set(raw.favorites.filter(id => PLANTS.some(p => p.id === id)))]
        : [],
    };
  } catch {
    return {
      cart: [],
      shelf: [],
      favorites: [],
    };
  }
}
return {plantFor,unitPrice,loadSaved};
}
export default function PlantsDashboard({ onBackToLanding }) {
  const PLANTS = useBuyerCatalogue('plants',nativeCatalogue,'Plants');
  const {plantFor,unitPrice,loadSaved} = useMemo(()=>catalogueTools(PLANTS),[PLANTS]);

  const [initial] = useState(loadSaved),
    [cart, setCart] = useCatalogueCart(initial.cart, PLANTS),
    [favorites, setFavorites] = useState(initial.favorites),
    [shelf, setShelf] = useState(initial.shelf);
  const [query, setQuery] = useState(()=>new URLSearchParams(window.location.search).get('q') || ''),
    [category, setCategory] = useState('all'),
    [light, setLight] = useState('any'),
    [lowWater, setLowWater] = useState(false),
    [pets, setPets] = useState(false),
    [savedOnly, setSavedOnly] = useState(false),
    [cap, setCap] = useState('all'),
    [sort, setSort] = useState('featured'),
    [filtersOpen, setFiltersOpen] = useState(false);
  const [panel, setPanel] = useState(null),
    [customizer, setCustomizer] = useState(null),
    [checkout, setCheckout] = useState(null),
    [toast, setToast] = useState(''),
    [finder, setFinder] = useState({
      light: 'any',
      water: 'any',
      pets: false,
    });

  const catalog = useRef(null),
    shelfSection = useRef(null),
    club = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE,
        JSON.stringify({
          cart,
          favorites,
          shelf,
        })
      );
    } catch {
      /* The page remains usable without browser storage. */
    }
  }, [cart, favorites, shelf]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const scrollTo = ref =>
    ref.current?.scrollIntoView({
      behavior: motion(),
      block: 'start',
    });

  const reset = () => {
    setQuery('');
    setCategory('all');
    setLight('any');
    setLowWater(false);
    setPets(false);
    setSavedOnly(false);
    setCap('all');
    setSort('featured');
  };

  const count = cart.reduce((sum, c) => sum + c.quantity, 0),
    subtotal = cart.reduce((sum, c) => sum + unitPrice(c) * c.quantity, 0);

  const visible = useMemo(() => {
    const result = PLANTS.filter(
      p =>
        (category === 'all' || p.collection === category) &&
        (light === 'any' || p.lights.includes(light)) &&
        (!lowWater || p.lowWater) &&
        (!pets || p.petSafe) &&
        (!savedOnly || favorites.includes(p.id)) &&
        (cap === 'all' || p.price <= Number(cap)) &&
        `${p.name} ${p.title} ${p.botanicalName}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())
    );

    if (sort === 'price-low') result.sort((a, b) => a.price - b.price);
    if (sort === 'price-high') result.sort((a, b) => b.price - a.price);
    if (sort === 'name') result.sort((a, b) => a.title.localeCompare(b.title));
    return result;
  }, [category, light, lowWater, pets, savedOnly, cap, query, sort, favorites, PLANTS]);

  const finderMatches = PLANTS.filter(
    p =>
      (finder.light === 'any' || p.lights.includes(finder.light)) &&
      (finder.water === 'any' || p.lowWater) &&
      (!finder.pets || p.petSafe)
  );

  const toggleFavorite = id =>
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
    );

  function addShelf(id) {
    if (shelf.some(p => p.id === id)) return;
    setShelf(prev => [
      ...prev,
      {
        id,
        nickname: '',
        note: '',
        checked: null,
      },
    ]);
    setToast(
      'Added to your care shelf. This records a plant you own; it does not place an order.'
    );
  }

  const updateShelf = (id, value) =>
    setShelf(prev =>
      prev.map(p =>
        p.id === id
          ? {
              ...p,
              ...value,
            }
          : p
      )
    );

  function confirm(choice) {
    const c = {
        ...choice,
        addons: [...choice.addons].sort(),
      },
      key = keyFor(c),
      others = cart.filter(l => keyFor(l) !== customizer?.editingKey),
      match = others.find(l => keyFor(l) === key);

    if ((match?.quantity || 0) + c.quantity > 20)
      return 'You can keep up to 20 of the same plant and bundle. Reduce the quantity before saving.';

    setCart(
      match
        ? others.map(l =>
            keyFor(l) === key
              ? {
                  ...l,
                  quantity: l.quantity + c.quantity,
                }
              : l
          )
        : [...others, c]
    );
    setCustomizer(null);
    if (customizer?.editingKey)
      setPanel({
        kind: 'cart',
      });
    setToast(
      customizer?.editingKey
        ? 'Your plant bundle is updated.'
        : `${plantFor(c).title} added to your basket.`
    );
    return null;
  }

  function checkoutCart() {
    if (!cart.length) return;
    const details = cart.map(
      c =>
        `${c.quantity} × ${plantFor(c).name}; ${potFor(c).name}${c.addons.length ? `; extras: ${c.addons.map(id => SOIL_ADDONS.find(a => a.id === id).name).join(', ')}` : ''}`
    );
    setCheckout({
      lines: cart.map(c => ({ id: c.id, name: plantFor(c).name, category: 'plants', image: plantFor(c).image, price: unitPrice(c), quantity: c.quantity, variant: [potFor(c).name, ...c.addons.map(id => SOIL_ADDONS.find(a => a.id === id).name)].join(' · '), options: { pot: c.pot, addons: c.addons } })),
      id: 'root-ritual-basket',
      name: details.join(' | '),
      category: 'plants',
      price: subtotal,
      plantMeta: {
        sunlight: cart
          .map(c => `${plantFor(c).title}: ${plantFor(c).light}`)
          .join(' / '),
        watering: cart
          .map(c => `${plantFor(c).title}: ${plantFor(c).water}`)
          .join(' / '),
      },
    });
    setPanel(null);
  }

  return (
    <div className="rr-page">
      <div className="rr-topbar">
        <span>GREEN SPACES. SMALL RITUALS.</span>
        <button
          onClick={() =>
            setPanel({
              kind: 'guide',
            })
          }
        >
          A little care goes a long way <ArrowUpRight size={12} />
        </button>
      </div>

      <header className="rr-header">
        <button
          className="rr-logo"
          aria-label="Root and Ritual home"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: motion(),
            })
          }
        >
          <Sprout size={30} />
          <span>
            root <i>&</i> ritual
            <small>THE BOTANICAL EDIT / EDGEMART</small>
          </span>
        </button>
        <nav className="rr-nav" aria-label="Plants navigation">
          <button
            onClick={() => {
              setSavedOnly(false);
              scrollTo(catalog);
            }}
          >
            The nursery
          </button>
          <button
            onClick={() =>
              setPanel({
                kind: 'finder',
              })
            }
          >
            Find your plant
          </button>
          <button onClick={() => scrollTo(shelfSection)}>
            My care shelf <span>{shelf.length}</span>
          </button>
          <button onClick={() => scrollTo(club)}>The plant club</button>
        </nav>
        <div className="rr-header-actions">
          <button
            className="rr-icon"
            aria-label={`My favourites, ${favorites.length} plants`}
            onClick={() => {
              reset();
              setSavedOnly(true);
              scrollTo(catalog);
            }}
          >
            <Heart size={20} />
            {favorites.length > 0 && <b>{favorites.length}</b>}
          </button>
          <button
            className="rr-basket-button"
            aria-label={`My basket, ${count} plants`}
            onClick={() =>
              setPanel({
                kind: 'cart',
              })
            }
          >
            <ShoppingBag size={18} />
            <span>Basket</span>
            <b>{count}</b>
          </button>
        </div>
      </header>

      <main>
        <section className="rr-hero">
          <div className="rr-hero-copy">
            <span className="rr-eyebrow">
              <span /> A SLOWER KIND OF LIVING
            </span>
            <h1>
              Make room
              <br />
              for something
              <br />
              <em>living.</em>
            </h1>
            <p>
              A sunlit corner. A leafy companion. A simple daily ritual. Bring
              a little of the outside into the place you call home.
            </p>
            <div className="rr-hero-buttons">
              <button
                className="rr-primary"
                onClick={() => {
                  reset();
                  scrollTo(catalog);
                }}
              >
                Explore the nursery <ArrowUpRight size={18} />
              </button>
              <button
                className="rr-text-button"
                onClick={() =>
                  setPanel({
                    kind: 'finder',
                  })
                }
              >
                Find my plant <ArrowRight size={15} />
              </button>
            </div>
            <div className="rr-hero-caption">
              <span>01 / THE BOTANICAL EDIT</span>
              <p>
                Four plant species.
                <br />
                A world of greener corners.
              </p>
            </div>
          </div>
          <div className="rr-hero-photo">
            <DepartmentPhoto department="plants" eager/>
            <span className="rr-photo-note">
              A LITTLE INSPIRATION FOR YOUR SPACE
            </span>
            
            <button
              className="rr-photo-caption"
              disabled={!PLANTS.length}
              onClick={() =>
                setCustomizer({
                  config: baseChoice((PLANTS[1] || PLANTS[0])),
                })
              }
            >
              <span>
                <small>THE SCULPTURAL COMPANION</small>
                <strong>{(PLANTS[1]||PLANTS[0])?.name||'Your nursery is getting ready'}</strong>
              </span>
              <ArrowUpRight size={23} />
            </button>
          </div>
        </section>

        <div className="rr-utility-strip">
          <button
            onClick={() =>
              setPanel({
                kind: 'finder',
              })
            }
          >
            <Sun size={22} />
            <span>
              <strong>Right plant, right corner.</strong>
              <small>Find a match for your light & routine.</small>
            </span>
            <ArrowUpRight size={15} />
          </button>
          <button
            onClick={() =>
              setPanel({
                kind: 'guide',
              })
            }
          >
            <Sprout size={23} />
            <span>
              <strong>A little care, made clearer.</strong>
              <small>Species details & thoughtful guidance.</small>
            </span>
            <ArrowUpRight size={15} />
          </button>
          <button onClick={() => scrollTo(shelfSection)}>
            <Heart size={22} />
            <span>
              <strong>Keep your own green journal.</strong>
              <small>Notes and soil checks, saved here.</small>
            </span>
            <ArrowUpRight size={15} />
          </button>
        </div>

        <section
          className="rr-catalog"
          ref={catalog}
          aria-labelledby="rr-catalog-heading"
        >
          <div className="rr-section-head">
            <div>
              <span className="rr-eyebrow">LIVING THINGS, LOVINGLY CHOSEN</span>
              <h2 id="rr-catalog-heading">
                Your next <em>green companion.</em>
              </h2>
            </div>
            <span className="rr-section-count">01 / THE NURSERY</span>
          </div>

          <div className="rr-catalog-bar">
            <div
              className="rr-collections"
              role="group"
              aria-label="Plant collections"
            >
              {COLLECTIONS.map(c => (
                <button
                  key={c.id}
                  className={category === c.id ? 'rr-selected' : ''}
                  aria-pressed={category === c.id}
                  onClick={() => setCategory(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <label className="rr-search">
              <Search size={17} />
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                aria-label="Search plants"
                placeholder="Find a plant…"
              />
              {query && (
                <button aria-label="Clear search" onClick={() => setQuery('')}>
                  <X size={15} />
                </button>
              )}
            </label>
          </div>

          <div className="rr-filter-row">
            <span>
              {visible.length} {visible.length === 1 ? 'plant' : 'plants'} to
              make room for{savedOnly ? ' · your favourites' : ''}
            </span>
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={pets}
                  onChange={e => setPets(e.target.checked)}
                />
                <PawPrint size={14} /> Non-toxic to cats & dogs
              </label>
              <button
                className="rr-refine"
                aria-expanded={filtersOpen}
                aria-controls="rr-filter-controls"
                onClick={() => setFiltersOpen(v => !v)}
              >
                <SlidersHorizontal size={16} /> Refine
              </button>
            </div>
          </div>

          {filtersOpen && (
            <div className="rr-filters" id="rr-filter-controls">
              <label>
                Light at home
                <select
                  aria-label="Filter by light"
                  value={light}
                  onChange={e => setLight(e.target.value)}
                >
                  <option value="any">Any light profile</option>
                  <option value="bright">Bright, indirect</option>
                  <option value="medium">Medium, filtered</option>
                  <option value="lower">Lower light tolerance</option>
                </select>
              </label>
              <label>
                Plant starting price
                <select
                  aria-label="Maximum plant price"
                  value={cap}
                  onChange={e => setCap(e.target.value)}
                >
                  <option value="all">Any price</option>
                  <option value="600">Up to ₹600</option>
                  <option value="1000">Up to ₹1,000</option>
                  <option value="1500">Up to ₹1,500</option>
                </select>
              </label>
              <label>
                Sort the nursery
                <select
                  aria-label="Sort plants"
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                >
                  <option value="featured">Nursery order</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                  <option value="name">Name: A–Z</option>
                </select>
              </label>
              <label className="rr-filter-check">
                <input
                  type="checkbox"
                  checked={lowWater}
                  onChange={e => setLowWater(e.target.checked)}
                />{' '}
                Less frequent watering
              </label>
              <label className="rr-filter-check">
                <input
                  type="checkbox"
                  checked={savedOnly}
                  onChange={e => setSavedOnly(e.target.checked)}
                />{' '}
                My favourites only
              </label>
              <button className="rr-text-button" onClick={reset}>
                Reset all
              </button>
              <p>
                Prices exclude optional planters and supplies. Light matches are
                browsing guidance, not a guarantee of growth.
              </p>
            </div>
          )}

          <DepartmentOffers department="plants"/>
<div className="rr-plant-grid">
            {visible.map((p, i) => (
              <article
                className="rr-plant-card"
                key={p.id}
                style={{
                  '--rr-delay': `${i * 60}ms`,
                }}
              >
                <div className="rr-plant-media">
                  <button
                    className="rr-image-button"
                    aria-label={`View ${p.title}`}
                    onClick={() =>
                      setCustomizer({
                        config: baseChoice(p),
                      })
                    }
                   disabled={p.inStock === false}>
                    <PlantImage plant={p} />
                  </button>
                  <span className="rr-plant-tag">{p.tag}</span>
                  <button
                    className={`rr-heart ${favorites.includes(p.id) ? 'rr-saved' : ''}`}
                    aria-label={`${favorites.includes(p.id) ? 'Unsave' : 'Save'} ${p.title}`}
                    aria-pressed={favorites.includes(p.id)}
                    onClick={() => toggleFavorite(p.id)}
                  >
                    <Heart
                      size={18}
                      fill={favorites.includes(p.id) ? 'currentColor' : 'none'}
                    />
                  </button>
                  <span className="rr-plant-number">
                    0{i + 1} / SPECIES INSPIRATION
                  </span>
                </div>
                <div className="rr-plant-copy">
                  <span className="rr-botanical">{p.botanicalName}</span>
                  <h3>{p.title}</h3>
                  <p>{p.caption}</p>
                  <div className="rr-card-care">
                    <span>
                      <Sun size={13} />
                      {p.light}
                    </span>
                    <span>
                      <Droplets size={13} />
                      {p.sellerProduct ? p.water : p.lowWater
                        ? 'Let soil dry between watering'
                        : 'Check soil before watering'}
                    </span>
                  </div>
                  <div className="rr-card-bottom">
                    <div>
                      <small>PLANT FROM</small>
                      <strong>{money(p.price)}</strong>
                    </div>
                    <button
                      className="rr-card-add"
                      aria-label={`Customise ${p.title}`}
                      onClick={() =>
                        setCustomizer({
                          config: baseChoice(p),
                        })
                      }
                     disabled={p.inStock === false}>
                      Choose planter <Plus size={16} />
                    </button>
                  </div>
                <DeliveryEstimate department="plants" product={p}/></div>
              </article>
            ))}
          </div>

          {!visible.length && (
            <div className="rr-empty">
              <Leaf size={34} />
              <h3>Let's find a different little green.</h3>
              <p>
                No plants match these choices. Adjust your filters or explore
                the full collection.
              </p>
              <button className="rr-primary" onClick={reset}>
                See all plants <ArrowRight size={17} />
              </button>
            </div>
          )}

          <p className="rr-catalog-note">
            Photos show species inspiration; actual size, markings and planters
            vary. Non-toxic classifications cover cats and dogs, not every pet.{' '}
            <a href={SOURCE.spiderPets} target="_blank" rel="noreferrer">
              ASPCA species guidance
            </a>
            .
          </p>
        </section>

        <section className="rr-finder-banner">
          <div>
            <span className="rr-eyebrow">NOT SURE WHERE TO START?</span>
            <h2>
              A plant that fits
              <br />
              <em>your kind of home.</em>
            </h2>
            <p>
              Tell us about your light, your watering rhythm and your
              four-legged companions. We'll narrow down this collection.
            </p>
            <button
              className="rr-primary"
              onClick={() =>
                setPanel({
                  kind: 'finder',
                })
              }
            >
              Find my green companion <ArrowRight size={17} />
            </button>
          </div>
          <div className="rr-finder-still">
            <PlantImage plant={(PLANTS[3] || PLANTS[0])} />
            <span className="rr-paper-note">
              <Sun size={22} />
              <strong>
                A little light.
                <br />A little attention.
              </strong>
              <small>Good things take their time.</small>
            </span>
          </div>
        </section>

        <section
          className="rr-shelf-section"
          ref={shelfSection}
          aria-labelledby="rr-shelf-heading"
        >
          <div className="rr-section-head">
            <div>
              <span className="rr-eyebrow">SMALL RITUALS, HAPPY LEAVES</span>
              <h2 id="rr-shelf-heading">
                Your personal <em>care shelf.</em>
              </h2>
            </div>
            <span className="rr-section-count">02 / MY GREEN JOURNAL</span>
          </div>

          <div className="rr-shelf-intro">
            <p>
              For plants you already own. Keep a nickname, a few notes and your
              last soil check. Adding to your basket doesn't add a plant here.
            </p>
            <label>
              Add a plant I own
              <select
                aria-label="Add a plant to care shelf"
                value=""
                onChange={e => {
                  if (e.target.value) addShelf(e.target.value);
                }}
              >
                <option value="">Choose a plant…</option>
                {PLANTS.map(p => (
                  <option
                    key={p.id}
                    value={p.id}
                    disabled={shelf.some(s => s.id === p.id)}
                  >
                    {p.title}
                    {shelf.some(s => s.id === p.id) ? ' · on shelf' : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {!shelf.length ? (
            <div className="rr-shelf-empty">
              <Sprout size={32} />
              <div>
                <h3>Every green corner starts somewhere.</h3>
                <p>
                  Add a plant you own above, or open its details in the nursery.
                </p>
              </div>
            </div>
          ) : (
            <div className="rr-shelf-grid">
              {shelf.filter(s=>plantFor(s)).map(s => {
                const p = plantFor(s);
                return (
                  <article className="rr-shelf-card" key={s.id}>
                    <div className="rr-shelf-card-head">
                      <PlantImage plant={p} />
                      <div>
                        <span className="rr-botanical">{p.botanicalName}</span>
                        <h3>{p.title}</h3>
                      </div>
                      <button
                        className="rr-icon"
                        aria-label={`Remove ${p.title} from care shelf`}
                        onClick={() =>
                          setShelf(prev => prev.filter(n => n.id !== s.id))
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <label>
                      My name for this plant
                      <input
                        aria-label={`Nickname for ${p.title}`}
                        value={s.nickname}
                        maxLength={40}
                        placeholder="e.g. My window companion"
                        onChange={e =>
                          updateShelf(s.id, {
                            nickname: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      My care notes
                      <textarea
                        aria-label={`Care notes for ${p.title}`}
                        value={s.note}
                        maxLength={240}
                        rows={2}
                        placeholder="A new leaf, a new spot, a little observation…"
                        onChange={e =>
                          updateShelf(s.id, {
                            note: e.target.value,
                          })
                        }
                      />
                    </label>
                    <div className="rr-soil-check">
                      <span>
                        <Droplets size={15} />
                        {s.checked
                          ? `Soil checked: ${dateLabel(s.checked)}`
                          : 'No soil check recorded yet'}
                      </span>
                      <button
                        className="rr-text-button"
                        onClick={() =>
                          updateShelf(s.id, {
                            checked: today(),
                          })
                        }
                        disabled={s.checked === today()}
                      >
                        {s.checked === today()
                          ? 'Checked today'
                          : 'I checked the soil today'}
                      </button>
                      {s.checked && (
                        <button
                          className="rr-clear-date"
                          aria-label={`Clear soil check for ${p.title}`}
                          onClick={() =>
                            updateShelf(s.id, {
                              checked: null,
                            })
                          }
                        >
                          Clear date
                        </button>
                      )}
                    </div>
                    <p className="rr-shelf-water">{p.water}</p>
                    <a
                      className="rr-source-link"
                      href={p.source}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Species care guide <ArrowUpRight size={12} />
                    </a>
                  </article>
                );
              })}
            </div>
          )}

          <p className="rr-catalog-note">
            This journal records checks, not watering instructions or scheduled
            reminders. Check the soil and each plant's needs before watering.
            Saved in this browser when storage is available.
          </p>
        </section>

        <section
          className="rr-club-section"
          ref={club}
          aria-labelledby="rr-club-heading"
        >
          <div className="rr-club-copy">
            <span className="rr-eyebrow">
              THE PLANT CLUB / CATALOGUE PREVIEW
            </span>
            <h2 id="rr-club-heading">
              A greener
              <br />
              <em>monthly ritual.</em>
            </h2>
            <p>
              Explore the two membership ideas in EdgeMart's catalogue. A
              little inspiration for growing your collection.
            </p>
            <span className="rr-demo-pill">
              Preview only · no subscription is activated
            </span>
          </div>
          <div className="rr-plan-grid">
            {NURSERY_CLUB_PLANS.map((p, i) => (
              <article
                className={`rr-plan ${i === 1 ? 'rr-plan-clay' : ''}`}
                key={p.id}
              >
                <span className="rr-eyebrow">
                  {i === 0 ? 'THE FIRST LEAF' : 'THE GROWING COLLECTION'}
                </span>
                <h3>{p.name}</h3>
                <div className="rr-plan-price">
                  <strong>{money(p.price)}</strong>
                  <span>{p.cadence} · listed price</span>
                </div>
                <ul>
                  {(CLUB_PERKS[p.id] || []).map(perk => (
                    <li key={perk}>
                      <Check size={14} />
                      {perk}
                    </li>
                  ))}
                </ul>
                <button
                  className="rr-secondary rr-full"
                  onClick={() =>
                    setPanel({
                      kind: 'plan',
                      plan: p,
                    })
                  }
                >
                  Explore this plan <ArrowUpRight size={17} />
                </button>
                <small>
                  Catalogue concept. Availability and benefits need retailer
                  confirmation.
                </small>
              </article>
            ))}
          </div>
        </section>

        <section className="rr-care-editorial">
          <div>
            <span className="rr-eyebrow">LESS GUESSWORK. MORE GROWING.</span>
            <h2>
              Care is a ritual.
              <br />
              <em>Keep it simple.</em>
            </h2>
            <button
              className="rr-text-button"
              onClick={() =>
                setPanel({
                  kind: 'guide',
                })
              }
            >
              Read the little care guide <ArrowUpRight size={16} />
            </button>
          </div>
          <article>
            <Sun size={25} />
            <h3>Find the light.</h3>
            <p>
              Match your plant to the light in your room. A darker corner isn't
              the same as no light.
            </p>
          </article>
          <article>
            <Droplets size={25} />
            <h3>Feel the soil.</h3>
            <p>
              Check moisture before watering. Your room, season and pot all
              change how quickly soil dries.
            </p>
          </article>
          <article>
            <Sprout size={25} />
            <h3>Let it drain.</h3>
            <p>
              Use suitable drainage and avoid standing water. Follow species
              guidance and supply labels.
            </p>
          </article>
        </section>
      </main>

      <footer className="rr-footer">
        <div className="rr-footer-brand">
          <Sprout size={28} />
          <span>
            root <i>&</i> ritual
            <small>GOOD THINGS GROW, LITTLE BY LITTLE.</small>
          </span>
        </div>
        <div>
          <button onClick={onBackToLanding}>
            <ArrowLeft size={14} /> All EdgeMart departments
          </button>
          <button
            onClick={() =>
              setPanel({
                kind: 'guide',
              })
            }
          >
            Care, sources & ordering
          </button>
          <small>
            EdgeMart plants & garden · Demo shopping experience
          </small>
        </div>
        <Leaf size={65} className="rr-footer-leaf" />
      </footer>

      {count > 0 && !panel && !customizer && !checkout && (
        <button
          className="rr-basket-tray"
          onClick={() =>
            setPanel({
              kind: 'cart',
            })
          }
        >
          <span>
            <ShoppingBag size={19} />
            <b>
              {count} {count === 1 ? 'plant' : 'plants'}
            </b>
            <small>Your little green collection.</small>
          </span>
          <span>
            View basket <strong>{money(subtotal)}</strong>
            <ArrowRight size={18} />
          </span>
        </button>
      )}

      {toast && (
        <div className="rr-toast" role="status">
          <Check size={17} />
          <span>{toast}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast('')}
          >
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
            if (customizer.editingKey)
              setPanel({
                kind: 'cart',
              });
          }}
          onShelf={addShelf}
          inShelf={shelf.some(s => s.id === customizer.config.id)}
        />
      )}

      {panel?.kind === 'finder' && (
        <Modal
          key="finder"
          title="Find your green companion"
          onClose={() => setPanel(null)}
        >
          <div className="rr-finder-body">
            <p>
              Three small choices. We'll filter the four species in this nursery,
              using their light and care profiles.
            </p>
            <fieldset>
              <legend>
                <span>01</span> What is your corner like?
              </legend>
              <div className="rr-finder-options">
                {[
                  {
                    id: 'any',
                    name: 'Still exploring',
                    detail: 'Show me the whole nursery',
                  },
                  {
                    id: 'bright',
                    name: 'Bright & indirect',
                    detail: 'A bright spot, out of harsh sun',
                  },
                  {
                    id: 'medium',
                    name: 'Medium & filtered',
                    detail: 'Some natural light through the day',
                  },
                  {
                    id: 'lower',
                    name: 'A lower-light corner',
                    detail: 'Less light, but not a windowless room',
                  },
                ].map(o => (
                  <label
                    key={o.id}
                    className={finder.light === o.id ? 'rr-chosen' : ''}
                  >
                    <input
                      type="radio"
                      name="finder-light"
                      checked={finder.light === o.id}
                      onChange={() =>
                        setFinder(f => ({
                          ...f,
                          light: o.id,
                        }))
                      }
                    />
                    <span>
                      <strong>{o.name}</strong>
                      <small>{o.detail}</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>
                <span>02</span> Your watering preference?
              </legend>
              <div className="rr-finder-options">
                {[
                  {
                    id: 'any',
                    name: 'Happy to check regularly',
                    detail: 'Show different watering needs',
                  },
                  {
                    id: 'less',
                    name: 'Less frequent watering',
                    detail: 'Plants that like soil to dry between drinks',
                  },
                ].map(o => (
                  <label
                    key={o.id}
                    className={finder.water === o.id ? 'rr-chosen' : ''}
                  >
                    <input
                      type="radio"
                      name="finder-water"
                      checked={finder.water === o.id}
                      onChange={() =>
                        setFinder(f => ({
                          ...f,
                          water: o.id,
                        }))
                      }
                    />
                    <span>
                      <strong>{o.name}</strong>
                      <small>{o.detail}</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>
                <span>03</span> Sharing your home with pets?
              </legend>
              <label className="rr-pet-finder">
                <input
                  type="checkbox"
                  checked={finder.pets}
                  onChange={e =>
                    setFinder(f => ({
                      ...f,
                      pets: e.target.checked,
                    }))
                  }
                />
                <PawPrint size={18} />
                <span>Only species listed as non-toxic to cats & dogs</span>
              </label>
              <p className="rr-fine">
                Non-toxic doesn't mean edible. Confirm the species and keep pets
                from chewing plants.{' '}
                <a href={SOURCE.spiderPets} target="_blank" rel="noreferrer">
                  ASPCA guidance
                </a>
                .
              </p>
            </fieldset>

            <div className="rr-finder-result">
              <strong>
                {finderMatches.length}{' '}
                {finderMatches.length === 1 ? 'match' : 'matches'} in this
                collection
              </strong>
              <p>
                {finderMatches.length
                  ? finderMatches.map(p => p.title).join(' · ')
                  : 'No species here combines those choices. Try a different watering preference or light profile.'}
              </p>
            </div>

            <button
              className="rr-primary rr-full"
              disabled={!finderMatches.length}
              onClick={() => {
                reset();
                setLight(finder.light);
                setLowWater(finder.water === 'less');
                setPets(finder.pets);
                setFiltersOpen(true);
                setPanel(null);
                scrollTo(catalog);
              }}
            >
              Show my matches <ArrowRight size={17} />
            </button>
          </div>
        </Modal>
      )}

      {panel?.kind === 'cart' && (
        <Modal
          key="cart"
          title="Your green collection"
          drawer
          onClose={() => setPanel(null)}
        >
          {!cart.length ? (
            <div className="rr-empty">
              <ShoppingBag size={35} />
              <h3>A little room for something living.</h3>
              <p>Choose a plant and its optional planter to get started.</p>
              <button
                className="rr-primary"
                onClick={() => {
                  setPanel(null);
                  scrollTo(catalog);
                }}
              >
                Explore the nursery <ArrowRight size={17} />
              </button>
            </div>
          ) : (
            <>
              <div className="rr-cart-intro">
                <span>
                  {count} {count === 1 ? 'plant' : 'plants'} · {cart.length}{' '}
                  custom {cart.length === 1 ? 'bundle' : 'bundles'}
                </span>
                <p>Your plants, planters and selected extras stay together.</p>
              </div>
              <div className="rr-cart-lines">
                {cart.map(c => {
                  const p = plantFor(c),
                    key = keyFor(c);
                  return (
                    <article className="rr-cart-line" key={key}>
                      <PlantImage plant={p} />
                      <div>
                        <div className="rr-cart-line-heading">
                          <h3>{p.title}</h3>
                          <button
                            className="rr-icon"
                            aria-label={`Remove ${p.title}, ${potFor(c).name}`}
                            onClick={() =>
                              setCart(prev =>
                                prev.filter(l => keyFor(l) !== key)
                              )
                            }
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <p>{potFor(c).name}</p>
                        {c.addons.length > 0 && (
                          <p>
                            +{' '}
                            {c.addons
                              .map(
                                id =>
                                  SOIL_ADDONS.find(a => a.id === id).name
                              )
                              .join(', ')}
                          </p>
                        )}
                        <button
                          className="rr-text-button"
                          aria-label={`Edit ${p.title}, ${potFor(c).name}`}
                          onClick={() => {
                            setPanel(null);
                            setCustomizer({
                              config: {
                                ...c,
                                addons: [...c.addons],
                              },
                              editingKey: key,
                            });
                          }}
                        >
                          Edit bundle
                        </button>
                        <div className="rr-cart-line-bottom">
                          <Quantity
                            quantity={c.quantity}
                            label={`${p.title}, ${potFor(c).name}`}
                            onChange={n =>
                              setCart(prev =>
                                prev.map(l =>
                                  keyFor(l) === key
                                    ? {
                                        ...l,
                                        quantity: Math.max(
                                          1,
                                          Math.min(20, l.quantity + n)
                                        ),
                                      }
                                    : l
                                )
                              )
                            }
                          />
                          <span>
                            <strong>
                              {money(unitPrice(c) * c.quantity)}
                            </strong>
                            <small>{money(unitPrice(c))} per bundle</small>
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="rr-cart-summary">
                <div>
                  <span>Plants & supplies subtotal</span>
                  <strong>{money(subtotal)}</strong>
                </div>
                <p>
                  Fees and the existing promotional discount are shown
                  separately in the shared demo checkout.
                </p>
                <button
                  className="rr-primary rr-full"
                  onClick={checkoutCart}
                >
                  Continue to checkout <ArrowRight size={17} />
                </button>
                <small>
                  No real payment, order or delivery. Your basket stays saved
                  when you leave.
                </small>
              </div>
            </>
          )}
        </Modal>
      )}

      {panel?.kind === 'plan' && (
        <Modal
          key="plan"
          title={panel.plan.name}
          onClose={() => setPanel(null)}
        >
          <div className="rr-plan-preview">
            <span className="rr-demo-pill">
              Catalogue preview · no live subscription
            </span>
            <h3>
              {money(panel.plan.price)} <small>{panel.plan.cadence}</small>
            </h3>
            <p>
              Listed monthly plan price. This preview does not start recurring
              billing, book a delivery or provide live support.
            </p>
            <ul>
              {(CLUB_PERKS[panel.plan.id] || []).map(perk => (
                <li key={perk}>
                  <Check size={16} />
                  {perk}
                </li>
              ))}
            </ul>
            <p>
              Confirm availability, exact plant selection, benefits, shipping
              and cancellation terms with the retailer before joining a real
              plan.
            </p>
            <button
              className="rr-primary rr-full"
              onClick={() => {
                const p = panel.plan;
                setPanel(null);
                setCheckout({
                  lines: [{ id: p.id, name: p.name, category: 'plants', price: p.price, quantity: 1, variant: 'Plan preview only · No subscription activated', options: { subscription: false } }],
                  id: p.id,
                  name: `Root & Ritual plan preview: ${p.name} — listed ${money(p.price)}${p.cadence}; no subscription activated`,
                  category: 'plants',
                  price: p.price,
                  plantMeta: {
                    sunlight: 'Plan preview: depends on selected species',
                    watering:
                      'Species guidance required; no scheduled deliveries',
                  },
                });
              }}
            >
              Continue to checkout <ArrowRight size={17} />
            </button>
          </div>
        </Modal>
      )}

      {panel?.kind === 'guide' && (
        <Modal
          key="guide"
          title="The little care & ordering guide"
          onClose={() => setPanel(null)}
        >
          <div className="rr-guide">
            <article>
              <Sun />
              <div>
                <h3>A good home begins with light.</h3>
                <p>
                  Choose a species that fits the room. The finder uses
                  simplified species profiles; lower light tolerance doesn't mean
                  a plant can grow without light.
                </p>
                <a
                  href="https://burke.ces.ncsu.edu/house-plants/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Choosing houseplants · NC State Extension{' '}
                  <ArrowUpRight size={12} />
                </a>
              </div>
            </article>
            <article>
              <Droplets />
              <div>
                <h3>Check first. Water when needed.</h3>
                <p>
                  Feel the soil before watering and avoid leaving the plant in
                  standing water. Conditions change with the season, light and
                  pot. Use each plant's linked species guide rather than a fixed
                  calendar.
                </p>
                <a href={SOURCE.care} target="_blank" rel="noreferrer">
                  Indoor plant care · NC State Extension{' '}
                  <ArrowUpRight size={12} />
                </a>
              </div>
            </article>
            <article>
              <PawPrint />
              <div>
                <h3>A thoughtful choice around pets.</h3>
                <p>
                  The spider plant is listed as non-toxic to cats and dogs by
                  ASPCA. Fiddle-leaf fig, Monstera and snake plant are toxic if
                  ingested. Non-toxic doesn't mean edible; don't encourage pets
                  to chew plants. Species classification links appear in every
                  plant's details.
                </p>
                <a
                  href={SOURCE.spiderPets}
                  target="_blank"
                  rel="noreferrer"
                >
                  Spider plant classification · ASPCA <ArrowUpRight size={12} />
                </a>
              </div>
            </article>
            <article>
              <ShoppingBag />
              <div>
                <h3>Every bundle keeps its choices.</h3>
                <p>
                  The base price is the plant price. Optional planters and
                  supplies add their listed prices. Different bundles stay
                  separate; identical bundles combine up to 20. Edit, remove or
                  change quantities in your basket.
                </p>
              </div>
            </article>
            <article>
              <Heart />
              <div>
                <h3>Your personal green journal.</h3>
                <p>
                  Favourites, bundles, nicknames, notes and soil-check dates are
                  saved in this browser when storage is available. The shelf is
                  for plants you already own and doesn't sync to an account or
                  send reminders. Dates use India time.
                </p>
              </div>
            </article>
            <article>
              <CircleHelp />
              <div>
                <h3>A preview of ordering.</h3>
                <p>
                  The shared five-step checkout is a demonstration. No payment,
                  live delivery, health guarantee, support service or
                  subscription is activated. Its address, crating, insurance,
                  promotion and tracking screens show existing demo data.
                  Closing or cancelling preserves your basket.
                </p>
              </div>
            </article>
            <article>
              <Leaf />
              <div>
                <h3>Photo & care sources.</h3>
                <p>
                  Fiddle-leaf, Monstera and the room photo are existing project
                  assets, shown as species or room inspiration. Planter drawings
                  are representative photographs. Exact planter photos are
                  displayed with a CSS crop; the source files are unchanged.
                </p>
                <a
                  href="https://plants.ces.ncsu.edu/plants/dracaena-trifasciata/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Snake plant photo: Lucy Bradley · CC0 · NC State
                </a>
                <a
                  href="https://plants.ces.ncsu.edu/plants/chlorophytum-comosum/common-name/spiderplant/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Spider plant photo: Joanne Kollar (Pitt County) · NC State
                </a>
                <a
                  href="https://creativecommons.org/licenses/by/4.0/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Spider plant photo licence: CC BY 4.0
                </a>
              </div>
            </article>
          </div>
        </Modal>
      )}

      {checkout && <CheckoutLifecycle
              item={checkout}
              quantity={1} onComplete={() => { if (checkout.id === 'root-ritual-basket') setCart([]); }}
              onBack={() => {
                setCheckout(null);
                setPanel(
                  checkout.id === 'root-ritual-basket'
                    ? {
                        kind: 'cart',
                      }
                    : {
                        kind: 'plan',
                        plan: NURSERY_CLUB_PLANS.find(
                          p => p.id === checkout.id
                        ),
                      }
                );
              }}
              onClose={() => setCheckout(null)}
            />}
    </div>
  );
}
