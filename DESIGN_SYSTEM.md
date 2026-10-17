# Kolab.id --- Design System

**UMKM × Creator Collaboration Platform** · Design System **v1.3**

Kolab.id is a collaboration platform that connects **UMKM** with
**content creators** through transparent pricing, clear collaboration
flows, and trustworthy transactions.

This document is the single source of truth for design tokens,
components, interaction states, and accessibility requirements.

> **How to read this doc:** every value below is a token. Build
> interfaces with tokens rather than raw hex/px values so Figma,
> frontend code, and future screens stay consistent.

------------------------------------------------------------------------

## 1. Design Principles

### 1.1 Trust without feeling corporate

Kolab.id handles collaboration, pricing, and payments, so the interface
must feel trustworthy. However, it should still feel approachable to
creators and small businesses.

### 1.2 Playful, but not childish

The visual identity is led by **Kolab Purple** with friendly
typography, supported by a **Secondary Yellow** accent for highlights
and companions to brand moments. Use strong color blocks and clear
hierarchy, but keep layouts structured and professional.

### 1.3 Purple means brand and action

Purple carries the whole brand: identity, primary actions, links,
selected states, and highlights. When something needs emphasis, use a
stronger purple step (e.g. `--primary-600` / `--primary-700`) or a
purple surface (`--primary-50`). The secondary lime (`--secondary-500`)
is reserved for accents and highlights --- it never replaces blue
for primary actions.

### 1.4 Green means positive progress

Green is reserved for success, completed collaborations, verified
states, positive growth indicators, and other clearly positive feedback.

### 1.5 Transparent by default

Pricing, status, deadlines, reviews, and collaboration progress should
be visually easy to understand. Avoid hiding important information
behind decorative UI.

### 1.6 Accessible by default

WCAG 2.1 AA is the minimum target. Color must never be the only way
information is communicated.

------------------------------------------------------------------------

# 2. Color Tokens

The brand colors are **Kolab Purple** (`#812BFF`) and **Secondary
Lime** (`#AAFF2B`). Each is expanded into a 50--900 scale so
components have clear hover, pressed, surface, and text states. A warm
neutral scale plus semantic colors (success, warning, error, info)
support them.

------------------------------------------------------------------------

## 2.1 Brand --- Kolab Blue

  Token             Hex         Role
  ----------------- ----------- ------------------------------------
  `--primary-50`    `#F7F2FF`   Very soft purple surface
  `--primary-100`   `#F0E6FF`   Selected backgrounds
  `--primary-200`   `#E0CAFF`   Soft borders / illustrations
  `--primary-300`   `#C6A0FF`   Decorative elements
  `--primary-400`   `#A76BFF`   Secondary interactive states
  `--primary-500`   `#812BFF`   **Brand primary**
  `--primary-600`   `#7226E0`   Hover / stronger interactive state
  `--primary-700`   `#6120BF`   Pressed state / dark text
  `--primary-800`   `#4D1A99`   High-emphasis text
  `--primary-900`   `#3A1373`   Deepest purple

**Primary base:** `#812BFF`

Use `--primary-500` for the core Kolab.id identity. Use `--primary-600`
and `--primary-700` for interaction states rather than darkening the
base arbitrarily.

------------------------------------------------------------------------

## 2.2 Brand --- Secondary Lime

  Token               Hex         Role
  ------------------- ----------- ------------------------------------
  `--secondary-50`    `#FAFFF2`   Very soft lime surface
  `--secondary-100`   `#F5FFE6`   Highlighted backgrounds
  `--secondary-200`   `#EAFFCA`   Soft borders / illustrations
  `--secondary-300`   `#D9FFA0`   Decorative elements
  `--secondary-400`   `#C4FF6B`   Secondary interactive states
  `--secondary-500`   `#AAFF2B`   **Brand secondary**
  `--secondary-600`   `#96E026`   Hover / stronger interactive state
  `--secondary-700`   `#80BF20`   Pressed state / dark text
  `--secondary-800`   `#66991A`   High-emphasis text
  `--secondary-900`   `#4C7313`   Deepest lime

**Secondary base:** `#AAFF2B`

Use `--secondary-500` for accents, badges, and highlights that
companion the primary purple. Lime carries less contrast on white,
so pair `--secondary-*` surfaces with dark text (`--neutral-900`)
and never use it for primary actions or body links.

Current landing-page placements: the solution-banner CTA fill
(`bg-secondary-500`), the rating stat tile (`bg-secondary-100` /
`text-secondary-800`), the cara-kerja connector gradient midpoint
(`via-secondary-400`), and the final-CTA pill tint.

------------------------------------------------------------------------

## 2.3 Semantic --- Success Green

  Token             Hex         Role
  ----------------- ----------- ----------------------------
  `--success-50`    `#E8FFF2`   Success surface
  `--success-100`   `#C8FBDD`   Success background
  `--success-200`   `#8FF5B8`   Soft success border
  `--success-300`   `#50E98C`   Decorative success
  `--success-400`   `#18DC6F`   Strong success
  `--success-500`   `#02D160`   **Semantic success**
  `--success-600`   `#00B653`   Hover / stronger success
  `--success-700`   `#008E43`   Text / pressed
  `--success-800`   `#006E35`   High-emphasis success text
  `--success-900`   `#004D27`   Deepest success

**Success base:** `#02D160`

Green is semantic first: success, completed, and verified states
only. Do not use it as a generic decorative color.

------------------------------------------------------------------------

## 2.4 Neutral --- Ink

  Token             Hex         Role
  ----------------- ----------- -----------------------------
  `--neutral-0`     `#FFFFFF`   Pure white
  `--neutral-50`    `#F9FAFB`   App background
  `--neutral-100`   `#F5F5F2`   Secondary background
  `--neutral-200`   `#E8E8E3`   Borders / dividers
  `--neutral-300`   `#D5D5CF`   Disabled borders
  `--neutral-400`   `#A8A8A0`   Placeholder / tertiary text
  `--neutral-500`   `#77776F`   Secondary text
  `--neutral-600`   `#5B5B55`   Supporting text
  `--neutral-700`   `#41413D`   Strong body text
  `--neutral-800`   `#292925`   Heading / high emphasis
  `--neutral-900`   `#1D1D1A`   Primary text
  `--neutral-950`   `#11110F`   Maximum emphasis

------------------------------------------------------------------------

## 2.5 Semantic Colors

### Error

  Token           Hex         Role
  --------------- ----------- ------------------------
  `--error-50`    `#FFF0F0`   Error field background
  `--error-100`   `#FFD9D9`   Error surface
  `--error-500`   `#D92D20`   Error
  `--error-700`   `#B42318`   Error text / pressed

### Warning

  Token             Hex         Role
  ----------------- ----------- --------------------
  `--warning-50`    `#FFF8E7`   Warning surface
  `--warning-100`   `#FFE8B0`   Warning background
  `--warning-500`   `#D98B00`   Warning
  `--warning-700`   `#9A6200`   Warning text

### Info

  Token          Hex         Role
  -------------- ----------- ------------------------
  `--info-50`    `#EEF5FF`   Information surface
  `--info-100`   `#D7E7FF`   Information background
  `--info-500`   `#2563EB`   Information
  `--info-700`   `#1D4ED8`   Information text

------------------------------------------------------------------------

## 2.6 Recommended Color Pairings

  Foreground        Background        Use
  ----------------- ----------------- --------------------------
  `--neutral-900`   `--neutral-0`     Default text
  `--neutral-900`   `--neutral-50`    Default page copy
  `--neutral-800`   `--primary-50`    Purple surface heading
  `--primary-700`   `--neutral-0`     Links / interactive text
  `--neutral-0`     `--primary-500`   Primary filled button
  `--neutral-0`     `--primary-700`   High-contrast purple CTA
  `--neutral-900`   `--secondary-500` Secondary accent badge
  `--neutral-900`   `--secondary-100` Lime highlight surface
  `--success-700`   `--success-50`    Success message
  `--error-700`     `--error-50`      Error message
  `--warning-700`   `--warning-50`    Warning message

------------------------------------------------------------------------

# 3. Semantic Color Tokens

Components should consume semantic tokens rather than directly
referencing primitive colors.

  Semantic Token                    Maps To           Usage
  --------------------------------- ----------------- -----------------------------
  `--color-bg-page`                 `--neutral-50`    Main application background
  `--color-bg-surface`              `--neutral-0`     Cards / panels
  `--color-bg-subtle`               `--neutral-100`   Secondary sections
  `--color-text-primary`            `--neutral-900`   Main text
  `--color-text-secondary`          `--neutral-600`   Supporting copy
  `--color-text-muted`              `--neutral-500`   Metadata / placeholders
  `--color-border-default`          `--neutral-200`   Default borders
  `--color-border-strong`           `--neutral-300`   Strong borders
  `--color-brand-primary`           `--primary-500`   Brand actions
  `--color-brand-primary-hover`     `--primary-600`   Primary hover
  `--color-brand-primary-pressed`   `--primary-700`   Primary pressed
  `--color-brand-secondary`         `--secondary-500` Secondary accents
  `--color-brand-secondary-hover`   `--secondary-600` Secondary hover
  `--color-brand-secondary-pressed` `--secondary-700` Secondary pressed
  `--color-success`                 `--success-500`   Successful states
  `--color-error`                   `--error-500`     Errors
  `--color-warning`                 `--warning-500`   Warnings
  `--color-info`                    `--info-500`      Informational states

------------------------------------------------------------------------

# 4. Typography Tokens

Kolab.id should feel friendly and modern without sacrificing
readability.

Recommended families:

-   **Heading:** `Plus Jakarta Sans`
-   **Body:** `Inter`

The heading family gives the brand a slightly distinctive character
while Inter keeps dense dashboards, prices, tables, and metadata highly
readable.

Type is built from **primitives** (weight, size, tracking) composed
into **semantic** roles. Primitives live in `:root` in
`app/globals.css`; components consume the semantic roles via `var()`
or Tailwind v4 arbitrary values (see §16), never raw px/rem.

## 4.1 Primitives

### Font Weight

  Token                    Value   Usage
  ------------------------ ------- --------------------------
  `--font-weight-regular`  `400`   Body / supporting copy
  `--font-weight-medium`   `500`   Card titles, labels
  `--font-weight-semibold` `600`   Headings, buttons, badges
  `--font-weight-bold`     `700`   Display, metrics

### Font Size (rem scale, base 16px)

  Token                 Value                                   Usage
  --------------------- --------------------------------------- --------------------------
  `--font-size-2xs`     `0.6875rem` (11px)                      Badges
  `--font-size-xs`      `0.75rem` (12px)                        Captions, eyebrows, table heads
  `--font-size-sm`      `0.875rem` (14px)                       Tables, labels, secondary copy
  `--font-size-md`      `1rem` (16px)                           Default body, card titles, buttons
  `--font-size-lg`      `1.125rem` (18px)                       Section titles
  `--font-size-xl`      `1.25rem` (20px)                        Lead paragraphs
  `--font-size-2xl`     `1.5rem` (24px)                         Page titles
  `--font-size-3xl`     `1.875rem` (30px)                       Metrics
  `--font-size-4xl`     `2.25rem` (36px)                        Large metrics

### Fluid Sizes (landing page only)

  Token                      Value                                              Usage
  -------------------------- -------------------------------------------------- ------------------
  `--font-size-fluid-display` `clamp(2.5rem, 1.5rem + 4vw, 4.5rem)`             Landing hero display
  `--font-size-fluid-h1`      `clamp(2rem, 1.3rem + 2.8vw, 3.5rem)`              Landing H1
  `--font-size-fluid-h2`      `clamp(1.625rem, 1.2rem + 1.7vw, 2.5rem)`          Landing H2

### Letter Spacing

  Token                     Value      Usage
  ------------------------- ---------- --------------------------
  `--letter-spacing-tighter` `-0.04em`  Display, metrics
  `--letter-spacing-tight`   `-0.02em`  Headings, titles
  `--letter-spacing-normal`  `0`        Body copy
  `--letter-spacing-wide`    `0.02em`   Captions
  `--letter-spacing-wider`   `0.06em`   Table heads, badges (with uppercase)
  `--letter-spacing-widest`  `0.1em`    Eyebrows (with uppercase)

## 4.2 Semantic --- Landing Page

  Role            Size Token                  Weight Token               Tracking Token
  --------------- --------------------------- -------------------------- ------------------------------
  Display         `--font-size-fluid-display` `--font-weight-bold`       `--letter-spacing-tighter`
  H1              `--font-size-fluid-h1`      `--font-weight-bold`       `--letter-spacing-tight`
  H2              `--font-size-fluid-h2`      `--font-weight-semibold`   `--letter-spacing-tight`
  Lead            `--font-size-xl`            `--font-weight-regular`    `--letter-spacing-normal`
  Body            `--font-size-md`            `--font-weight-regular`    `--letter-spacing-normal`
  Eyebrow         `--font-size-xs`            `--font-weight-semibold`   `--letter-spacing-widest`
  Button          `--font-size-md`            `--font-weight-semibold`   `--letter-spacing-normal`

Composed tokens: `--type-{display,h1,h2,lead,body,eyebrow,button}-{size,weight,tracking}`.

## 4.3 Semantic --- Dashboard (more compact)

  Role            Size Token          Weight Token             Tracking Token
  --------------- ------------------- ------------------------ ------------------------------
  Page title      `--font-size-2xl`   `--font-weight-semibold` `--letter-spacing-tight`
  Section title   `--font-size-lg`    `--font-weight-semibold` `--letter-spacing-tight`
  Card title      `--font-size-md`    `--font-weight-medium`   `--letter-spacing-normal`
  Metric          `--font-size-3xl`   `--font-weight-bold`     `--letter-spacing-tighter`
  Table           `--font-size-sm`    `--font-weight-regular`  `--letter-spacing-normal`
  Table head      `--font-size-xs`    `--font-weight-semibold` `--letter-spacing-wider`
  Label           `--font-size-sm`    `--font-weight-medium`   `--letter-spacing-normal`
  Caption         `--font-size-xs`    `--font-weight-regular`  `--letter-spacing-wide`
  Badge           `--font-size-2xs`   `--font-weight-semibold` `--letter-spacing-wider`

Composed tokens: `--type-{page-title,section-title,card-title,metric,table,table-head,label,caption,badge}-{size,weight,tracking}`.

Table heads, badges, and eyebrows are always paired with uppercase.

### Typography Rules

-   Consume semantic `--type-*` roles, not primitives or raw px/rem.
-   Prices use **600--700 weight** so they are easy to scan.
-   Avoid all-caps except for very small metadata or badges.
-   Minimum regular body size: **14px**; default body size: **16px**.
-   Fluid sizes are landing-only; dashboards use the fixed scale.

------------------------------------------------------------------------

# 5. Shape / Radius Tokens

Kolab.id should use **moderately rounded UI**, rather than making every
element a pill.

  Token                 Value Applies to
  ----------------- --------- ---------------------------
  `--radius-sm`         `8px` Small controls / badges
  `--radius-md`        `12px` Inputs / buttons
  `--radius-lg`        `16px` Cards / dialogs
  `--radius-xl`        `20px` Featured cards / sections
  `--radius-2xl`       `24px` Hero containers
  `--radius-pill`     `999px` Chips / tags / avatars

### Shape Convention

-   Buttons: `12px`
-   Inputs: `10–12px`
-   Cards: `16px`
-   Featured marketing surfaces: `20–24px`
-   Pills are reserved for tags, filters, statuses, and compact
    controls.

This intentionally differs from a fully-pill-based button system.

------------------------------------------------------------------------

# 6. Spacing Tokens

Use a 4px base unit.

  Token            Value
  -------------- -------
  `--space-1`        4px
  `--space-2`        8px
  `--space-3`       12px
  `--space-4`       16px
  `--space-5`       20px
  `--space-6`       24px
  `--space-7`       32px
  `--space-8`       40px
  `--space-9`       48px
  `--space-10`      64px
  `--space-11`      80px
  `--space-12`      96px

### Layout Constants

  Token                        Value
  ------------------------- --------
  `--container-sm`             640px
  `--container-md`             768px
  `--container-lg`            1024px
  `--container-xl`            1200px
  `--page-gutter-mobile`        16px
  `--page-gutter-desktop`       32px
  `--section-gap`               80px

------------------------------------------------------------------------

# 7. Elevation / Shadow Tokens

Use shadows sparingly. The interface should primarily communicate
hierarchy through spacing, borders, and surfaces.

  ----------------------------------------------------------------------------------
  Token                   Value                              Usage
  ----------------------- ---------------------------------- -----------------------
  `--shadow-xs`           `0 1px 2px rgba(29,29,26,.06)`     Small controls

  `--shadow-sm`           `0 2px 8px rgba(29,29,26,.08)`     Cards

  `--shadow-md`           `0 8px 24px rgba(29,29,26,.10)`    Dropdowns / popovers

  `--shadow-lg`           `0 16px 40px rgba(29,29,26,.12)`   Dialogs / featured
                                                             surfaces
  ----------------------------------------------------------------------------------

------------------------------------------------------------------------

# 8. Motion Tokens

Motion should communicate feedback and hierarchy rather than decoration.

  Token                 Value                        Usage
  --------------------- ---------------------------- --------------------------
  `--ease-standard`     `cubic-bezier(.2,.8,.2,1)`   General transition
  `--ease-emphasized`   `cubic-bezier(.16,1,.3,1)`   Enter / expand
  `--ease-out`          `cubic-bezier(.23,1,.32,1)`  Scroll-reveal entrances
  `--duration-fast`     `150ms`                      Hover / press
  `--duration-normal`   `250ms`                      Component transitions
  `--duration-slow`     `400ms`                      Page / panel transitions

### Motion Rules

-   Hover states should be subtle.
-   Avoid excessive bounce or elastic effects.
-   Buttons may move by `translateY(-1px)` on hover.
-   Pressed states should return to their resting position.
-   Respect `prefers-reduced-motion: reduce`.

------------------------------------------------------------------------

# 9. Accessibility --- WCAG 2.1 AA

AA is the minimum target for every screen.

  Content                              Minimum ratio
  ---------------------------------- ---------------
  Normal text                                4.5 : 1
  Large text                                   3 : 1
  UI components / focus indicators             3 : 1

### Accessibility Rules

1.  Never use color as the only indicator of status.
2.  Pair statuses with text and/or icons.
3.  All interactive elements need a visible focus state.
4.  Minimum touch target: **44 × 44px**.
5.  Form inputs must have accessible labels.
6.  Keyboard navigation must follow a logical order.
7.  Error messages must explain how to recover.
8.  Respect `prefers-reduced-motion`.
9.  Prices and important information must remain readable without
    relying on color.
10. Do not use low-contrast text over brand illustrations or
    photographs.

### Focus Ring

``` css
:focus-visible {
  outline: 3px solid var(--primary-400);
  outline-offset: 3px;
}
```

------------------------------------------------------------------------

# 10. Core Components

## 10.1 Buttons

Buttons intentionally do **not** use a fully rounded/pill style.

### Variants

  -----------------------------------------------------------------------------------
  Variant        Fill              Text              Border            Usage
  -------------- ----------------- ----------------- ----------------- --------------
  Primary        `--primary-500`   `--neutral-0`     none              Main action

  Primary Hover  `--primary-600`   `--neutral-0`     none              Hover

  Primary        `--primary-700`   `--neutral-0`     none              Pressed
  Pressed                                                              

  Secondary      `--neutral-0`     `--primary-700`   `--primary-300`   Secondary
                                                                       action

  Secondary      `--primary-50`    `--primary-700`   `--primary-400`   Hover
  Hover                                                                

  Ghost          transparent       `--neutral-800`   none              Low emphasis

  Destructive    `--error-500`     `--neutral-0`     none              Delete /
                                                                       cancel
                                                                       irreversible
                                                                       action

  Disabled       `--neutral-200`   `--neutral-400`   none              Unavailable
  -----------------------------------------------------------------------------------

### Button Style

-   Radius: `--radius-md` (`12px`)
-   Height: `44px` default
-   Horizontal padding: `16px`
-   Font: Inter 600 / 14px
-   Icon gap: `8px`
-   No permanent shadow
-   Hover: subtle background change + `translateY(-1px)`
-   Pressed: `translateY(0)`
-   Focus: visible 3px focus ring

Example:

``` css
.button {
  min-height: 44px;
  padding: 0 16px;
  border-radius: var(--radius-md);
  font: 600 14px/20px var(--font-body);
  transition:
    background-color var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-standard);
}

.button:hover {
  transform: translateY(-1px);
}

.button:active {
  transform: translateY(0);
}
```

------------------------------------------------------------------------

## 10.2 Creator Card

Creator cards are a core component because discovery is central to
Kolab.id.

Recommended structure:

``` text
┌─────────────────────────────────────┐
│ [Creator photo]        [Verified]   │
│                                     │
│ Creator Name                        │
│ @socialhandle                       │
│                                     │
│ Kuliner · Bandung                   │
│ ★ 4.9  ·  38 collaborations        │
│                                     │
│ Mulai dari                           │
│ Rp350.000 / video                   │
│                                     │
│ [Lihat Profil]     [Ajukan]         │
└─────────────────────────────────────┘
```

### Card Rules

-   Surface: `--color-bg-surface`
-   Border: `--color-border-default`
-   Radius: `--radius-lg`
-   Padding: `--space-6`
-   Creator image should be visually dominant.
-   Price must be immediately scannable.
-   Rating should include both icon and numeric value.
-   Do not use follower count as the dominant metric.

------------------------------------------------------------------------

## 10.3 Price Display

Pricing is a key differentiator of Kolab.id.

``` text
Mulai dari
Rp350.000
/video
```

Rules:

-   Price: Plus Jakarta Sans 700, 20--24px.
-   Supporting label: Inter 14px.
-   Currency and number should remain visually grouped.
-   Avoid using color alone to indicate whether a price is high or low.

------------------------------------------------------------------------

## 10.4 Status Badge

Statuses should use semantic color + text.

  Status     Background       Text
  ---------- ---------------- -----------------
  Menunggu   `--warning-50`   `--warning-700`
  Diterima   `--info-50`      `--info-700`
  Berjalan   `--primary-50`   `--primary-700`
  Selesai    `--success-50`   `--success-700`
  Ditolak    `--error-50`     `--error-700`

Radius: `--radius-pill`

------------------------------------------------------------------------

## 10.5 Inputs

  Property       Value
  -------------- -----------------
  Height         44--48px
  Radius         `--radius-md`
  Border         `--neutral-200`
  Text           `--neutral-900`
  Placeholder    `--neutral-400`
  Focus border   `--primary-500`
  Focus ring     `--primary-200`

States:

``` text
Default → Hover → Focus → Filled → Error → Disabled
```

------------------------------------------------------------------------

## 10.6 Filter Chips

Filter chips are useful for:

-   Category
-   City
-   Budget
-   Platform
-   Creator size

Default:

``` text
Background: --neutral-0
Border: --neutral-200
Text: --neutral-700
Radius: --radius-pill
```

Selected:

``` text
Background: --primary-50
Border: --primary-300
Text: --primary-700
```

------------------------------------------------------------------------

## 10.7 Cards

Default card:

-   Background: `--neutral-0`
-   Border: `--neutral-200`
-   Radius: `--radius-lg`
-   Padding: `--space-6`
-   Shadow: `--shadow-xs`

Hoverable card:

-   Border changes to `--primary-200`
-   Shadow changes to `--shadow-sm`
-   Transition: `--duration-fast`

Avoid excessive shadows across dashboards.

------------------------------------------------------------------------

## 10.8 Navigation

### Desktop

``` text
KOLAB.ID

Cari Kreator   Wawasan Harga   Cara Kerja

                         [Masuk] [Daftar]
```

### Authenticated

``` text
Dashboard
Kreator
Kolaborasi
Chat
Profile
```

Rules:

-   Active navigation uses `--primary-700`.
-   Active item may use `--primary-50` background.
-   Active states use blue only; never introduce a second hue.
-   Keep primary actions visually distinct from navigation.

------------------------------------------------------------------------

# 11. Data Visualization

For pricing insights and dashboard analytics:

1.  Primary series → `--primary-500`
2.  Comparison / highlight → `--primary-300`
3.  Positive trend → `--success-500`
4.  Warning → `--warning-500`
5.  Error → `--error-500`
6.  Neutral reference → `--neutral-300`

Never create additional arbitrary chart colors unless the data requires
more categories.

------------------------------------------------------------------------

# 12. Illustration & Brand Usage

The identity is single-hue: Kolab Blue supported by near-white gray
surfaces, hand-drawn / organic supporting shapes, and high-energy blue
color blocks. Green appears only for success feedback, never as
decoration.

For Kolab.id:

### Marketing / landing pages

Use stronger brand compositions:

``` text
Blue background
+ Stronger blue CTA
+ Green success/highlight
+ Warm neutral surface
```

### Dashboard

Use more neutral space:

``` text
Neutral background
+ White cards
+ Blue interaction
+ Blue tinted highlights (--primary-50)
+ Green semantic success
```

This keeps the dashboard practical while preserving the brand identity.

------------------------------------------------------------------------

# 13. Design System Rules for Kolab.id

### Do

-   Use purple as the primary visual anchor.
-   Use stronger purple steps or purple surfaces to draw attention.
-   Use secondary lime sparingly for accents and highlights.
-   Use green primarily for success and positive progress.
-   Keep prices highly scannable.
-   Show creator information consistently.
-   Use borders and spacing to create hierarchy.
-   Keep buttons moderately rounded rather than pill-shaped.
-   Use warm neutral backgrounds to soften the interface.

### Don't

-   Use secondary lime for primary actions or body links.
-   Make every component a pill.
-   Use green as a generic decorative color.
-   Use follower count as the only indicator of creator quality.
-   Hide pricing behind a contact/chat flow.
-   Use raw hex values directly inside components.
-   Use color alone to communicate status.
-   Overuse shadows or gradients.

------------------------------------------------------------------------

# 14. Token Quick Reference --- Tailwind v4

The app uses Tailwind CSS v4 (`@import "tailwindcss"` in
`app/globals.css`). Custom values live in `@theme`, which turns each
`--color-*`, `--font-*`, `--shadow-*`, and `--ease-*` entry into a
utility (`bg-primary-600`, `font-head`, `shadow-sm`, ...). Spacing
and duration tokens that already exist in Tailwind are consumed via
built-in classes --- see the mapping in section 16. Radius is the
exception: all rectangular steps are overridden to a global 10px in
`@theme` (see Shape below).

``` css
@import "tailwindcss";

@theme {
  /* Brand — Primary */
  --primary-50: #F7F2FF;
  --primary-100: #F0E6FF;
  --primary-200: #E0CAFF;
  --primary-300: #C6A0FF;
  --primary-400: #A76BFF;
  --primary-500: #812BFF;
  --primary-600: #7226E0;
  --primary-700: #6120BF;
  --primary-800: #4D1A99;
  --primary-900: #3A1373;

  /* Brand — Secondary */
  --secondary-50: #FAFFF2;
  --secondary-100: #F5FFE6;
  --secondary-200: #EAFFCA;
  --secondary-300: #D9FFA0;
  --secondary-400: #C4FF6B;
  --secondary-500: #AAFF2B;
  --secondary-600: #96E026;
  --secondary-700: #80BF20;
  --secondary-800: #66991A;
  --secondary-900: #4C7313;

  /* Supporting — Success (semantic only) */
  --success-50: #E8FFF2;
  --success-100: #C8FBDD;
  --success-200: #8FF5B8;
  --success-300: #50E98C;
  --success-400: #18DC6F;
  --success-500: #02D160;
  --success-600: #00B653;
  --success-700: #008E43;
  --success-800: #006E35;
  --success-900: #004D27;

  /* Neutral */
  --neutral-0: #FFFFFF;
  --neutral-50: #F9FAFB;
  --neutral-100: #F5F5F2;
  --neutral-200: #E8E8E3;
  --neutral-300: #D5D5CF;
  --neutral-400: #A8A8A0;
  --neutral-500: #77776F;
  --neutral-600: #5B5B55;
  --neutral-700: #41413D;
  --neutral-800: #292925;
  --neutral-900: #1D1D1A;
  --neutral-950: #11110F;

  /* Semantic */
  --error-50: #FFF0F0;
  --error-100: #FFD9D9;
  --error-500: #D92D20;
  --error-700: #B42318;

  --warning-50: #FFF8E7;
  --warning-100: #FFE8B0;
  --warning-500: #D98B00;
  --warning-700: #9A6200;

  --info-50: #EEF5FF;
  --info-100: #D7E7FF;
  --info-500: #2563EB;
  --info-700: #1D4ED8;

  /* Semantic aliases */
  --color-bg-page: var(--neutral-50);
  --color-bg-surface: var(--neutral-0);
  --color-bg-subtle: var(--neutral-100);
  --color-text-primary: var(--neutral-900);
  --color-text-secondary: var(--neutral-600);
  --color-text-muted: var(--neutral-500);
  --color-border-default: var(--neutral-200);
  --color-border-strong: var(--neutral-300);
  --color-brand-primary: var(--primary-500);
  --color-brand-primary-hover: var(--primary-600);
  --color-brand-primary-pressed: var(--primary-700);
  --color-brand-secondary: var(--secondary-500);
  --color-brand-secondary-hover: var(--secondary-600);
  --color-brand-secondary-pressed: var(--secondary-700);
  --color-success: var(--success-500);
  --color-error: var(--error-500);
  --color-warning: var(--warning-500);
  --color-info: var(--info-500);

  /* Shape — global 10px */
  --radius-sm: 10px;
  --radius-md: 10px;
  --radius-lg: 10px;
  --radius-xl: 10px;
  --radius-2xl: 10px;
  --radius-3xl: 10px;
  --radius-pill: 999px;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-7: 32px;
  --space-8: 40px;
  --space-9: 48px;
  --space-10: 64px;
  --space-11: 80px;
  --space-12: 96px;

  /* Motion */
  --ease-standard: cubic-bezier(.2,.8,.2,1);
  --ease-emphasized: cubic-bezier(.16,1,.3,1);
  --ease-out: cubic-bezier(.23,1,.32,1);
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;

  /* Typography */
  --font-head: 'Plus Jakarta Sans', sans-serif;
  --font-body: 'Inter', sans-serif;

/* Typography primitives + semantics live in :root (app/globals.css),
   full table in §4. Consumed via var() or Tailwind v4 paren shorthand:
   text-(--type-body-size), font-(--type-body-weight),
   tracking-(--type-body-tracking). */

  /* Shadow */
  --shadow-xs: 0 1px 2px rgba(29,29,26,.06);
  --shadow-sm: 0 2px 8px rgba(29,29,26,.08);
  --shadow-md: 0 8px 24px rgba(29,29,26,.10);
  --shadow-lg: 0 16px 40px rgba(29,29,26,.12);
}
```

------------------------------------------------------------------------

# 15. Design Direction Summary

  Dimension                 Kolab.id Direction
  ------------------------- ----------------------------------
  Primary                   Kolab Purple `#812BFF`
  Secondary                 Secondary Lime `#AAFF2B` (accents only)
  Supporting                Vivid Green `#02D160` (semantic only)
  Personality               Friendly, energetic, trustworthy
  Typography                Plus Jakarta Sans + Inter
  Buttons                   Moderately rounded, 10px
  Cards                     Soft 10px radius
  Surfaces                  Near-white gray + white
  Primary action            Blue
  Highlight                 Blue tint / strong blue
  Success                   Green
  Status                    Semantic colors
  Visual density            Medium, breathable
  Accessibility             WCAG 2.1 AA minimum

------------------------------------------------------------------------

# 16. Tailwind Mapping

How each token is written in code. Colors, fonts, radius, shadows,
and easing come from the `@theme` block in section 14; everything
else uses built-in Tailwind utilities.

### Colors

  Token               Tailwind usage
  ------------------- -----------------------------------------
  `--primary-500`     `bg-primary-500` / `text-primary-500` / ...
  `--primary-600`     Hover fills: `hover:bg-primary-600`
  `--primary-700`     Pressed fills, links: `text-primary-700`
  `--primary-50`      Tinted surfaces: `bg-primary-50`
  `--primary-200`     Focus rings: `focus:ring-primary-200`
  `--secondary-*`     Accents: `bg-secondary-500`, `bg-secondary-100`, ...
  `--success-*`       `bg-success-50`, `text-success-700`, ...
  `--error-*`         `bg-error-50`, `text-error-700`, ...
  `--warning-*`       `bg-warning-50`, `text-warning-700`, ...
  `--info-*`          `bg-info-50`, `text-info-700`, ...
  `--neutral-*`       Surfaces, text, borders: `bg-white`,
                      `text-neutral-900`, `border-neutral-200`

> The `@theme` neutral scale overrides Tailwind's default `neutral`
> with the warm Ink values. Use `slate-*` only on legacy screens that
> have not migrated yet.

### Radius

All rectangular radii are unified to a global **10px** via `@theme`
overrides in `app/globals.css` (`rounded-sm` through `rounded-3xl`,
including directional variants like `rounded-br-md`). Only pills stay
round.

  Token           Value   Tailwind class
  --------------- ------- ------------------
  `--radius-sm`   `10px`  `rounded-sm`
  `--radius-md`   `10px`  `rounded-md`
  `--radius-lg`   `10px`  `rounded-lg`
  `--radius-xl`   `10px`  `rounded-xl`
  `--radius-2xl`  `10px`  `rounded-2xl`
  `--radius-3xl`  `10px`  `rounded-3xl`
  `--radius-pill` `999px` `rounded-full`

### Spacing (4px base)

  Token        Value   Tailwind class
  ------------ ------- ----------------
  `--space-1`  4px     `*-1` (`p-1`, `m-1`, `gap-1`, ...)
  `--space-2`  8px     `*-2`
  `--space-3`  12px    `*-3`
  `--space-4`  16px    `*-4`
  `--space-5`  20px    `*-5`
  `--space-6`  24px    `*-6`
  `--space-7`  32px    `*-8`
  `--space-8`  40px    `*-10`
  `--space-9`  48px    `*-12`
  `--space-10` 64px    `*-16`
  `--space-11` 80px    `*-20`
  `--space-12` 96px    `*-24`

Layout constants: `--container-lg` (1024px) → `max-w-[1024px]`,
`--page-gutter-mobile` → `px-4`, `--page-gutter-desktop` → `px-8`,
`--section-gap` (80px) → `py-20`.

### Shadows and motion

  Token                 Tailwind class
  --------------------- ------------------------
  `--shadow-xs`         `shadow-xs`
  `--shadow-sm`         `shadow-sm`
  `--shadow-md`         `shadow-md`
  `--shadow-lg`         `shadow-lg`
  `--duration-fast`     `duration-150`
  `--duration-normal`   `duration-250`
  `--duration-slow`     `duration-400`
  `--ease-standard`     `ease-standard`
  `--ease-emphasized`   `ease-emphasized`
  `--ease-out`          `ease-out`

### Typography

Type roles resolve to `--type-*-{size,weight,tracking}` tokens (§4).
Prefer the helper classes in `app/globals.css` (one per role) and add
color + family utilities alongside:

  Role          Helper + color/family example
  ------------- ------------------------------------------------------------------
  Display       `type-display font-head text-neutral-900`
  H1 / H2       `type-h1 font-head text-neutral-900`
  Body / Lead   `type-body text-neutral-600`
  Page title    `type-page-title font-head text-neutral-900`
  Metric        `type-metric font-head text-neutral-900`
  Table / head  `type-table text-neutral-700` / `type-table-head uppercase text-neutral-500`
  Caption       `type-caption text-neutral-500`
  Badge         `type-badge uppercase text-neutral-600`

Raw Tailwind equivalent (when a helper doesn't fit):
`text-(--type-body-size) font-(--type-body-weight)
tracking-(--type-body-tracking)`.

Headings use `font-head` (Plus Jakarta Sans); body uses the default
sans (Inter). Tracking comes from each role's `--type-*-tracking`.

------------------------------------------------------------------------

*Kolab.id Design System v1.3 · Palette re-based to primary
`#812BFF` and secondary lime `#AAFF2B`; secondary accents on the
landing page.*
