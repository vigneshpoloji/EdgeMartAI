import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
//  Correct (goes up to /src/ and then into /api/):
import { pruneCatalogueCart } from '../../sellers/catalogue-cart.js';
import useBuyerCatalogue from '../../sellers/useBuyerCatalogue';
import { DepartmentOffers, DeliveryEstimate } from '../../components/ShoppingBenefits';
import { DepartmentPhoto, ProductPhoto } from '../../components/DepartmentPhoto';
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Bookmark, Check, ChevronDown, Heart, Minus, Plus, Search, ShoppingBag, Trash2, X } from 'lucide-react';
import { GENERAL_PRODUCTS } from '../../data';
import CheckoutLifecycle from '../../components/CheckoutLifecycle';
import './books.css';

const STORE = 'edgemart-folio-books-v1';
const nativeCatalogue = GENERAL_PRODUCTS.filter(book => book.category === 'books').map((book, index) => ({
  ...book,
  collection: index === 0 ? 'Architecture' : 'Programming',
  colour: index === 0 ? 'violet' : 'yellow',
  subtitle: index === 0 ? 'Think in systems.' : 'Make every line count.',
  format: book.bookMeta?.format || 'Format not listed'
}));

const money = value => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
}).format(value);
const STATUSES = ['To read', 'Reading', 'Finished'];

function Cover({ book, small = false }) { return <ProductPhoto department="books" src={book.image} label={book.name} className={small ? 'fc-cover fc-cover-small' : 'fc-cover'}/>; }
function Modal({
  title,
  onClose,
  drawer = false,
  bare = false,
  children
}) {
  const titleId = useId();
  const dialog = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const opener = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();
    function keydown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
      }
      if (event.key !== 'Tab') return;
      const elements = [...dialog.current.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')].filter(el => el.getClientRects().length);
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first) {
        event.preventDefault();
        return;
      }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', keydown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', keydown);
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  return <div className={`fc-overlay${drawer ? ' fc-overlay-drawer' : ''}`} onMouseDown={event => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <section ref={dialog} className={`fc-dialog${drawer ? ' fc-drawer' : ''}${bare ? ' fc-dialog-checkout' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
      {bare ? <h2 id={titleId} className="fc-sr-only">{title}</h2> : <header className="fc-dialog-header"><div><span className="fc-eyebrow">FOLIO & CO. / EDGEMART</span><h2 id={titleId}>{title}</h2></div><button className="fc-icon" aria-label={`Close ${title}`} onClick={onClose}><X size={21} /></button></header>}
      {children}
    </section>
  </div>;
}

function catalogueTools(BOOKS) {
  const byId = id => BOOKS.find(book => book.id === id);
  function readSaved() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || '{}');
      const favourites = Array.isArray(saved.favourites) ? [...new Set(saved.favourites.filter(byId))] : [];
      const quantities = new Map();
      if (Array.isArray(saved.bag)) saved.bag.forEach(line => {
        if (byId(line?.id) && Number.isInteger(line.quantity) && line.quantity >= 1 && line.quantity <= 20) quantities.set(line.id, Math.min(20, (quantities.get(line.id) || 0) + line.quantity));
      });
      const shelf = new Map();
      if (Array.isArray(saved.shelf)) saved.shelf.forEach(entry => {
        if (byId(entry?.id) && STATUSES.includes(entry.status)) shelf.set(entry.id, {
          id: entry.id,
          status: entry.status,
          progress: entry.status === 'Finished' ? 100 : Math.max(0, Math.min(100, Number.isFinite(entry.progress) ? Math.round(entry.progress) : 0)),
          note: typeof entry.note === 'string' ? entry.note.slice(0, 240) : ''
        });
      });
      return {
        favourites,
        bag: [...quantities].map(([id, quantity]) => ({
          id,
          quantity
        })),
        shelf: [...shelf.values()]
      };
    } catch {
      return {
        favourites: [],
        bag: [],
        shelf: []
      };
    }
  }
  return { byId, readSaved };
}

export default function BooksDashboard({
  onBackToLanding
}) {
  const BOOKS = useBuyerCatalogue('books', nativeCatalogue, 'Books');
  const { byId, readSaved } = useMemo(() => catalogueTools(BOOKS), [BOOKS]);

  const [rawSaved, setSaved] = useState(readSaved);
  const saved = useMemo(() => ({
    ...rawSaved,
    bag: pruneCatalogueCart(rawSaved.bag, BOOKS),
    shelf: rawSaved.shelf.filter(s => byId(s.id)),
    favourites: rawSaved.favourites.filter(id => byId(id))
  }), [rawSaved, BOOKS, byId]);

  const [storageWarning, setStorageWarning] = useState(false);
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get('q') || '');
  const [collection, setCollection] = useState('All books');
  const [onlySaved, setOnlySaved] = useState(false);
  const [sort, setSort] = useState('featured');
  const [panel, setPanel] = useState(null);
  const [checkout, setCheckout] = useState(null);
  const [notice, setNotice] = useState('');
  const catalogueRef = useRef(null);
  const shelfRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify(saved));
      setStorageWarning(false);
    } catch {
      setStorageWarning(true);
    }
  }, [saved]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4500);
    return () => clearTimeout(timer);
  }, [notice]);

  const count = saved.bag.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = saved.bag.reduce((sum, line) => sum + byId(line.id).price * line.quantity, 0);

  const books = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = BOOKS.filter(book => (!query || `${book.name} ${book.description} ${book.bookMeta?.author || ''} ${book.collection}`.toLowerCase().includes(query)) && (collection === 'All books' || book.collection === collection) && (!onlySaved || saved.favourites.includes(book.id)));
    if (sort === 'price-low') list.sort((a, b) => a.price - b.price);
    if (sort === 'price-high') list.sort((a, b) => b.price - a.price);
    if (sort === 'title') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [search, collection, onlySaved, sort, saved.favourites, BOOKS]);

  function scrollTo(ref) {
    ref.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start'
    });
  }

  function toggleFavourite(id) {
    setSaved(value => ({
      ...value,
      favourites: value.favourites.includes(id) ? value.favourites.filter(item => item !== id) : [...value.favourites, id]
    }));
  }

  function addBook(id) {
    const line = saved.bag.find(item => item.id === id);
    if (line?.quantity >= 20) {
      setNotice('You can keep up to 20 copies of each title in your bag.');
      return;
    }
    setSaved(value => ({
      ...value,
      bag: value.bag.some(item => item.id === id) ? value.bag.map(item => item.id === id ? {
        ...item,
        quantity: Math.min(20, item.quantity + 1)
      } : item) : [...value.bag, {
        id,
        quantity: 1
      }]
    }));
    setNotice(`${byId(id).name} added to your book bag.`);
  }

  function changeQuantity(id, delta) {
    setSaved(value => ({
      ...value,
      bag: value.bag.map(item => item.id === id ? {
        ...item,
        quantity: Math.max(1, Math.min(20, item.quantity + delta))
      } : item)
    }));
  }

  function removeBook(id) {
    setSaved(value => ({
      ...value,
      bag: value.bag.filter(item => item.id !== id)
    }));
  }

  function addShelf(id) {
    if (!byId(id) || saved.shelf.some(entry => entry.id === id)) return;
    setSaved(value => ({
      ...value,
      shelf: [...value.shelf, {
        id,
        status: 'To read',
        progress: 0,
        note: ''
      }]
    }));
    setNotice('Added to your personal reading shelf.');
  }

  function updateShelf(id, changes) {
    setSaved(value => ({
      ...value,
      shelf: value.shelf.map(entry => entry.id === id ? {
        ...entry,
        ...changes
      } : entry)
    }));
  }

  function resetFilters() {
    setSearch('');
    setCollection('All books');
    setOnlySaved(false);
    setSort('featured');
  }

  function startCheckout() {
    if (!saved.bag.length) return;
    setPanel(null);
    setCheckout({
      lines: saved.bag.map(line => ({ id: line.id, name: byId(line.id).name, category: 'books', image: byId(line.id).image, price: byId(line.id).price, quantity: line.quantity, variant: byId(line.id).format || '' })),
      id: 'folio-book-bag',
      category: 'books',
      name: saved.bag.map(line => `${line.quantity} × ${byId(line.id).name}`).join(' | '),
      price: subtotal,
      image: '',
      description: 'Complete book bag · demo checkout'
    });
  }

  return (
    <div className="fc-site">
      <div className="fc-topline">
        <span>A LITTLE CURIOSITY GOES A LONG WAY.</span>
        <button onClick={() => setPanel({ kind: 'guide' })}>
          Make yourself a reading ritual <ArrowUpRight size={13} />
        </button>
      </div>
      <header className="fc-header">
        <button className="fc-brand" aria-label="Folio and Co home" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <BookOpen size={30} strokeWidth={1.4} />
          <span>folio <i>&</i> co.<small>THE BOOKSHOP / EDGEMART</small></span>
        </button>
        <nav aria-label="Books navigation">
          <button onClick={() => { resetFilters(); scrollTo(catalogueRef); }}>The bookshop</button>
          <button onClick={() => scrollTo(shelfRef)}>My reading shelf <span>{saved.shelf.length}</span></button>
          <button onClick={() => setPanel({ kind: 'guide' })}>A reader's guide</button>
        </nav>
        <div className="fc-header-actions">
          <button className="fc-icon" aria-label={`My saved books, ${saved.favourites.length} ${saved.favourites.length === 1 ? 'title' : 'titles'}`} onClick={() => { resetFilters(); setOnlySaved(true); scrollTo(catalogueRef); }}>
            <Heart size={21} /><b>{saved.favourites.length}</b>
          </button>
          <button className="fc-bag-button" aria-label={`My book bag, ${count} ${count === 1 ? 'copy' : 'copies'}`} onClick={() => setPanel({ kind: 'bag' })}>
            <ShoppingBag size={18} /><span>Book bag</span><b>{count}</b>
          </button>
        </div>
      </header>
      <main>
        <section className="fc-hero">
          <div className="fc-hero-copy">
            <span className="fc-eyebrow">THE KNOWLEDGE EDIT / VOLUME 01</span>
            <h1>For your<br />next <em>chapter.</em></h1>
            <p>New ideas. Better questions. A page worth turning.<br />Find a little room for the books that move you forward.</p>
            <div className="fc-hero-actions">
              <button className="fc-primary" onClick={() => { resetFilters(); scrollTo(catalogueRef); }}>
                Browse the bookshop <ArrowRight size={17} />
              </button>
              <button className="fc-text-button" onClick={() => scrollTo(shelfRef)}>
                Build my reading shelf <ArrowUpRight size={16} />
              </button>
            </div>
            <div className="fc-hero-caption">
              <span>{BOOKS.length.toString().padStart(2,'0')} TITLES / ONE CURIOUS MIND</span>
              <p>A focused collection.<br />An open world of ideas.</p>
            </div>
          </div>
          <div className="fc-hero-art em-photo-hero">
            <DepartmentPhoto department="books" eager/>
          </div>
        </section>
        <div className="fc-ribbon">
          <span><Search size={19} /> Find a title that speaks to you.</span>
          <span><Bookmark size={19} /> Give your reading a little rhythm.</span>
          <span><Heart size={19} /> Keep your next reads close.</span>
        </div>
        <section className="fc-catalogue fc-section" ref={catalogueRef} aria-labelledby="fc-catalogue-title">
          <div className="fc-section-header">
            <div>
              <span className="fc-eyebrow">A SMALL COLLECTION. BIG POSSIBILITIES.</span>
              <h2 id="fc-catalogue-title">Ideas worth <em>keeping.</em></h2>
            </div>
            <span className="fc-section-number">01 / THE BOOKSHOP</span>
          </div>
          <div className="fc-catalogue-toolbar">
            <div className="fc-tabs" role="group" aria-label="Book collections">
              {['All books', ...new Set(BOOKS.map(book=>book.collection).filter(Boolean))].map(item => (
                <button key={item} aria-pressed={collection === item} onClick={() => setCollection(item)}>{item}</button>
              ))}
            </div>
            <label className="fc-search">
              <Search size={17} />
              <input type="search" aria-label="Search books" placeholder="A title, topic or catalogue author…" value={search} onChange={event => setSearch(event.target.value)} />
              {search && <button aria-label="Clear book search" onClick={() => setSearch('')}><X size={15} /></button>}
            </label>
          </div>
          <div className="fc-result-bar">
            <span>{books.length} {books.length === 1 ? 'title' : 'titles'} in this edit</span>
            <div>
              <label className="fc-saved-filter">
                <input type="checkbox" checked={onlySaved} onChange={event => setOnlySaved(event.target.checked)} />
                Saved books
              </label>
              <label className="fc-sort">
                <span className="fc-sr-only">Sort books</span>
                <select aria-label="Sort books" value={sort} onChange={event => setSort(event.target.value)}>
                  <option value="featured">Featured order</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                  <option value="title">Title: A to Z</option>
                </select>
                <ChevronDown size={14} />
              </label>
            </div>
          </div>
          <DepartmentOffers department="books"/>
          {books.length ? (
            <div className="fc-book-grid">
              {books.map((book) => (
                <article key={book.id} className="fc-book-card">
                  <div className={`fc-book-stage fc-stage-${book.colour}`}>
                    <span className="fc-card-index">0{BOOKS.indexOf(book) + 1} / THE KNOWLEDGE EDIT</span>
                    <button className="fc-card-cover-button" aria-label={`View ${book.name}`} onClick={() => setPanel({ kind: 'book', book })}>
                      <Cover book={book} />
                    </button>
                    <button className="fc-save-button" aria-label={`${saved.favourites.includes(book.id) ? 'Unsave' : 'Save'} ${book.name}`} aria-pressed={saved.favourites.includes(book.id)} onClick={() => toggleFavourite(book.id)}>
                      <Heart size={19} fill={saved.favourites.includes(book.id) ? 'currentColor' : 'none'} />
                    </button>
                    <span className="fc-stage-caption">PRODUCT PHOTO / CATALOGUE TITLE</span>
                  </div>
                  <div className="fc-card-copy">
                    <span className="fc-eyebrow">{book.collection}</span>
                    <button className="fc-title-button" onClick={() => setPanel({ kind: 'book', book })}>
                      <h3>{book.name}</h3>
                    </button>
                    <p>{book.description}</p>
                    <div className="fc-card-meta">
                      <span>{book.format}</span>
                      <button className="fc-text-button" onClick={() => addShelf(book.id)} disabled={saved.shelf.some(entry => entry.id === book.id)}>
                        <Bookmark size={13} />{saved.shelf.some(entry => entry.id === book.id) ? 'On my shelf' : 'Add to shelf'}
                      </button>
                    </div>
                    <div className="fc-card-bottom">
                      <strong>{money(book.price)}</strong>
                      <button className="fc-primary" aria-label={`Add ${book.name} to book bag`} onClick={() => addBook(book.id)} disabled={book.inStock === false}>
                        Add to bag <Plus size={17} />
                      </button>
                    </div>
                    <DeliveryEstimate department="books" product={book}/>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="fc-empty">
              <Search size={32} />
              <h3>A different search, a new chapter.</h3>
              <p>No books match these choices. Try another title or clear your filters.</p>
              <button className="fc-primary" onClick={resetFilters}>Show all books <ArrowRight size={16} /></button>
            </div>
          )}
          <p className="fc-catalogue-note">This edit uses the books in your EdgeMart catalogue. Book photos are representative; edition, author, format and availability should be confirmed with the retailer.</p>
        </section>
        <section className="fc-reading-banner">
          <span className="fc-eyebrow">LESS SCROLLING. MORE PAGE TURNING.</span>
          <h2>A few pages.<br /><em>A little perspective.</em></h2>
          <p>No perfect routine required. Give your next read a home, track your progress, and make a note of what stays with you.</p>
          <button className="fc-primary" onClick={() => scrollTo(shelfRef)}>Make room on my shelf <ArrowRight size={16} /></button>
          <div className="fc-page-decoration" aria-hidden="true">
            <span>“</span>
            <p>ONE PAGE<br />AT A TIME.</p>
            <BookOpen size={96} strokeWidth={.8} />
          </div>
        </section>
        <section className="fc-section fc-shelf" ref={shelfRef} aria-labelledby="fc-shelf-title">
          <div className="fc-section-header">
            <div>
              <span className="fc-eyebrow">YOUR OWN LITTLE LIBRARY</span>
              <h2 id="fc-shelf-title">The next chapter<br /><em>is yours.</em></h2>
            </div>
            <span className="fc-section-number">02 / MY READING SHELF</span>
          </div>
          <div className="fc-shelf-intro">
            <p>Plan what to read, record your progress and keep a thought for later. This personal shelf is separate from your shopping bag.</p>
            <label>
              Add a book to my shelf
              <select aria-label="Add a book to reading shelf" value="" onChange={event => addShelf(event.target.value)}>
                <option value="">Choose a title…</option>
                {BOOKS.map(book => (
                  <option key={book.id} value={book.id} disabled={saved.shelf.some(entry => entry.id === book.id)}>
                    {book.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {saved.shelf.length ? (
            <div className="fc-shelf-grid">
              {saved.shelf.map(entry => {
                const book = byId(entry.id);
                return (
                  <article className="fc-shelf-card" key={entry.id}>
                    <div className="fc-shelf-card-header">
                      <Cover book={book} small />
                      <div>
                        <span className="fc-eyebrow">{book.collection}</span>
                        <h3>{book.name}</h3>
                      </div>
                      <button className="fc-icon" aria-label={`Remove ${book.name} from reading shelf`} onClick={() => setSaved(value => ({
                        ...value,
                        shelf: value.shelf.filter(item => item.id !== entry.id)
                      }))}>
                        <Trash2 size={17} />
                      </button>
                    </div>
                    <label className="fc-field">
                      Reading status
                      <select aria-label={`Reading status for ${book.name}`} value={entry.status} onChange={event => updateShelf(entry.id, {
                        status: event.target.value,
                        ...(event.target.value === 'Finished' ? { progress: 100 } : {})
                      })}>
                        {STATUSES.map(status => <option key={status}>{status}</option>)}
                      </select>
                    </label>
                    <label className="fc-progress-label" htmlFor={`fc-progress-${entry.id}`}>
                      My progress <strong>{entry.progress}%</strong>
                    </label>
                    <input id={`fc-progress-${entry.id}`} type="range" min="0" max="100" step="5" aria-label={`Reading progress for ${book.name}`} value={entry.progress} disabled={entry.status === 'Finished'} onChange={event => updateShelf(entry.id, {
                      progress: Number(event.target.value)
                    })} />
                    <label className="fc-field">
                      A thought to keep
                      <textarea aria-label={`Reading notes for ${book.name}`} maxLength={240} placeholder="An idea, a question, a favourite moment…" value={entry.note} onChange={event => updateShelf(entry.id, {
                        note: event.target.value
                      })} />
                    </label>
                    <div className="fc-shelf-card-footer">
                      <span>{entry.note.length}/240 characters</span>
                      {entry.status === 'Finished' && <span><Check size={12} /> Finished, thoughtfully.</span>}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="fc-empty fc-empty-shelf">
              <Bookmark size={35} />
              <h3>Your next read belongs here.</h3>
              <p>Add a catalogue title above or use “Add to shelf” in the bookshop.</p>
              <button className="fc-text-button" onClick={() => scrollTo(catalogueRef)}>Find my next read <ArrowRight size={16} /></button>
            </div>
          )}
          <p className="fc-catalogue-note">Your favourites, bag and reading shelf are saved in this browser when storage is available. Progress is entered by you; it does not track a reader app or sync to an account.</p>
        </section>
      </main>
      <footer className="fc-footer">
        <div className="fc-footer-brand">folio <i>&</i> co.<small>GOOD IDEAS HAVE A WAY OF FINDING YOU.</small></div>
        <div>
          <button onClick={onBackToLanding}><ArrowLeft size={14} /> All EdgeMart departments</button>
          <button onClick={() => setPanel({ kind: 'guide' })}>Books, your shelf & ordering</button>
        </div>
        <span>EdgeMart books & literary · Demo shopping experience</span>
      </footer>
      <div className="fc-notices" role="status" aria-live="polite">
        {notice && <span>{notice}</span>}
        {storageWarning && <span>Browser storage is unavailable. Your changes will last for this visit.</span>}
      </div>
      {count > 0 && !panel && !checkout && (
        <button className="fc-bag-tray" onClick={() => setPanel({ kind: 'bag' })}>
          <span><ShoppingBag size={18} />{count} {count === 1 ? 'book' : 'books'}</span>
          <span>View book bag <strong>{money(subtotal)}</strong><ArrowRight size={17} /></span>
        </button>
      )}
      {panel?.kind === 'book' && (
        <Modal key="book" title="A closer look" onClose={() => setPanel(null)}>
          <div className="fc-detail">
            <div className={`fc-detail-cover fc-stage-${panel.book.colour}`}>
              <Cover book={panel.book} />
              <small>Representative book photograph; confirm the exact edition.</small>
            </div>
            <div className="fc-detail-copy">
              <span className="fc-eyebrow">{panel.book.collection}</span>
              <h3>{panel.book.name}</h3>
              <p>{panel.book.description}</p>
              <dl>
                <div><dt>Catalogue format</dt><dd>{panel.book.format}</dd></div>
                <div><dt>Catalogue author</dt><dd>{panel.book.bookMeta?.author || 'Not listed'}</dd></div>
                <div><dt>Listed price</dt><dd>{money(panel.book.price)}</dd></div>
              </dl>
              <p className="fc-detail-note">Confirm the exact edition and author before a real purchase. The existing catalogue is a demo collection.</p>
              <button className="fc-primary fc-full" onClick={() => addBook(panel.book.id)}>
                Add to my book bag <span>{money(panel.book.price)} <Plus size={16} /></span>
              </button>
              <div className="fc-detail-actions">
                <button className="fc-secondary" aria-pressed={saved.favourites.includes(panel.book.id)} onClick={() => toggleFavourite(panel.book.id)}>
                  <Heart size={16} />{saved.favourites.includes(panel.book.id) ? 'Saved' : 'Save this book' }
                </button>
                <button className="fc-secondary" disabled={saved.shelf.some(entry => entry.id === panel.book.id)} onClick={() => addShelf(panel.book.id)}>
                  <Bookmark size={16} />{saved.shelf.some(entry => entry.id === panel.book.id) ? 'On my shelf' : 'Add to shelf'}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
      {panel?.kind === 'bag' && (
        <Modal key="bag" title="Your book bag" drawer onClose={() => setPanel(null)}>
          {saved.bag.length ? (
            <>
              <div className="fc-bag-intro">
                <span className="fc-eyebrow">{count} COPIES / {saved.bag.length} TITLES</span>
                <p>A little stack of new possibilities.</p>
              </div>
              <div className="fc-bag-lines">
                {saved.bag.map(line => {
                  const book = byId(line.id);
                  return (
                    <article className="fc-bag-line" key={line.id}>
                      <Cover book={book} small />
                      <div>
                        <h3>{book.name}</h3>
                        <p>{book.format}</p>
                        <div className="fc-quantity">
                          <button aria-label={`Decrease ${book.name}`} disabled={line.quantity === 1} onClick={() => changeQuantity(line.id, -1)}><Minus size={13} /></button>
                          <span aria-label={`${book.name} quantity`}>{line.quantity}</span>
                          <button aria-label={`Increase ${book.name}`} disabled={line.quantity === 20} onClick={() => changeQuantity(line.id, 1)}><Plus size={13} /></button>
                        </div>
                        <strong>{money(book.price * line.quantity)}</strong>
                        <small>{money(book.price)} per copy</small>
                      </div>
                      <button className="fc-icon" aria-label={`Remove ${book.name} from book bag`} onClick={() => removeBook(line.id)}><X size={17} /></button>
                    </article>
                  );
                })}
              </div>
              <div className="fc-bag-summary">
                <div><span>Books subtotal</span><strong>{money(subtotal)}</strong></div>
                <p>Delivery estimates and optional preview promotions appear in shared checkout.</p>
                <button className="fc-primary fc-full" onClick={startCheckout}>Continue to checkout <ArrowRight size={16} /></button>
                <small>Preview only. Closing checkout preserves your bag; saving a preview clears it.</small>
              </div>
            </>
          ) : (
            <div className="fc-empty">
              <ShoppingBag size={35} />
              <h3>Room for your next chapter.</h3>
              <p>Choose a title from the bookshop to begin.</p>
              <button className="fc-primary" onClick={() => { setPanel(null); resetFilters(); scrollTo(catalogueRef); }}>
                Explore the books <ArrowRight size={16} />
              </button>
            </div>
          )}
        </Modal>
      )}
      {panel?.kind === 'guide' && (
        <Modal key="guide" title="A reader's little guide" onClose={() => setPanel(null)}>
          <div className="fc-guide">
            <article><Search size={23} /><div><h3>A focused bookshop.</h3><p>Search the existing catalogue titles by title, topic or listed author. Browse Architecture and Programming, sort by price or title, and save a book for later. No invented sales figures, reviews or stock counts are shown.</p></div></article>
            <article><BookOpen size={23} /><div><h3>Covers with a little character.</h3><p>These book photographs are representative, and may not show the publisher’s exact edition. Confirm edition, author, format and availability with the retailer before ordering. Unlisted information stays unlisted.</p></div></article>
            <article><Bookmark size={23} /><div><h3>A shelf that belongs to you.</h3><p>Add any catalogue book to your personal reading plan. Choose To read, Reading or Finished, enter progress and save a short note. Finished books show 100% and their progress control is locked until you change the status. Shelf entries are separate from purchases.</p></div></article>
            <article><ShoppingBag size={23} /><div><h3>Your bag keeps the whole stack.</h3><p>Copies of the same title combine up to 20. Change quantities or remove a title in the bag. All titles, quantities and their combined subtotal go to the shared checkout. Closing checkout preserves the bag; saving a preview clears the checked-out bag.</p></div></article>
            <article><Heart size={23} /><div><h3>Saved here, for your next visit.</h3><p>Favourites, bag, reading notes and progress are stored only in this browser when local storage is available. They do not sync with accounts or send notifications.</p></div></article>
            <article><div><h3>A preview of ordering.</h3><p>The shared EdgeMart checkout includes your full bag, address and delivery preferences, payment choices and a preview receipt. No money is collected or order sent to a retailer. Saved previews appear in Preview orders across all departments.</p></div></article>
          </div>
        </Modal>
      )}
      {checkout && (
        <CheckoutLifecycle
          item={checkout}
          quantity={1}
          onComplete={() => { setSaved(old => ({ ...old, bag: [] })); }}
          onBack={() => { setCheckout(null); setPanel({ kind: 'bag' }); }}
          onClose={() => setCheckout(null)}
        />
      )}
    </div>
  );
}
