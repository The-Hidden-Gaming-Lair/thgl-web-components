import type { WebMap } from "../webmap";
import type { LatLng } from "../types";
import { DrawingLayer, type DrawingShape } from "../layers/drawing";

export type DrawingMode = 'none' | 'line' | 'rectangle' | 'polygon' | 'circle' | 'text' | 'edit' | 'drag' | 'remove';

export interface DrawingManagerOptions {
  defaultColor?: string;
  defaultSize?: number;
  textColor?: string;
  textSize?: number;
}

export interface DrawingManagerEventMap {
  'drawing:start': { mode: DrawingMode };
  'drawing:create': { shape: DrawingShape };
  'drawing:edit': { shape: DrawingShape };
  'drawing:remove': { id: string };
  'drawing:finish': { shape: DrawingShape };
}

type EventHandler<T = any> = (event: T) => void;

export class DrawingManager {
  private map: WebMap;
  private drawingLayer: DrawingLayer;
  private currentMode: DrawingMode = 'none';
  private isDrawing = false;
  private currentShape: Partial<DrawingShape> | null = null;
  private temporaryPoints: LatLng[] = [];
  private options: Required<DrawingManagerOptions>;
  private eventHandlers: Map<keyof DrawingManagerEventMap, EventHandler[]> = new Map();
  private clickHandler?: (event: { latlng: LatLng; originalEvent: MouseEvent }) => void;
  private mouseMoveHandler?: (event: { latlng: LatLng; originalEvent: MouseEvent }) => void;

  constructor(map: WebMap, options: DrawingManagerOptions = {}) {
    this.map = map;
    this.drawingLayer = new DrawingLayer({ interactive: true });
    this.options = {
      defaultColor: options.defaultColor || '#3388ff',
      defaultSize: options.defaultSize || 3,
      textColor: options.textColor || '#000000',
      textSize: options.textSize || 16,
    };

    // Add drawing layer to map
    this.map.addLayer(this.drawingLayer, { zIndex: 1000 });
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.clickHandler = (event) => this.handleMapClick(event);
    this.mouseMoveHandler = (event) => this.handleMapMouseMove(event);
  }

  enableDraw(mode: DrawingMode): void {
    this.disableDraw();
    this.currentMode = mode;

    if (mode !== 'none') {
      this.map.disableInteractions();
      this.map.on('click', this.clickHandler!);
      this.map.on('mousemove', this.mouseMoveHandler!);
      this.fire('drawing:start', { mode });
    }
  }

  disableDraw(): void {
    if (this.clickHandler) {
      this.map.off('click', this.clickHandler);
    }
    if (this.mouseMoveHandler) {
      this.map.off('mousemove', this.mouseMoveHandler);
    }

    this.map.enableInteractions();
    this.finishCurrentDrawing();
    this.currentMode = 'none';
    this.isDrawing = false;
    this.temporaryPoints = [];
    this.currentShape = null;
  }

  getActiveShape(): DrawingMode {
    return this.currentMode;
  }

  setPathOptions(options: { color?: string; weight?: number }): void {
    if (options.color) this.options.defaultColor = options.color;
    if (options.weight) this.options.defaultSize = options.weight;
  }

  setTextOptions(options: { color?: string; size?: number }): void {
    if (options.color) this.options.textColor = options.color;
    if (options.size) this.options.textSize = options.size;
  }

  private handleMapClick(event: { latlng: LatLng; originalEvent: MouseEvent }): void {
    console.log('DrawingManager handleMapClick:', event.latlng, 'currentMode:', this.currentMode);
    const { latlng } = event;

    switch (this.currentMode) {
      case 'line':
        console.log('Calling handleLineClick');
        this.handleLineClick(latlng);
        break;
      case 'rectangle':
        console.log('Calling handleRectangleClick');
        this.handleRectangleClick(latlng);
        break;
      case 'polygon':
        console.log('Calling handlePolygonClick');
        this.handlePolygonClick(latlng);
        break;
      case 'circle':
        console.log('Calling handleCircleClick');
        this.handleCircleClick(latlng);
        break;
      case 'text':
        console.log('Calling handleTextClick');
        this.handleTextClick(latlng);
        break;
      default:
        console.log('No handler for mode:', this.currentMode);
    }
  }

  private handleMapMouseMove(event: { latlng: LatLng; originalEvent: MouseEvent }): void {
    if (!this.isDrawing || !this.currentShape) return;

    const { latlng } = event;

    switch (this.currentMode) {
      case 'rectangle':
        this.updateRectanglePreview(latlng);
        break;
      case 'circle':
        this.updateCirclePreview(latlng);
        break;
    }
  }

  private handleLineClick(latlng: LatLng): void {
    console.log('handleLineClick called, isDrawing:', this.isDrawing, 'latlng:', latlng);

    if (!this.isDrawing) {
      // Start new line
      console.log('Starting new line');
      this.startDrawing();
      this.currentShape = {
        id: this.generateId(),
        type: 'line',
        positions: [latlng],
        color: this.options.defaultColor,
        size: this.options.defaultSize,
        mapName: '', // Will be set by consumer
      };
      this.temporaryPoints = [latlng];
      console.log('Created new line shape:', this.currentShape);
      // Add the shape to the layer immediately
      this.updateTemporaryShape();
    } else {
      // Add point to line
      console.log('Adding point to existing line');
      this.temporaryPoints.push(latlng);
      if (this.currentShape && this.currentShape.positions) {
        this.currentShape.positions = [...this.temporaryPoints];
        this.updateTemporaryShape();
        console.log('Updated line shape with', this.temporaryPoints.length, 'points');
      }
    }
  }

  private handleRectangleClick(latlng: LatLng): void {
    if (!this.isDrawing) {
      // Start rectangle
      this.startDrawing();
      this.currentShape = {
        id: this.generateId(),
        type: 'rectangle',
        positions: [latlng, latlng],
        color: this.options.defaultColor,
        size: this.options.defaultSize,
        mapName: '',
      };
      this.temporaryPoints = [latlng];
    } else {
      // Finish rectangle
      this.finishCurrentDrawing();
    }
  }

  private handlePolygonClick(latlng: LatLng): void {
    if (!this.isDrawing) {
      // Start polygon
      this.startDrawing();
      this.currentShape = {
        id: this.generateId(),
        type: 'polygon',
        positions: [latlng],
        color: this.options.defaultColor,
        size: this.options.defaultSize,
        mapName: '',
      };
      this.temporaryPoints = [latlng];
    } else {
      // Add point to polygon
      this.temporaryPoints.push(latlng);
      if (this.currentShape && this.currentShape.positions) {
        this.currentShape.positions = [...this.temporaryPoints];
        this.updateTemporaryShape();
      }
    }
  }

  private handleCircleClick(latlng: LatLng): void {
    if (!this.isDrawing) {
      // Start circle
      this.startDrawing();
      this.currentShape = {
        id: this.generateId(),
        type: 'circle',
        center: latlng,
        radius: 0,
        color: this.options.defaultColor,
        size: this.options.defaultSize,
        mapName: '',
      };
    } else {
      // Finish circle
      this.finishCurrentDrawing();
    }
  }

  private handleTextClick(latlng: LatLng): void {
    const text = prompt('Enter text:');
    if (text) {
      const shape: DrawingShape = {
        id: this.generateId(),
        type: 'text',
        center: latlng,
        text,
        color: this.options.textColor,
        size: this.options.textSize,
        mapName: '',
      };

      this.addShape(shape);
      this.fire('drawing:create', { shape });
    }
  }

  private updateRectanglePreview(latlng: LatLng): void {
    if (this.currentShape && this.temporaryPoints.length > 0) {
      this.currentShape.positions = [this.temporaryPoints[0], latlng];
      this.updateTemporaryShape();
    }
  }

  private updateCirclePreview(latlng: LatLng): void {
    if (this.currentShape && this.currentShape.center) {
      const [centerLat, centerLng] = this.currentShape.center;
      const [lat, lng] = latlng;
      const radius = Math.sqrt(
        Math.pow(lat - centerLat, 2) + Math.pow(lng - centerLng, 2)
      );
      this.currentShape.radius = radius;
      this.updateTemporaryShape();
    }
  }

  private startDrawing(): void {
    this.isDrawing = true;
  }

  private updateTemporaryShape(): void {
    console.log('updateTemporaryShape called with:', this.currentShape);
    if (this.currentShape && this.currentShape.id) {
      // Check if the shape already exists in the layer
      const existingShape = this.drawingLayer.getShape(this.currentShape.id);
      if (existingShape) {
        console.log('Updating existing shape:', this.currentShape.id);
        this.drawingLayer.updateShape(this.currentShape.id, this.currentShape);
      } else {
        console.log('Adding new shape to layer (has ID but not in layer yet)');
        this.drawingLayer.addShape(this.currentShape as DrawingShape);
      }
    } else if (this.currentShape) {
      console.log('Adding new shape to layer');
      this.drawingLayer.addShape(this.currentShape as DrawingShape);
    }
  }

  private finishCurrentDrawing(): void {
    if (this.currentShape && this.isDrawing) {
      const shape = this.currentShape as DrawingShape;

      // Validate shape before finishing
      if (this.isValidShape(shape)) {
        this.fire('drawing:finish', { shape });
        this.fire('drawing:create', { shape });
      } else {
        // Remove invalid shape
        if (shape.id) {
          this.drawingLayer.removeShape(shape.id);
        }
      }
    }

    this.isDrawing = false;
    this.currentShape = null;
    this.temporaryPoints = [];
  }

  private isValidShape(shape: DrawingShape): boolean {
    switch (shape.type) {
      case 'line':
        return (shape.positions?.length ?? 0) >= 2;
      case 'rectangle':
        return (shape.positions?.length ?? 0) >= 2;
      case 'polygon':
        return (shape.positions?.length ?? 0) >= 3;
      case 'circle':
        return (shape.radius ?? 0) > 0;
      case 'text':
        return !!shape.text && shape.text.length > 0;
      default:
        return false;
    }
  }

  finishLine(): void {
    if (this.currentMode === 'line' && this.isDrawing) {
      this.finishCurrentDrawing();
    }
  }

  finishPolygon(): void {
    if (this.currentMode === 'polygon' && this.isDrawing) {
      this.finishCurrentDrawing();
    }
  }

  // Shape management methods
  addShape(shape: DrawingShape): void {
    this.drawingLayer.addShape(shape);
  }

  removeShape(id: string): void {
    this.drawingLayer.removeShape(id);
    this.fire('drawing:remove', { id });
  }

  updateShape(id: string, updates: Partial<DrawingShape>): void {
    this.drawingLayer.updateShape(id, updates);
    const shape = this.drawingLayer.getShape(id);
    if (shape) {
      this.fire('drawing:edit', { shape });
    }
  }

  getShape(id: string): DrawingShape | undefined {
    return this.drawingLayer.getShape(id);
  }

  getAllShapes(): DrawingShape[] {
    return this.drawingLayer.getAllShapes();
  }

  clearShapes(): void {
    this.drawingLayer.clearShapes();
  }

  // Event system
  on<K extends keyof DrawingManagerEventMap>(
    type: K,
    handler: EventHandler<DrawingManagerEventMap[K]>
  ): this {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, []);
    }
    this.eventHandlers.get(type)!.push(handler);
    return this;
  }

  off<K extends keyof DrawingManagerEventMap>(
    type: K,
    handler?: EventHandler<DrawingManagerEventMap[K]>
  ): this {
    const handlers = this.eventHandlers.get(type);
    if (!handlers) return this;

    if (handler) {
      const index = handlers.indexOf(handler);
      if (index >= 0) {
        handlers.splice(index, 1);
      }
    } else {
      this.eventHandlers.set(type, []);
    }
    return this;
  }

  private fire<K extends keyof DrawingManagerEventMap>(
    type: K,
    event: DrawingManagerEventMap[K]
  ): void {
    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event);
        } catch (e) {
          console.error(`Error in ${type} event handler:`, e);
        }
      }
    }
  }

  private generateId(): string {
    return `drawing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  destroy(): void {
    this.disableDraw();
    this.map.enableInteractions(); // Ensure interactions are re-enabled
    this.drawingLayer.destroy();
    this.eventHandlers.clear();
  }
}