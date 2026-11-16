# CLAUDE.md: Peter's of Kensington draft PDP + cart drawer

## What we're building
A static, clickable prototype of a Peter's of Kensington (PoK) product detail page (PDP) for the
**Emile Henry Sublime Round Casserole**, with a working **slide-out cart drawer** (design option **2a –
"Pairs well with" swipeable rail**). The PDP is the landing page (`index.html`). Shoppers can add to
cart from several places on the page. The drawer then slides in from the right and shows the cart contents and an
upsell rail.

It's a design prototype for stakeholder review, not a production store. There's no backend, no checkout and no
payments.

## Source designs (read these first)
- `reference/Sublime Round Casserole PDP v4.dc.html`: the PDP. Copy, prices, layout, colours and
  interactions all come from here.
- `reference/Cart Drawer Upsell Options.dc.html`: build **only the `id="2a"` drawer**. Ignore 2b and 2c.

These files use a design-tool template format: inline `style=""` attributes, `{{ holes }}`, `<sc-for>`,
`<sc-if>` and a `class Component` logic block. Treat them as a **visual and behavioural spec**. Don't
copy the format. Rebuild the design in plain HTML/CSS/JS and match it pixel for pixel.

## Tech constraints
- **Plain HTML + CSS + vanilla JS (ES modules OK). No build step, no frameworks, no npm.**
- Must run by double-clicking `index.html` **and** on GitHub Pages under a sub-path
  (`https://<user>.github.io/pok-draft-pdp/`). Use **relative paths only**. Don't use leading `/`.
- If you use ES modules, note that `file://` blocks them in some browsers. Prefer classic `<script defer>` files
  that share one global `window.POK` namespace.
- Add an empty `.nojekyll` file at the root.

## File structure
```
pok-draft-pdp/
├── index.html          # the PDP (landing page) + cart drawer markup
├── css/styles.css      # all styles; CSS custom properties for tokens
├── js/data.js          # product catalogue, PDP variants, FAQ/accordion copy
├── js/cart.js          # cart state, drawer open/close, render, upsell rail
├── js/pdp.js           # swatches, size, qty, BNPL toggle, bundle, accordions, timers, sticky bar
├── images/             # empty for now (.gitkeep); real photos dropped in later
├── reference/          # design sources (keep in repo, not linked from the page)
├── .nojekyll
└── README.md
```

## Design tokens (from the source, use as CSS variables)
| Token | Value | Use |
|---|---|---|
| `--pink` | `#E6288E` | primary CTA, prices, links |
| `--pink-dark` | `#C8137A` | CTA hover, pink text on light pink |
| `--navy` | `#0B1F44` | headings, top bar, "added" state |
| `--ink` | `#1A1A1A` | body text |
| `--muted` | `#6E7385` | secondary text |
| `--body-2` | `#42506B` | long-form copy |
| `--line` | `#E4E4E8` / `#EDEEF1` | borders, dividers |
| `--blush` | `#FDF0F5` | sub-nav, FAQ bg, bundle header |
| `--blush-2` | `#FBE4EE` | enquire + newsletter panels |
| `--grey-bg` | `#F7F7F8` | image wells, reviews bg |
| `--drawer-bg` | `#F4F4F6` | cart drawer body |
| `--sale` | `#E01B22` | ON SALE, low stock |
| `--green` | `#1F9E6E` | stars, savings, in-stock |

- Fonts: **Poppins** 300–700 (everything) and **Parisienne** (the "Peter's" wordmark only). Load both from Google Fonts.
- **Square corners everywhere.** Only round elements are colour swatches, the cart badge and BNPL logo chips.
- Button text: uppercase, 600 weight, ~.06–.08em tracking, min-height 44px.

## Image placeholders
Every image (hero, four thumbs, bundle items, collection cards, "You may also like", sticky bar thumb and
cart/rail items) is a neutral placeholder. Use a `<div class="ph">` on `--grey-bg` with a thin `--line` border,
the product's short label centred in `--muted` 12px, and the correct aspect ratio from the source. Give each one a
`data-img="images/<slug>.jpg"` attribute so real photos can be swapped in later. Write one small helper: if the
file exists, it renders an `<img>`. Otherwise it keeps the placeholder.

## Page sections (top → bottom, all from PDP v4)
1. Navy shipping banner
2. Pink header: wordmark, nav links, search, currency, account and wishlist icons, **cart button with count badge**
3. Blush category nav, then breadcrumb
4. Two-column product area (stacks on mobile)
   - Gallery: hero + four thumbs with ON SALE and LOW IN STOCK badges. Clicking a thumb moves the pink underline.
   - Buy box: brand, title (updates with colour and size), stars, badges, price block, BNPL row with a
     Compare/Hide panel, low-stock meter, live viewers, dispatch countdown, colour swatches (4), size `<select>` (3),
     qty stepper, **+ ADD TO CART**, wishlist, trust strip (3)
   - **Frequently bought together** bundle (casserole locked, plus trivet/spoon/mitts checkboxes, select-all, live
     total, **Add N items to cart** CTA)
   - Description, features list, spec lines, seven accordions, Enquire panel
5. Customer reviews
6. Complete your collection: 4 cards, each with **+ Add to cart**
7. FAQ accordion (one open at a time, first open by default)
8. You may also like (4 static cards)
9. Newsletter, footer and navy legal bar
10. **Sticky buy bar**: appears after scrolling past ~620px, with its own **+ Add to cart**

Keep all copy, prices and variant logic exactly as in the source `renderVals()`, including the colours
array, the sizes array (price, RRP, stock and sold counts per size), the instalment maths, the countdown and the random viewers.

## Cart drawer (option 2a)
### ⚠ Must-have: clicking a cart button opens the pop-up
Every cart button on the page **must open the cart drawer pop-up straight away**. There should be no page
navigation and no "added" message without the drawer opening. These are the buttons:
| Button | Selector to give it | What happens on click |
|---|---|---|
| Header cart icon | `#cart-btn` | opens the drawer (works with an empty cart too) |
| Main **+ ADD TO CART** | `[data-add="main"]` | adds the casserole variant × qty, then opens the drawer |
| Sticky bar **+ ADD TO CART** | `[data-add="sticky"]` | same as main |
| Bundle **Add N items to cart** | `[data-add="bundle"]` | adds the casserole + ticked extras, then opens the drawer |
| Collection card **+ Add to cart** (×4) | `[data-add="<id>"]` | adds that product, then opens the drawer |

Use one event listener delegated from `document` for `#cart-btn, [data-add]`, so that no button can be
missed. All of them call `POK.cart.open()`. The drawer must also open if the same item is added twice.
Rail **+ Add** buttons inside the drawer add the item but keep the drawer open (they don't re-trigger it).

### Opening and closing
- Opens (slides in from the right, ~280ms ease-out) when:
  - any **Add to cart** action happens (main CTA, sticky bar, bundle CTA, collection card)
  - the **header cart button** is clicked
- Closes on the ✕ button, a click on the dimmed overlay (navy at 45% opacity), or the `Esc` key.
- Width 420px on desktop. **100% width under 480px.** Full height, and the middle section scrolls on its own
  while the header and footer stay pinned.
- Accessibility: `role="dialog"`, `aria-modal="true"` and `aria-labelledby` pointing at the title. Move focus to the close
  button on open and return it to the trigger on close. Trap Tab inside the drawer. Lock body scroll while it's open.

### Layout (match the source exactly)
1. White header: **"Your Cart (n)"** + ✕
2. Line items on `--drawer-bg`: white cards with an 84px image, brand (bold navy), name, qty display, pink
   price, and a pink ✕ remove button top-right
3. **"Pairs well with your casserole"** + "Swipe →", then a horizontal scroll-snap rail of 140px cards with
   a hidden scrollbar. Each card shows: image (104px tall), optional navy tag (**Best match** on trivet,
   **Popular** on mitts), brand, name, price, struck-through RRP and a toggle button:
   - default: white bg, pink border, `--pink-dark` text, **"+ ADD"**
   - added: navy bg and border, white text, **"✓ ADDED"**. Clicking again removes the item from the cart.
4. White footer: **Subtotal: $X AUD** + **CHECKOUT NOW** (pink, no action; show a small "Prototype: checkout
   not built" toast).

### Empty state
"Your cart is empty" + a short line, with the rail still visible underneath so the upsell is always there.

### Behaviour
- Cart state is a simple in-memory array of `{ id, brand, name, variant, price, qty }`.
- **Main/sticky Add to cart** adds the casserole with the current colour, size and qty. Use the line id
  `casserole-<colour>-<size>`. If that same variant is added again, increase its qty rather than adding a
  duplicate line.
- **Bundle CTA** adds the casserole variant plus each ticked extra.
- **Collection card** adds that product.
- **Rail "+ Add"** adds that product and the line item appears above it straight away. Remove (✕ on a line) also
  resets the matching rail button.
- Subtotal = Σ price × qty. Header badge = Σ qty. Both update live.
- Keep the source's 2.2s "✓ Added to cart" button feedback on the PDP buttons.
- The qty display in the drawer shows the line's qty. **The −/+ buttons don't need to work** (out of scope), so
  render them as non-interactive.
- **No persistence.** A refresh clears the cart.

### Catalogue (`js/data.js`)
The PDP bundle and the drawer rail use the **same product ids**, so "added" states stay in sync across the page:
| id | brand | name | price | RRP | in |
|---|---|---|---|---|---|
| trivet | Emile Henry | Ceramic Trivet 22cm | 39 | 49 | bundle, rail (Best match) |
| spoon | Scanpan | Olive Wood Spoon 30cm | 15 | 19 | bundle, rail |
| mitts | Peters | Quilted Oven Mitt Pair Charcoal | 25 | 35 | bundle, rail (Popular) |
| gratin | Emile Henry | Oval Gratin Dish Graphite 35cm | 79 | 99 | rail |
| c1 / c2 / c3 / c5 | per PDP v4 `collData` | | | | collection cards |
| casserole | Emile Henry | Sublime Round Casserole {colour} {size} | per size | per size | main CTA |

## Responsive
- Breakpoints: 480px and 900px. The source's flex-wrap and `auto-fit` grids already reflow, so keep them.
- Mobile: the product columns stack, the header search drops to its own row, the sticky bar compacts (hide the thumb and RRP),
  the drawer goes full width, and the rail stays swipeable by touch.
- Touch targets must be at least 44px.

## Acceptance checklist
- [ ] `index.html` opens straight to the PDP from the file system and from GitHub Pages, with no console errors
- [ ] Colour and size change the title, price, savings, instalments, stock meter and size labels
- [ ] **Clicking any cart button (header icon + every Add to cart) opens the drawer pop-up, every time**
- [ ] All four add paths open the drawer with the right items, and the badge and subtotal are correct
- [ ] Header cart button opens the drawer, including when the cart is empty
- [ ] Rail add/remove toggles stay in sync with line items and the bundle checkboxes
- [ ] ✕, overlay and Esc all close the drawer, and focus returns to the trigger
- [ ] Looks right at 375px, 768px and 1440px
- [ ] No frameworks, no build step, relative paths only

## Out of scope
Checkout, real payments, persistence, search, the account and wishlist pages, the other drawer options (2b/2c), and real images.
