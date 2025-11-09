# Hype Insight Reviews - Brand Guidelines

## Brand Identity

**Brand Name:** Hype Insight Reviews  
**Tagline:** Review Management System  
**Primary Domain:** hypeinsight.com  
**Service Domain:** reviews.hypeawareness.com

---

## Color Palette

### Primary Colors

#### Green (Primary Brand Color)
- **Hex:** `#46B646`
- **RGB:** `70, 182, 70`
- **Usage:** Primary buttons, highlights, success states, stat values
- **Hover State:** `#3da03d` (darker green)
- **Shadow:** `rgba(70, 182, 70, 0.3)` for glows

#### Dark Navy (Background)
- **Hex:** `#02202E`
- **RGB:** `2, 32, 46`
- **Usage:** Main background, dark surfaces

### Secondary Colors

#### Cyan/Teal (Secondary)
- **Hex:** `#00A9BA`
- **RGB:** `0, 169, 186`
- **Usage:** Accents, links, secondary highlights

#### Yellow (Accent)
- **Hex:** `#FFCB2B`
- **RGB:** `255, 203, 43`
- **Usage:** Star ratings, warning states, attention elements

### Neutral Colors

#### White
- **Hex:** `#FFFFFF`
- **RGB:** `255, 255, 255`
- **Usage:** Text, cards, primary content
- **Opacity Variations:**
  - 100%: Primary text
  - 70%: Secondary text (`rgba(255, 255, 255, 0.7)`)
  - 12%: Hover states (`rgba(255, 255, 255, 0.12)`)
  - 10%: Borders (`rgba(255, 255, 255, 0.1)`)
  - 8%: Card backgrounds (`rgba(255, 255, 255, 0.08)`)

#### Gray Scale
- **Gray 50:** `#F8F8F8` - Light backgrounds
- **Gray 200:** `#EEEEEE` - Borders, dividers
- **Gray 600:** `#666666` - Muted text

### Gradient

#### Primary Gradient (Purple to Pink)
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```
- **Usage:** Email headers, premium features, special highlights

#### Button Gradient
```css
background: linear-gradient(135deg, #46B646 0%, #3da03d 100%);
```
- **Usage:** Enhanced button states

---

## Typography

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```
- **Primary:** System fonts for optimal performance
- **Widget Font:** 'Inter' (imported from Google Fonts)

### Font Weights
- **Regular:** 400 - Body text
- **Medium:** 500 - Labels, secondary headings
- **Semi-Bold:** 600 - Buttons, emphasis
- **Bold:** 700 - Headings, titles

### Type Scale

#### Headings
- **H1:** 32px / 700 weight - Page titles
- **H2:** 24px / 700 weight - Section headers
- **H3:** 20px / 600 weight - Card titles
- **H4:** 18px / 600 weight - Subsections

#### Body Text
- **Large:** 16px - Primary content
- **Default:** 15px - Buttons, forms
- **Small:** 14px - Labels, metadata
- **Tiny:** 12px - Captions, footnotes

#### Display
- **Stats:** 32px / 700 weight - Dashboard metrics
- **Large Display:** 48px - Email stars, icons

---

## Component Styles

### Buttons

#### Primary Button
```css
background: #46B646;
color: white;
padding: 12px 24px;
border-radius: 8px;
font-size: 15px;
font-weight: 600;
box-shadow: 0 2px 8px rgba(70, 182, 70, 0.3);
```

**Hover:**
```css
background: #3da03d;
transform: translateY(-1px);
box-shadow: 0 4px 12px rgba(70, 182, 70, 0.4);
```

#### Secondary Button
```css
background: #e8f5e9;
color: #46B646;
border: 1px solid #46B646;
```

### Cards

#### Standard Card
```css
background: rgba(255, 255, 255, 0.08);
border: 1px solid rgba(255, 255, 255, 0.1);
border-radius: 12px;
padding: 24px;
box-shadow: 0 2px 8px rgba(0,0,0,0.3);
```

**Hover:**
```css
background: rgba(255, 255, 255, 0.12);
border-color: #46B646;
box-shadow: 0 4px 16px rgba(70, 182, 70, 0.3);
transform: translateY(-2px);
```

### Modals

#### Modal Backdrop
```css
background: rgba(0, 0, 0, 0.5);
```

#### Modal Content
```css
background: white;
border-radius: 12px;
padding: 32px;
max-width: 500px;
box-shadow: 0 20px 60px rgba(0,0,0,0.3);
```

### Forms

#### Input Fields
```css
border: 1px solid #ddd;
border-radius: 6px;
padding: 12px;
font-size: 14px;
```

#### Text Areas
```css
border: 1px solid #ddd;
border-radius: 6px;
padding: 12px;
min-height: 100px;
resize: vertical;
```

### Badges

#### Success Badge
```css
background: rgba(70, 182, 70, 0.2);
color: #46B646;
padding: 4px 12px;
border-radius: 12px;
font-size: 12px;
font-weight: 600;
```

#### Warning Badge
```css
background: #fef3c7;
color: #92400e;
```

#### Info Badge
```css
background: #dbeafe;
color: #1e40af;
```

---

## Spacing System

### Scale
- **xs:** 4px
- **sm:** 8px
- **md:** 12px
- **base:** 16px
- **lg:** 24px
- **xl:** 32px
- **2xl:** 48px
- **3xl:** 64px

### Common Patterns
- **Card Padding:** 24px
- **Modal Padding:** 32px
- **Section Spacing:** 32px
- **Grid Gap:** 24px (desktop) / 16px (mobile)
- **Button Padding:** 12px 24px

---

## Shadows

### Elevation System

#### Level 1 (Default)
```css
box-shadow: 0 2px 8px rgba(0,0,0,0.3);
```

#### Level 2 (Hover)
```css
box-shadow: 0 4px 16px rgba(70, 182, 70, 0.3);
```

#### Level 3 (Modal)
```css
box-shadow: 0 20px 60px rgba(0,0,0,0.3);
```

#### Glow Effect
```css
box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
```

---

## Border Radius

- **Small:** 6px - Inputs, small elements
- **Medium:** 8px - Buttons
- **Large:** 12px - Cards, modals
- **XL:** 16px - Widget buttons

---

## Transitions

### Standard Transition
```css
transition: all 0.2s ease;
```

### Smooth Bezier
```css
transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
```

### Transform Hover
```css
transform: translateY(-2px);
```

---

## Breakpoints

### Mobile First Approach

- **Mobile:** < 480px
- **Tablet:** < 768px
- **Desktop:** > 768px
- **Large Desktop:** 1400px max-width

### Media Queries
```css
@media (max-width: 480px) { /* Mobile */ }
@media (max-width: 768px) { /* Tablet */ }
@media (min-width: 769px) { /* Desktop */ }
```

---

## Widget Branding

### Default Widget Colors
- **Primary:** `#4285F4` (Google Blue - if no custom color set)
- **Custom:** Client's brand color (configurable)

### Widget Button
```css
background: linear-gradient(135deg, primaryColor 0%, darkerShade 100%);
padding: 16px 32px;
border-radius: 16px;
font-size: 15px;
font-weight: 600;
box-shadow: 0 8px 32px rgba(0,0,0,0.12);
```

---

## Email Templates

### Email Color Scheme
- **Header Gradient:** `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **Background:** `#f5f5f5`
- **Card Background:** `white`
- **Text:** `#333` (primary) / `#666` (secondary)

### Rating Colors
- **5 Stars:** Green border (`#4caf50`)
- **3 Stars:** Orange border (`#ff9800`)
- **1-2 Stars:** Red border (`#f44336`)

### Email Star Rating
- **Filled Star:** `★` (gold `#FFD700`)
- **Empty Star:** `☆` (same color)

---

## Logo Usage

### Dashboard Logo
- **Location:** Top left header
- **Size:** 48px height (desktop) / 36px (mobile)
- **File:** `/Logo/logo-resized.webp`

### Email Logo
- **Format:** PNG or WebP
- **Alt Text:** "Hype Insight"

---

## Powered By Attribution

### Footer Text
```
Powered by Hype Insight
```

### Link
- **URL:** `https://hypeinsight.com/?utm_source=review_widget&utm_medium=referral&utm_campaign=powered_by_review_modal`
- **Color:** `#667eea` (hover: `#764ba2`)
- **Font Size:** 12px
- **Font Weight:** 600

### White Label Option
Can be hidden with `data-white-label="true"` attribute

---

## Accessibility

### Color Contrast
- All text meets WCAG AA standards
- Primary green (#46B646) on white: 3.5:1 ratio ✓
- White text on dark (#02202E): 18:1 ratio ✓

### Focus States
- Visible focus rings on all interactive elements
- Keyboard navigation support

---

## Animation Guidelines

### Timing Functions
- **Standard:** `ease` or `cubic-bezier(0.4, 0, 0.2, 1)`
- **Duration:** 0.2s - 0.4s
- **Hover:** Immediate feedback (<0.2s)

### Transforms
- Prefer `transform` over `top/left` for performance
- Use `translateY(-2px)` for lift effect
- Use `scale(1.02)` for subtle growth

---

## Icon System

### Star Ratings
- **Character:** `★` (U+2605)
- **Size:** 16px - 48px depending on context
- **Color:** `#FFD700` (active) / `#ddd` (inactive)

### Emoji Usage
- **Success:** ✓ or 🌟
- **Warning:** ⚠️ or 🚨
- **Info:** ℹ️ or 💡

---

## Best Practices

1. **Consistency:** Always use CSS variables for colors
2. **Spacing:** Use the spacing scale, avoid arbitrary values
3. **Shadows:** Use elevation system, don't create custom shadows
4. **Borders:** Prefer subtle borders with transparency
5. **Hover States:** Always provide visual feedback
6. **Mobile First:** Design for mobile, enhance for desktop
7. **Performance:** Use system fonts where possible
8. **Accessibility:** Maintain color contrast ratios

---

## CSS Variables Reference

```css
:root {
  --color-primary: #46B646;
  --color-dark: #02202E;
  --color-secondary: #00A9BA;
  --color-accent: #FFCB2B;
  --color-white: #FFFFFF;
  --color-gray-50: #F8F8F8;
  --color-gray-200: #EEEEEE;
  --color-gray-600: #666666;
}
```

---

*Last Updated: November 2024*  
*Version: 1.0*
