import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }
    
    res.json({
      success: true,
      data: organization
    });
  } catch (error) {
    console.error('Error getting organization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get organization'
    });
  }
});

export default router;
