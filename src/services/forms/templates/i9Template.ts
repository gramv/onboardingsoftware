import { FormTemplate, FormSection, FormField } from '@/types/forms';

export const I9_TEMPLATE_EN: FormTemplate = {
  id: 'i9-en-v1',
  name: 'Form I-9 Employment Eligibility Verification',
  type: 'i9',
  version: '1.0',
  language: 'en',
  metadata: {
    title: 'Employment Eligibility Verification',
    description: 'Department of Homeland Security U.S. Citizenship and Immigration Services',
    instructions: 'Read instructions carefully before completing this form. The instructions must be available, either in paper or electronically, during completion of this form.',
    legalNotice: 'Employers must complete Form I-9 to verify the identity and employment authorization of their employees. Both employees and employers (or authorized representatives of the employer) must complete the form.'
  },
  sections: [
    {
      id: 'section1',
      title: 'Section 1. Employee Information and Attestation',
      description: 'Employees must complete and sign Section 1 of Form I-9 no later than the first day of employment, but not before accepting a job offer.',
      order: 1,
      fields: [
        {
          name: 'lastName',
          label: 'Last Name (Family Name)',
          type: 'text',
          required: true,
          validation: { minLength: 1, maxLength: 50 }
        },
        {
          name: 'firstName',
          label: 'First Name (Given Name)',
          type: 'text',
          required: true,
          validation: { minLength: 1, maxLength: 50 }
        },
        {
          name: 'middleInitial',
          label: 'Middle Initial',
          type: 'text',
          required: false,
          validation: { maxLength: 1 }
        },
        {
          name: 'otherLastNames',
          label: 'Other Last Names Used (if any)',
          type: 'text',
          required: false,
          validation: { maxLength: 100 }
        },
        {
          name: 'address',
          label: 'Address (Street Number and Name)',
          type: 'text',
          required: true,
          validation: { minLength: 5, maxLength: 100 }
        },
        {
          name: 'city',
          label: 'City or Town',
          type: 'text',
          required: true,
          validation: { minLength: 1, maxLength: 50 }
        },
        {
          name: 'state',
          label: 'State',
          type: 'select',
          required: true,
          options: [
            'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
            'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
            'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
            'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
            'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
          ]
        },
        {
          name: 'zipCode',
          label: 'ZIP Code',
          type: 'text',
          required: true,
          validation: { pattern: '^\\d{5}(-\\d{4})?$' }
        },
        {
          name: 'dateOfBirth',
          label: 'Date of Birth (mm/dd/yyyy)',
          type: 'date',
          required: true
        },
        {
          name: 'ssnNumber',
          label: 'U.S. Social Security Number',
          type: 'text',
          required: true,
          validation: { pattern: '^\\d{9}$' },
          placeholder: '123456789'
        },
        {
          name: 'email',
          label: 'Employee\'s Email Address',
          type: 'text',
          required: false,
          validation: { pattern: '^[^@]+@[^@]+\\.[^@]+$' }
        },
        {
          name: 'phone',
          label: 'Employee\'s Telephone Number',
          type: 'text',
          required: false,
          validation: { pattern: '^\\d{10}$' }
        }
      ]
    },
    {
      id: 'citizenship',
      title: 'Citizenship and Immigration Status',
      description: 'Check one of the following attestations',
      order: 2,
      fields: [
        {
          name: 'citizenshipStatus',
          label: 'I am aware that federal law provides for imprisonment and/or fines for false statements or use of false documents in connection with the completion of this form.',
          type: 'radio',
          required: true,
          options: [
            { value: 'us_citizen', label: '1. A citizen of the United States' },
            { value: 'non_citizen_national', label: '2. A noncitizen national of the United States' },
            { value: 'lawful_permanent_resident', label: '3. A lawful permanent resident (Alien Registration Number): A-' },
            { value: 'alien_authorized', label: '4. An alien authorized to work until (expiration date, if applicable, mm/dd/yyyy):' }
          ]
        },
        {
          name: 'alienNumber',
          label: 'Alien Registration Number (A-Number)',
          type: 'text',
          required: false,
          validation: { pattern: '^A?\\d{8,9}$' },
          helpText: 'Required if you selected option 3'
        },
        {
          name: 'uscisNumber',
          label: 'USCIS Number',
          type: 'text',
          required: false,
          validation: { pattern: '^\\d{10}$' }
        },
        {
          name: 'i94Number',
          label: 'Form I-94 Admission Number',
          type: 'text',
          required: false,
          validation: { maxLength: 20 }
        },
        {
          name: 'foreignPassportNumber',
          label: 'Foreign Passport Number',
          type: 'text',
          required: false,
          validation: { maxLength: 20 }
        },
        {
          name: 'countryOfIssuance',
          label: 'Country of Issuance',
          type: 'text',
          required: false,
          validation: { maxLength: 50 }
        },
        {
          name: 'workAuthorizationExpiration',
          label: 'Work Authorization Expiration Date (mm/dd/yyyy)',
          type: 'date',
          required: false,
          helpText: 'Required if you selected option 4'
        }
      ]
    },
    {
      id: 'preparer',
      title: 'Preparer and/or Translator Certification',
      description: 'Complete this section if you used a preparer and/or translator to assist you in completing Form I-9',
      order: 3,
      fields: [
        {
          name: 'preparerUsed',
          label: 'I used a preparer and/or translator to complete this form',
          type: 'checkbox',
          required: false
        },
        {
          name: 'preparerLastName',
          label: 'Preparer\'s Last Name',
          type: 'text',
          required: false,
          validation: { maxLength: 50 }
        },
        {
          name: 'preparerFirstName',
          label: 'Preparer\'s First Name',
          type: 'text',
          required: false,
          validation: { maxLength: 50 }
        },
        {
          name: 'preparerAddress',
          label: 'Preparer\'s Address',
          type: 'textarea',
          required: false,
          validation: { maxLength: 200 }
        }
      ]
    }
  ]
};

export const I9_TEMPLATE_ES: FormTemplate = {
  id: 'i9-es-v1',
  name: 'Formulario I-9 Verificación de Elegibilidad de Empleo',
  type: 'i9',
  version: '1.0',
  language: 'es',
  metadata: {
    title: 'Verificación de Elegibilidad de Empleo',
    description: 'Departamento de Seguridad Nacional Servicios de Ciudadanía e Inmigración de EE.UU.',
    instructions: 'Lea las instrucciones cuidadosamente antes de completar este formulario. Las instrucciones deben estar disponibles, ya sea en papel o electrónicamente, durante la finalización de este formulario.',
    legalNotice: 'Los empleadores deben completar el Formulario I-9 para verificar la identidad y autorización de empleo de sus empleados. Tanto los empleados como los empleadores (o representantes autorizados del empleador) deben completar el formulario.'
  },
  sections: [
    {
      id: 'section1',
      title: 'Sección 1. Información y Certificación del Empleado',
      description: 'Los empleados deben completar y firmar la Sección 1 del Formulario I-9 no más tarde del primer día de empleo, pero no antes de aceptar una oferta de trabajo.',
      order: 1,
      fields: [
        {
          name: 'lastName',
          label: 'Apellido (Nombre de Familia)',
          type: 'text',
          required: true,
          validation: { minLength: 1, maxLength: 50 }
        },
        {
          name: 'firstName',
          label: 'Primer Nombre (Nombre de Pila)',
          type: 'text',
          required: true,
          validation: { minLength: 1, maxLength: 50 }
        },
        {
          name: 'middleInitial',
          label: 'Inicial del Segundo Nombre',
          type: 'text',
          required: false,
          validation: { maxLength: 1 }
        },
        {
          name: 'otherLastNames',
          label: 'Otros Apellidos Usados (si los hay)',
          type: 'text',
          required: false,
          validation: { maxLength: 100 }
        },
        {
          name: 'address',
          label: 'Dirección (Número y Nombre de la Calle)',
          type: 'text',
          required: true,
          validation: { minLength: 5, maxLength: 100 }
        },
        {
          name: 'city',
          label: 'Ciudad o Pueblo',
          type: 'text',
          required: true,
          validation: { minLength: 1, maxLength: 50 }
        },
        {
          name: 'state',
          label: 'Estado',
          type: 'select',
          required: true,
          options: [
            'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
            'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
            'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
            'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
            'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
          ]
        },
        {
          name: 'zipCode',
          label: 'Código Postal',
          type: 'text',
          required: true,
          validation: { pattern: '^\\d{5}(-\\d{4})?$' }
        },
        {
          name: 'dateOfBirth',
          label: 'Fecha de Nacimiento (mm/dd/aaaa)',
          type: 'date',
          required: true
        },
        {
          name: 'ssnNumber',
          label: 'Número de Seguro Social de EE.UU.',
          type: 'text',
          required: true,
          validation: { pattern: '^\\d{9}$' },
          placeholder: '123456789'
        },
        {
          name: 'email',
          label: 'Dirección de Correo Electrónico del Empleado',
          type: 'text',
          required: false,
          validation: { pattern: '^[^@]+@[^@]+\\.[^@]+$' }
        },
        {
          name: 'phone',
          label: 'Número de Teléfono del Empleado',
          type: 'text',
          required: false,
          validation: { pattern: '^\\d{10}$' }
        }
      ]
    },
    {
      id: 'citizenship',
      title: 'Estado de Ciudadanía e Inmigración',
      description: 'Marque una de las siguientes certificaciones',
      order: 2,
      fields: [
        {
          name: 'citizenshipStatus',
          label: 'Estoy consciente de que la ley federal provee prisión y/o multas por declaraciones falsas o uso de documentos falsos en conexión con la finalización de este formulario.',
          type: 'radio',
          required: true,
          options: [
            { value: 'us_citizen', label: '1. Un ciudadano de los Estados Unidos' },
            { value: 'non_citizen_national', label: '2. Un nacional no ciudadano de los Estados Unidos' },
            { value: 'lawful_permanent_resident', label: '3. Un residente permanente legal (Número de Registro de Extranjero): A-' },
            { value: 'alien_authorized', label: '4. Un extranjero autorizado para trabajar hasta (fecha de vencimiento, si aplica, mm/dd/aaaa):' }
          ]
        },
        {
          name: 'alienNumber',
          label: 'Número de Registro de Extranjero (Número A)',
          type: 'text',
          required: false,
          validation: { pattern: '^A?\\d{8,9}$' },
          helpText: 'Requerido si seleccionó la opción 3'
        },
        {
          name: 'uscisNumber',
          label: 'Número USCIS',
          type: 'text',
          required: false,
          validation: { pattern: '^\\d{10}$' }
        },
        {
          name: 'i94Number',
          label: 'Número de Admisión del Formulario I-94',
          type: 'text',
          required: false,
          validation: { maxLength: 20 }
        },
        {
          name: 'foreignPassportNumber',
          label: 'Número de Pasaporte Extranjero',
          type: 'text',
          required: false,
          validation: { maxLength: 20 }
        },
        {
          name: 'countryOfIssuance',
          label: 'País de Emisión',
          type: 'text',
          required: false,
          validation: { maxLength: 50 }
        },
        {
          name: 'workAuthorizationExpiration',
          label: 'Fecha de Vencimiento de Autorización de Trabajo (mm/dd/aaaa)',
          type: 'date',
          required: false,
          helpText: 'Requerido si seleccionó la opción 4'
        }
      ]
    },
    {
      id: 'preparer',
      title: 'Certificación del Preparador y/o Traductor',
      description: 'Complete esta sección si usó un preparador y/o traductor para ayudarle a completar el Formulario I-9',
      order: 3,
      fields: [
        {
          name: 'preparerUsed',
          label: 'Usé un preparador y/o traductor para completar este formulario',
          type: 'checkbox',
          required: false
        },
        {
          name: 'preparerLastName',
          label: 'Apellido del Preparador',
          type: 'text',
          required: false,
          validation: { maxLength: 50 }
        },
        {
          name: 'preparerFirstName',
          label: 'Primer Nombre del Preparador',
          type: 'text',
          required: false,
          validation: { maxLength: 50 }
        },
        {
          name: 'preparerAddress',
          label: 'Dirección del Preparador',
          type: 'textarea',
          required: false,
          validation: { maxLength: 200 }
        }
      ]
    }
  ]
};