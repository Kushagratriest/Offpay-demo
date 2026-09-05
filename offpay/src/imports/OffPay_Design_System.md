# OffPay Design System — Locked Specs

## Color Palette

**Dark Theme Base (Apple Style)**
- Background: `#0F172A` (Slate-900, near-black)
- Surface: `#1E293B` (Slate-800, elevated surfaces)
- Border: `#334155` (Slate-700, subtle dividers)
- Text Primary: `#F1F5F9` (Slate-50, main text)
- Text Secondary: `#CBD5E1` (Slate-300, secondary text)

**Accent Color: Teal**
- Primary Accent: `#14B8A6` (emerald teal)
- Accent Hover: `#0D9488` (darker teal)
- Accent Light: `#99F6E0` (light teal, hover states only)

**Semantic Colors**
- Success: `#10B981` (green, for completed transactions)
- Warning: `#F59E0B` (amber, for pending)
- Error: `#EF4444` (red, for failures)

---

## Typography (iOS/Apple Style)

**Font:** SF Pro Display (San Francisco) or system font fallback

| Level | Size | Weight | Line Height | Use Case |
|-------|------|--------|-------------|----------|
| Display | 34pt | 700 (Bold) | 41pt | Balance figure |
| Title | 28pt | 600 (Semi) | 34pt | Screen title |
| Headline | 20pt | 600 (Semi) | 24pt | Section headers |
| Body | 16pt | 400 (Regular) | 22pt | Main text, transaction details |
| Caption | 14pt | 400 (Regular) | 18pt | Timestamps, secondary info |
| Small | 12pt | 400 (Regular) | 16pt | Fine print, labels |

---

## Spacing System (8pt Grid)

Apple principle: **spacing implies relationship**

| Spacing | Pixels | Usage |
|---------|--------|-------|
| XS | 4px | Internal button padding |
| S | 8px | Tight grouping (related items) |
| M | 12px | Moderate grouping |
| L | 16px | Standard padding, element spacing |
| XL | 24px | Section separation |
| XXL | 32px | Major sections |

**Applied:**
- Page padding: 16px (L)
- Button rows gap: 12px (M)
- Section gap: 24px (XL)
- Button internal padding: 16px horizontal, 12px vertical (L + M)

---

## Button System

### Primary Button (Accent Color)
- **Background:** `#14B8A6` (Teal)
- **Text:** `#0F172A` (Dark slate)
- **Size:** 48pt height (exceeds Apple's 44pt minimum for confidence)
- **Width:** Full width of container
- **Padding:** 12px vertical, 16px horizontal (interior text padding)
- **Border Radius:** 12px (Apple's modern rounded look)
- **Typography:** 16pt, 600 weight (Headline)
- **States:**
  - Normal: Teal background
  - Pressed: `#0D9488` (darker teal, 200ms animation)
  - Disabled: `#64748B` (slate-500, 50% opacity text)
- **Shadow:** Subtle: `0 2px 8px rgba(20, 184, 166, 0.15)` (soft teal glow)

### Secondary Button (Outline)
- **Background:** Transparent
- **Border:** 1.5px `#334155` (slate-700)
- **Text:** `#F1F5F9` (light slate)
- **Size:** 48pt height
- **Padding:** 12px vertical, 16px horizontal
- **Border Radius:** 12px
- **Typography:** 16pt, 500 weight
- **States:**
  - Normal: Border only
  - Pressed: Background `#1E293B` (surface color fills)
  - Disabled: Border `#475569` (muted)

---

## Quick Actions Layout (Main Screen)

### Grid Layout: 3 Columns × 2 Rows

**Why 3 + 3?** 
- Fits comfortable thumb reach on mobile
- Aligns with Apple's safe zone design
- Each button gets clear visual hierarchy

**Buttons (in order):**

**Row 1:**
1. Add to Wallet (icon: wallet.plus)
2. Send to Bank/UPI (icon: arrow.right.square)
3. Show QR (icon: qrcode)

**Row 2:**
4. Send to Phone (icon: person.badge.plus)
5. Request Money (icon: hand.raised) ← Bluetooth scan for nearby
6. Bills & Recharge (icon: building.2)

### Dimensions

- Button visual area: 60px × 60px (icon)
- Hit area (tap target): 44pt minimum, reached via padding
- Button card (with label): 75px wide, 95px tall
- Gap between buttons: 12px (M spacing)
- Gap between rows: 16px (L spacing)
- Container padding: 16px (L) on all sides

### Typography (within Quick Actions)
- Icon: 24px (SF Symbols, centered)
- Label: 12pt, 500 weight, `#CBD5E1` (slate-300)
- Centered alignment, no more than 2 lines per label

---

## Interaction Principles (Apple HIG)

1. **Tap Target:** All interactive elements = minimum 44pt square (hit area)
2. **Feedback:** 
   - Tap color change (immediate)
   - Haptic feedback (light tap when available)
   - No loading spinners unless >1s wait
3. **Whitespace:** Don't pack elements; let them breathe
4. **Consistency:** Use the same button style everywhere; don't mix styles on one screen
5. **Color Reserve:** Only use teal accent for actionable elements — trains vendor eyes to recognize what's clickable

---

## Safe Areas & Padding

- Top safe area: Respect notch/status bar
- Bottom safe area: 16px above home indicator
- Left/Right: 16px minimum padding
- Content max-width: 360px (standard mobile)

---

## Dark Theme Notes

- Background: Never pure black (#000000) — use #0F172A instead (easier on OLED, less harsh)
- Text contrast: Light slate (#F1F5F9) on dark (#0F172A) = 14.3:1 contrast ratio (WCAG AAA)
- Accent contrast: Teal (#14B8A6) on dark = 7.8:1 (WCAG AA+)
- Use subtle shadows, not borders, to show elevation

---

## Components Needed (for Figma)

- Button (primary, secondary, disabled states)
- Button Row (3-column grid for quick actions)
- Text Input (for phone entry, VAN display)
- Transaction Card (for history)
- Badge (for pending/settled status)
- Icon set (SF Symbols port or custom)

---

## Figma Setup Guide

1. **Create Color Styles** for each color (auto-apply to components)
2. **Create Text Styles** for each typography level
3. **Create Components:**
   - Button/Primary (variant: normal, pressed, disabled)
   - Button/Secondary (variant: normal, pressed, disabled)
   - QuickActionButton (grid-friendly)
4. **Set up 8pt grid** (View → Show Layout Grid → 8px)
5. **Use Constraints** for responsive layouts (horizontal: left+right, vertical: top)
6. **Create frame "SafeArea"** showing 16px padding boundaries

---

## Tone & Trust Signals

- Professional, minimalist, serious
- Only teal accent on actions (not decorative)
- Generous whitespace (Apple principle: "content is the star")
- No gradients, no playful icons
- Clear error messages (not just red Xs)
- Show status always (pending vs settled)

---

## Next Steps for Figma Build

1. Import SF Symbols (or equivalent icon set)
2. Build Quick Actions grid (3×2)
3. Build transaction history card
4. Build text input for phone/VAN
5. Use specs above as your bible — no deviations
6. Test on mobile (360px width) and tablet (480px width)

Use Figma AI prompt like:
> "Create a dark theme mobile app header with [color], [spacing], following Apple HIG. Quick action buttons in 3×2 grid, 48pt height, 12px gaps."

---

## Security & Reliability Signals

- **Lock icon** near sensitive actions (Request Money via Bluetooth)
- **Clear status badges:** "✓ Settled", "⏳ Pending", "✗ Failed"
- **Transaction timestamp** always visible (vendors track money flow)
- **VAN display** with copy button (reassures vendor their account is set up)
- **QR scan feedback** ("Nearby devices found" vs "No devices found")

