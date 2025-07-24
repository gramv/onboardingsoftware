import { Router } from 'express';
import { propertyQRService } from '../services/property/propertyQRService';

const router = Router();

router.get('/:propertyId/qr-code', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const qrData = await propertyQRService.generatePropertyQRCode(propertyId);
    
    res.json({
      success: true,
      data: qrData
    });
  } catch (error) {
    console.error('Error generating property QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR code'
    });
  }
});

router.get('/:propertyId/departments', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const departments = await propertyQRService.getPropertyDepartments(propertyId);
    
    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error('Error getting property departments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get departments'
    });
  }
});

router.get('/:propertyId/positions', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { department } = req.query;
    
    if (!department) {
      return res.status(400).json({
        success: false,
        message: 'Department parameter is required'
      });
    }
    
    const positions = await propertyQRService.getPositionsByDepartment(propertyId, department as string);
    
    res.json({
      success: true,
      data: positions
    });
  } catch (error) {
    console.error('Error getting positions by department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get positions'
    });
  }
});

export default router;
