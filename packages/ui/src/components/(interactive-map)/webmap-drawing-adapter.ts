/**
 * WebMap Drawing Adapter
 *
 * Provides a compatibility layer between Geoman API and WebMap DrawingManager
 * to enable seamless migration of existing drawing functionality.
 */

import { DrawingManager, type DrawingMode } from "@repo/lib/web-map";

export interface GeomanCompatibleLayer {
  getLatLngs(): any;
  options: {
    color?: string;
    weight?: number;
  };
  getLatLng?(): { lat: number; lng: number };
  getRadius?(): number;
}

export interface GeomanCompatibleEvent {
  layer: GeomanCompatibleLayer;
  shape: string;
}

export class WebMapDrawingAdapter {
  private drawingManager: DrawingManager;
  private map: any;
  private globalMode: string = 'none';
  private eventHandlers: Map<string, Function[]> = new Map();
  private layers: Map<string, GeomanCompatibleLayer> = new Map();

  constructor(map: any) {
    this.map = map;
    this.drawingManager = new DrawingManager(map);
    this.setupEventForwarding();
  }

  private setupEventForwarding(): void {
    this.drawingManager.on('drawing:start', (event) => {
      this.fire('pm:drawstart', { shape: event.mode });
    });

    this.drawingManager.on('drawing:create', (event) => {
      const layer = this.createCompatibleLayer(event.shape);
      if (layer) {
        this.layers.set(event.shape.id, layer);
        this.fire('pm:create', { layer, shape: event.shape.type });
      }
    });

    this.drawingManager.on('drawing:finish', (event) => {
      const layer = this.layers.get(event.shape.id);
      if (layer) {
        this.fire('pm:drawend', { layer, shape: event.shape.type });
      }
    });

    this.drawingManager.on('drawing:remove', (event) => {
      const layer = this.layers.get(event.id);
      if (layer) {
        this.fire('pm:remove', { layer });
        this.layers.delete(event.id);
      }
    });
  }

  private createCompatibleLayer(shape: any): GeomanCompatibleLayer | null {
    switch (shape.type) {
      case 'line':
      case 'polygon':
      case 'rectangle':
        return {
          getLatLngs: () => shape.positions?.map((pos: [number, number]) => ({
            lat: pos[0],
            lng: pos[1]
          })) || [],
          options: {
            color: shape.color,
            weight: shape.size
          }
        };

      case 'circle':
        return {
          getLatLngs: () => [],
          getLatLng: () => ({
            lat: shape.center[0],
            lng: shape.center[1]
          }),
          getRadius: () => shape.radius,
          options: {
            color: shape.color,
            weight: shape.size
          }
        };

      case 'text':
        return {
          getLatLngs: () => [],
          getLatLng: () => ({
            lat: shape.center[0],
            lng: shape.center[1]
          }),
          options: {
            color: shape.color,
            weight: shape.size
          }
        };

      default:
        return null;
    }
  }

  // Geoman-compatible API methods
  get Draw() {
    return {
      getActiveShape: () => {
        const activeMode = this.drawingManager.getActiveShape();
        return activeMode === 'none' ? null : activeMode;
      },
      Line: {
        _finishShape: () => {
          this.drawingManager.finishLine();
        }
      }
    };
  }

  enableDraw(shape: string): void {
    const mode = this.mapGeomanShapeToDrawingMode(shape);
    this.drawingManager.enableDraw(mode);
  }

  disableDraw(): void {
    this.drawingManager.disableDraw();
  }

  setPathOptions(options: { color?: string; weight?: number }): void {
    this.drawingManager.setPathOptions(options);
  }

  setGlobalOptions(options: any): void {
    // WebMap DrawingManager handles text options differently
    if (options.textColor || options.textSize) {
      this.drawingManager.setTextOptions({
        color: options.textColor,
        size: options.textSize
      });
    }
  }

  toggleGlobalEditMode(): boolean {
    if (this.globalMode === 'edit') {
      this.globalMode = 'none';
      this.drawingManager.disableDraw();
      return false;
    } else {
      this.globalMode = 'edit';
      this.drawingManager.enableDraw('edit');
      return true;
    }
  }

  toggleGlobalDragMode(): boolean {
    if (this.globalMode === 'drag') {
      this.globalMode = 'none';
      this.drawingManager.disableDraw();
      return false;
    } else {
      this.globalMode = 'drag';
      this.drawingManager.enableDraw('drag');
      return true;
    }
  }

  toggleGlobalRemovalMode(): boolean {
    if (this.globalMode === 'remove') {
      this.globalMode = 'none';
      this.drawingManager.disableDraw();
      return false;
    } else {
      this.globalMode = 'remove';
      this.drawingManager.enableDraw('remove');
      return true;
    }
  }

  disableGlobalEditMode(): void {
    if (this.globalMode === 'edit') {
      this.globalMode = 'none';
      this.drawingManager.disableDraw();
    }
  }

  globalEditModeEnabled(): boolean {
    return this.globalMode === 'edit';
  }

  globalDragModeEnabled(): boolean {
    return this.globalMode === 'drag';
  }

  globalRemovalModeEnabled(): boolean {
    return this.globalMode === 'remove';
  }

  getGeomanLayers(): GeomanCompatibleLayer[] {
    return Array.from(this.layers.values());
  }

  addShape(shape: any): void {
    this.drawingManager.addShape(shape);
  }

  clearShapes(): void {
    this.drawingManager.clearShapes();
    this.layers.clear();
  }

  // Event system compatible with Geoman
  on(eventType: string, handler: Function): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  off(eventType: string, handler?: Function): void {
    const handlers = this.eventHandlers.get(eventType);
    if (!handlers) return;

    if (handler) {
      const index = handlers.indexOf(handler);
      if (index >= 0) {
        handlers.splice(index, 1);
      }
    } else {
      this.eventHandlers.set(eventType, []);
    }
  }

  private fire(eventType: string, event: any): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event);
        } catch (e) {
          console.error(`Error in ${eventType} event handler:`, e);
        }
      }
    }
  }

  private mapGeomanShapeToDrawingMode(shape: string): DrawingMode {
    switch (shape.toLowerCase()) {
      case 'line':
        return 'line';
      case 'rectangle':
        return 'rectangle';
      case 'polygon':
        return 'polygon';
      case 'circle':
        return 'circle';
      case 'text':
        return 'text';
      default:
        return 'none';
    }
  }

  destroy(): void {
    this.drawingManager.destroy();
    this.eventHandlers.clear();
    this.layers.clear();
  }
}

// Add pm property to InteractiveMap interface

// Helper function to initialize the drawing adapter on a map
export function initializeDrawingAdapter(map: any): void {
  if (!map.pm) {
    map.pm = new WebMapDrawingAdapter(map);
  }
}