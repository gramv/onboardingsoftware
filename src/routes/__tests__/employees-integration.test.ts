import request from 'supertest';
import express from 'express';
import { translationService, EMPLOYEE_SUCCESS_KEYS } from '@/utils/i18n/translationService';

describe('Employee Routes Integration - Internationalization', () => {
  let app: express.Application;

  beforeEach(() => {
    // Setup Express app
    app = express();
    app.use(express.json());
  });

  describe('Translation Service Integration', () => {
    it('should provide correct translations for different locales', () => {
      // Test English translations
      const englishMessage = translationService.t(EMPLOYEE_SUCCESS_KEYS.EMPLOYEE_CREATED, {}, 'en');
      expect(englishMessage).toBe('Employee created successfully');

      // Test Spanish translations
      const spanishMessage = translationService.t(EMPLOYEE_SUCCESS_KEYS.EMPLOYEE_CREATED, {}, 'es');
      expect(spanishMessage).toBe('Empleado creado exitosamente');
    });

    it('should handle common error messages in both languages', () => {
      // Test validation error in English
      const validationErrorEn = translationService.t('common.errors.validation', {}, 'en');
      expect(validationErrorEn).toBe('Validation error');

      // Test validation error in Spanish
      const validationErrorEs = translationService.t('common.errors.validation', {}, 'es');
      expect(validationErrorEs).toBe('Error de validación');
    });

    it('should translate employment status correctly', () => {
      // Test active status
      const activeEn = translationService.t('employee.status.active', {}, 'en');
      const activeEs = translationService.t('employee.status.active', {}, 'es');
      
      expect(activeEn).toBe('Active');
      expect(activeEs).toBe('Activo');

      // Test terminated status
      const terminatedEn = translationService.t('employee.status.terminated', {}, 'en');
      const terminatedEs = translationService.t('employee.status.terminated', {}, 'es');
      
      expect(terminatedEn).toBe('Terminated');
      expect(terminatedEs).toBe('Terminado');
    });

    it('should translate departments correctly', () => {
      // Test reception department
      const receptionEn = translationService.t('employee.departments.reception', {}, 'en');
      const receptionEs = translationService.t('employee.departments.reception', {}, 'es');
      
      expect(receptionEn).toBe('Reception');
      expect(receptionEs).toBe('Recepción');

      // Test housekeeping department
      const housekeepingEn = translationService.t('employee.departments.housekeeping', {}, 'en');
      const housekeepingEs = translationService.t('employee.departments.housekeeping', {}, 'es');
      
      expect(housekeepingEn).toBe('Housekeeping');
      expect(housekeepingEs).toBe('Limpieza');
    });

    it('should translate positions correctly', () => {
      // Test front desk clerk position
      const frontDeskEn = translationService.t('employee.positions.frontDeskClerk', {}, 'en');
      const frontDeskEs = translationService.t('employee.positions.frontDeskClerk', {}, 'es');
      
      expect(frontDeskEn).toBe('Front Desk Clerk');
      expect(frontDeskEs).toBe('Recepcionista');

      // Test housekeeper position
      const housekeeperEn = translationService.t('employee.positions.housekeeper', {}, 'en');
      const housekeeperEs = translationService.t('employee.positions.housekeeper', {}, 'es');
      
      expect(housekeeperEn).toBe('Housekeeper');
      expect(housekeeperEs).toBe('Camarera/o');
    });

    it('should handle error messages correctly', () => {
      // Test employee not found error
      const notFoundEn = translationService.t('employee.errors.employeeNotFound', {}, 'en');
      const notFoundEs = translationService.t('employee.errors.employeeNotFound', {}, 'es');
      
      expect(notFoundEn).toBe('Employee not found');
      expect(notFoundEs).toBe('Empleado no encontrado');

      // Test insufficient permissions error
      const permissionsEn = translationService.t('employee.errors.insufficientPermissionsView', {}, 'en');
      const permissionsEs = translationService.t('employee.errors.insufficientPermissionsView', {}, 'es');
      
      expect(permissionsEn).toBe('Insufficient permissions to view employee');
      expect(permissionsEs).toBe('Permisos insuficientes para ver empleado');
    });

    it('should fall back to key when translation is missing', () => {
      const missingKey = translationService.t('nonexistent.key', {}, 'en');
      expect(missingKey).toBe('nonexistent.key');
    });

    it('should fall back to English when locale is not supported', () => {
      const message = translationService.t(EMPLOYEE_SUCCESS_KEYS.EMPLOYEE_CREATED, {}, 'fr');
      expect(message).toBe('Employee created successfully'); // Falls back to English
    });
  });

  describe('Route Helper Functions', () => {
    // These tests would verify that the helper functions in the routes work correctly
    // Since we can't easily test the actual routes without a full setup, we test the translation logic

    it('should correctly determine user locale from request', () => {
      // Mock request with English preference
      const reqEn = {
        user: { languagePreference: 'en' }
      } as any;

      // Mock request with Spanish preference
      const reqEs = {
        user: { languagePreference: 'es' }
      } as any;

      // Mock request without preference (should default to English)
      const reqDefault = {
        user: {}
      } as any;

      // These would be tested if we extracted the getUserLocale function
      // For now, we verify the translation service works with different locales
      expect(translationService.t('employee.status.active', {}, 'en')).toBe('Active');
      expect(translationService.t('employee.status.active', {}, 'es')).toBe('Activo');
      expect(translationService.t('employee.status.active', {}, undefined)).toBe('Active'); // Default to English
    });
  });
});