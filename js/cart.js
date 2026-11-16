/* Cart state + drawer (design option 2a: swipeable "Pairs well with" rail).
   Public API: POK.cart.add / remove / open / close (+ items, count, subtotal, has).

   MUST-HAVE: one delegated click listener on `document` for `#cart-btn, [data-add]`
   opens the drawer every time (empty cart, repeat adds, same item twice).
   Rail "+ Add" buttons use data-rail (not data-add) so they add without re-opening. */
(function () {
  'use strict';

  var POK = (window.POK = window.POK || {});
  var D = POK.data;

  var lines = [];            // [{ id, brand, name, variant, price, rrp, qty, short, img }]
  var isOpen = false;
  var lastTrigger = null;
  var toastTimer = null;

  var el = {};               // DOM refs, filled in init()

  function money(n) { return '$' + n.toLocaleString('en-AU'); }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function find(id) {
    for (var i = 0; i < lines.length; i++) if (lines[i].id === id) return lines[i];
    return null;
  }
  function count() { return lines.reduce(function (t, l) { return t + l.qty; }, 0); }
  function subtotal() { return lines.reduce(function (t, l) { return t + l.price * l.qty; }, 0); }

  /* ---------- state changes ---------- */
  function emit(type, ids) {
    var ev;
    try { ev = new CustomEvent('pok:cart', { detail: { type: type, ids: ids } }); }
    catch (err) { ev = document.createEvent('CustomEvent'); ev.initCustomEvent('pok:cart', false, false, { type: type, ids: ids }); }
    document.dispatchEvent(ev);
  }

  function add(items) {
    if (!items) return;
    if (!Array.isArray(items)) items = [items];
    var ids = [];
    items.forEach(function (it) {
      if (!it || !it.id) return;
      var q = it.qty > 0 ? it.qty : 1;
      var line = find(it.id);
      if (line) {
        line.qty += q;                       // same variant → bump qty, never duplicate
      } else {
        lines.push({
          id: it.id, brand: it.brand || '', name: it.name || '', variant: it.variant || '',
          price: it.price || 0, rrp: it.rrp || 0, qty: q, short: it.short || '', img: it.img || ''
        });
      }
      ids.push(it.id);
    });
    render();
    emit('add', ids);
  }

  function remove(id) {
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].id === id) {
        lines.splice(i, 1);
        render();
        emit('remove', [id]);
        return true;
      }
    }
    return false;
  }

  /* ---------- rendering ---------- */
  function ph(it, cls) {
    return '<div class="ph ' + (cls || 'ph--xs') + '" data-img="' + esc(it.img) + '"><span class="ph__label">' + esc(it.short || it.name) + '</span></div>';
  }

  function renderLines() {
    el.lines.innerHTML = lines.map(function (l) {
      return '<div class="line" data-line="' + esc(l.id) + '">' +
        '<div class="line__media media">' + ph(l) + '</div>' +
        '<div class="line__info">' +
        '<span class="line__brand">' + esc(l.brand) + '</span>' +
        '<span class="line__name">' + esc(l.name) + '</span>' +
        '<div class="line__row">' +
        '<div class="line__qty" role="group" aria-label="Quantity ' + l.qty + '"><span class="line__qty-btn" aria-hidden="true">-</span><span class="line__qty-val">' + l.qty + '</span><span class="line__qty-btn" aria-hidden="true">+</span></div>' +
        '<span class="line__price">' + money(l.price * l.qty) + '</span>' +
        '</div></div>' +
        '<button type="button" class="line__remove" data-remove="' + esc(l.id) + '" aria-label="Remove ' + esc(l.name) + ' from cart">✕</button>' +
        '</div>';
    }).join('');
    el.empty.hidden = lines.length > 0;
    POK.img.hydrate(el.lines);
  }

  /* Rail is built once so its scroll position survives re-renders. */
  function buildRail() {
    el.rail.innerHTML = D.rail.map(function (id) {
      var p = D.catalogue[id];
      var tag = D.railTags[id];
      return '<div class="rcard" data-rail-card="' + id + '">' +
        '<div class="rcard__media media"><div class="ph ph--xs" data-img="' + D.imgFor(id) + '"><span class="ph__label">' + esc(p.short) + '</span></div>' +
        (tag ? '<span class="rcard__tag">' + esc(tag) + '</span>' : '') + '</div>' +
        '<div class="rcard__body">' +
        '<span class="rcard__brand">' + esc(p.brand) + '</span>' +
        '<span class="rcard__name">' + esc(p.name) + '</span>' +
        '<span class="rcard__prices"><span class="rcard__price">' + money(p.price) + '</span><span class="rcard__rrp">' + money(p.rrp) + '</span></span>' +
        '<span class="rcard__spacer"></span>' +
        '<button type="button" class="rcard__btn" data-rail="' + id + '" aria-pressed="false"></button>' +
        '</div></div>';
    }).join('');
    POK.img.hydrate(el.rail);
  }

  function renderRail() {
    Array.prototype.forEach.call(el.rail.querySelectorAll('[data-rail]'), function (btn) {
      var id = btn.getAttribute('data-rail');
      var on = !!find(id);
      var p = D.catalogue[id];
      btn.textContent = on ? '✓ Added' : '+ Add';
      btn.classList.toggle('is-added', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.setAttribute('aria-label', (on ? 'Remove ' : 'Add ') + p.name + (on ? ' from cart' : ' to cart'));
    });
  }

  function render() {
    var n = count();
    renderLines();
    renderRail();
    el.count.textContent = n;
    el.subtotal.textContent = money(subtotal());
    el.badge.textContent = n;
    el.cartBtn.setAttribute('aria-label', 'Open cart, ' + n + (n === 1 ? ' item' : ' items'));
  }

  /* ---------- open / close ---------- */
  function focusables() {
    var list = el.drawer.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
    return Array.prototype.filter.call(list, function (n) { return n.offsetParent !== null || n === document.activeElement; });
  }

  function open(trigger) {
    if (isOpen) return;
    isOpen = true;
    lastTrigger = trigger && trigger.focus ? trigger : document.activeElement;

    var sbw = window.innerWidth - document.documentElement.clientWidth;   // avoid layout shift when scroll locks
    document.body.style.setProperty('--sbw', sbw > 0 ? sbw + 'px' : '0px');
    document.body.classList.add('is-locked', 'is-cart-open');
    el.drawer.setAttribute('aria-hidden', 'false');
    if ('inert' in el.page) el.page.inert = true;
    el.close.focus({ preventScroll: true });
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    document.body.classList.remove('is-cart-open', 'is-locked');
    document.body.style.removeProperty('--sbw');
    el.drawer.setAttribute('aria-hidden', 'true');
    if ('inert' in el.page) el.page.inert = false;

    var back = lastTrigger;
    if (!back || !document.contains(back) || back.offsetParent === null) back = el.cartBtn;
    back.focus({ preventScroll: true });
    lastTrigger = null;
  }

  /* ---------- toast ---------- */
  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.toast.classList.remove('is-visible'); }, 2400);
  }

  /* ---------- wiring ---------- */
  function init() {
    el.page = document.getElementById('page');
    el.drawer = document.getElementById('cart-drawer');
    el.overlay = document.getElementById('drawer-overlay');
    el.close = document.getElementById('drawer-close');
    el.lines = document.getElementById('drawer-lines');
    el.empty = document.getElementById('drawer-empty');
    el.rail = document.getElementById('rail-scroller');
    el.count = document.getElementById('drawer-count');
    el.subtotal = document.getElementById('drawer-subtotal');
    el.badge = document.getElementById('cart-badge');
    el.cartBtn = document.getElementById('cart-btn');
    el.toast = document.getElementById('toast');
    el.checkout = document.getElementById('checkout-btn');

    buildRail();
    render();

    /* THE listener: every cart button, delegated from document. */
    document.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('#cart-btn, [data-add]') : null;
      if (!t) return;
      e.preventDefault();
      var key = t.getAttribute('data-add');
      if (key) {
        try {
          var items = POK.pdp && POK.pdp.itemsFor(key);
          if (items && items.length) add(items);
          if (POK.pdp) POK.pdp.flash(key);
        } catch (err) {
          if (window.console) console.error(err);   // never let a bug stop the drawer opening
        }
      }
      open(t);
    });

    el.close.addEventListener('click', close);
    el.overlay.addEventListener('click', close);

    document.addEventListener('keydown', function (e) {
      if (!isOpen) return;
      if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      var f = focusables();
      if (!f.length) { e.preventDefault(); return; }
      var first = f[0], last = f[f.length - 1], active = document.activeElement;
      if (e.shiftKey && (active === first || active === el.drawer)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
      else if (!el.drawer.contains(active)) { e.preventDefault(); first.focus(); }
    });

    /* keep focus inside while open (fallback where inert isn't supported) */
    document.addEventListener('focusin', function (e) {
      if (isOpen && !el.drawer.contains(e.target)) el.close.focus({ preventScroll: true });
    });

    /* line remove ✕ (also resets the matching rail button via render) */
    el.lines.addEventListener('click', function (e) {
      var b = e.target.closest('[data-remove]');
      if (!b) return;
      var all = Array.prototype.slice.call(el.lines.querySelectorAll('[data-remove]'));
      var idx = all.indexOf(b);
      remove(b.getAttribute('data-remove'));
      var rest = el.lines.querySelectorAll('[data-remove]');
      var next = rest[Math.min(idx, rest.length - 1)];
      (next || el.close).focus({ preventScroll: true });
    });

    /* rail + Add / ✓ Added toggle. Adds (or removes) but never re-triggers open(). */
    el.rail.addEventListener('click', function (e) {
      var b = e.target.closest('[data-rail]');
      if (!b) return;
      var id = b.getAttribute('data-rail');
      if (find(id)) remove(id);
      else add([D.item(id, 1)]);
    });

    el.checkout.addEventListener('click', function () { toast('Prototype: checkout not built'); });
  }

  POK.cart = {
    add: add,
    remove: remove,
    open: open,
    close: close,
    has: function (id) { return !!find(id); },
    items: function () { return lines.map(function (l) { return Object.assign({}, l); }); },
    count: count,
    subtotal: subtotal
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
