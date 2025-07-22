// Repository exports
export { BaseRepository } from './base.repository';
export { UserRepository } from './user.repository';
export { EmployeeRepository } from './employee.repository';
export { DocumentRepository } from './document.repository';
export { OnboardingRepository } from './onboarding.repository';
export { AnnouncementRepository } from './announcement.repository';

// Type exports
export type { PaginatedResponse, PaginationOptions } from './base.repository';
export type { 
  CreateUserData, 
  UpdateUserData, 
  UserFilters 
} from './user.repository';
export type { 
  CreateEmployeeData, 
  UpdateEmployeeData, 
  EmployeeFilters, 
  TerminationData 
} from './employee.repository';
export type { 
  CreateDocumentData, 
  UpdateDocumentData, 
  DocumentFilters, 
  SignDocumentData 
} from './document.repository';
export type {
  CreateOnboardingSessionData,
  UpdateOnboardingSessionData,
  OnboardingSessionFilters,
  OnboardingSessionWithEmployee
} from './onboarding.repository';
export type {
  CreateAnnouncementData,
  UpdateAnnouncementData,
  AnnouncementFilters
} from './announcement.repository';

// Import repository classes
import { UserRepository } from './user.repository';
import { EmployeeRepository } from './employee.repository';
import { DocumentRepository } from './document.repository';
import { OnboardingRepository } from './onboarding.repository';
import { AnnouncementRepository } from './announcement.repository';

// Repository instances (singletons)
export const userRepository = new UserRepository();
export const employeeRepository = new EmployeeRepository();
export const documentRepository = new DocumentRepository();
export const onboardingRepository = new OnboardingRepository();
export const announcementRepository = new AnnouncementRepository();