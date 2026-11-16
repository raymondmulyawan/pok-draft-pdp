/* PDP behaviour: swatches, size, qty, BNPL panel, stock meter, live viewers,
   countdown, thumbs, accordions, FAQ, bundle, sticky bar.
   Derived values mirror renderVals() in the PDP v4 source.

   Add-to-cart clicks are NOT handled here. js/cart.js owns the single delegated
   document listener and asks this file what to add via POK.pdp.itemsFor(key),
   then calls POK.pdp.flash(key) for the 2.2s "✓ Added to cart" feedback. */
(function () {
  'use strict';

  var POK = (window.POK = window.POK || {});
  var D = POK.data;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function money(n) { return '$' + n.toLocaleString('en-AU'); }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, ''); }

  /* State (same shape as the source Component.state) ---------------------- */
  var S = {
    c: 0,                     // colour index
    s: 2,                     // size index
    qty: 1,
    faq: 0,                   // open FAQ index (-1 = none)
    rows: {},                 // open accordions
    added: false,             // main + sticky button feedback
    scrolled: false,
    viewers: 18,
    secs: 4 * 3600 + 12 * 60, // dispatch countdown
    bundle: { trivet: true, spoon: true, mitts: false },
    bundleAdded: false,
    payOpen: false,
    collAdded: {},
    thumb: 0
  };
  var timers = {};

  /* [data-bind] lookup ------------------------------------------------------ */
  var binds = {};
  function indexBinds() {
    $$('[data-bind]').forEach(function (el) {
      var k = el.getAttribute('data-bind');
      (binds[k] = binds[k] || []).push(el);
    });
  }
  function setBind(key, val) {
    var list = binds[key];
    if (!list) return;
    for (var i = 0; i < list.length; i++) list[i].textContent = val;
  }

  /* Casserole variant → cart item ------------------------------------------ */
  function casseroleItem(qty) {
    var c = D.colors[S.c], s = D.sizes[S.s];
    return {
      id: 'casserole-' + slug(c.name) + '-' + slug(s.short),
      brand: 'Emile Henry',
      name: 'Sublime Round Casserole ' + c.name + ' ' + s.short,
      variant: c.name + ' · ' + s.short,
      price: s.price,
      rrp: s.rrp,
      qty: qty,
      short: 'Casserole',
      img: D.imgFor('casserole')
    };
  }

  function chosenAddOns() {
    return D.addOns.filter(function (a) { return S.bundle[a.id]; });
  }

  /* What each [data-add] key should put in the cart --------------------------- */
  function itemsFor(key) {
    if (key === 'main' || key === 'sticky') return [casseroleItem(S.qty)];
    if (key === 'bundle') {
      var list = [casseroleItem(1)];
      chosenAddOns().forEach(function (a) { list.push(D.item(a.id, 1)); });
      return list;
    }
    var one = D.item(key, 1);
    return one ? [one] : [];
  }

  /* 2.2s "✓ Added to cart" feedback ----------------------------------------- */
  function flash(key) {
    if (key === 'main' || key === 'sticky') {
      S.added = true;
      clearTimeout(timers.added);
      timers.added = setTimeout(function () { S.added = false; renderCta(); }, 2200);
      renderCta();
    } else if (key === 'bundle') {
      S.bundleAdded = true;
      clearTimeout(timers.bundle);
      timers.bundle = setTimeout(function () { S.bundleAdded = false; renderBundle(); }, 2200);
      renderBundle();
    } else if (D.catalogue[key]) {
      S.collAdded[key] = true;
      clearTimeout(timers['c' + key]);
      timers['c' + key] = setTimeout(function () { S.collAdded[key] = false; renderCollection(); }, 2200);
      renderCollection();
    }
  }

  /* ---------------------------------------------------------------------------
     Builders (one-off markup from data.js)
  --------------------------------------------------------------------------- */
  function buildSwatches() {
    $('#swatches').innerHTML = D.colors.map(function (c, i) {
      return '<button type="button" class="swatch" role="radio" data-swatch="' + i + '" aria-label="' + esc(c.name) + '" aria-checked="false">' +
        '<span class="swatch__dot" style="background:' + c.hex + '"></span></button>';
    }).join('');
  }

  function buildSizes() {
    $('#size-select').innerHTML = D.sizes.map(function (s, i) {
      return '<option value="' + i + '"></option>';
    }).join('');
  }

  function bundleRow(id, locked) {
    return '<div class="bundle__row" data-bundle-row="' + id + '">' +
      '<label class="bundle__label' + (locked ? ' is-locked' : '') + '">' +
      '<input type="checkbox" class="bundle__check" data-bundle-check="' + id + '"' + (locked ? ' checked disabled' : '') + '>' +
      '<span class="bundle__thumb media"><span class="ph ph--xs" data-img="images/' + (locked ? 'casserole-hero' : id) + '.jpg"><span class="ph__label" data-f="short"></span></span></span>' +
      '<span class="bundle__info"><span class="bundle__name" data-f="name"></span><span class="bundle__meta" data-f="meta"></span></span>' +
      '</label>' +
      '<span class="bundle__prices"><span class="bundle__price" data-f="price"></span><span class="bundle__save" data-f="save"></span></span>' +
      '</div>';
  }

  function buildBundle() {
    var html = bundleRow('casserole', true);
    D.addOns.forEach(function (a) { html += bundleRow(a.id, false); });
    $('#bundle-list').innerHTML = html;

    var cas = $('[data-bundle-row="casserole"]');
    $('[data-f="short"]', cas).textContent = 'This item';
    $('[data-f="meta"]', cas).textContent = 'This item · always included';

    D.addOns.forEach(function (a) {
      var row = $('[data-bundle-row="' + a.id + '"]');
      var p = D.catalogue[a.id];
      $('[data-f="short"]', row).textContent = p.short;
      $('[data-f="name"]', row).textContent = a.name;
      $('[data-f="meta"]', row).textContent = a.meta;
      $('[data-f="price"]', row).textContent = money(p.price);
      $('[data-f="save"]', row).textContent = 'save ' + money(p.rrp - p.price);
    });
  }

  function buildAccordion() {
    $('#accordion').innerHTML = D.accordion.map(function (r, i) {
      return '<div class="acc__item">' +
        '<button type="button" class="acc__btn" id="acc-btn-' + i + '" data-acc="' + i + '" aria-expanded="false" aria-controls="acc-panel-' + i + '">' +
        '<span>' + esc(r.title) + '</span><span class="acc__sign" aria-hidden="true">+</span></button>' +
        '<div class="acc__body" id="acc-panel-' + i + '" role="region" aria-labelledby="acc-btn-' + i + '" hidden></div>' +
        '</div>';
    }).join('');
  }

  function buildFaq() {
    $('#faq-list').innerHTML = D.faq.map(function (f, i) {
      return '<div class="faq__item">' +
        '<button type="button" class="faq__btn" id="faq-btn-' + i + '" data-faq="' + i + '" aria-expanded="false" aria-controls="faq-panel-' + i + '">' +
        '<span class="faq__q">' + esc(f.q) + '</span><span class="faq__sign" aria-hidden="true">+</span></button>' +
        '<div class="faq__a" id="faq-panel-' + i + '" role="region" aria-labelledby="faq-btn-' + i + '" hidden>' + esc(f.a) + '</div>' +
        '</div>';
    }).join('');
  }

  function buildCollection() {
    $('#collection-grid').innerHTML = D.collection.map(function (id) {
      var p = D.catalogue[id];
      return '<div class="card">' +
        '<a href="#" class="card__media media" aria-label="' + esc(p.brand + ' ' + p.name) + '"><div class="ph" data-img="' + D.imgFor(id) + '"><span class="ph__label">' + esc(p.cat) + '</span></div></a>' +
        '<div class="card__body">' +
        '<span class="card__cat">' + esc(p.cat) + '</span>' +
        '<a href="#" class="card__name">' + esc(p.brand + ' ' + p.name) + '</a>' +
        '<span class="card__prices"><span class="card__price">' + money(p.price) + '</span><span class="card__rrp">RRP ' + money(p.rrp) + '</span></span>' +
        '<span class="card__spacer"></span>' +
        '<button type="button" class="btn card__add" data-add="' + id + '"></button>' +
        '</div></div>';
    }).join('');
  }

  /* ---------------------------------------------------------------------------
     Renderers (derived values: see renderVals() in the source)
  --------------------------------------------------------------------------- */
  function renderCta() {
    setBind('cartLabel', S.added ? '✓ Added to cart' : '+ Add to cart');
  }

  function renderCountdown() {
    var sec = S.secs;
    setBind('countdown', pad(Math.floor(sec / 3600)) + 'h ' + pad(Math.floor((sec % 3600) / 60)) + 'm ' + pad(sec % 60) + 's');
  }

  function renderBundle() {
    var c = D.colors[S.c], s = D.sizes[S.s];
    var chosen = chosenAddOns();
    var bundleTotal = s.price + chosen.reduce(function (t, a) { return t + D.catalogue[a.id].price; }, 0);
    var bundleRrp = s.rrp + chosen.reduce(function (t, a) { return t + D.catalogue[a.id].rrp; }, 0);
    var maxSave = D.addOns.reduce(function (t, a) { var p = D.catalogue[a.id]; return t + (p.rrp - p.price); }, 0);
    var allOn = D.addOns.every(function (a) { return S.bundle[a.id]; });

    var cas = $('[data-bundle-row="casserole"]');
    $('[data-f="name"]', cas).textContent = 'Sublime Round Casserole ' + c.name + ' ' + s.short;
    $('[data-f="price"]', cas).textContent = money(s.price);
    $('[data-f="save"]', cas).textContent = 'save ' + money(s.rrp - s.price);

    D.addOns.forEach(function (a) {
      $('[data-bundle-check="' + a.id + '"]').checked = !!S.bundle[a.id];
    });

    setBind('bundleMaxSave', 'Save ' + money(maxSave) + ' on the extras');
    setBind('bundleCount', chosen.length ? chosen.length + (chosen.length === 1 ? ' extra selected' : ' extras selected') : 'Casserole only');
    setBind('bundleRrp', bundleRrp > bundleTotal ? money(bundleRrp) : '');
    setBind('bundleTotal', money(bundleTotal));
    setBind('bundleSaved', bundleRrp > bundleTotal ? 'you save ' + money(bundleRrp - bundleTotal) + ' off RRP' : '');
    setBind('selectAll', allOn ? 'Clear all extras' : 'Add all ' + D.addOns.length + ' extras — save ' + money(maxSave));
    setBind('bundleCta', S.bundleAdded
      ? '✓ Added to cart'
      : 'Add ' + (chosen.length + 1) + (chosen.length ? ' items' : ' item') + ' to cart — ' + money(bundleTotal));
    $('[data-add="bundle"]').classList.toggle('is-added', S.bundleAdded);
  }

  function renderCollection() {
    $$('#collection-grid [data-add]').forEach(function (btn) {
      var on = !!S.collAdded[btn.getAttribute('data-add')];
      btn.textContent = on ? '✓ Added to cart' : '+ Add to cart';
      btn.classList.toggle('is-added', on);
    });
  }

  function renderAccordion() {
    var c = D.colors[S.c], s = D.sizes[S.s];
    D.accordion.forEach(function (r, i) {
      var open = !!S.rows[i];
      var btn = $('#acc-btn-' + i), panel = $('#acc-panel-' + i);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      $('.acc__sign', btn).textContent = open ? '−' : '+';
      panel.hidden = !open;
      panel.textContent = typeof r.body === 'function' ? r.body(c, s) : r.body;
    });
  }

  function renderFaq() {
    D.faq.forEach(function (f, i) {
      var open = S.faq === i;
      var btn = $('#faq-btn-' + i), panel = $('#faq-panel-' + i);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      $('.faq__sign', btn).textContent = open ? '−' : '+';
      panel.hidden = !open;
    });
  }

  function update() {
    var c = D.colors[S.c], s = D.sizes[S.s];

    setBind('title', 'Sublime Round Casserole ' + c.name + ' ' + s.short);
    setBind('colourName', c.name);
    setBind('sizeShort', s.short);
    setBind('capacity', s.cap);
    setBind('rrp', s.rrp.toLocaleString('en-AU'));
    setBind('price', s.price.toLocaleString('en-AU'));
    setBind('saveAmt', (s.rrp - s.price).toLocaleString('en-AU'));
    setBind('savePct', String(Math.round((1 - s.price / s.rrp) * 100)));
    setBind('instalment', '$' + (s.price / 4).toFixed(2));
    setBind('stock', String(s.stock));
    setBind('soldCopy', s.sold + ' sold in the last 24 hours');
    setBind('viewers', String(S.viewers));
    setBind('qty', String(S.qty));
    $('#stock-fill').style.width = Math.max(8, Math.round((s.stock / 12) * 100)) + '%';

    setBind('payLabel', S.payOpen ? 'Hide ▴' : 'Compare ▾');
    $('#bnpl-toggle').setAttribute('aria-expanded', S.payOpen ? 'true' : 'false');
    $('#bnpl-panel').hidden = !S.payOpen;

    $$('#swatches .swatch').forEach(function (b, i) {
      b.classList.toggle('is-selected', i === S.c);
      b.setAttribute('aria-checked', i === S.c ? 'true' : 'false');
    });

    var sel = $('#size-select');
    $$('option', sel).forEach(function (o, i) {
      o.textContent = 'Emile Henry - Sublime Round Casserole ' + c.name + ' ' + D.sizes[i].short;
    });
    sel.value = String(S.s);

    $$('.thumb').forEach(function (t, i) {
      t.classList.toggle('is-active', i === S.thumb);
      t.setAttribute('aria-pressed', i === S.thumb ? 'true' : 'false');
    });

    renderCta();
    renderCountdown();
    renderBundle();
    renderAccordion();
    renderFaq();
    renderCollection();
  }

  /* ---------------------------------------------------------------------------
     Events
  --------------------------------------------------------------------------- */
  function bindEvents() {
    $('#swatches').addEventListener('click', function (e) {
      var b = e.target.closest('[data-swatch]');
      if (!b) return;
      S.c = Number(b.getAttribute('data-swatch'));
      S.added = false;
      update();
    });

    $('#size-select').addEventListener('change', function (e) {
      S.s = Number(e.target.value);
      S.added = false;
      update();
    });

    $('#qty-dec').addEventListener('click', function () { S.qty = Math.max(1, S.qty - 1); update(); });
    $('#qty-inc').addEventListener('click', function () { S.qty += 1; update(); });

    $('#bnpl-toggle').addEventListener('click', function () { S.payOpen = !S.payOpen; update(); });

    $$('.thumb').forEach(function (t) {
      t.addEventListener('click', function () {
        S.thumb = Number(t.getAttribute('data-thumb'));
        // when real photos are loaded, the thumb also swaps the hero image
        var src = $('.ph img', t), hero = $('.gallery__hero .ph img');
        if (src && hero) { hero.src = src.src; hero.alt = src.alt; }
        update();
      });
    });

    $('#accordion').addEventListener('click', function (e) {
      var b = e.target.closest('[data-acc]');
      if (!b) return;
      var i = Number(b.getAttribute('data-acc'));
      S.rows[i] = !S.rows[i];
      renderAccordion();
    });

    $('#faq-list').addEventListener('click', function (e) {
      var b = e.target.closest('[data-faq]');
      if (!b) return;
      var i = Number(b.getAttribute('data-faq'));
      S.faq = S.faq === i ? -1 : i;
      renderFaq();
    });

    $('#bundle-list').addEventListener('change', function (e) {
      var id = e.target.getAttribute('data-bundle-check');
      if (!id || id === 'casserole') return;
      S.bundle[id] = e.target.checked;
      S.bundleAdded = false;
      renderBundle();
    });

    $('#bundle-all').addEventListener('click', function () {
      var allOn = D.addOns.every(function (a) { return S.bundle[a.id]; });
      var next = {};
      D.addOns.forEach(function (a) { next[a.id] = !allOn; });
      S.bundle = next;
      S.bundleAdded = false;
      renderBundle();
    });

    /* Rail/line changes in the drawer keep the bundle checkboxes in sync:
       adding an add-on from the rail ticks it, removing it unticks it. */
    document.addEventListener('pok:cart', function (e) {
      var d = e.detail || {};
      var touched = false;
      (d.ids || []).forEach(function (id) {
        var isAddOn = D.addOns.some(function (a) { return a.id === id; });
        if (!isAddOn) return;
        if (d.type === 'add' && !S.bundle[id]) { S.bundle[id] = true; touched = true; }
        if (d.type === 'remove' && S.bundle[id]) { S.bundle[id] = false; touched = true; }
      });
      if (touched) { S.bundleAdded = false; renderBundle(); }
    });

    /* sticky buy bar after 620px */
    var bar = $('#sticky-bar');
    function onScroll() {
      var y = window.scrollY || (document.scrollingElement || document.documentElement).scrollTop || document.body.scrollTop || 0;
      var next = y > 620;
      if (next !== S.scrolled) { S.scrolled = next; bar.hidden = !next; }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function startTimers() {
    setInterval(function () { S.secs = Math.max(0, S.secs - 1); renderCountdown(); }, 1000);
    setInterval(function () { S.viewers = 14 + Math.floor(Math.random() * 9); setBind('viewers', String(S.viewers)); }, 5000);
  }

  function init() {
    indexBinds();
    buildSwatches();
    buildSizes();
    buildBundle();
    buildAccordion();
    buildFaq();
    buildCollection();
    // (re)index after builders added any [data-bind] nodes (none today, but cheap)
    binds = {};
    indexBinds();
    bindEvents();
    update();
    startTimers();
    POK.img.hydrate(document);
  }

  POK.pdp = { itemsFor: itemsFor, flash: flash, state: function () { return S; } };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
