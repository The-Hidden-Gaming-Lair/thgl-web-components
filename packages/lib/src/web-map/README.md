@repo/web-map (prototype)

Goals

- WebGL2 map engine tailored for THGL interactive maps.
- Fast tiles + 10k–100k markers, rotation, smooth pan/zoom.

Status

- Prototype scaffolding with camera, renderer bootstrap, and layer APIs.
- Minimal WebGL skeleton for tiles and instanced markers.
- ✅ Drawing system implemented (Geoman replacement) with WebGL rendering.
- ✅ Interactive drawing tools: line, rectangle, polygon, circle, text.
- ✅ Event system for drawing interactions and shape management.

API sketch

import { WebMap, TileLayer, MarkerLayer, DrawingManager } from '@repo/web-map';

const map = new WebMap({
canvas: document.getElementById('map') as HTMLCanvasElement,
center: [lat, lng],
zoom: 3,
bearing: 0,
});

const tiles = new TileLayer({
url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
subdomains: ['a', 'b', 'c'],
filter: null,
colorBlind: { mode: 'none', severity: 1 },
});

const markers = new MarkerLayer();
markers.add({ id: '1', latLng: [lat, lng], radius: 10, fillColor: '#FFFFFFFF' });

// Drawing functionality (Geoman replacement)
const drawingManager = new DrawingManager(map, {
defaultColor: '#3388ff',
defaultSize: 3,
textColor: '#000000',
textSize: 16,
});

// Enable drawing modes
drawingManager.enableDraw('line');
drawingManager.enableDraw('rectangle');
drawingManager.enableDraw('polygon');
drawingManager.enableDraw('circle');
drawingManager.enableDraw('text');

// Listen to drawing events
drawingManager.on('drawing:create', (e) => {
console.log('Shape created:', e.shape);
});

map.addLayer(tiles, { zIndex: 0 });
map.addLayer(markers, { zIndex: 10 });

## Drawing System Architecture

The drawing system provides a complete replacement for @geoman-io/leaflet-geoman-free with WebGL-based rendering:

### Components

- **DrawingLayer**: WebGL2 layer for rendering shapes with custom shaders
- **DrawingManager**: Interaction manager for creating and editing shapes
- **Shape Types**: Line, Rectangle, Polygon, Circle, Text with full coordinate projection
- **Event System**: Comprehensive events for drawing lifecycle management

### Key Features

- WebGL2 rendering with proper coordinate projection for all shape types
- Interactive drawing modes with real-time preview
- Event-driven architecture compatible with React components
- Map interaction control (disables pan/zoom during drawing)
- Shape management (add, update, remove, clear operations)
- Customizable styling (colors, sizes, text properties)

### Files

- `layers/drawing.ts` - WebGL rendering layer for shapes
- `drawing/drawing-manager.ts` - Interactive drawing controller
- `webmap.ts` - Updated with interaction control methods
- `index.ts` - Exports drawing components for public API

TODO (Leaflet replacement + new features)

- Core Engine Parity

  - ✅ Cursor‑anchored zoom with smooth coupled pan (wheelAccum + zoomAtScreen)
  - ✅ Pan inertia with soft bounds/rubber‑band (panAnim + setPanConstraints)
  - ✅ Rotation controls (RMB drag for bearing/pitch)
  - [ ] Keyboard/touch gestures for rotation (currently mouse-only)
  - [ ] FitBounds(bounds, padding) helper (affine + WebMercator)
  - [ ] Programmatic animations (flyTo, easeTo) with interrupt rules

- Tiles (Raster) Stability + UX

  - ✅ Finalize addressing for XYZ vs z/{y}/{x} (supports flexible {x}/{y} ordering)
  - [ ] AbortController for stale tile fetches on rapid zoom/pan
  - [ ] Prefetch 1–2 rings around viewport (current and target zoom)
  - ✅ Cross‑fade LOD transition (fadeMs=220ms, prev/active zoom layers)
  - ✅ Tile cache sizing + LRU eviction (evictUnusedTiles with ±3 zoom tolerance)
  - ✅ Error/404 policy (network errors retry after 5s, server errors marked failed)
  - [ ] Optional OffscreenCanvas + Worker decoding for heavy tiles

- Markers (Instanced)

  - ✅ Highlight, discovered, zPos arrows (isHighlighted, isDiscovered, zPos rendering)
  - ✅ Icon atlas/spritesheets (IconSheet + loadFilterIconMap)
  - [ ] Worker packing for sprite atlas optimization
  - [ ] GPU color picking path (currently using CPU pick() method)
  - ✅ Text labels: HTML overlay (DrawingLayer text elements)
  - [ ] GPU SDF text rendering (future enhancement)
  - ✅ Zoom‑aware radius policy (size scaling with highlight/selection)

- Events & Interactions

  - ✅ Mouse gestures (click, drag, wheel zoom, RMB rotate)
  - [ ] Touch gestures (pinch, rotate) - desktop-focused currently
  - ✅ Hit‑test under rotation/scale (pick() with view transform)
  - [ ] Keyboard shortcuts (zoom, rotate, reset, fit)

- Drawing Tools (Geoman replacement)

  - ✅ Line/Polyline create/edit/remove with WebGL rendering
  - ✅ Rectangle/Polygon, Circle (center placed), Text markers
  - ✅ Global draw options (color/weight/size configuration)
  - ✅ Drawing modes: line, rectangle, polygon, circle, text
  - ✅ Event system: drawing:start, drawing:create, drawing:edit, drawing:remove, drawing:finish
  - ✅ Shape management: add, remove, update, clear operations
  - ✅ Export/import helpers (DrawingShape type matches existing schema)
  - [ ] Vertex add/remove/drag for shape editing
  - [ ] Keyboard finish shape (Enter) + ESC cancel
  - [ ] Z‑ordering for editing vs shared layers

- Adapters & Migration

  - [ ] CanvasLayer adapter (filter/threshold + color‑blind simulation)
  - [ ] CanvasMarker adapter (icon, highlight/discovered, zPos, text)
  - ✅ PrivateDrawing parity (edit, update, remove, events) - Core functionality complete
  - ✅ React integration for drawing tools - Working in @repo/ui components
  - [ ] Migration guide (Leaflet usage → @repo/web-map)

- Color‑blind Simulation

  - ✅ Shader modes (protanopia/deuteranopia/tritanopia implemented in shaders)
  - ✅ Per‑layer API (setColorBlindMode/Severity on TileLayer and IconMarkerLayer)
  - [ ] Global toggle API across all layers
- Performance & Quality

  - [ ] Benchmarks: 10k/50k/100k markers at 60fps targets
  - [ ] Frame budget guard (clamp per‑frame deltas to keep under 16ms)
  - [ ] Memory audits (tile pool, texture atlas, GC pressure)
  - [ ] Mobile GPU considerations (precision, texture sizes, extensions)

- Debug & Diagnostics

  - [ ] Optional debug overlay (cursor world px, center, tile index ranges)
  - [ ] Tile under‑cursor readout; highlight visible tile bounds
  - [ ] Feature flags for UX experiments (zoom/pan curves)

- Testing & Tooling

  - [ ] Unit tests for math/projection, clamping, hit‑testing
  - [ ] Visual/regression checks for tile addressing and cross‑fade
  - [ ] CI sanity for typecheck/lint/build across packages

- Documentation

  - [ ] Public API reference (Map, Layers, Events)
  - [ ] Recipes: custom tiles (affine), markers, drawing, color‑blind
  - [ ] Integration notes for Overwolf apps and Next.js pages

- Future Enhancements (optional)
  - [ ] Vector layers (GeoJSON, simple paths) with GPU rendering
  - [ ] Heatmaps/rasters as shader layers (blending modes)
  - [ ] Offline/partial caching for tiles and atlases
  - [ ] WebGPU backend experiment (feature flag)

## Leaflet to WebMap Migration Plan

The following files need to be updated to migrate from Leaflet to the new WebGL2 WebMap engine:

### Core Package Dependencies

**packages/ui/package.json**
- [ ] Remove: `"leaflet": "1.9.4"`
- [ ] Remove: `"@geoman-io/leaflet-geoman-free": "^2.17.0"`
- [ ] Remove: `"@types/leaflet": "1.9.14"`

### Interactive Map Components (packages/ui/src/components/(interactive-map)/)

**Core Files - Complete Rewrite Required:**
- [ ] **interactive-map.tsx** - Main map component, replace Leaflet initialization with WebMap
- [ ] **world.ts** - Map creation logic, convert from Leaflet.Map to WebMap
- [ ] **store.ts** - Update LeafletMap type to WebMap, remove Leaflet dependencies
- [ ] **canvas-layer.ts** - Convert Leaflet.TileLayer.extend to WebMap TileLayer
- [ ] **private-drawing.tsx** - Replace @geoman-io with WebMap DrawingManager

**Marker & Layer Components:**
- [ ] **markers.tsx** - Convert Leaflet markers to WebMap IconMarkerLayer
- [ ] **simple-markers.tsx** - Update marker rendering for WebMap
- [ ] **canvas-marker.ts** - Adapt marker rendering system
- [ ] **player-marker.ts** - Convert player marker to WebMap marker
- [ ] **player.tsx** - Update player marker component
- [ ] **teammate.tsx** - Update teammate marker component
- [ ] **private-node.tsx** - Convert node markers to WebMap

**UI & Interaction Components:**
- [ ] **trace-line.tsx** - Convert Leaflet polylines to WebMap drawing shapes
- [ ] **regions.tsx** - Update region rendering for WebMap
- [ ] **coordinates-control.ts** - Adapt coordinate display for WebMap
- [ ] **context-menu.tsx** - Update event handling for WebMap click events
- [ ] **color-blind.ts** - Migrate to WebMap color-blind shader system

**Supporting Components (Minor Updates):**
- [ ] **discovery.tsx** - Update map references
- [ ] **live-player.tsx** - Update for WebMap events
- [ ] **marker-tooltip.tsx** - Adapt for WebMap marker system
- [ ] **marker-details.tsx** - Update marker interaction handling
- [ ] **share-map-view.tsx** - Update for WebMap view/zoom handling
- [ ] **upload-filter.tsx** - Adapt for WebMap marker filtering
- [ ] **add-shared-filter.tsx** - Update for WebMap
- [ ] **live-teammates.tsx** - Update for WebMap
- [ ] **index.tsx** - Update exports

### App-Level Integration Files

**Stormgate App:**
- [ ] **apps/stormgate-web/src/components/interactive-map-client.tsx** - Update to use WebMap
- [ ] **apps/stormgate-web/src/components/interactive-map-dynamic.tsx** - Update dynamic import

**Other Apps:**
- [ ] **apps/palia-web/src/components/pile-map-dynamic.tsx** - Update for WebMap
- [ ] **apps/once-human-web/src/components/simple-map-dynamic.tsx** - Update for WebMap

### Data Components (Minor Impact)

- [ ] **packages/ui/src/components/(data)/dune-heatmaps.tsx** - Verify compatibility
- [ ] **packages/ui/src/components/(data)/dune-deep-desert-grid.tsx** - Verify compatibility
- [ ] **packages/ui/src/components/(data)/palia-grid.tsx** - Verify compatibility

### CSS Dependencies

- [ ] Remove Leaflet CSS imports: `"leaflet/dist/leaflet.css"`
- [ ] Remove Geoman CSS imports: `"@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css"`

### Migration Strategy

1. **Phase 1: Core Engine** - Update world.ts, store.ts, interactive-map.tsx
2. **Phase 2: Markers** - Migrate all marker-related components
3. **Phase 3: Drawing** - Replace Geoman with WebMap DrawingManager
4. **Phase 4: UI Components** - Update supporting components
5. **Phase 5: Apps** - Update app-level integrations
6. **Phase 6: Testing** - Verify all functionality works

### API Compatibility Notes

**Leaflet → WebMap Mapping:**
- `leaflet.Map` → `WebMap`
- `leaflet.TileLayer` → `TileLayer`
- `leaflet.Marker` → `IconMarkerLayer.add()`
- `leaflet.Polyline/Polygon` → `DrawingManager` shapes
- `map.on('click')` → `map.on('click')`
- `map.getCenter()` → `map.getCenter()`
- `map.getZoom()` → `map.getZoom()`

**Key Differences:**
- WebMap uses canvas-based rendering vs DOM-based
- Different event signatures for click/hover
- Marker system is instanced vs individual DOM elements
- Drawing system is integrated vs plugin-based
