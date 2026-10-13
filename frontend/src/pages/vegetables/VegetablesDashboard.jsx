import useCatalogueCart from '../../sellers/useCatalogueCart';
import useBuyerCatalogue from '../../sellers/useBuyerCatalogue';
import { DepartmentOffers, DeliveryEstimate } from '../../components/ShoppingBenefits';
import { DepartmentPhoto, ProductPhoto } from '../../components/DepartmentPhoto';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChefHat, ChevronDown, Clock, Heart, HelpCircle, LayoutGrid, Leaf, List, MapPin, Minus, Package, Plus, Search, ShoppingBag, SlidersHorizontal, Sprout, Trash2, Truck, X } from 'lucide-react';
import { VEGETABLES_PRODUCTS, VEGETABLE_CATEGORIES } from '../../data';
import CheckoutLifecycle from '../../components/CheckoutLifecycle';
import './vegetables.css';

const STORAGE_KEY = 'edgemart-greenroom-v1';
const currency = value => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
}).format(value);
const lineKey = (id, pack) => `${id}:${pack}`;
const discount = pack => pack.originalPrice > pack.price ? Math.round((1 - pack.price / pack.originalPrice) * 100) : 0;
const EDIT = {
  v1: { title: 'Hybrid tomatoes', image: '/images/products/v2.jpg', use: 'Sauces, curries & everyday cooking', tone: 'tomato' },
  v2: { title: 'Red onions', image: '/images/products/greenroom-onion.jpg', use: 'The start of something delicious', tone: 'onion' },
  v3: { title: 'Fresh coriander', image: '/images/products/greenroom-coriander.jpg', use: 'A fragrant finishing touch', tone: 'herb' },
  v4: { title: 'Organic broccoli', image: '/images/products/v4.jpg', use: 'Roast, steam or toss into a stir-fry', tone: 'broccoli' },
  v5: { title: 'English cucumber', image: '/images/products/greenroom-cucumber.jpg', use: 'For cool, crunchy salad moments', tone: 'cucumber' },
  v6: { title: 'Ooty carrots', image: '/images/products/v3.jpg', use: 'A little crunch. A lot of color.', tone: 'carrot' },
};
const nativeCatalogue = VEGETABLES_PRODUCTS.map(product => ({
  ...product, ...EDIT[product.id],
  title: EDIT[product.id]?.title || product.name,
  image: EDIT[product.id]?.image || product.image,
  packs: product.weights?.length ? product.weights : [{ label: product.unitWeight || '1 pack', price: product.price, originalPrice: product.originalPrice }],
  organic: Boolean(product.isOrganic || /\borganic\b/i.test(product.name)),
}));
const KITCHEN_IDEAS = [
  { id: 'daily', title: 'Everyday cooking trio', caption: 'The foundation of your next great meal.', ids: ['v1', 'v2', 'v3'], mood: 'THE KITCHEN CLASSICS', tone: 'lavender', icon: ChefHat },
  { id: 'salad', title: 'The crunchy salad edit', caption: 'Tomatoes, cucumber & carrots. Just add your favorite dressing.', ids: ['v1', 'v5', 'v6'], mood: 'KEEP IT COLORFUL', tone: 'peach', icon: Leaf },
  { id: 'roast', title: 'Roast & greens', caption: 'Broccoli, carrots & onions for a tray full of goodness.', ids: ['v4', 'v6', 'v2'], mood: 'MAKE DINNER INTERESTING', tone: 'lime', icon: Package },
];



function ProduceImage({product,className='',eager=false,...props}) {const [failed,setFailed]=useState(false);const src=product.image;useEffect(()=>setFailed(false),[src]);return failed || !src ? <div className={className || 'gr-product-photo'}><span className="em-photo-unavailable">Photo not available</span></div> : <img src={src} alt={product.name} className={className} loading={eager?'eager':'lazy'} {...props} onError={()=>setFailed(true)}/>;}

function Modal({ title, children, onClose, wide = false, drawer = false }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    const onKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); }
      if (event.key !== 'Tab') return;
      const targets = [...ref.current.querySelectorAll('button, a[href], input, select, textarea, summary, [tabindex="0"]')]
        .filter(element => !element.disabled && element.getClientRects().length);
      const first = targets[0], last = targets[targets.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKey); previousFocus?.focus?.(); };
  }, []);
  return <div className={`gr-backdrop ${drawer ? 'gr-backdrop-drawer' : ''}`} onClick={onClose}>
    <section ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
      className={`gr-modal ${wide ? 'gr-modal-wide' : ''} ${drawer ? 'gr-drawer' : ''}`} onClick={event => event.stopPropagation()}>
      <header className="gr-modal-header"><h2>{title}</h2><button className="gr-icon-button" onClick={onClose} aria-label={`Close ${title}`}><X size={19} /></button></header>
      {children}
    </section>
  </div>;
}

function catalogueTools(PRODUCTS) {
function readSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const cart = {};
    Object.values(saved.cart || {}).forEach(line => {
      const product = PRODUCTS.find(item => item.id === line?.id);
      if (product && Number.isInteger(line.pack) && product.packs[line.pack]
        && Number.isInteger(line.quantity) && line.quantity > 0 && line.quantity <= 99) {
        cart[lineKey(line.id, line.pack)] = { id: line.id, pack: line.pack, quantity: line.quantity };
      }
    });
    return { cart, favorites: Array.isArray(saved.favorites) ? [...new Set(saved.favorites.filter(id => PRODUCTS.some(product => product.id === id)))] : [], pin: /^[1-9]\d{5}$/.test(saved.pin) ? saved.pin : '' };
  } catch { return { cart: {}, favorites: [], pin: '' }; }
}
return {readSaved};
}
export default function VegetablesDashboard({ onBackToLanding }) {
  const PRODUCTS = useBuyerCatalogue('vegetables',nativeCatalogue,'Vegetables');
  const {readSaved} = useMemo(()=>catalogueTools(PRODUCTS),[PRODUCTS]);

  const [saved] = useState(readSaved);
  const [cart, setCart] = useCatalogueCart(saved.cart, PRODUCTS);
  const [favorites, setFavorites] = useState(saved.favorites);
  const [pin, setPin] = useState(saved.pin);
  const [pinDraft, setPinDraft] = useState(saved.pin);
  const [pinError, setPinError] = useState('');
  const [tab, setTab] = useState('market');
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState(()=>new URLSearchParams(window.location.search).get('q') || '');
  const [organicOnly, setOrganicOnly] = useState(false);
  const [dealsOnly, setDealsOnly] = useState(false);
  const [budget, setBudget] = useState('all');
  const [sort, setSort] = useState('featured');
  const [layout, setLayout] = useState('grid');
  const [filterOpen, setFilterOpen] = useState(false);
  const [packs, setPacks] = useState({});
  const [panel, setPanel] = useState(null);
  const [detail, setDetail] = useState(null);
  const [checkout, setCheckout] = useState(null);
  const [toast, setToast] = useState('');
  const catalogRef = useRef(null);
  const kitchenRef = useRef(null);
  const packIndex = product => packs[product.id] ?? 0;
  const lines = Object.values(cart).map(line => {
    const product = PRODUCTS.find(item => item.id === line.id);
    return { ...line, product, packDetails: product.packs[line.pack] };
  });
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.packDetails.price, 0);
  const savings = lines.reduce((sum, line) => sum + Math.max(0, (line.packDetails.originalPrice || line.packDetails.price) - line.packDetails.price) * line.quantity, 0);
  const delivery = subtotal >= 999 ? 0 : 49;
  const organicCount = PRODUCTS.filter(product => product.organic).length;
  const filterCount = Number(organicOnly) + Number(dealsOnly) + Number(budget !== 'all');

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ cart, favorites, pin })); } catch { /* Browser storage may be disabled. */ } }, [cart, favorites, pin]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 3500); return () => clearTimeout(timer); }, [toast]);

  const filtered = useMemo(() => PRODUCTS.filter(product => {
    const pack = product.packs[packs[product.id] ?? 0];
    const searchable = `${product.name} ${product.title} ${product.scientific || ''} ${product.origin || ''} ${product.tag || ''} ${product.use || ''}`.toLowerCase();
    return (category === 'all' || category === product.subCategory) && searchable.includes(query.trim().toLowerCase())
      && (tab !== 'saved' || favorites.includes(product.id)) && (!organicOnly || product.organic)
      && (!dealsOnly || discount(pack) >= 30) && (budget === 'all' || pack.price <= Number(budget));
  }).sort((a, b) => {
    const ap = a.packs[packs[a.id] ?? 0], bp = b.packs[packs[b.id] ?? 0];
    if (sort === 'low') return ap.price - bp.price;
    if (sort === 'high') return bp.price - ap.price;
    if (sort === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sort === 'savings') return discount(bp) - discount(ap);
    return 0;
  }), [category, query, packs, favorites, tab, organicOnly, dealsOnly, budget, sort, PRODUCTS]);

  const reset = () => { setCategory('all'); setQuery(''); setOrganicOnly(false); setDealsOnly(false); setBudget('all'); setSort('featured'); };
  const scrollTo = ref => ref.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  const navigate = nextTab => { setTab(nextTab); if (nextTab === 'saved') reset(); scrollTo(nextTab === 'kitchen' ? kitchenRef : catalogRef); };
  const browse = nextCategory => { reset(); setCategory(nextCategory || 'all'); setTab('market'); scrollTo(catalogRef); };
  const back = () => onBackToLanding ? onBackToLanding() : window.location.assign('/landing.html');
  const toggleFavorite = product => {
    const exists = favorites.includes(product.id);
    setFavorites(previous => exists ? previous.filter(id => id !== product.id) : [...previous, product.id]);
    setToast(exists ? 'Removed from your saved vegetables.' : 'Saved for your next kitchen adventure.');
  };
  const update = (product, pack, delta) => {
    if(delta>0 && product.inStock===false)return;
    setCart(previous => {
      const key = lineKey(product.id, pack), next = { ...previous };
      const quantity = Math.min(99, (previous[key]?.quantity || 0) + delta);
      if (quantity <= 0) delete next[key]; else next[key] = { id: product.id, pack, quantity };
      return next;
    });
  };
  const addIdea = idea => {
    if (idea.ids.some(id => (cart[lineKey(id, 0)]?.quantity || 0) >= 99)) {
      setToast('One of these packs has reached the 99-pack limit. Reduce its quantity first.');
      return;
    }
    setCart(previous => {
      const next = { ...previous };
      idea.ids.forEach(id => { const key = lineKey(id, 0); next[key] = { id, pack: 0, quantity: Math.min(99, (previous[key]?.quantity || 0) + 1) }; });
      return next;
    });
    setToast(`${idea.title}: vegetable packs added to your basket.`);
  };
  const startCheckout = () => {
    if (!lines.length) return;
    setPanel(null);
    setCheckout({
      lines: lines.map(line => ({ id: line.product.id, name: line.product.title, category: 'vegetables', image: line.product.image, price: line.packDetails.price, quantity: line.quantity, variant: line.packDetails.label, options: { pack: line.pack } })), id: 'greenroom_vegetable_basket', category: 'vegetables', returnDays: 0,
      image: lines[0].product.image, price: subtotal,
      name: lines.map(line => `${line.product.title} (${line.packDetails.label}) × ${line.quantity}`).join(' + ') });
  };
  const controls = (product, selectedPack) => {
    const quantity = cart[lineKey(product.id, selectedPack)]?.quantity || 0;
    return quantity ? <div className="gr-stepper"><button aria-label={`Remove one ${product.title}, ${product.packs[selectedPack].label}`} onClick={() => update(product, selectedPack, -1)}><Minus size={15} /></button><span aria-live="polite">{quantity}</span><button aria-label={`Add one ${product.title}, ${product.packs[selectedPack].label}`} disabled={(quantity >= 99) || product.inStock === false} onClick={() => update(product, selectedPack, 1)}><Plus size={15} /></button></div>
      : <button className="gr-add-button" aria-label={`Add ${product.title}, ${product.packs[selectedPack].label} to basket`} onClick={() => { update(product, selectedPack, 1); setToast(`${product.title} added to your basket.`); }} disabled={product.inStock === false}><Plus size={16} /> Add</button>;
  };
  const packSelector = product => <label className="gr-pack"><span className="gr-sr-only">Weight for {product.title}</span><select value={packIndex(product)} onChange={event => setPacks(previous => ({ ...previous, [product.id]: Number(event.target.value) }))}>{product.packs.map((pack, index) => <option key={pack.label} value={index}>{pack.label}</option>)}</select><ChevronDown size={14} aria-hidden="true" /></label>;
  const openDelivery = () => { setPinDraft(pin); setPinError(''); setPanel('delivery'); };

  return <div className="gr-app">
    <a className="gr-skip" href="#greenroom-market">Skip to the vegetable market</a>
    <div className="gr-topline"><span><Sprout size={13} /> THE VEGETABLE DEPARTMENT</span><span>Good food starts with good ingredients.</span><button onClick={back}>Explore all worlds <ArrowUpRight size={12} /></button></div>
    <header className="gr-header"><div className="gr-header-inner">
      <button className="gr-brand" onClick={back} aria-label="EdgeMart, all shopping worlds"><span><Sprout size={25} /></span><div><strong>EdgeMart<span className="gr-brand-period">.</span></strong><small>GREENROOM</small></div></button>
      <nav className="gr-main-nav" aria-label="Vegetable dashboard"><button className={tab === 'market' ? 'is-active' : ''} aria-pressed={tab === 'market'} onClick={() => navigate('market')}>Fresh market</button><button className={tab === 'kitchen' ? 'is-active' : ''} aria-pressed={tab === 'kitchen'} onClick={() => navigate('kitchen')}>Kitchen ideas</button><button className={tab === 'saved' ? 'is-active' : ''} aria-pressed={tab === 'saved'} onClick={() => navigate('saved')}>Saved picks <span>{favorites.length}</span></button></nav>
      <button className="gr-location" onClick={openDelivery}><MapPin size={17} /><span><small>YOUR DELIVERY PIN</small><strong>{pin || 'Set location'} <ChevronDown size={12} /></strong></span></button>
      <button className="gr-header-cart" onClick={() => setPanel('cart')} aria-label={`Open vegetable basket, ${count} packs`}><ShoppingBag size={17} /><span>My basket</span><b>{count}</b></button>
    </div></header>

    <main className="gr-main">
      <section className="gr-hero" aria-labelledby="gr-hero-title">
        <div className="gr-hero-copy"><span className="gr-label gr-hero-label"><span className="gr-live-dot" /> WELCOME TO THE GREENROOM</span><h1 id="gr-hero-title">Better ingredients.<br /><span>Brighter plates.</span></h1><p>A fresh take on your everyday market.<br />Kitchen staples, crisp greens, and a little inspiration.</p><div className="gr-hero-actions"><button className="gr-button gr-button-lime" onClick={() => browse()}>Fill your basket <ArrowUpRight size={18} /></button><button className="gr-hero-secondary" onClick={() => navigate('kitchen')}><ChefHat size={17} /> Find your next meal</button></div><div className="gr-hero-bottom"><span><Package size={15} /> Your weight. Your choice.</span><span><Heart size={15} /> Save what you love.</span></div></div>
        <div className="gr-hero-art em-photo-hero"><DepartmentPhoto department="vegetables" eager/></div>
      </section>

      <section className="gr-overview" aria-label="Your market overview"><div><span className="gr-overview-icon"><Sprout size={21} /></span><p><strong>{String(PRODUCTS.length).padStart(2, '0')}</strong><span>Kitchen-ready selections</span></p></div><div><span className="gr-overview-icon gr-icon-purple"><Heart size={20} /></span><p><strong>{String(favorites.length).padStart(2, '0')}</strong><span>Your saved favorites</span></p></div><div><span className="gr-overview-icon gr-icon-peach"><ShoppingBag size={21} /></span><p><strong>{String(count).padStart(2, '0')}</strong><span>Packs in your basket</span></p></div><div><span className="gr-overview-icon"></span><p><strong>{currency(savings)}</strong><span>Saved against list prices</span></p></div></section>

      <section className="gr-market-section" id="greenroom-market" ref={catalogRef} aria-labelledby="gr-market-title">
        <div className="gr-section-heading"><div><span className="gr-label">YOUR EVERYDAY, UPGRADED</span><h2 id="gr-market-title">{tab === 'saved' ? 'Your saved essentials' : 'Meet your fresh essentials'}<span>({filtered.length})</span></h2></div><button className="gr-small-link" onClick={() => setPanel('help')}>The freshness guide <ArrowUpRight size={15} /></button></div>
        <div className="gr-market-layout">
          <div className="gr-catalog">
            <div className="gr-search-row"><label className="gr-search"><Search size={18} /><span className="gr-sr-only">Search vegetables and cooking uses</span><input type="search" aria-label="Search vegetables and cooking uses" placeholder="Search tomatoes, greens, salad ingredients…" value={query} onChange={event => setQuery(event.target.value)} />{query && <button aria-label="Clear vegetable search" onClick={() => setQuery('')}><X size={15} /></button>}</label><button className={`gr-filter-button ${filterOpen || filterCount ? 'is-active' : ''}`} aria-expanded={filterOpen} aria-controls="greenroom-filters" onClick={() => setFilterOpen(!filterOpen)}><SlidersHorizontal size={16} /> Filters {filterCount > 0 && <b>{filterCount}</b>}</button></div>
            <nav className="gr-categories" aria-label="Vegetable categories">{VEGETABLE_CATEGORIES.map(item => <button key={item.id} className={category === item.id ? 'is-active' : ''} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}><span>{item.icon}</span>{item.id === 'all' ? 'All vegetables' : item.id === 'daily' ? 'Daily essentials' : item.id === 'leafy' ? 'Greens & herbs' : item.id === 'exotic' ? 'Salad & exotics' : 'Roots & tubers'}</button>)}</nav>
            {filterOpen && <div className="gr-filters" id="greenroom-filters"><label><input type="checkbox" checked={organicOnly} onChange={event => setOrganicOnly(event.target.checked)} /> Organic-labelled ({organicCount})</label><label><input type="checkbox" checked={dealsOnly} onChange={event => setDealsOnly(event.target.checked)} /> Save 30% or more</label><label>Pack budget<select aria-label="Pack budget" value={budget} onChange={event => setBudget(event.target.value)}><option value="all">Any price</option><option value="50">Up to ₹50</option><option value="100">Up to ₹100</option></select></label><button className="gr-small-link" onClick={reset}>Reset filters</button></div>}
            <div className="gr-toolbar"><span>{query ? `Results for “${query}”` : `${filtered.length} fresh ${filtered.length === 1 ? 'selection' : 'selections'} · choose your perfect pack`}</span><div><label><span className="gr-sr-only">Sort vegetables</span><select value={sort} onChange={event => setSort(event.target.value)}><option value="featured">Featured first</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="rating">Highest rated</option><option value="savings">Biggest savings</option></select></label><div className="gr-view-switch"><button aria-label="Vegetable grid view" aria-pressed={layout === 'grid'} className={layout === 'grid' ? 'is-active' : ''} onClick={() => setLayout('grid')}><LayoutGrid size={16} /></button><button aria-label="Vegetable list view" aria-pressed={layout === 'list'} className={layout === 'list' ? 'is-active' : ''} onClick={() => setLayout('list')}><List size={16} /></button></div></div></div>
            <DepartmentOffers department="vegetables"/>
{filtered.length ? <div className={`gr-products ${layout === 'list' ? 'gr-products-list' : ''}`}>{filtered.map((product, index) => {
              const selected = packIndex(product), tier = product.packs[selected];
              return <article className={`gr-product gr-product-${product.tone || 'herb'}`} key={product.id} style={{ '--gr-delay': `${index * 45}ms` }}>
                <div className="gr-product-media"><button className="gr-product-image" aria-label={`View ${product.title} details`} onClick={() => setDetail(product)}><ProduceImage product={product} loading="lazy" /></button><span className="gr-discount">{discount(tier) > 0 ? `${discount(tier)}% OFF` : 'FRESH PICK'}</span><button className={`gr-heart ${favorites.includes(product.id) ? 'is-saved' : ''}`} aria-label={`Save ${product.title}`} aria-pressed={favorites.includes(product.id)} onClick={() => toggleFavorite(product)}><Heart size={17} fill={favorites.includes(product.id) ? 'currentColor' : 'none'} /></button><span className="gr-product-label">{product.organic ? <Leaf size={12} /> : <Sprout size={12} />}{product.organic ? 'ORGANIC-LABELLED' : product.subCategory === 'leafy' ? 'A LITTLE GREEN GOODNESS' : 'YOUR DAILY ESSENTIAL'}</span></div>
                <div className="gr-product-info"><div className="gr-product-title"><h3><button onClick={() => setDetail(product)}>{product.title}</button></h3><span>{product.sellerProduct ? 'New' : product.rating?.toFixed(1) || '—'}</span></div><p>{product.use || product.tag}</p>{packSelector(product)}<div className="gr-product-buy"><div><strong>{currency(tier.price)}</strong>{tier.originalPrice > tier.price && <s>{currency(tier.originalPrice)}</s>}<small>per selected pack</small></div>{controls(product, selected)}</div><DeliveryEstimate department="vegetables" product={product}/></div>
              </article>;
            })}</div> : <div className="gr-empty"><Sprout size={35} /><h3>{tab === 'saved' && !favorites.length ? 'Good taste is worth saving.' : 'Let’s try another fresh direction.'}</h3><p>{tab === 'saved' && !favorites.length ? 'Tap a heart to keep your kitchen favorites close.' : 'Try a different search, category or price filter.'}</p><button className="gr-button" onClick={() => browse()}>Explore all vegetables <ArrowRight size={16} /></button></div>}
            <div className="gr-catalog-note"><Package size={15} /> Mix different weights in one basket. Each pack keeps its own price and quantity.</div>
          </div>

          <aside className="gr-side-stack" aria-label="Basket and kitchen shortcuts"><section className="gr-basket-card"><div className="gr-basket-heading"><span><ShoppingBag size={21} /></span><h3>Your market haul</h3><b>{count}</b></div>{count ? <><p>Good ingredients. Great possibilities.</p><div className="gr-basket-preview">{lines.slice(0, 3).map(line => <div key={lineKey(line.id, line.pack)}><ProduceImage product={line.product} /><span><strong>{line.product.title}</strong><small>{line.packDetails.label} · ×{line.quantity}</small></span><b>{currency(line.packDetails.price * line.quantity)}</b></div>)}{lines.length > 3 && <small>+ {lines.length - 3} more pack selections</small>}</div><div className="gr-basket-subtotal"><span>Basket subtotal</span><strong>{currency(subtotal)}</strong></div><button className="gr-button gr-button-lime" onClick={() => setPanel('cart')}>Review your basket <ArrowRight size={16} /></button></> : <div className="gr-basket-empty"><span><ShoppingBag size={30} /><Plus size={13} /></span><strong>Your next great meal<br />starts here.</strong><p>Add your first fresh pick.</p><button className="gr-small-link" onClick={() => browse()}>Explore the market <ArrowRight size={13} /></button></div>}<div className="gr-basket-foot"><Check size={13} /> Kept for you in this browser</div></section>
            <button className="gr-cooking-prompt" onClick={() => navigate('kitchen')}><span className="gr-label">A LITTLE KITCHEN INSPIRATION</span><ChefHat size={27} /><strong>Less “what’s for dinner?”<br />More “that looks good.”</strong><span>Build a vegetable bundle <ArrowUpRight size={17} /></span></button>
            <button className="gr-storage-prompt" onClick={() => setPanel('help')}><Clock size={20} /><span><strong>Make freshness last.</strong><small>Storage tips for your market haul</small></span><ArrowUpRight size={17} /></button>
          </aside>
        </div>
      </section>

      <section className="gr-kitchen-section" id="greenroom-kitchen" ref={kitchenRef} aria-labelledby="gr-kitchen-title"><div className="gr-section-heading"><div><span className="gr-label">FROM “WHAT IF” TO “WHAT’S COOKING”</span><h2 id="gr-kitchen-title">A basket with a little purpose.</h2></div><span className="gr-kitchen-note">Vegetable bundles · pantry staples not included</span></div><div className="gr-idea-grid">{KITCHEN_IDEAS.filter(idea=>idea.ids.every(id=>PRODUCTS.some(p=>p.id===id))).map(idea => {
        const items = idea.ids.map(id => PRODUCTS.find(product => product.id === id));
        const price = items.reduce((sum, product) => sum + product.packs[0].price, 0);
        return <article className={`gr-idea gr-idea-${idea.tone}`} key={idea.id}><div className="gr-idea-top"><span className="gr-label">{idea.mood}</span><idea.icon size={21} /></div><div className="gr-idea-images">{items.map(product => <ProduceImage key={product.id} product={product} loading="lazy" />)}</div><h3>{idea.title}</h3><p>{idea.caption}</p><div className="gr-idea-items">{items.map(product => <span key={product.id}>{product.title} · {product.packs[0].label}</span>)}</div><button onClick={() => addIdea(idea)} aria-label={`Add ${idea.title} bundle`}><span>Add all 3 packs <strong>{currency(price)}</strong></span><Plus size={18} /></button></article>;
      })}</div></section>

      <section className="gr-bottom-banner"><div><span><Sprout size={28} /></span><p><strong>A small habit. A fresher everyday.</strong><span>Find the vegetables you love. Keep coming back to good food.</span></p></div><button className="gr-button" onClick={() => browse('leafy')}>Find your greens <ArrowUpRight size={16} /></button></section>
      <footer className="gr-footer"><span><Sprout size={16} /> EdgeMart / Greenroom</span><span>Good ingredients. Your kind of everyday.</span><div><button onClick={() => setPanel('help')}>Kitchen help</button><button onClick={back}>All shopping worlds <ArrowUpRight size={12} /></button></div></footer>
    </main>

    <button className="gr-help-float" onClick={() => setPanel('help')} aria-label="Open kitchen help"><HelpCircle size={20} /></button>
    {count > 0 && <button className="gr-mobile-cart" onClick={() => setPanel('cart')}><ShoppingBag size={19} /><span>{count} packs · {currency(subtotal)}</span>Review basket <ArrowRight size={16} /></button>}
    <div className="gr-toast" role="status" aria-live="polite">{toast && <span><Check size={16} />{toast}</span>}</div>

    {detail && <Modal title="Meet your ingredient" onClose={() => setDetail(null)} wide><div className="gr-detail-layout"><div className="gr-detail-image"><ProduceImage product={detail} /><span>{detail.tag}</span></div><div className="gr-detail-info"><span className="gr-label">THE GREENROOM / FRESH PICK</span><h3>{detail.title}</h3><p className="gr-detail-fullname">{detail.name}</p><em>{detail.scientific}</em><div className="gr-detail-rating">{detail.sellerProduct ? 'New' : detail.rating?.toFixed(1) || '—'}<span>Catalog rating</span></div><div className="gr-detail-fact"><ChefHat size={19} /><span><small>IN YOUR KITCHEN</small>{detail.use || detail.tag}</span></div><div className="gr-detail-fact"><Clock size={19} /><span><small>STORAGE & SHELF LIFE</small>{detail.shelfLife || 'See product packaging for storage guidance.'}</span></div>{detail.organic && <p className="gr-organic-note"><Leaf size={15} />Listed as organic in the product catalog. Certification details are not supplied.</p>}{packSelector(detail)}<div className="gr-detail-buy"><div><strong>{currency(detail.packs[packIndex(detail)].price)}</strong><small>{detail.packs[packIndex(detail)].label} · per pack</small></div>{controls(detail, packIndex(detail))}</div><button className="gr-small-link" onClick={() => toggleFavorite(detail)}><Heart size={15} fill={favorites.includes(detail.id) ? 'currentColor' : 'none'} />{favorites.includes(detail.id) ? 'Saved to your essentials' : 'Save this ingredient'}</button></div></div></Modal>}

    {panel === 'cart' && <Modal title="Your vegetable basket" onClose={() => setPanel(null)} drawer>{lines.length ? <><div className="gr-cart-lines">{lines.map(line => <article className="gr-cart-line" key={lineKey(line.id, line.pack)}><ProduceImage product={line.product} /><div><h3>{line.product.title}</h3><p>{line.packDetails.label} · {currency(line.packDetails.price)} per pack</p><strong>{currency(line.packDetails.price * line.quantity)}</strong><div>{controls(line.product, line.pack)}<button className="gr-icon-button" aria-label={`Remove ${line.product.title}, ${line.packDetails.label} from basket`} onClick={() => setCart(previous => { const next = { ...previous }; delete next[lineKey(line.id, line.pack)]; return next; })}><Trash2 size={16} /></button></div></div></article>)}</div><div className="gr-delivery-progress"><Truck size={17} /><span>{subtotal >= 999 ? 'Free delivery threshold reached.' : `Add ${currency(999 - subtotal)} for free delivery.`}</span><progress value={Math.min(subtotal, 999)} max={999} aria-label="Progress towards free delivery" /></div><div className="gr-cart-totals"><div><span>Subtotal ({count} packs)</span><strong>{currency(subtotal)}</strong></div><div><span>Delivery estimate</span><strong>{delivery ? currency(delivery) : 'FREE'}</strong></div><div className="gr-cart-total"><span>Estimated total</span><strong>{currency(subtotal + delivery)}</strong></div>{savings > 0 && <p>{currency(savings)} saved against list prices.</p>}</div><button className="gr-button gr-checkout-button" onClick={startCheckout}>Continue to checkout <ArrowRight size={17} /></button><p className="gr-checkout-note">Delivery estimates and optional preview offers appear in the shared checkout. No payment is collected.</p><button className="gr-small-link" onClick={() => setCart({})}><Trash2 size={14} /> Clear vegetable basket</button></> : <div className="gr-empty"><ShoppingBag size={36} /><h3>Your basket has possibilities.</h3><p>Start with a favorite vegetable or add a kitchen bundle.</p><button className="gr-button" onClick={() => { setPanel(null); browse(); }}>Explore fresh essentials <ArrowRight size={16} /></button></div>}</Modal>}

    {panel === 'delivery' && <Modal title="Your delivery preference" onClose={() => setPanel(null)}><div className="gr-info-box"><MapPin size={23} /><p>Save a PIN for this vegetable dashboard. Enter your full address in checkout; availability and delivery timing are not verified here.</p></div><form className="gr-pin-form" onSubmit={event => { event.preventDefault(); if (!/^[1-9]\d{5}$/.test(pinDraft)) { setPinError('Enter a valid six-digit Indian PIN code.'); return; } setPin(pinDraft); setPanel(null); setToast('Your delivery PIN is saved in this browser.'); }}><label htmlFor="gr-pin">Vegetable delivery PIN</label><input id="gr-pin" inputMode="numeric" maxLength={6} autoComplete="postal-code" value={pinDraft} onChange={event => { setPinDraft(event.target.value.replace(/\D/g, '')); setPinError(''); }} aria-invalid={Boolean(pinError)} aria-describedby="gr-pin-note" placeholder="e.g. 500049" /><p id="gr-pin-note" className={pinError ? 'gr-error' : ''}>{pinError || 'Your checkout address can be different from this saved preference.'}</p><button className="gr-button" type="submit">Save vegetable PIN <Check size={16} /></button></form><div className="gr-delivery-explainer"><Truck size={20} /><p><strong>Delivery estimate</strong><span>₹49 below ₹999. Free from ₹999 before checkout discounts.</span></p></div></Modal>}

    {panel === 'help' && <Modal title="Kitchen help & freshness guide" onClose={() => setPanel(null)}><div className="gr-info-box"><ChefHat size={25} /><p>Good ingredients deserve a little care. Quick views include each vegetable’s storage information and available pack sizes.</p></div>{[
      { title: 'How can I keep my vegetables fresh?', text: 'Use the shelf-life guidance in each product quick view. Keep refrigerated vegetables chilled and onions in dry storage. Check product packaging for handling instructions.' },
      { title: 'What comes in a kitchen bundle?', text: 'Each bundle adds one of the smallest listed packs of each of its three vegetables. Exact pack weights and the combined price are shown on the card. Dressing, seasonings and other pantry ingredients are not included.' },
      { title: 'Can I mix different vegetable weights?', text: 'Yes. Select a weight and add it, then choose a second weight. Each size has a separate basket line, price and quantity. Change quantities or remove lines in the basket.' },
      { title: 'What does the organic filter mean?', text: 'The filter includes products identified as organic by their catalog name or organic flag. The current catalog does not provide certification records; the dashboard does not verify certification.' },
      { title: 'Are my basket and saved picks connected to an account?', text: 'They are saved only in this browser, independently of the fruit dashboard. They do not sync across devices. Private browsing or clearing browser storage may remove them.' },
      { title: 'Does checkout place a real order?', text: 'Checkout uses this project’s existing demo lifecycle. The full basket is handed over as one bundle with pack names and quantities. There is no live payment or order backend. Closing checkout keeps your basket.' },
    ].map(faq => <details className="gr-faq" key={faq.title}><summary>{faq.title}<Plus size={16} /></summary><p>{faq.text}</p></details>)}</Modal>}

    {checkout && <CheckoutLifecycle item={checkout} quantity={1} onComplete={() => { setCart({}); }} onBack={() => { setCheckout(null); setPanel('cart'); }} onClose={() => setCheckout(null)} />}
  </div>;
}
