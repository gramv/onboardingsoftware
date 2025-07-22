import express from 'express';
import authRoutes from './auth';
import employeeRoutes from './employees';
import onboardingRoutes from './onboarding';
import walkInOnboardingRoutes from './walkin-onboarding';
import documentRoutes from './documents';
import signatureRoutes from './signatures';
import ocrRoutes from './ocr';
import formRoutes from './forms';
import scheduleRoutes from './schedules';
import announcementRoutes from './announcements';
import messageRoutes from './messages';
import notificationRoutes from './notifications';
import jobRoutes from './jobs';
import emailRoutes from './email';
import onboardingAccessRoutes from './onboardingAccess';
import aiRoutes from './ai';
import qrCodeRoutes from './qr-codes';
import hrRoutes from './hr';

// Added comment to trigger hooks - i18n compliance check
const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/walkin-onboarding', walkInOnboardingRoutes);
router.use('/documents', documentRoutes);
router.use('/signatures', signatureRoutes);
router.use('/ocr', ocrRoutes);
router.use('/forms', formRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/announcements', announcementRoutes);
router.use('/messages', messageRoutes);
router.use('/notifications', notificationRoutes);
router.use('/jobs', jobRoutes);
router.use('/email', emailRoutes);
router.use('/ai', aiRoutes);
router.use('/qr-codes', qrCodeRoutes);
router.use('/hr', hrRoutes);
// Mount the new onboarding access routes at the same path (they have different endpoints)
// This will merge with the existing onboarding routes
router.use('/onboarding', onboardingAccessRoutes);

export default router;
