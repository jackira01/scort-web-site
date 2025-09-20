import { Router } from 'express';
import * as controller from './sponsored-profiles.controller';

const router = Router();

/**
 * @route GET /api/sponsored-profiles
 * @desc Obtiene perfiles patrocinados que cumplen con todos los criterios de validación
 * @access Public
 * @query {
 *   page?: number,
 *   limit?: number,
 *   sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'lastShownAt',
 *   sortOrder?: 'asc' | 'desc',
 *   fields?: string (comma-separated field names)
 * }
 * @returns {
 *   success: boolean,
 *   data: IProfile[],
 *   pagination: {
 *     currentPage: number,
 *     totalPages: number,
 *     totalProfiles: number,
 *     hasNextPage: boolean,
 *     hasPrevPage: boolean
 *   },
 *   message: string
 * }
 * @example
 * GET /api/sponsored-profiles?page=1&limit=20&sortBy=lastShownAt&sortOrder=asc
 * GET /api/sponsored-profiles?fields=_id,name,age,location,media
 */
router.get('/', controller.getSponsoredProfiles);

/**
 * @route GET /api/sponsored-profiles/count
 * @desc Obtiene el conteo total de perfiles patrocinados válidos
 * @access Public
 * @returns {
 *   success: boolean,
 *   data: {
 *     totalCount: number
 *   },
 *   message: string
 * }
 * @example
 * GET /api/sponsored-profiles/count
 */
router.get('/count', controller.getSponsoredProfilesCount);

/**
 * @route GET /api/sponsored-profiles/check/:profileId
 * @desc Verifica si un perfil específico es elegible para aparecer en la sección patrocinada
 * @access Public
 * @param {string} profileId - ID del perfil a verificar
 * @returns {
 *   success: boolean,
 *   data: {
 *     profileId: string,
 *     isSponsored: boolean
 *   },
 *   message: string
 * }
 * @example
 * GET /api/sponsored-profiles/check/507f1f77bcf86cd799439011
 */
router.get('/check/:profileId', controller.checkProfileSponsored);

export default router;