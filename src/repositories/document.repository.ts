import { Document, DocumentType, Prisma } from '@prisma/client';
import { BaseRepository, PaginatedResponse, PaginationOptions } from './base.repository';

export interface CreateDocumentData {
  employeeId: string;
  documentType: DocumentType;
  documentName?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  ocrData?: any;
}

export interface UpdateDocumentData {
  documentName?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  ocrData?: any;
  isSigned?: boolean;
  signedAt?: Date;
  signatureData?: string;
  version?: number;
}

export interface DocumentFilters {
  employeeId?: string;
  documentType?: DocumentType;
  isSigned?: boolean;
  organizationId?: string;
}

export interface SignDocumentData {
  signatureData: string;
  signedAt: Date;
  ipAddress: string;
  userAgent: string;
  signerName?: string;
}

export class DocumentRepository extends BaseRepository {
  /**
   * Create a new document
   */
  async create(data: CreateDocumentData): Promise<Document> {
    return this.prisma.document.create({
      data,
      include: {
        employee: {
          include: {
            user: {
              include: {
                organization: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Find document by ID
   */
  async findById(id: string): Promise<Document | null> {
    return this.prisma.document.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: {
              include: {
                organization: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Update document by ID
   */
  async update(id: string, data: UpdateDocumentData): Promise<Document> {
    return this.prisma.document.update({
      where: { id },
      data,
      include: {
        employee: {
          include: {
            user: {
              include: {
                organization: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Delete document by ID
   */
  async delete(id: string): Promise<Document> {
    return this.prisma.document.delete({
      where: { id }
    });
  }

  /**
   * List documents with filters and pagination
   */
  async list(
    filters: DocumentFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResponse<Document>> {
    const { skip, take, page, limit } = this.getPaginationParams(
      pagination.page,
      pagination.limit
    );

    const where: Prisma.DocumentWhereInput = {
      ...(filters.employeeId && { employeeId: filters.employeeId }),
      ...(filters.documentType && { documentType: filters.documentType }),
      ...(filters.isSigned !== undefined && { isSigned: filters.isSigned }),
      ...(filters.organizationId && {
        employee: {
          user: {
            organizationId: filters.organizationId
          }
        }
      })
    };

    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip,
        take,
        include: {
          employee: {
            include: {
              user: {
                include: {
                  organization: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.document.count({ where })
    ]);

    return this.createPaginatedResponse(documents, total, page, limit);
  }

  /**
   * Find documents by employee ID
   */
  async findByEmployee(employeeId: string): Promise<Document[]> {
    return this.prisma.document.findMany({
      where: { employeeId },
      include: {
        employee: {
          include: {
            user: {
              include: {
                organization: true
              }
            }
          }
        }
      },
      orderBy: [
        { documentType: 'asc' },
        { createdAt: 'desc' }
      ]
    });
  }

  /**
   * Find documents by type for an employee
   */
  async findByEmployeeAndType(
    employeeId: string, 
    documentType: DocumentType
  ): Promise<Document | null> {
    return this.prisma.document.findFirst({
      where: {
        employeeId,
        documentType
      },
      include: {
        employee: {
          include: {
            user: {
              include: {
                organization: true
              }
            }
          }
        }
      },
      orderBy: { version: 'desc' }
    });
  }

  /**
   * Find latest version of a document type for an employee
   */
  async findLatestByEmployeeAndType(
    employeeId: string,
    documentType: DocumentType
  ): Promise<Document | null> {
    return this.prisma.document.findFirst({
      where: {
        employeeId,
        documentType
      },
      include: {
        employee: {
          include: {
            user: {
              include: {
                organization: true
              }
            }
          }
        }
      },
      orderBy: { version: 'desc' }
    });
  }

  /**
   * Sign a document
   */
  async signDocument(id: string, signatureData: SignDocumentData): Promise<Document> {
    // Store signature data as JSON with audit information
    const signatureAudit = {
      signatureData: signatureData.signatureData,
      ipAddress: signatureData.ipAddress,
      userAgent: signatureData.userAgent,
      signerName: signatureData.signerName,
      timestamp: signatureData.signedAt.toISOString()
    };

    return this.prisma.document.update({
      where: { id },
      data: {
        isSigned: true,
        signedAt: signatureData.signedAt,
        signatureData: JSON.stringify(signatureAudit)
      },
      include: {
        employee: {
          include: {
            user: {
              include: {
                organization: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Find unsigned documents for an employee
   */
  async findUnsignedByEmployee(employeeId: string): Promise<Document[]> {
    return this.prisma.document.findMany({
      where: {
        employeeId,
        isSigned: false
      },
      include: {
        employee: {
          include: {
            user: {
              include: {
                organization: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  /**
   * Find documents requiring OCR processing
   */
  async findPendingOCR(): Promise<Document[]> {
    return this.prisma.document.findMany({
      where: {
        documentType: {
          in: ['ssn', 'drivers_license']
        },
        ocrData: {
          path: ['processingStatus'],
          equals: 'pending'
        }
      },
      include: {
        employee: {
          include: {
            user: {
              include: {
                organization: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  /**
   * Update OCR data for a document
   */
  async updateOCRData(id: string, ocrData: any): Promise<Document> {
    return this.prisma.document.update({
      where: { id },
      data: { ocrData },
      include: {
        employee: {
          include: {
            user: {
              include: {
                organization: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Get document statistics for organization
   */
  async getOrganizationStats(organizationId: string) {
    const [total, signed, unsigned, withOCR] = await Promise.all([
      this.prisma.document.count({
        where: {
          employee: {
            user: { organizationId }
          }
        }
      }),
      this.prisma.document.count({
        where: {
          isSigned: true,
          employee: {
            user: { organizationId }
          }
        }
      }),
      this.prisma.document.count({
        where: {
          isSigned: false,
          employee: {
            user: { organizationId }
          }
        }
      }),
      this.prisma.document.count({
        where: {
          ocrData: { not: Prisma.DbNull },
          employee: {
            user: { organizationId }
          }
        }
      })
    ]);

    return {
      total,
      signed,
      unsigned,
      withOCR,
      signedPercentage: total > 0 ? Math.round((signed / total) * 100) : 0
    };
  }

  /**
   * Find documents by organization
   */
  async findByOrganization(organizationId: string): Promise<Document[]> {
    return this.prisma.document.findMany({
      where: {
        employee: {
          user: { organizationId }
        }
      },
      include: {
        employee: {
          include: {
            user: {
              include: {
                organization: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Create new version of existing document
   */
  async createNewVersion(originalId: string, data: CreateDocumentData): Promise<Document> {
    return this.transaction(async (tx) => {
      // Get the original document to determine next version
      const original = await tx.document.findUnique({
        where: { id: originalId }
      });

      if (!original) {
        throw new Error('Original document not found');
      }

      // Create new version
      return tx.document.create({
        data: {
          ...data,
          version: original.version + 1
        },
        include: {
          employee: {
            include: {
              user: {
                include: {
                  organization: true
                }
              }
            }
          }
        }
      });
    });
  }

  /**
   * Check if file path is already in use
   */
  async filePathExists(filePath: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.document.count({
      where: {
        filePath,
        ...(excludeId && { id: { not: excludeId } })
      }
    });
    return count > 0;
  }
}