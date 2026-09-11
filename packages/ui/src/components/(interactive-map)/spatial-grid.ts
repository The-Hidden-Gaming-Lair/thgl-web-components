/**
 * A simple spatial grid for efficient proximity queries.
 * Divides 2D space into cells and allows querying markers within a radius.
 *
 * Performance: O(1) for add/remove, O(k) for getNearby where k is markers in nearby cells
 * vs O(n) for brute force where n is total markers.
 */
interface Cell<T> {
  /** Cell coordinates, kept numeric so a scan never has to parse the key. */
  cx: number;
  cy: number;
  items: Set<T>;
}

export class SpatialGrid<T> {
  private cells = new Map<string, Cell<T>>();
  private itemCells = new Map<T, string>(); // Track which cell each item is in
  private cellSize: number;

  constructor(cellSize: number) {
    this.cellSize = cellSize;
  }

  /**
   * Add an item to the grid at the given position
   */
  add(item: T, x: number, y: number): void {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    const key = `${cellX}:${cellY}`;

    // Remove from old cell if it was already in the grid
    const oldKey = this.itemCells.get(item);
    if (oldKey && oldKey !== key) {
      const oldCell = this.cells.get(oldKey);
      if (oldCell) {
        oldCell.items.delete(item);
        if (oldCell.items.size === 0) {
          this.cells.delete(oldKey);
        }
      }
    }

    // Add to new cell
    let cell = this.cells.get(key);
    if (!cell) {
      cell = { cx: cellX, cy: cellY, items: new Set() };
      this.cells.set(key, cell);
    }
    cell.items.add(item);
    this.itemCells.set(item, key);
  }

  /**
   * Remove an item from the grid
   */
  remove(item: T): void {
    const key = this.itemCells.get(item);
    if (key) {
      const cell = this.cells.get(key);
      if (cell) {
        cell.items.delete(item);
        if (cell.items.size === 0) {
          this.cells.delete(key);
        }
      }
      this.itemCells.delete(item);
    }
  }

  /**
   * Update an item's position in the grid
   */
  update(item: T, x: number, y: number): void {
    this.add(item, x, y); // add() handles the update case
  }

  /**
   * Get all items within maxDistance of the given point.
   * Returns items that MIGHT be within range - caller should do final distance check.
   */
  getNearby(x: number, y: number, maxDistance: number): T[] {
    const results: T[] = [];

    // Calculate how many cells we need to check in each direction
    const cellRadius = Math.ceil(maxDistance / this.cellSize);
    const centerCellX = Math.floor(x / this.cellSize);
    const centerCellY = Math.floor(y / this.cellSize);

    // Probing every coordinate in the square costs (2r+1)^2 map lookups — each
    // building a key string — no matter how few items the grid holds. That
    // explodes with a large radius: a user-configured proximity range of 99999
    // over 100-unit cells is 4,004,001 probes (~230ms) per call, and callers
    // run this on every actor tick, which freezes the map. When the square
    // covers more cells than the grid actually has, walking the populated
    // cells yields exactly the same candidates for O(populated cells).
    const span = 2 * cellRadius + 1;
    if (span * span > this.cells.size) {
      for (const cell of this.cells.values()) {
        if (
          Math.abs(cell.cx - centerCellX) > cellRadius ||
          Math.abs(cell.cy - centerCellY) > cellRadius
        ) {
          continue;
        }
        for (const item of cell.items) {
          results.push(item);
        }
      }
      return results;
    }

    // Check all cells within the radius
    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        const key = `${centerCellX + dx}:${centerCellY + dy}`;
        const cell = this.cells.get(key);
        if (cell) {
          for (const item of cell.items) {
            results.push(item);
          }
        }
      }
    }

    return results;
  }

  /**
   * Clear all items from the grid
   */
  clear(): void {
    this.cells.clear();
    this.itemCells.clear();
  }

  /**
   * Get total number of items in the grid
   */
  get size(): number {
    return this.itemCells.size;
  }

  /**
   * Rebuild the grid with a new cell size
   */
  rebuild(
    newCellSize: number,
    getPosition: (item: T) => [number, number],
  ): void {
    const items = Array.from(this.itemCells.keys());
    this.cellSize = newCellSize;
    this.cells.clear();
    this.itemCells.clear();

    for (const item of items) {
      const [x, y] = getPosition(item);
      this.add(item, x, y);
    }
  }
}
