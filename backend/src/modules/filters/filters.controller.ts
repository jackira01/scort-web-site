import { Request, Response } from 'express';
import * as service from './filters.service';
import type { FilterQuery } from './filters.types';

/**
 * GET /api/filters/profiles
 * Obtiene perfiles filtrados
 */
export const getFilteredProfiles = async (req: Request, res: Response) => {
    try {
      const {
        category,
        country, 
        department,
        city,
        features,
        minPrice,
        maxPrice,
        dayOfWeek,
        timeStart,
        timeEnd,
        isActive,
        isVerified,
        page,
        limit,
        sortBy,
        sortOrder,
        fields
      } = req.query;

      // Extraer parámetros de location anidados
      const locationParams = req.query.location as any;
      const locationDepartment = locationParams?.department || req.query['location[department]'];
      const locationCity = locationParams?.city || req.query['location[city]'];

      // Construir objeto de filtros
      const filters: FilterQuery = {};

      // Filtros básicos
      if (category) filters.category = category as string;
      if (isActive !== undefined) {
        filters.isActive = isActive === 'true';
      } else {
        // Si no se especifica isActive, no filtrar por este campo
        filters.isActive = undefined;
      }
      if (isVerified !== undefined) filters.isVerified = isVerified === 'true';

      // Filtros de ubicación
      if (country || department || city || locationDepartment || locationCity) {
        filters.location = {};
        if (country) filters.location.country = country as string;
        if (department) filters.location.department = department as string;
         else if (locationDepartment) filters.location.department = locationDepartment as string;
        
        // Solo agregar city si está presente
        if (city) filters.location.city = city as string;
        else if (locationCity) filters.location.city = locationCity as string;
      }

      // Filtros de características
      if (features) {
        try {
          filters.features = typeof features === 'string' 
            ? JSON.parse(features) 
            : features as { [key: string]: string | string[] };
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: 'Formato de features inválido. Debe ser un JSON válido.'
          });
        }
      }

      // Filtros de precio
      if (minPrice || maxPrice) {
        filters.priceRange = {};
        if (minPrice) {
          const min = parseFloat(minPrice as string);
          if (isNaN(min)) {
            return res.status(400).json({
              success: false,
              message: 'minPrice debe ser un número válido'
            });
          }
          filters.priceRange.min = min;
        }
        if (maxPrice) {
          const max = parseFloat(maxPrice as string);
          if (isNaN(max)) {
            return res.status(400).json({
              success: false,
              message: 'maxPrice debe ser un número válido'
            });
          }
          filters.priceRange.max = max;
        }
      }

      // Filtros de disponibilidad
      if (dayOfWeek || timeStart || timeEnd) {
        filters.availability = {};
        if (dayOfWeek) filters.availability.dayOfWeek = dayOfWeek as string;
        if (timeStart || timeEnd) {
          filters.availability.timeSlot = {};
          if (timeStart) filters.availability.timeSlot.start = timeStart as string;
          if (timeEnd) filters.availability.timeSlot.end = timeEnd as string;
        }
      }

      // Paginación y ordenamiento
      if (page) {
        const pageNum = parseInt(page as string);
        if (isNaN(pageNum) || pageNum < 1) {
          return res.status(400).json({
            success: false,
            message: 'page debe ser un número entero mayor a 0'
          });
        }
        filters.page = pageNum;
      }

      if (limit) {
        const limitNum = parseInt(limit as string);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
          return res.status(400).json({
            success: false,
            message: 'limit debe ser un número entre 1 y 100'
          });
        }
        filters.limit = limitNum;
      }

      if (sortBy) {
        const validSortFields = ['createdAt', 'updatedAt', 'name', 'price'];
        if (!validSortFields.includes(sortBy as string)) {
          return res.status(400).json({
            success: false,
            message: `sortBy debe ser uno de: ${validSortFields.join(', ')}`
          });
        }
        filters.sortBy = sortBy as 'createdAt' | 'updatedAt' | 'name' | 'price';
      }

      if (sortOrder) {
        if (sortOrder !== 'asc' && sortOrder !== 'desc') {
          return res.status(400).json({
            success: false,
            message: 'sortOrder debe ser "asc" o "desc"'
          });
        }
        filters.sortOrder = sortOrder as 'asc' | 'desc';
      }

      // Procesar campos seleccionables
      if (fields) {
        if (typeof fields === 'string') {
          filters.fields = fields.split(',').map(field => field.trim());
        } else if (Array.isArray(fields)) {
          filters.fields = fields as string[];
        }
      }

      // Obtener perfiles filtrados
      const result = await service.getFilteredProfiles(filters);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Perfiles obtenidos exitosamente'
      });
    } catch (error) {
      console.error('Error in getFilteredProfiles controller:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
};

/**
 * POST /api/filters/profiles
 * Obtiene perfiles filtrados usando body (más escalable)
 */
export const getFilteredProfilesPost = async (req: Request, res: Response) => {
    try {
      const filters: FilterQuery = req.body;

      // Validaciones básicas
      if (filters.page && (isNaN(filters.page) || filters.page < 1)) {
        return res.status(400).json({
          success: false,
          message: 'page debe ser un número entero mayor a 0'
        });
      }

      if (filters.limit && (isNaN(filters.limit) || filters.limit < 1 || filters.limit > 100)) {
        return res.status(400).json({
          success: false,
          message: 'limit debe ser un número entre 1 y 100'
        });
      }

      if (filters.sortBy) {
        const validSortFields = ['createdAt', 'updatedAt', 'name', 'price'];
        if (!validSortFields.includes(filters.sortBy)) {
          return res.status(400).json({
            success: false,
            message: `sortBy debe ser uno de: ${validSortFields.join(', ')}`
          });
        }
      }

      if (filters.sortOrder && filters.sortOrder !== 'asc' && filters.sortOrder !== 'desc') {
        return res.status(400).json({
          success: false,
          message: 'sortOrder debe ser "asc" o "desc"'
        });
      }

      if (filters.priceRange) {
        if (filters.priceRange.min && isNaN(filters.priceRange.min)) {
          return res.status(400).json({
            success: false,
            message: 'priceRange.min debe ser un número válido'
          });
        }
        if (filters.priceRange.max && isNaN(filters.priceRange.max)) {
          return res.status(400).json({
            success: false,
            message: 'priceRange.max debe ser un número válido'
          });
        }
      }

      // Obtener perfiles filtrados
      const result = await service.getFilteredProfiles(filters);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Perfiles obtenidos exitosamente'
      });
    } catch (error) {
      console.error('Error in getFilteredProfilesPost controller:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
};

/**
 * GET /api/filters/options
 * Obtiene las opciones disponibles para los filtros
 */
export const getFilterOptions = async (req: Request, res: Response) => {
  try {
    const options = await service.getFilterOptions();

    res.status(200).json({
      success: true,
      data: options,
      message: 'Opciones de filtros obtenidas exitosamente'
    });
  } catch (error) {
    console.error('Error in getFilterOptions controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * GET /api/filters/profiles/count
 * Obtiene el conteo de perfiles que coinciden con los filtros sin paginación
 */
export const getProfilesCount = async (req: Request, res: Response) => {
  try {
    // Usar los mismos filtros pero sin paginación
    const filters: FilterQuery = { ...req.query as any };
    delete filters.page;
    delete filters.limit;
    
    // Establecer un límite alto para obtener el conteo total
    filters.limit = 999999;
    
    const result = await service.getFilteredProfiles(filters);

    res.status(200).json({
      success: true,
      data: {
        totalCount: result.totalCount
      },
      message: 'Conteo de perfiles obtenido exitosamente'
    });
  } catch (error) {
    console.error('Error in getProfilesCount controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};