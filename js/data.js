/* Peter's of Kensington draft PDP: data
   Shared namespace: window.POK. Copy, prices and variants come from
   reference/Sublime Round Casserole PDP v4.dc.html (renderVals) and
   the product table in CLAUDE.md. */
(function () {
  'use strict';

  var POK = (window.POK = window.POK || {});

  /* Prototype switches ------------------------------------------------- */
  POK.config = {
    /* When true the image helper tries each data-img path and swaps the placeholder
       for an <img> once the file loads (if it doesn't exist the placeholder stays).
       Every slot now has a photo in /images, so this is on. If you add a new
       placeholder without a photo, expect one 404 in the console for it. */
    probeImages: true
  };

  /* Colours + sizes (PDP v4 renderVals) --------------------------------- */
  var colors = [
    { name: 'Graphite', hex: '#3C3F44' },
    { name: 'Indigo', hex: '#28324F' },
    { name: 'Clay', hex: '#C2A079' },
    { name: 'Fig', hex: '#6E4638' }
  ];

  var sizes = [
    { short: '24cm/2.5l', cap: '2.5L', rrp: 449, price: 246, stock: 7, sold: 9 },
    { short: '28cm/4.2l', cap: '4.2L', rrp: 549, price: 299, stock: 5, sold: 14 },
    { short: '31cm/5.8l', cap: '5.8L', rrp: 649, price: 356, stock: 3, sold: 12 }
  ];

  /* Seven product accordions (verbatim). Body is a string, or a function of
     the current colour + size for the Product Specs row. */
  var accordion = [
    {
      title: 'Product Specs',
      body: function (c, s) {
        return 'Design: ' + c.name + ' · Size: ' + s.short + ' · Capacity: ' + s.cap + ' · Material: 100% natural ceramic, lead, cadmium and nickel free · Temperature range: −20°C to 290°C · Guarantee: 10 years · Product number: 267202.';
      }
    },
    {
      title: 'Important Information: Care & Heat Sources',
      body: 'Heat sources: gas ✓ · electric/radiant ✓ · ceramic ✓ · halogen ✓ · oven to 290°C ✓ · grill and barbecue ✓ · microwave ✓ · dishwasher ✓ · freezer to −20°C ✓ · induction ✕ (ceramic isn’t magnetic — an induction adapter disc will work, though heat spread is slower). Care tips: warm the dish gradually on a low-to-medium flame rather than moving it from fridge to hot oven; rest it on a wooden board or trivet, never a cold or wet surface; let it cool before washing and use warm soapy water with a soft sponge; stick to wood or silicone utensils to protect the glaze, and soak baked-on residue instead of scouring.'
    },
    {
      title: 'Postage Calculator Australia',
      body: 'Enter your postcode to see delivery options and timing. Free standard delivery on orders over $99. Express and Click & Collect available at the Kensington and Birkenhead Point stores.'
    },
    {
      title: 'Postage Calculator International',
      body: 'We ship to New Zealand, USA, UK, Canada, China, Hong Kong, Japan and more. Enter your country to see rates and estimated transit times at checkout.'
    },
    {
      title: 'Shipping & Returns',
      body: 'In stock items are dispatched within 1–2 business days. Returns accepted within 30 days in original condition and packaging — see our returns policy for full details.'
    },
    {
      title: 'Reviews (47)',
      body: 'Rated 4.8 out of 5 from 47 verified reviews, with 96% of buyers saying they’d buy again. Read the full reviews below.'
    },
    {
      title: '✔ Complimentary Gift Wrapping Available',
      body: 'Add a gift-wrapping note at checkout and we’ll wrap this piece by hand at no extra cost — ideal for weddings, housewarmings and Christmas.'
    }
  ];

  /* FAQ (verbatim) ------------------------------------------------------ */
  var faq = [
    { q: 'Can I use the Sublime casserole on an induction cooktop?', a: 'Not on its own. The Sublime body is 100% natural ceramic, which isn’t magnetic, so an induction hob won’t detect it. It works on gas, electric, ceramic and halogen hobs, in the oven to 290°C, under the grill and on the barbecue. An induction adapter disc will let you use it on induction, though heat spread is slower and less even.' },
    { q: 'How hot can it go in the oven?', a: '290°C is the maximum, and it handles temperatures down to −20°C, so it goes from freezer to oven to table. Warm it up gradually rather than putting a cold dish into a fully preheated oven.' },
    { q: 'Is it dishwasher and microwave safe?', a: 'Yes to both. Let the casserole cool before it goes into the dishwasher, and soak baked-on residue in warm soapy water instead of scouring the glaze.' },
    { q: 'Which size should I choose?', a: '24cm/2.5L suits one to two people or a side dish; 28cm/4.2L is the everyday family size; 31cm/5.8L takes a whole chicken with vegetables around it, or a braise for five to six.' },
    { q: 'How does the ceramic compare to cast iron?', a: 'It’s around 50% lighter than most cast-iron Dutch ovens and distributes heat smoothly, so it sears at high heat but also handles gentle cooking — caramel and custard heat without catching. It needs no seasoning and won’t react with acidic ingredients.' },
    { q: 'What does the 10-year guarantee cover?', a: 'Emile Henry backs the ceramic against manufacturing defects for 10 years in normal domestic use. Keep your Peter’s of Kensington order confirmation as proof of purchase, and see our returns policy for the first 30 days.' }
  ];

  /* Catalogue: one id per product, shared by the PDP bundle, collection
     cards and the cart drawer rail (so "added" states stay in sync). ------- */
  var catalogue = {
    /* Names adjusted to match the supplied photos (marble trivet, beechwood spoon,
       red silicone mitt, white gratin dish). Prices and ids unchanged. */
    trivet: { id: 'trivet', brand: 'Emile Henry', name: 'Marble Trivet 22cm', short: 'Trivet', price: 39, rrp: 49 },
    spoon: { id: 'spoon', brand: 'Scanpan', name: 'Beechwood Serving Spoon 30cm', short: 'Spoon', price: 15, rrp: 19 },
    mitts: { id: 'mitts', brand: 'Peters', name: 'Silicone Oven Mitt Red', short: 'Oven mitt', price: 25, rrp: 35 },
    gratin: { id: 'gratin', brand: 'Emile Henry', name: 'Oval Gratin Dish White 35cm', short: 'Gratin dish', price: 79, rrp: 99 },
    c1: { id: 'c1', brand: 'Emile Henry', name: 'Oval Casserole 4.1L', short: 'Oval casserole', price: 289, rrp: 349, cat: 'Casserole pots & dishes' },
    c2: { id: 'c2', brand: 'Emile Henry', name: 'Delight Round Stewpot 2.5L', short: 'Stewpot', price: 219, rrp: 269, cat: 'French ovens' },
    c3: { id: 'c3', brand: 'Emile Henry', name: 'Rectangular Roaster 42cm', short: 'Roaster', price: 119, rrp: 149, cat: 'Roasting dishes' },
    c5: { id: 'c5', brand: 'Emile Henry', name: 'Oval Gratin Dish 35cm', short: 'Gratin dish', price: 79, rrp: 99, cat: 'Bakeware' }
  };

  /* Frequently bought together: add-ons (display copy verbatim from PDP v4) */
  var addOns = [
    { id: 'trivet', name: 'Emile Henry Marble Trivet 22cm', meta: 'Added by 78% of casserole buyers' },
    { id: 'spoon', name: 'Beechwood Large Serving Spoon', meta: 'Won’t scratch the ceramic glaze' },
    { id: 'mitts', name: 'Heat-resistant Silicone Oven Mitt', meta: 'Rated to 290°C — matches this dish' }
  ];

  /* Complete your collection: 4 cards ------------------------------------ */
  var collection = ['c1', 'c2', 'c3', 'c5'];

  /* Cart drawer 2a rail ("Pairs well with your casserole") --------------- */
  var rail = ['trivet', 'mitts', 'gratin', 'spoon'];
  var railTags = { trivet: 'Best match', mitts: 'Popular' };

  /* Image path for a catalogue id (swap-in photos go in /images) --------- */
  function imgFor(id) {
    return id === 'casserole' ? 'images/casserole-hero.jpg' : 'images/' + id + '.jpg';
  }

  /* Build a cart item from the catalogue ---------------------------------- */
  function item(id, qty) {
    var p = catalogue[id];
    if (!p) return null;
    return {
      id: p.id,
      brand: p.brand,
      name: p.name,
      variant: '',
      price: p.price,
      rrp: p.rrp,
      qty: qty || 1,
      short: p.short,
      img: imgFor(p.id)
    };
  }

  POK.data = {
    colors: colors,
    sizes: sizes,
    accordion: accordion,
    faq: faq,
    catalogue: catalogue,
    addOns: addOns,
    collection: collection,
    rail: rail,
    railTags: railTags,
    imgFor: imgFor,
    item: item
  };

  /* Image helper ----------------------------------------------------------
     Every image is a neutral <div class="ph" data-img="images/x.jpg">.
     If probeImages is on and the file exists, the placeholder becomes an <img>.
     Otherwise it stays a placeholder. */
  POK.img = {
    hydrate: function (root) {
      if (!POK.config.probeImages) return;
      var list = (root || document).querySelectorAll('.ph[data-img]:not([data-ph-done])');
      Array.prototype.forEach.call(list, function (ph) {
        ph.setAttribute('data-ph-done', '1');
        var label = ph.textContent.trim();
        var im = new Image();
        im.onload = function () {
          im.alt = label;
          ph.textContent = '';
          ph.appendChild(im);
          ph.classList.add('ph--loaded');
        };
        im.src = ph.getAttribute('data-img');
      });
    }
  };
})();
