---
name: SF Rats
description: Playful city guide for discovering and sharing local events
colors:
  bg: "#f7f7f4"
  surface: "#fff"
  surface-2: "#e9e9e5"
  ink: "#171717"
  ink-soft: "#414141"
  ink-muted: "#626262"
  rule: "#d7d7d2"
  accent: "#4055b5"
  accent-ink: "#2f408f"
  location-blue: "#2563eb"
typography:
  display:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "30px"
    fontWeight: 500
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "20px"
    fontWeight: 550
    lineHeight: 1.25
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "14px"
  label:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    letterSpacing: "0"
rounded:
  control: "12px"
  surface: "20px"
  marker: "50%"
spacing:
  unit: "4px"
  small: "8px"
  mobile-gutter: "16px"
  desktop-gutter: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    rounded: "{rounded.surface}"
    padding: "0 16px"
  button-primary-hover:
    backgroundColor: "{colors.accent-ink}"
    textColor: "{colors.surface}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "10px 12px"
  filter-trigger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "8px 14px"
  filter-trigger-active:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
  search-input:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "10px 12px"
  navigation:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    height: "64px"
    padding: "0 32px"
  event-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "22px 16px 16px"
  event-popup:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "20px"
  venue-marker:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.accent-ink}"
    rounded: "50%"
    minWidth: "40px"
    height: "40px"
---

# Design System: SF Rats

## Overview

**Creative North Star: "Playful city guide"**

The map stays colorful. Do not restore the removed “Out in the Bay” heading. Swiss structure does not imply a monochrome map. The confirmed direction is a light Swiss city guide: Helvetica typography, clear grids, clear structural regions, soft rounded controls, thin rules, and one blueberry-blue accent with quiet pastel surfaces. The existing rat-on-bridge mark is the single handmade detail. The signature interaction is selecting emoji event pins, opening event detail, then planning a visit.

This refresh preserves the established direction contract. The tool route remains the starting kit, with its dark palette, rounded controls, and display-font suggestions explicitly overridden. Precedence is explicit user request, this file, taste/SIGNATURE.md, then Impeccable defaults. Product context is limited to the README and current routes: SF Rats supports local discovery and sharing, while the current application foregrounds Bay Area events. PRODUCT.md is absent; no additional audience or brand preferences are assumed.

**Key Characteristics:**

- Helvetica throughout the interface.
- Near-white canvas, white surfaces, dark ink, and blueberry blue.
- Flat event rows and compact filters organized by rules and alignment.
- Emoji event pins linked to the event index, and a distinct blue user-location indicator.

Source of truth: the frontmatter records the effective shared values in `frontend/src/index.css`, with matching aliases in `frontend/tailwind.config.js`. The imported `frontend/src/styles/tokens/tool.css` supplies the spacing unit but its palette and typography are overridden. This document is an implementation scan, not a claim that every legacy component has been normalized. Component excerpts and non-frontmatter extensions live in `.impeccable/design.json`.

## Colors

The palette combines a near-white canvas and neutral ink with blueberry blue.

### Primary

- **Blueberry blue** (`accent`): primary actions, active filters, event icons, venue markers, and the brand period.
- **Deep blueberry blue** (`accent-ink`): primary-action hover and quieter accent text.

### Neutral

- **Canvas** (`bg`): page background and subtle hover surfaces.
- **White surface** (`surface`): masthead, controls, dropdowns, and map overlays.
- **Secondary surface** (`surface-2`): subdued interaction backgrounds.
- **Ink** (`ink`): primary text and structural rules.
- **Soft ink** (`ink-soft`): introductory and reading text.
- **Muted ink** (`ink-muted`): metadata and secondary labels.
- **Hairline** (`rule`): separators and control boundaries.

The semantic location-blue token belongs only to the user's location indicator. It is not a second brand accent. The sidecar preserves the existing brand tonal scale from Tailwind; synthesized preview ramps for other colors are display aids, not additional application tokens.

**The Accent Rule.** Use the blueberry accent to make actions, selected state, and event locations legible. The blue location indicator retains a separate meaning.

## Typography

Helvetica Neue, Helvetica, Arial, and the system sans-serif fallback serve display, body, and labels. Actual code may use monospace. The voice is compact and direct; typography supplies hierarchy without decorative font pairing.

The display role is available for other surfaces; the explore page has no visible heading. Date headings use the headline role, event titles use title, and metadata uses label. The map must dominate the page. Date headings become 25px and event titles 18px on mobile. Reading prose is limited to 65ch with a 1.75 line height; introductory text uses a 1.5 line height. The masthead is 23px, weight 750, with tight tracking, reducing to 19px on mobile.

Secondary pages retain local size and weight variants. Some secondary controls still carry tracked uppercase labels from the earlier implementation; these are legacy exceptions rather than the preferred label model. Use sentence-case labels with normal tracking for new interface work.

## Layout

Use the established 4px spacing unit, desktop gutters of 32px, and mobile gutters of 16px. Compact controls may use optical adjustments outside the base rhythm. The fixed masthead is 64px high on desktop and 56px below 767px. The explore surface fills the remaining viewport.

The explore page starts directly with one compact row of When, Types, Near me and Search dropdowns. The map fills the full width. Map and List are separate views, with a collapsible Just posted panel on the desktop map. Phones retain a labeled horizontal Map/List switch. Mobile dropdowns span the viewport between 16px side gutters and scroll within a bounded height.

The date-grouped list is centered with a 1120px maximum width. On desktop each day has a 180px date column, a flexible event column, and a 40px gap. On mobile the date and event columns stack. Keep existing posting, listing, editing, management, About, and For AI routes and calendar links.

## Elevation & Depth

Page structure is flat. One-pixel neutral rules divide rows and controls; two-pixel ink rules anchor date groups. Floating dropdowns and event popups use soft shadows, with subtle shadows under map markers. The map uses an authored vector style with clear blue water (#91cde8), warm land (#f4eedf), green parks (#a9d58c), golden main roads (#f6d68b), white local roads, and readable neighborhood labels. Do not use a grayscale filter on a dense raster map. Exact shadow values and motion settings live in the sidecar.

**The Flat Structure Rule.** Use alignment, tonal surfaces, and rules for the page structure. Soft shadows belong to floating overlays and map markers.

## Shapes

Use pill radii for filter triggers, primary actions and segmented view controls, 20px radii for floating panels, and 12px radii for smaller interactive surfaces. The mobile event sheet has 24px top corners. Preserve circles for event pins, the map key, and the user-location indicator. These circles communicate map state rather than decorating containers.

## Components

### Buttons

Buttons use rounded controls or pills, with unchanged hit areas and visible focus. The primary masthead action uses blueberry blue with white text and deep blueberry on hover. The secondary icon actions use white, an ink border, and a canvas hover. Controls retain visible focus: a blueberry two-pixel outline with a three-pixel offset. Do not add movement or dimensional effects that alter the control's stable geometry.

### Filter chips and dropdowns

Date, type, nearby, and search share a softly tinted pill trigger. Selected filters fill red; an expanded trigger gains an ink border. Desktop triggers have a 40px minimum height, reducing to 36px on mobile. Dropdowns use white surfaces, neutral borders, and soft elevation. They close on outside click or Escape. The search control displays its active term in the trigger.

### Inputs / Fields

Search uses a canvas fill and a one-pixel border, changing to white with a darker border and a one-pixel ink focus ring on focus. Posting fields have a stronger two-pixel ink border. Preserve accessible field names and visible focus. Individual field sizes remain component-specific; do not infer a single shared input height from the body type token.

### Navigation

A fixed white masthead uses a dark bottom rule, a compact logo and wordmark, and text links that turn blueberry blue on hover or when active. The Post an event action retains its text on mobile. About, Discord, and For AI appear directly in desktop navigation and under More on phones; the descriptive brand line is omitted.

### Event rows and popups

Event rows are flat, rule-separated, and turn white on hover. Date labels form a separate column on desktop. A listing preview popup is white with a neutral border, soft shadow, and compact metadata. On mobile it becomes a full-width bottom sheet with safe-area padding and a maximum height of 65dvh. Preserve the event actions for opening details, sharing, editing, directions, and adding to a calendar.

### Venue markers

White pins carry event emojis without numerical counts. Clicking opens one actual event immediately; events sharing coordinates are individually selectable by name under Also here. Nearby pins never collapse into numeric clusters. Overlapping click targets separate with thin leader lines back to the recorded coordinates. The event index and map share selection; row hover highlights the corresponding pin without changing what clicking it opens. Only the selected pin fills blueberry blue. Hover tooltips name the event. User location remains blue. Motion respects reduced-motion preferences.

SF neighborhood label points are derived from DataSF's 41 Analysis Neighborhoods. Names appear at the opening city zoom; street labels appear closer in. Retain the DataSF attribution and bundled source note. Map labels are orientation aids, not venue locations. Event descriptions, coordinates, dates and detail links come from the existing live feed. Exclude scraper metadata and imported directory pages with neither an event date nor a venue from both list and map.

## Do's and Don'ts

### Do

- Do keep the existing rat-on-bridge mark as the single handmade detail.
- Do reserve solid blueberry blue map fills for selected venues; use blueberry icons, primary actions, and selected state elsewhere; reserve blue for user location.
- Do preserve visible keyboard focus, stable control geometry, and reduced-motion interactions.
- Do keep date, type, nearby, and search filters in the unified toolbar.
- Do verify the map, dropdowns, and stacked event list at 390px without horizontal overflow.

### Don't

- Don't reintroduce paper grain, slanted stamps, decorative serif type, monospace interface labels or hard offset shadows.
- Don't turn flat list rows into a grid of elevated cards.
- Don't fabricate event data or change persistent records as part of visual work.
- Don't treat legacy tracked uppercase labels in secondary controls as a new visual direction.

## Current layout: original SF Rats, new theme

Amy asked to preserve the original website format with the new theme. The full-width map, compact filter dropdowns, separate date-grouped List view, desktop navigation links, and collapsible Just posted panel define that format. Do not reintroduce the permanent split event index or the extra activity strip by default.

Keep the white interface, Helvetica typography, restrained blueberry accent, colorful map, readable neighborhood labels and expressive emoji pins. Keep numeric clustering removed. Event previews open directly; other events at the same recorded location remain individually selectable by name. List rows link to detail pages and retain source and calendar actions. Just posted uses the same filtered live event feed as the map.

Phones retain visible Post an event and Map/List labels, with secondary navigation under More. The four compact filters fit in one row at 390px. This responsive adaptation preserves the original browsing structure without restoring the old cream palette, decorative type or stamped shadows. Development continues directly without Rivet.

## Event emoji choices

Map pins are fixed 40px circles with no horizontal padding, centered emoji and 44px click targets. Keep their shape stable for every glyph. Amy prefers shopping bags over shopping carts, puzzle pieces for trivia instead of brains, and contextual activity icons or sparkles instead of generic calendars. Apply these as display choices across map pins, lists and event previews; stored event categories and filtering retain their existing meaning.

## Softer and more playful

Amy explicitly wants rounded shapes and more fun overall. This overrides the earlier sharp Swiss geometry. Preserve the original full-width map format and white interface while adding butter-yellow, peach, mint and pale-blue filter surfaces. Use lightly tinted category pins, rounded previews and a warm Just posted panel. Keep the rat mark, expressive event emojis and contextual selection as the personality; avoid new hero sections or layout changes. All map pins remain true 40px circles.

## Shared system across routes

Amy selected blueberry blue as the accent. `--accent-50` through `--accent-700` in `index.css` are the single brand scale; Tailwind's legacy `bridge` aliases resolve to these tokens. Primary actions, selection, links and keyboard focus share the scale. Soft yellow, peach, mint and sky surfaces support categories, rather than becoming competing primary actions.

The list uses rounded day groups with flat rows inside, pastel emoji tiles, compact time/location metadata and small date pills. Calendar and source actions remain separate from the row's detail link. Imported HTML and entities become plain display text, never injected HTML; database records are preserved.

Posting, editing, details, management, About and For AI use the shared `content-page` type, input and control styling. Headings use a 32–42px scale, fields have 12px corners, floating and grouped surfaces 20px corners, and action buttons use pills. Event details and location selection reuse the colorful basemap. Code remains monospace in developer documentation. Keep error semantics and all existing workflows intact.

## Recurring rat mark

Amy welcomes the existing rat-on-bridge logo in more places. Reuse the original artwork as a small mascot beside secondary-page headings, in Just posted, in empty states, and on the return-to-exploring link. Pastel framing uses the shared yellow and blue surfaces. Preserve its proportions and keep it decorative when nearby text supplies the meaning. Repetition of this same handmade detail is welcome; retain event-specific emojis for event rows and map pins.
