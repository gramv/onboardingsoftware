// Translation service for internationalization compliance
export interface ITranslationService {
  t(key: string, params?: Record<string, any>, locale?: string): string;
}

export class TranslationService implements ITranslationService {
  t(key: string, params?: Record<string, any>, locale?: string): string {
    // Simple implementation for now - in production this would use actual translation files
    return key;
  }
}

// Employee service error message translation keys
export const EMPLOYEE_ERROR_KEYS = {
  EMPLOYEE_ID_EXISTS: 'employee.errors.employeeIdExists',
  EMAIL_EXISTS: 'employee.errors.emailExists',
  EMPLOYEE_NOT_FOUND: 'employee.errors.employeeNotFound',
  INVALID_MANAGER_RATING: 'employee.errors.invalidManagerRating',
  CANNOT_CREATE_DIFFERENT_ORG: 'employee.errors.cannotCreateDifferentOrg',
  INSUFFICIENT_PERMISSIONS_CREATE: 'employee.errors.insufficientPermissionsCreate',
  INSUFFICIENT_PERMISSIONS_VIEW: 'employee.errors.insufficientPermissionsView',
  INSUFFICIENT_PERMISSIONS_UPDATE: 'employee.errors.insufficientPermissionsUpdate',
  INSUFFICIENT_PERMISSIONS_TERMINATE: 'employee.errors.insufficientPermissionsTerminate',
  INSUFFICIENT_PERMISSIONS_STATS: 'employee.errors.insufficientPermissionsStats',
  INSUFFICIENT_PERMISSIONS_ALUMNI: 'employee.errors.insufficientPermissionsAlumni',
  EMPLOYEE_ALREADY_TERMINATED: 'employee.errors.employeeAlreadyTerminated',
  EMPLOYEE_NOT_TERMINATED: 'employee.errors.employeeNotTerminated'
} as const;

// Employee service success message keys
export const EMPLOYEE_SUCCESS_KEYS = {
  EMPLOYEE_CREATED: 'employee.success.employeeCreated',
  EMPLOYEE_UPDATED: 'employee.success.employeeUpdated',
  EMPLOYEE_TERMINATED: 'employee.success.employeeTerminated',
  EXPERIENCE_LETTER_GENERATED: 'employee.success.experienceLetterGenerated'
} as const;

// Onboarding service error message keys
export const ONBOARDING_ERROR_KEYS = {
  EMPLOYEE_NOT_FOUND: 'onboarding.errors.employeeNotFound',
  ONBOARDING_SESSION_ALREADY_EXISTS: 'onboarding.errors.onboardingSessionAlreadyExists',
  INVALID_TOKEN: 'onboarding.errors.invalidToken',
  TOKEN_EXPIRED: 'onboarding.errors.tokenExpired',
  ONBOARDING_SESSION_NOT_ACTIVE: 'onboarding.errors.onboardingSessionNotActive',
  ONBOARDING_SESSION_NOT_FOUND: 'onboarding.errors.onboardingSessionNotFound',
  ONBOARDING_SESSION_EXPIRED: 'onboarding.errors.onboardingSessionExpired',
  TOKEN_EMPLOYEE_MISMATCH: 'onboarding.errors.tokenEmployeeMismatch',
  SESSION_ID_REQUIRED: 'onboarding.errors.sessionIdRequired',
  INVALID_EMPLOYEE_ID: 'onboarding.errors.invalidEmployeeId',
  TOKEN_TOO_SHORT: 'onboarding.errors.tokenTooShort',
  ADDITIONAL_HOURS_REQUIRED: 'onboarding.errors.additionalHoursRequired'
} as const;

// Onboarding service success message keys
export const ONBOARDING_SUCCESS_KEYS = {
  SESSION_CREATED: 'onboarding.success.sessionCreated',
  PROGRESS_UPDATED: 'onboarding.success.progressUpdated',
  SESSION_COMPLETED: 'onboarding.success.sessionCompleted',
  SESSION_CANCELLED: 'onboarding.success.sessionCancelled',
  SESSION_EXTENDED: 'onboarding.success.sessionExtended',
  ONBOARDING_STARTED: 'onboarding.success.onboardingStarted',
  ONBOARDING_SUBMITTED: 'onboarding.success.onboardingSubmitted'
} as const;

// Employee field labels for forms
export const EMPLOYEE_FIELD_KEYS = {
  EMPLOYEE_ID: 'employee.fields.employeeId',
  FIRST_NAME: 'employee.fields.firstName',
  LAST_NAME: 'employee.fields.lastName',
  EMAIL: 'employee.fields.email',
  PHONE: 'employee.fields.phone',
  POSITION: 'employee.fields.position',
  DEPARTMENT: 'employee.fields.department',
  HOURLY_RATE: 'employee.fields.hourlyRate',
  HIRE_DATE: 'employee.fields.hireDate',
  DATE_OF_BIRTH: 'employee.fields.dateOfBirth',
  EMERGENCY_CONTACT: 'employee.fields.emergencyContact',
  ADDRESS: 'employee.fields.address',
  LANGUAGE_PREFERENCE: 'employee.fields.languagePreference'
} as const;

// Employment status translations
export const EMPLOYMENT_STATUS_KEYS = {
  ACTIVE: 'employee.status.active',
  TERMINATED: 'employee.status.terminated',
  ON_LEAVE: 'employee.status.onLeave'
} as const;

// Department translations (common motel departments)
export const DEPARTMENT_KEYS = {
  RECEPTION: 'employee.departments.reception',
  HOUSEKEEPING: 'employee.departments.housekeeping',
  MAINTENANCE: 'employee.departments.maintenance',
  FACILITIES: 'employee.departments.facilities',
  MANAGEMENT: 'employee.departments.management',
  SECURITY: 'employee.departments.security'
} as const;

// Position translations (common motel positions)
export const POSITION_KEYS = {
  FRONT_DESK_CLERK: 'employee.positions.frontDeskClerk',
  HOUSEKEEPER: 'employee.positions.housekeeper',
  MAINTENANCE_WORKER: 'employee.positions.maintenanceWorker',
  NIGHT_AUDITOR: 'employee.positions.nightAuditor',
  MANAGER: 'employee.positions.manager',
  ASSISTANT_MANAGER: 'employee.positions.assistantManager',
  SECURITY_GUARD: 'employee.positions.securityGuard'
} as const;

// Mock translation service for development
export class MockTranslationService implements TranslationService {
  private translations: Record<string, Record<string, string>> = {
    en: {
      // Error messages
      'employee.errors.employeeIdExists': 'Employee ID already exists',
      'employee.errors.emailExists': 'Email already exists',
      'employee.errors.employeeNotFound': 'Employee not found',
      'employee.errors.invalidManagerRating': 'Manager rating must be between 1 and 5',
      'employee.errors.cannotCreateDifferentOrg': 'Cannot create employee in different organization',
      'employee.errors.insufficientPermissionsCreate': 'Insufficient permissions to create employee',
      'employee.errors.insufficientPermissionsView': 'Insufficient permissions to view employee',
      'employee.errors.insufficientPermissionsUpdate': 'Insufficient permissions to update employee',
      'employee.errors.insufficientPermissionsTerminate': 'Insufficient permissions to terminate employee',
      'employee.errors.insufficientPermissionsStats': 'Insufficient permissions to view organization statistics',
      'employee.errors.insufficientPermissionsAlumni': 'Insufficient permissions to view alumni',
      'employee.errors.employeeAlreadyTerminated': 'Employee is already terminated',
      'employee.errors.employeeNotTerminated': 'Employee is not terminated',
      
      // Success messages
      'employee.success.employeeCreated': 'Employee created successfully',
      'employee.success.employeeUpdated': 'Employee updated successfully',
      'employee.success.employeeTerminated': 'Employee terminated successfully',
      'employee.success.experienceLetterGenerated': 'Experience letter generated successfully',
      
      // Field labels
      'employee.fields.employeeId': 'Employee ID',
      'employee.fields.firstName': 'First Name',
      'employee.fields.lastName': 'Last Name',
      'employee.fields.email': 'Email Address',
      'employee.fields.phone': 'Phone Number',
      'employee.fields.position': 'Position',
      'employee.fields.department': 'Department',
      'employee.fields.hourlyRate': 'Hourly Rate',
      'employee.fields.hireDate': 'Hire Date',
      'employee.fields.dateOfBirth': 'Date of Birth',
      'employee.fields.emergencyContact': 'Emergency Contact',
      'employee.fields.address': 'Address',
      'employee.fields.languagePreference': 'Language Preference',
      
      // Employment status
      'employee.status.active': 'Active',
      'employee.status.terminated': 'Terminated',
      'employee.status.onLeave': 'On Leave',
      
      // Departments
      'employee.departments.reception': 'Reception',
      'employee.departments.housekeeping': 'Housekeeping',
      'employee.departments.maintenance': 'Maintenance',
      'employee.departments.facilities': 'Facilities',
      'employee.departments.management': 'Management',
      'employee.departments.security': 'Security',
      
      // Positions
      'employee.positions.frontDeskClerk': 'Front Desk Clerk',
      'employee.positions.housekeeper': 'Housekeeper',
      'employee.positions.maintenanceWorker': 'Maintenance Worker',
      'employee.positions.nightAuditor': 'Night Auditor',
      'employee.positions.manager': 'Manager',
      'employee.positions.assistantManager': 'Assistant Manager',
      'employee.positions.securityGuard': 'Security Guard',
      
      // Forms error messages
      'forms.errors.notFound': 'Form not found',
      'forms.errors.accessDenied': 'Access denied',
      'forms.errors.validationFailed': 'Form validation failed',
      'forms.errors.generationFailed': 'Failed to generate form',
      'forms.errors.retrievalFailed': 'Failed to retrieve form',
      'forms.errors.updateFailed': 'Failed to update form',
      'forms.errors.validationError': 'Failed to validate form',
      'forms.errors.submitFailed': 'Failed to submit form',
      'forms.errors.approveFailed': 'Failed to approve form',
      'forms.errors.rejectFailed': 'Failed to reject form',
      'forms.errors.pdfGenerationFailed': 'Failed to generate PDF',
      'forms.errors.formRetrievalFailed': 'Failed to retrieve forms',
      'forms.errors.suggestionsFailed': 'Failed to get suggestions',
      'forms.errors.mustBeSubmittedForApproval': 'Form must be submitted before approval',
      'forms.errors.mustBeSubmittedForRejection': 'Form must be submitted before rejection',
      
      // Forms messages
      'forms.messages.submitSuccess': 'Form submitted successfully',
      'forms.messages.approveSuccess': 'Form approved successfully',
      'forms.messages.rejectSuccess': 'Form rejected',
      'forms.messages.validationError': 'Validation error',
      'forms.messages.authenticationRequired': 'Authentication required',
      'forms.messages.insufficientPermissions': 'Insufficient permissions',
      
      // Forms status
      'forms.status.draft': 'Draft',
      'forms.status.inProgress': 'In Progress',
      'forms.status.completed': 'Completed',
      'forms.status.submitted': 'Submitted',
      'forms.status.approved': 'Approved',
      'forms.status.rejected': 'Rejected',
      
      // API Error Messages
      'api.errors.authentication_required': 'Authentication required',
      'api.errors.insufficient_permissions': 'Insufficient permissions',
      'api.errors.invalid_token': 'Invalid token',
      'api.errors.token_expired': 'Token expired',
      'api.errors.validation_error': 'Validation error',
      'api.errors.invalid_input': 'Invalid input',
      'api.errors.missing_required_field': 'Missing required field',
      'api.errors.resource_not_found': 'Resource not found',
      'api.errors.resource_already_exists': 'Resource already exists',
      'api.errors.resource_conflict': 'Resource conflict',
      'api.errors.business_rule_violation': 'Business rule violation',
      'api.errors.operation_not_allowed': 'Operation not allowed',
      'api.errors.invalid_state': 'Invalid state',
      'api.errors.internal_server_error': 'Internal server error',
      'api.errors.service_unavailable': 'Service unavailable',
      'api.errors.database_error': 'Database error',
      'api.errors.external_service_error': 'External service error',
      'api.errors.rate_limit_exceeded': 'Rate limit exceeded',
      'api.errors.too_many_requests': 'Too many requests',
      'api.errors.file_not_found': 'File not found',
      'api.errors.file_too_large': 'File too large',
      'api.errors.invalid_file_type': 'Invalid file type',
      'api.errors.file_upload_failed': 'File upload failed',
      'api.errors.form_not_found': 'Form not found',
      'api.errors.form_validation_failed': 'Form validation failed',
      'api.errors.form_already_submitted': 'Form already submitted',
      'api.errors.form_generation_failed': 'Form generation failed',
      'api.errors.ocr_processing_failed': 'OCR processing failed',
      'api.errors.ocr_disabled': 'OCR processing disabled',
      'api.errors.unsupported_document_type': 'Unsupported document type',
      'api.errors.employee_not_found': 'Employee not found',
      'api.errors.employee_already_exists': 'Employee already exists',
      'api.errors.employee_already_terminated': 'Employee already terminated',
      'api.errors.organization_not_found': 'Organization not found',
      'api.errors.organization_access_denied': 'Organization access denied',
      
      // Onboarding error messages
      'onboarding.errors.employeeNotFound': 'Employee not found',
      'onboarding.errors.onboardingSessionAlreadyExists': 'An active onboarding session already exists for this employee',
      'onboarding.errors.invalidAccessCode': 'Invalid access code',
      'onboarding.errors.accessCodeExpired': 'Access code has expired',
      'onboarding.errors.onboardingSessionNotActive': 'Onboarding session is not active',
      'onboarding.errors.onboardingSessionNotFound': 'Onboarding session not found',
      'onboarding.errors.onboardingSessionExpired': 'Onboarding session has expired',
      'onboarding.errors.accessCodeEmployeeMismatch': 'Access code does not match the specified employee',
      'onboarding.errors.sessionIdRequired': 'Session ID is required',
      'onboarding.errors.invalidEmployeeId': 'Invalid employee ID format',
      'onboarding.errors.accessCodeTooShort': 'Access code must be at least 6 characters',
      'onboarding.errors.additionalHoursRequired': 'Additional hours must be a positive number',
      
      // Onboarding success messages
      'onboarding.success.sessionCreated': 'Onboarding session created successfully',
      'onboarding.success.progressUpdated': 'Onboarding progress updated successfully',
      'onboarding.success.sessionCompleted': 'Onboarding completed successfully',
      'onboarding.success.sessionCancelled': 'Onboarding session cancelled',
      'onboarding.success.sessionExtended': 'Onboarding session extended successfully',
      'onboarding.success.onboardingStarted': 'Onboarding started successfully',
      'onboarding.success.onboardingSubmitted': 'Onboarding submitted for review',
      
      // Common error messages
      'common.errors.validation': 'Validation error',
      'common.errors.unexpected': 'An unexpected error occurred',
      'common.errors.searchQueryRequired': 'Search query is required',
      'common.errors.organizationIdRequired': 'Organization ID is required',
      'common.errors.authenticationRequired': 'Authentication required',

      // Document types
      'documents.types.ssn': 'Social Security Card',
      'documents.types.driversLicense': 'Driver\'s License',
      'documents.types.i9': 'Form I-9',
      'documents.types.w4': 'Form W-4',
      'documents.types.handbook': 'Employee Handbook',
      'documents.types.policy': 'Company Policy',
      'documents.types.experienceLetter': 'Experience Letter',
      'documents.types.other': 'Other Document',

      // Experience letter content
      'experienceLetter.title': 'Experience Letter',
      'experienceLetter.date': 'Date',
      'experienceLetter.greeting': 'To Whom It May Concern',
      'experienceLetter.intro': 'This is to certify that {name} (Employee ID: {employeeId}) was employed with {company} in the capacity mentioned below.',
      'experienceLetter.employeeDetails': 'Employee Details',
      'experienceLetter.fullName': 'Full Name',
      'experienceLetter.employeeId': 'Employee ID',
      'experienceLetter.position': 'Position',
      'experienceLetter.department': 'Department',
      'experienceLetter.employmentPeriod': 'Employment Period',
      'experienceLetter.duration': 'Duration',
      'experienceLetter.to': 'to',
      'experienceLetter.performance': 'During the tenure with us, {name} has shown dedication and professionalism in their work.',
      'experienceLetter.performanceRating': 'Performance Rating',
      'experienceLetter.recommendation': 'Recommendation',
      'experienceLetter.closing': 'We wish {name} all the best in their future endeavors.',
      'experienceLetter.contact': 'For any further information, please feel free to contact us.',
      'experienceLetter.sincerely': 'Sincerely',
      'experienceLetter.hrManager': 'Human Resources Manager',
      'experienceLetter.footer': 'This is a computer-generated document from {company}.',
      'experienceLetter.year': 'year',
      'experienceLetter.years': 'years',
      'experienceLetter.month': 'month',
      'experienceLetter.months': 'months',
      'experienceLetter.day': 'day',
      'experienceLetter.days': 'days',
      'experienceLetter.recommendations.excellent': 'Highly recommended for future employment',
      'experienceLetter.recommendations.good': 'Recommended for future employment',
      'experienceLetter.recommendations.satisfactory': 'Eligible for future employment',
      'experienceLetter.recommendations.needsImprovement': 'May be considered for future employment',
      'experienceLetter.recommendations.unsatisfactory': 'Not recommended for future employment'
    },
    es: {
      // Forms error messages - Spanish
      'forms.errors.notFound': 'Formulario no encontrado',
      'forms.errors.accessDenied': 'Acceso denegado',
      'forms.errors.validationFailed': 'Validación del formulario falló',
      'forms.errors.generationFailed': 'Error al generar formulario',
      'forms.errors.retrievalFailed': 'Error al recuperar formulario',
      'forms.errors.updateFailed': 'Error al actualizar formulario',
      'forms.errors.validationError': 'Error al validar formulario',
      'forms.errors.submitFailed': 'Error al enviar formulario',
      'forms.errors.approveFailed': 'Error al aprobar formulario',
      'forms.errors.rejectFailed': 'Error al rechazar formulario',
      'forms.errors.pdfGenerationFailed': 'Error al generar PDF',
      'forms.errors.formRetrievalFailed': 'Error al recuperar formularios',
      'forms.errors.suggestionsFailed': 'Error al obtener sugerencias',
      'forms.errors.mustBeSubmittedForApproval': 'El formulario debe ser enviado antes de la aprobación',
      'forms.errors.mustBeSubmittedForRejection': 'El formulario debe ser enviado antes del rechazo',
      
      // Forms messages - Spanish
      'forms.messages.submitSuccess': 'Formulario enviado exitosamente',
      'forms.messages.approveSuccess': 'Formulario aprobado exitosamente',
      'forms.messages.rejectSuccess': 'Formulario rechazado',
      'forms.messages.validationError': 'Error de validación',
      'forms.messages.authenticationRequired': 'Se requiere autenticación',
      'forms.messages.insufficientPermissions': 'Permisos insuficientes',
      
      // Forms status - Spanish
      'forms.status.draft': 'Borrador',
      'forms.status.inProgress': 'En Progreso',
      'forms.status.completed': 'Completado',
      'forms.status.submitted': 'Enviado',
      'forms.status.approved': 'Aprobado',
      'forms.status.rejected': 'Rechazado',
      
      // API Error Messages - Spanish
      'api.errors.authentication_required': 'Se requiere autenticación',
      'api.errors.insufficient_permissions': 'Permisos insuficientes',
      'api.errors.invalid_token': 'Token inválido',
      'api.errors.token_expired': 'Token expirado',
      'api.errors.validation_error': 'Error de validación',
      'api.errors.invalid_input': 'Entrada inválida',
      'api.errors.missing_required_field': 'Falta campo requerido',
      'api.errors.resource_not_found': 'Recurso no encontrado',
      'api.errors.resource_already_exists': 'El recurso ya existe',
      'api.errors.resource_conflict': 'Conflicto de recurso',
      'api.errors.business_rule_violation': 'Violación de regla de negocio',
      'api.errors.operation_not_allowed': 'Operación no permitida',
      'api.errors.invalid_state': 'Estado inválido',
      'api.errors.internal_server_error': 'Error interno del servidor',
      'api.errors.service_unavailable': 'Servicio no disponible',
      'api.errors.database_error': 'Error de base de datos',
      'api.errors.external_service_error': 'Error de servicio externo',
      'api.errors.rate_limit_exceeded': 'Límite de velocidad excedido',
      'api.errors.too_many_requests': 'Demasiadas solicitudes',
      'api.errors.file_not_found': 'Archivo no encontrado',
      'api.errors.file_too_large': 'Archivo demasiado grande',
      'api.errors.invalid_file_type': 'Tipo de archivo inválido',
      'api.errors.file_upload_failed': 'Fallo en la carga del archivo',
      'api.errors.form_not_found': 'Formulario no encontrado',
      'api.errors.form_validation_failed': 'Validación del formulario falló',
      'api.errors.form_already_submitted': 'Formulario ya enviado',
      'api.errors.form_generation_failed': 'Fallo en la generación del formulario',
      'api.errors.ocr_processing_failed': 'Fallo en el procesamiento OCR',
      'api.errors.ocr_disabled': 'Procesamiento OCR deshabilitado',
      'api.errors.unsupported_document_type': 'Tipo de documento no soportado',
      'api.errors.employee_not_found': 'Empleado no encontrado',
      'api.errors.employee_already_exists': 'El empleado ya existe',
      'api.errors.employee_already_terminated': 'Empleado ya terminado',
      'api.errors.organization_not_found': 'Organización no encontrada',
      'api.errors.organization_access_denied': 'Acceso a la organización denegado',
      
      // Error messages - Spanish translations
      'employee.errors.employeeIdExists': 'El ID del empleado ya existe',
      'employee.errors.emailExists': 'El correo electrónico ya existe',
      'employee.errors.employeeNotFound': 'Empleado no encontrado',
      'employee.errors.invalidManagerRating': 'La calificación del gerente debe estar entre 1 y 5',
      'employee.errors.cannotCreateDifferentOrg': 'No se puede crear empleado en una organización diferente',
      'employee.errors.insufficientPermissionsCreate': 'Permisos insuficientes para crear empleado',
      'employee.errors.insufficientPermissionsView': 'Permisos insuficientes para ver empleado',
      'employee.errors.insufficientPermissionsUpdate': 'Permisos insuficientes para actualizar empleado',
      'employee.errors.insufficientPermissionsTerminate': 'Permisos insuficientes para terminar empleado',
      'employee.errors.insufficientPermissionsStats': 'Permisos insuficientes para ver estadísticas de la organización',
      'employee.errors.insufficientPermissionsAlumni': 'Permisos insuficientes para ver ex-empleados',
      'employee.errors.employeeAlreadyTerminated': 'El empleado ya está terminado',
      'employee.errors.employeeNotTerminated': 'El empleado no está terminado',
      
      // Success messages
      'employee.success.employeeCreated': 'Empleado creado exitosamente',
      'employee.success.employeeUpdated': 'Empleado actualizado exitosamente',
      'employee.success.employeeTerminated': 'Empleado terminado exitosamente',
      'employee.success.experienceLetterGenerated': 'Carta de experiencia generada exitosamente',
      
      // Field labels - Spanish translations with proper HR terminology
      'employee.fields.employeeId': 'ID de Empleado',
      'employee.fields.firstName': 'Nombre',
      'employee.fields.lastName': 'Apellido',
      'employee.fields.email': 'Correo Electrónico',
      'employee.fields.phone': 'Número de Teléfono',
      'employee.fields.position': 'Puesto',
      'employee.fields.department': 'Departamento',
      'employee.fields.hourlyRate': 'Tarifa por Hora',
      'employee.fields.hireDate': 'Fecha de Contratación',
      'employee.fields.dateOfBirth': 'Fecha de Nacimiento',
      'employee.fields.emergencyContact': 'Contacto de Emergencia',
      'employee.fields.address': 'Dirección',
      'employee.fields.languagePreference': 'Preferencia de Idioma',
      
      // Employment status - Spanish
      'employee.status.active': 'Activo',
      'employee.status.terminated': 'Terminado',
      'employee.status.onLeave': 'Con Licencia',
      
      // Departments - Spanish with proper hospitality terminology
      'employee.departments.reception': 'Recepción',
      'employee.departments.housekeeping': 'Limpieza',
      'employee.departments.maintenance': 'Mantenimiento',
      'employee.departments.facilities': 'Instalaciones',
      'employee.departments.management': 'Gerencia',
      'employee.departments.security': 'Seguridad',
      
      // Positions - Spanish with proper hospitality job titles
      'employee.positions.frontDeskClerk': 'Recepcionista',
      'employee.positions.housekeeper': 'Camarera/o',
      'employee.positions.maintenanceWorker': 'Trabajador de Mantenimiento',
      'employee.positions.nightAuditor': 'Auditor Nocturno',
      'employee.positions.manager': 'Gerente',
      'employee.positions.assistantManager': 'Gerente Asistente',
      'employee.positions.securityGuard': 'Guardia de Seguridad',
      
      // Onboarding error messages - Spanish
      'onboarding.errors.employeeNotFound': 'Empleado no encontrado',
      'onboarding.errors.onboardingSessionAlreadyExists': 'Ya existe una sesión de incorporación activa para este empleado',
      'onboarding.errors.invalidAccessCode': 'Código de acceso inválido',
      'onboarding.errors.accessCodeExpired': 'El código de acceso ha expirado',
      'onboarding.errors.onboardingSessionNotActive': 'La sesión de incorporación no está activa',
      'onboarding.errors.onboardingSessionNotFound': 'Sesión de incorporación no encontrada',
      'onboarding.errors.onboardingSessionExpired': 'La sesión de incorporación ha expirado',
      'onboarding.errors.accessCodeEmployeeMismatch': 'El código de acceso no coincide con el empleado especificado',
      'onboarding.errors.sessionIdRequired': 'Se requiere ID de sesión',
      'onboarding.errors.invalidEmployeeId': 'Formato de ID de empleado inválido',
      'onboarding.errors.accessCodeTooShort': 'El código de acceso debe tener al menos 6 caracteres',
      'onboarding.errors.additionalHoursRequired': 'Las horas adicionales deben ser un número positivo',
      
      // Onboarding success messages - Spanish
      'onboarding.success.sessionCreated': 'Sesión de incorporación creada exitosamente',
      'onboarding.success.progressUpdated': 'Progreso de incorporación actualizado exitosamente',
      'onboarding.success.sessionCompleted': 'Incorporación completada exitosamente',
      'onboarding.success.sessionCancelled': 'Sesión de incorporación cancelada',
      'onboarding.success.sessionExtended': 'Sesión de incorporación extendida exitosamente',
      'onboarding.success.onboardingStarted': 'Incorporación iniciada exitosamente',
      'onboarding.success.onboardingSubmitted': 'Incorporación enviada para revisión',
      
      // Common error messages
      'common.errors.validation': 'Error de validación',
      'common.errors.unexpected': 'Ocurrió un error inesperado',
      'common.errors.searchQueryRequired': 'Se requiere consulta de búsqueda',
      'common.errors.organizationIdRequired': 'Se requiere ID de organización',
      'common.errors.authenticationRequired': 'Se requiere autenticación',

      // Document types - Spanish
      'documents.types.ssn': 'Tarjeta de Seguro Social',
      'documents.types.driversLicense': 'Licencia de Conducir',
      'documents.types.i9': 'Formulario I-9',
      'documents.types.w4': 'Formulario W-4',
      'documents.types.handbook': 'Manual del Empleado',
      'documents.types.policy': 'Política de la Empresa',
      'documents.types.experienceLetter': 'Carta de Experiencia Laboral',
      'documents.types.other': 'Otro Documento',

      // Experience letter content - Spanish
      'experienceLetter.title': 'Carta de Experiencia Laboral',
      'experienceLetter.date': 'Fecha',
      'experienceLetter.greeting': 'A Quien Corresponda',
      'experienceLetter.intro': 'Por medio de la presente certificamos que {name} (ID de Empleado: {employeeId}) trabajó con {company} en la capacidad mencionada a continuación.',
      'experienceLetter.employeeDetails': 'Detalles del Empleado',
      'experienceLetter.fullName': 'Nombre Completo',
      'experienceLetter.employeeId': 'ID de Empleado',
      'experienceLetter.position': 'Posición',
      'experienceLetter.department': 'Departamento',
      'experienceLetter.employmentPeriod': 'Período de Empleo',
      'experienceLetter.duration': 'Duración',
      'experienceLetter.to': 'a',
      'experienceLetter.performance': 'Durante su tiempo con nosotros, {name} ha demostrado dedicación y profesionalismo en su trabajo.',
      'experienceLetter.performanceRating': 'Calificación de Desempeño',
      'experienceLetter.recommendation': 'Recomendación',
      'experienceLetter.closing': 'Le deseamos a {name} todo lo mejor en sus futuros proyectos.',
      'experienceLetter.contact': 'Para cualquier información adicional, no dude en contactarnos.',
      'experienceLetter.sincerely': 'Atentamente',
      'experienceLetter.hrManager': 'Gerente de Recursos Humanos',
      'experienceLetter.footer': 'Este es un documento generado por computadora de {company}.',
      'experienceLetter.year': 'año',
      'experienceLetter.years': 'años',
      'experienceLetter.month': 'mes',
      'experienceLetter.months': 'meses',
      'experienceLetter.day': 'día',
      'experienceLetter.days': 'días',
      'experienceLetter.recommendations.excellent': 'Altamente recomendado para empleo futuro',
      'experienceLetter.recommendations.good': 'Recomendado para empleo futuro',
      'experienceLetter.recommendations.satisfactory': 'Elegible para empleo futuro',
      'experienceLetter.recommendations.needsImprovement': 'Puede ser considerado para empleo futuro',
      'experienceLetter.recommendations.unsatisfactory': 'No recomendado para empleo futuro'
    }
  };

  t(key: string, params?: Record<string, any>, locale: string = 'en'): string {
    const translation = this.translations[locale]?.[key] || this.translations['en'][key] || key;
    
    if (params) {
      return Object.entries(params).reduce((str, [param, value]) => {
        return str.replace(new RegExp(`{{${param}}}`, 'g'), String(value));
      }, translation);
    }
    
    return translation;
  }
}

// Singleton instance for use across the application
export const translationService = new MockTranslationService();