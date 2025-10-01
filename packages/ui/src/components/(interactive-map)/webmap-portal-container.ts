/**
 * WebMap Portal Container
 *
 * Creates a DOM container for portals that need to render above the WebMap canvas
 * with proper z-index layering. This replaces Leaflet's pane system for WebMap.
 */

import type { InteractiveMap } from "./store";

// Global registry to track portal containers per map
const portalContainers = new WeakMap<InteractiveMap, HTMLElement>();

/**
 * Updates the portal container position to match the canvas.
 * Called whenever we need to ensure the container is properly positioned.
 */
function updatePortalContainerPosition(container: HTMLElement, canvas: HTMLCanvasElement): void {
  const canvasRect = canvas.getBoundingClientRect();
  const parentRect = canvas.parentElement?.getBoundingClientRect();

  if (parentRect) {
    // Calculate position relative to parent
    const top = canvasRect.top - parentRect.top;
    const left = canvasRect.left - parentRect.left;

    container.style.top = `${top}px`;
    container.style.left = `${left}px`;
    container.style.width = `${canvasRect.width}px`;
    container.style.height = `${canvasRect.height}px`;
  }
}

/**
 * Gets or creates a portal container for the given WebMap instance.
 * This container will be positioned above the canvas with proper z-indexing
 * to ensure tooltips, hover cards, and other UI elements render correctly.
 */
export function getWebMapPortalContainer(map: InteractiveMap): HTMLElement {
  // Find the map's canvas element
  const canvas = (map as any).canvas || (map as any)._canvas;
  if (!canvas || !canvas.parentElement) {
    // Fallback to document.body if we can't find the canvas
    return document.body;
  }

  // Check if we already have a container for this map
  const existing = portalContainers.get(map);
  if (existing && existing.isConnected) {
    // Update position in case canvas moved or resized
    updatePortalContainerPosition(existing, canvas);
    return existing;
  }

  // Create a new portal container
  const container = document.createElement('div');
  container.className = 'webmap-portal-container';

  container.style.cssText = `
    position: absolute;
    pointer-events: none;
    z-index: 1000;
  `;

  // Insert the container as a sibling to the canvas
  // This ensures it's positioned relative to the map container
  const mapContainer = canvas.parentElement;

  // Ensure the map container has relative positioning
  if (getComputedStyle(mapContainer).position === 'static') {
    mapContainer.style.position = 'relative';
  }

  mapContainer.appendChild(container);

  // Set initial position
  updatePortalContainerPosition(container, canvas);

  // Register the container
  portalContainers.set(map, container);

  return container;
}

/**
 * Gets a portal container specifically for hover cards and tooltips
 * that need to render above markers during map interactions.
 */
export function getWebMapTooltipContainer(map: InteractiveMap): HTMLElement {
  const container = getWebMapPortalContainer(map);

  // Ensure tooltip-specific styling
  container.style.zIndex = '1001'; // Higher than general portals

  return container;
}

/**
 * Enables/disables pointer events on WebMap portal containers
 * This replaces Leaflet's pane pointer event management during drawing mode
 */
export function setWebMapPortalPointerEvents(map: InteractiveMap, enabled: boolean): void {
  const container = portalContainers.get(map);
  if (container) {
    container.style.pointerEvents = enabled ? 'auto' : 'none';
  }
}

/**
 * Cleanup function to remove portal containers when a map is destroyed
 */
export function cleanupWebMapPortalContainer(map: InteractiveMap): void {
  const container = portalContainers.get(map);
  if (container) {
    container.remove();
    portalContainers.delete(map);
  }
}