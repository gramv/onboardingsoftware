import { FormTemplate, FormSection, FormField } from '@/types/forms';

export const W4_TEMPLATE_EN: FormTemplate = {
  id: 'w4-en-v1',
  name: 'Form W-4 Employee\'s Withholding Certificate',
  type: 'w4',
  version: '1.0',
  language: 'en',
  metadata: {
    title: 'Employee\'s Withholding Certificate',
    description: 'Department of the Treasury Internal Revenue Service',
    instructions: 'Complete Form W-4 so that your employer can withhold the correct federal income tax from your pay.',
    legalNotice: 'Give Form W-4 to your employer. Your withholding is subject to review by the IRS.'
  },
  sections: [
    {
      id: 'personal_info',
      title: 'Step 1: Enter Personal Information',
      description: 'Enter your personal information',
      order: 1,
      fields: [
        {
          name: 'firstName',
          label: 'First name and middle initial',
          type: 'text',
          required: true,
          validation: { minLength: 1, maxLength: 50 }
        },
        {
          name: 'lastName',
          label: 'Last name',
          type: 'text',
          required: true,
          validation: { minLength: 1, maxLength: 50 }
        },
        {
          name: 'address',
          label: 'Address',
          type: 'text',
          required: true,
          validation: { minLength: 5, maxLength: 100 }
        },
        {
          name: 'city',
          label: 'City or town, state, and ZIP code',
          type: 'text',
          required: true,
          validation: { minLength: 5, maxLength: 100 }
        },
        {
          name: 'ssnNumber',
          label: 'Social security number',
          type: 'text',
          required: true,
          validation: { pattern: '^\\d{9}$' },
          placeholder: '123456789'
        },
        {
          name: 'filingStatus',
          label: 'Filing Status',
          type: 'radio',
          required: true,
          options: [
            { value: 'single', label: 'Single or Married filing separately' },
            { value: 'married_filing_jointly', label: 'Married filing jointly or Qualifying surviving spouse' },
            { value: 'head_of_household', label: 'Head of household (Check only if you\'re unmarried and pay more than half the costs of keeping up a home for yourself and a qualifying individual)' }
          ]
        }
      ]
    },
    {
      id: 'multiple_jobs',
      title: 'Step 2: Multiple Jobs or Spouse Works',
      description: 'Complete this step if you (1) hold more than one job at a time, or (2) are married filing jointly and your spouse also works.',
      order: 2,
      fields: [
        {
          name: 'multipleJobsSpouseWorks',
          label: 'I have multiple jobs or my spouse works',
          type: 'checkbox',
          required: false,
          helpText: 'Check this box if it applies. If you (and your spouse) have a total of only two jobs, you may check this box. Do the same on Form W-4 for the other job.'
        },
        {
          name: 'useEstimator',
          label: 'Use the online estimator at www.irs.gov/W4App',
          type: 'checkbox',
          required: false,
          helpText: 'For the most accurate withholding, use the estimator online'
        }
      ]
    },
    {
      id: 'dependents',
      title: 'Step 3: Claim Dependents',
      description: 'If your total income will be $200,000 or less ($400,000 or less if married filing jointly)',
      order: 3,
      fields: [
        {
          name: 'qualifyingChildren',
          label: 'Qualifying children under age 17 multiplied by $2,000',
          type: 'number',
          required: false,
          validation: { min: 0, max: 50000 },
          helpText: 'Enter number of qualifying children × $2,000'
        },
        {
          name: 'otherDependents',
          label: 'Other dependents multiplied by $500',
          type: 'number',
          required: false,
          validation: { min: 0, max: 25000 },
          helpText: 'Enter number of other dependents × $500'
        },
        {
          name: 'totalDependentAmount',
          label: 'Total (add amounts above)',
          type: 'number',
          required: false,
          validation: { min: 0, max: 75000 }
        }
      ]
    },
    {
      id: 'adjustments',
      title: 'Step 4: Other Adjustments',
      description: 'Complete this step if you want tax withheld for other income or if you want to reduce withholding',
      order: 4,
      fields: [
        {
          name: 'otherIncome',
          label: 'Other income (not from jobs)',
          type: 'number',
          required: false,
          validation: { min: 0, max: 999999 },
          helpText: 'If you want tax withheld for other income you expect this year that won\'t have withholding, enter the amount of other income here.'
        },
        {
          name: 'deductions',
          label: 'Deductions',
          type: 'number',
          required: false,
          validation: { min: 0, max: 999999 },
          helpText: 'If you expect to claim deductions other than the standard deduction and want to reduce your withholding, use the Deductions Worksheet and enter the result here.'
        },
        {
          name: 'extraWithholding',
          label: 'Extra withholding',
          type: 'number',
          required: false,
          validation: { min: 0, max: 9999 },
          helpText: 'Enter any additional tax you want withheld each pay period.'
        }
      ]
    },
    {
      id: 'signature',
      title: 'Step 5: Sign Here',
      description: 'Under penalties of perjury, I declare that this certificate, to the best of my knowledge and belief, is true, correct, and complete.',
      order: 5,
      fields: [
        {
          name: 'signatureDate',
          label: 'Date',
          type: 'date',
          required: true
        }
      ]
    }
  ]
};

export const W4_TEMPLATE_ES: FormTemplate = {
  id: 'w4-es-v1',
  name: 'Formulario W-4 Certificado de Retenciones del Empleado',
  type: 'w4',
  version: '1.0',
  language: 'es',
  metadata: {
    title: 'Certificado de Retenciones del Empleado',
    description: 'Departamento del Tesoro Servicio de Impuestos Internos',
    instructions: 'Complete el Formulario W-4 para que su empleador pueda retener el impuesto federal sobre la renta correcto de su pago.',
    legalNotice: 'Entregue el Formulario W-4 a su empleador. Sus retenciones están sujetas a revisión por el IRS.'
  },
  sections: [
    {
      id: 'personal_info',
      title: 'Paso 1: Ingrese Información Personal',
      description: 'Ingrese su información personal',
      order: 1,
      fields: [
        {
          name: 'firstName',
          label: 'Primer nombre e inicial del segundo nombre',
          type: 'text',
          required: true,
          validation: { minLength: 1, maxLength: 50 }
        },
        {
          name: 'lastName',
          label: 'Apellido',
          type: 'text',
          required: true,
          validation: { minLength: 1, maxLength: 50 }
        },
        {
          name: 'address',
          label: 'Dirección',
          type: 'text',
          required: true,
          validation: { minLength: 5, maxLength: 100 }
        },
        {
          name: 'city',
          label: 'Ciudad o pueblo, estado y código postal',
          type: 'text',
          required: true,
          validation: { minLength: 5, maxLength: 100 }
        },
        {
          name: 'ssnNumber',
          label: 'Número de seguro social',
          type: 'text',
          required: true,
          validation: { pattern: '^\\d{9}$' },
          placeholder: '123456789'
        },
        {
          name: 'filingStatus',
          label: 'Estado Civil para Efectos Tributarios',
          type: 'radio',
          required: true,
          options: [
            { value: 'single', label: 'Soltero o Casado que presenta una declaración por separado' },
            { value: 'married_filing_jointly', label: 'Casado que presenta una declaración conjunta o Cónyuge sobreviviente que reúne los requisitos' },
            { value: 'head_of_household', label: 'Cabeza de familia (Marque solo si no está casado y paga más de la mitad de los costos de mantener un hogar para usted y una persona que reúne los requisitos)' }
          ]
        }
      ]
    },
    {
      id: 'multiple_jobs',
      title: 'Paso 2: Múltiples Trabajos o el Cónyuge Trabaja',
      description: 'Complete este paso si usted (1) tiene más de un trabajo a la vez, o (2) está casado presentando conjuntamente y su cónyuge también trabaja.',
      order: 2,
      fields: [
        {
          name: 'multipleJobsSpouseWorks',
          label: 'Tengo múltiples trabajos o mi cónyuge trabaja',
          type: 'checkbox',
          required: false,
          helpText: 'Marque esta casilla si aplica. Si usted (y su cónyuge) tienen un total de solo dos trabajos, puede marcar esta casilla. Haga lo mismo en el Formulario W-4 para el otro trabajo.'
        },
        {
          name: 'useEstimator',
          label: 'Use el estimador en línea en www.irs.gov/W4App',
          type: 'checkbox',
          required: false,
          helpText: 'Para la retención más precisa, use el estimador en línea'
        }
      ]
    },
    {
      id: 'dependents',
      title: 'Paso 3: Reclamar Dependientes',
      description: 'Si su ingreso total será de $200,000 o menos ($400,000 o menos si está casado presentando conjuntamente)',
      order: 3,
      fields: [
        {
          name: 'qualifyingChildren',
          label: 'Hijos que califican menores de 17 años multiplicado por $2,000',
          type: 'number',
          required: false,
          validation: { min: 0, max: 50000 },
          helpText: 'Ingrese número de hijos que califican × $2,000'
        },
        {
          name: 'otherDependents',
          label: 'Otros dependientes multiplicado por $500',
          type: 'number',
          required: false,
          validation: { min: 0, max: 25000 },
          helpText: 'Ingrese número de otros dependientes × $500'
        },
        {
          name: 'totalDependentAmount',
          label: 'Total (sume las cantidades anteriores)',
          type: 'number',
          required: false,
          validation: { min: 0, max: 75000 }
        }
      ]
    },
    {
      id: 'adjustments',
      title: 'Paso 4: Otros Ajustes',
      description: 'Complete este paso si quiere que se retenga impuesto para otros ingresos o si quiere reducir la retención',
      order: 4,
      fields: [
        {
          name: 'otherIncome',
          label: 'Otros ingresos (no de trabajos)',
          type: 'number',
          required: false,
          validation: { min: 0, max: 999999 },
          helpText: 'Si quiere que se retenga impuesto para otros ingresos que espera este año que no tendrán retención, ingrese la cantidad de otros ingresos aquí.'
        },
        {
          name: 'deductions',
          label: 'Deducciones',
          type: 'number',
          required: false,
          validation: { min: 0, max: 999999 },
          helpText: 'Si espera reclamar deducciones distintas a la deducción estándar y quiere reducir su retención, use la Hoja de Trabajo de Deducciones e ingrese el resultado aquí.'
        },
        {
          name: 'extraWithholding',
          label: 'Retención adicional',
          type: 'number',
          required: false,
          validation: { min: 0, max: 9999 },
          helpText: 'Ingrese cualquier impuesto adicional que quiera que se retenga cada período de pago.'
        }
      ]
    },
    {
      id: 'signature',
      title: 'Paso 5: Firme Aquí',
      description: 'Bajo pena de perjurio, declaro que este certificado, según mi mejor conocimiento y creencia, es verdadero, correcto y completo.',
      order: 5,
      fields: [
        {
          name: 'signatureDate',
          label: 'Fecha',
          type: 'date',
          required: true
        }
      ]
    }
  ]
};