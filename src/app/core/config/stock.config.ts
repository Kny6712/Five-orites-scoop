// src/app/core/config/stock.config.ts
// Five-orites Scoop — Stock display thresholds
//
// Kept separate from pricing.config.ts (which is a pure data matrix) so the
// templates can import one obvious symbol.

import { environment } from '../../../environments/environment';

/**
 * Units at or below which a SKU is flagged as low stock.
 *
 * Sourced from the environment so it is tunable per build, and re-exported so
 * no template hardcodes the number.
 */
export const LOW_STOCK_THRESHOLD: number = environment.lowStockThreshold;
