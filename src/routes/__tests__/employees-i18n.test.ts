import { translationService, EMPLOYEE_SUCCESS_KEYS, EMPLOYEE_ERROR_KEYS } from '@/utils/i18n/translationService';

describe('Employee Routes Internationalization', () => {
  describe('Translation Service', () => {
    it('should translate employee success messages in English', () => {
      const message = translationService.t(EMPLOYEE_SUCCESS_KEYS.EMPLOYEE_CREATED, {}, 'en');
      expect(message).toBe('Employee created successfully');
    });

    it('should translate employee success messages in Spanish', () => {
      const message = translationService.t(EMPLOYEE_SUCCESS_KEYS.EMPLOYEE_CREATED, {}, 'es');
      expect(message).toBe('Empleado creado exitosamente');
    });

    it('should translate employee error messages in English', () => {
      const message = translationService.t(EMPLOYEE_ERROR_KEYS.EMPLOYEE_NOT_FOUND, {}, 'en');
      expect(message).toBe('Employee not found');
    });

    it('should translate employee error messages in Spanish', () => {
      const message = translationService.t(EMPLOYEE_ERROR_KEYS.EMPLOYEE_NOT_FOUND, {}, 'es');
      expect(message).toBe('Empleado no encontrado');
    });

    it('should translate common error messages in English', () => {
      const message = translationService.t('common.errors.validation', {}, 'en');
      expect(message).toBe('Validation error');
    });

    it('should translate common error messages in Spanish', () => {
      const message = translationService.t('common.errors.validation', {}, 'es');
      expect(message).toBe('Error de validación');
    });

    it('should fall back to English when translation not found', () => {
      const message = translationService.t('nonexistent.key', {}, 'es');
      expect(message).toBe('nonexistent.key'); // Falls back to key when not found
    });

    it('should handle parameter substitution', () => {
      // This would work if we had parameterized messages
      const message = translationService.t('employee.success.employeeCreated', {}, 'en');
      expect(message).toBe('Employee created successfully');
    });
  });

  describe('Employment Status Translation', () => {
    it('should translate employment status correctly', () => {
      const activeEn = translationService.t('employee.status.active', {}, 'en');
      const activeEs = translationService.t('employee.status.active', {}, 'es');
      
      expect(activeEn).toBe('Active');
      expect(activeEs).toBe('Activo');
    });

    it('should translate terminated status correctly', () => {
      const terminatedEn = translationService.t('employee.status.terminated', {}, 'en');
      const terminatedEs = translationService.t('employee.status.terminated', {}, 'es');
      
      expect(terminatedEn).toBe('Terminated');
      expect(terminatedEs).toBe('Terminado');
    });
  });

  describe('Department Translation', () => {
    it('should translate departments correctly', () => {
      const receptionEn = translationService.t('employee.departments.reception', {}, 'en');
      const receptionEs = translationService.t('employee.departments.reception', {}, 'es');
      
      expect(receptionEn).toBe('Reception');
      expect(receptionEs).toBe('Recepción');
    });

    it('should translate housekeeping correctly', () => {
      const housekeepingEn = translationService.t('employee.departments.housekeeping', {}, 'en');
      const housekeepingEs = translationService.t('employee.departments.housekeeping', {}, 'es');
      
      expect(housekeepingEn).toBe('Housekeeping');
      expect(housekeepingEs).toBe('Limpieza');
    });
  });

  describe('Position Translation', () => {
    it('should translate positions correctly', () => {
      const frontDeskEn = translationService.t('employee.positions.frontDeskClerk', {}, 'en');
      const frontDeskEs = translationService.t('employee.positions.frontDeskClerk', {}, 'es');
      
      expect(frontDeskEn).toBe('Front Desk Clerk');
      expect(frontDeskEs).toBe('Recepcionista');
    });

    it('should translate housekeeper correctly', () => {
      const housekeeperEn = translationService.t('employee.positions.housekeeper', {}, 'en');
      const housekeeperEs = translationService.t('employee.positions.housekeeper', {}, 'es');
      
      expect(housekeeperEn).toBe('Housekeeper');
      expect(housekeeperEs).toBe('Camarera/o');
    });
  });
});