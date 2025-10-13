import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { param } from 'express-validator';
import mongoose from 'mongoose';

export const validateRequest = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(error => ({
        field: error.type === 'field' ? (error as any).path : error.type,
        message: error.msg
      }));
      
      return res.status(400).json({
        message: 'Errores de validación',
        errors: formattedErrors
      });
    }
    
    next();
  };
};

export const validateObjectId = (paramName: string) => {
  return param(paramName)
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error(`${paramName} debe ser un ObjectId válido`);
      }
      return true;
    });
};

export const validateQuery = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(error => ({
        field: error.type === 'field' ? (error as any).path : error.type,
        message: error.msg
      }));
      
      return res.status(400).json({
        message: 'Errores de validación en query parameters',
        errors: formattedErrors
      });
    }
    
    next();
  };
};

export const validateParams = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(error => ({
        field: error.type === 'field' ? (error as any).path : error.type,
        message: error.msg
      }));
      
      return res.status(400).json({
        message: 'Errores de validación en parámetros',
        errors: formattedErrors
      });
    }
    
    next();
  };
};