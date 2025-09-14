// Módulo de Filtros - Exportaciones principales

import * as filtersController from './filters.controller';
import * as filtersService from './filters.service';
import filtersRoutes from './filters.routes';

// Exportaciones explícitas del controlador
export {
  getFilteredProfilesPost,
  getFilterOptions as getFilterOptionsController
} from './filters.controller';

// Exportaciones explícitas del servicio
export {
  getFilteredProfiles as getFilteredProfilesService,
  getFilterOptions as getFilterOptionsService
} from './filters.service';

export type {
  FilterQuery,
  FilterResponse,
  FilterOptions
} from './filters.types';
export { default as filtersRoutes } from './filters.routes';

// Re-exportar para facilitar el uso
export default {
  controller: filtersController,
  service: filtersService,
  routes: filtersRoutes
};