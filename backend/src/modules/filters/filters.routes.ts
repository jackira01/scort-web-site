import { Router } from 'express';
import * as controller from './filters.controller';

const router = Router();

/**
 * @route GET /api/filters/profiles
 * @desc Obtiene perfiles filtrados con paginación
 * @access Public
 * @query {
 *   category?: string,
 *   country?: string,
 *   department?: string,
 *   city?: string,
 *   features?: string (JSON stringified object),
 *   minPrice?: number,
 *   maxPrice?: number,
 *   dayOfWeek?: string,
 *   timeStart?: string,
 *   timeEnd?: string,
 *   isActive?: boolean,
 *   isVerified?: boolean,
 *   page?: number,
 *   limit?: number,
 *   sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'price',
 *   sortOrder?: 'asc' | 'desc'
 * }
 * @example
 * GET /api/filters/profiles?category=escort&city=Bogotá&minPrice=100&maxPrice=500&page=1&limit=20
 * GET /api/filters/profiles?features={"gender":"female","age":["18-25","26-35"]}&isVerified=true
 */
router.get('/profiles', controller.getFilteredProfiles);

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
 * @route GET /api/filters/profiles/count
 * @desc Obtiene el conteo total de perfiles que coinciden con los filtros
 * @access Public
 * @query Same as /profiles endpoint but without page and limit
 * @returns {
 *   totalCount: number
 * }
 */
router.get('/profiles/count', controller.getProfilesCount);

export default router;