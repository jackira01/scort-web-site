import { Router } from 'express';
import * as controller from './filters.controller';

const router = Router();

// GET endpoint eliminado - solo se usa POST para filtros de perfiles

/**
 * @route POST /api/filters/profiles
 * @desc Obtiene perfiles filtrados con paginación usando body (más escalable)
 * @access Public
 * @body {
 *   category?: string,
 *   location?: {
 *     country?: string,
 *     department?: string,
 *     city?: string
 *   },
 *   features?: {
 *     [key: string]: string | string[]
 *   },
 *   priceRange?: {
 *     min?: number,
 *     max?: number
 *   },
 *   availability?: {
 *     dayOfWeek?: string,
 *     timeSlot?: {
 *       start?: string,
 *       end?: string
 *     }
 *   },
 *   isActive?: boolean,
 *   isVerified?: boolean,
 *   page?: number,
 *   limit?: number,
 *   sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'price',
 *   sortOrder?: 'asc' | 'desc',
 *   fields?: string[]
 * }
 * @example
 * POST /api/filters/profiles
 * {
 *   "category": "escort",
 *   "location": { "city": "Bogotá" },
 *   "priceRange": { "min": 100, "max": 500 },
 *   "features": { "gender": "female", "age": ["18-25", "26-35"] },
 *   "fields": ["_id", "name", "age", "location", "verification"],
 *   "page": 1,
 *   "limit": 20
 * }
 */
router.post('/profiles', controller.getFilteredProfilesPost);

/**
 * @route GET /api/filters/options
 * @desc Obtiene todas las opciones disponibles para los filtros
 * @access Public
 * @returns {
 *   categories: string[],
 *   locations: {
 *     countries: string[],
 *     departments: string[],
 *     cities: string[]
 *   },
 *   features: {
 *     [groupKey: string]: string[]
 *   },
 *   priceRange: {
 *     min: number,
 *     max: number
 *   }
 * }
 */
router.get('/options', controller.getFilterOptions);

/**
 * @route POST /api/filters/profiles/count
 * @desc Obtiene el conteo total de perfiles que coinciden con los filtros
 * @access Public
 * @body Same as /profiles endpoint but without page and limit
 * @returns {
 *   totalCount: number
 * }
 */
router.post('/profiles/count', controller.getProfilesCountPost);

export default router;