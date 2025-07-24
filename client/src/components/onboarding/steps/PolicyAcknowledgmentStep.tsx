import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { useToast } from '../../../hooks/useToast';

interface PolicyAcknowledgmentStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
  initialData?: any;
  language: 'en' | 'es';
}

interface PolicySection {
  id: string;
  title: string;
  titleEs: string;
  content: string;
  contentEs: string;
  requiresAcknowledgment: boolean;
  minimumReadTime: number; // seconds
}

export const PolicyAcknowledgmentStep: React.FC<PolicyAcknowledgmentStepProps> = ({
  onNext,
  onBack,
  initialData,
  language = 'en'
}) => {
  const { showToast } = useToast();
  
  const [acknowledgments, setAcknowledgments] = useState<Record<string, boolean>>(
    initialData?.acknowledgments || {}
  );
  const [readTimes, setReadTimes] = useState<Record<string, number>>({});
  const [currentPolicy, setCurrentPolicy] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  const policies: PolicySection[] = [
    {
      id: 'at-will-employment',
      title: 'At-Will Employment',
      titleEs: 'Empleo a Voluntad',
      content: `This employment is at-will, meaning either party may terminate the employment relationship at any time, with or without cause, and with or without notice. This policy supersedes all previous agreements and cannot be modified except in writing by an authorized company representative.

Key Points:
• Employment may be terminated by either party at any time
• No guarantee of continued employment
• Company policies may change at management discretion
• This agreement supersedes all verbal promises or agreements`,
      contentEs: `Este empleo es a voluntad, lo que significa que cualquiera de las partes puede terminar la relación laboral en cualquier momento, con o sin causa, y con o sin aviso. Esta política reemplaza todos los acuerdos anteriores y no puede modificarse excepto por escrito por un representante autorizado de la empresa.

Puntos Clave:
• El empleo puede ser terminado por cualquiera de las partes en cualquier momento
• No hay garantía de empleo continuo
• Las políticas de la empresa pueden cambiar a discreción de la gerencia
• Este acuerdo reemplaza todas las promesas o acuerdos verbales`,
      requiresAcknowledgment: true,
      minimumReadTime: 30
    },
    {
      id: 'equal-employment',
      title: 'Equal Employment Opportunity',
      titleEs: 'Igualdad de Oportunidades de Empleo',
      content: `Our company is committed to providing equal employment opportunities to all employees and applicants without regard to race, color, religion, sex, national origin, age, disability, or any other characteristic protected by law.

We prohibit:
• Discrimination in hiring, promotion, or termination
• Harassment based on protected characteristics
• Retaliation against those who report discrimination
• Creating a hostile work environment

All employees are expected to treat others with respect and dignity.`,
      contentEs: `Nuestra empresa se compromete a brindar igualdad de oportunidades de empleo a todos los empleados y solicitantes sin distinción de raza, color, religión, sexo, origen nacional, edad, discapacidad o cualquier otra característica protegida por la ley.

Prohibimos:
• Discriminación en contratación, promoción o terminación
• Acoso basado en características protegidas
• Represalias contra quienes reportan discriminación
• Crear un ambiente de trabajo hostil

Se espera que todos los empleados traten a otros con respeto y dignidad.`,
      requiresAcknowledgment: true,
      minimumReadTime: 25
    },
    {
      id: 'sexual-harassment',
      title: 'Sexual Harassment Prevention',
      titleEs: 'Prevención del Acoso Sexual',
      content: `Sexual harassment is strictly prohibited and will not be tolerated. This includes unwelcome sexual advances, requests for sexual favors, and other verbal or physical conduct of a sexual nature.

Examples include but are not limited to:
• Unwelcome sexual advances or propositions
• Sexual jokes, comments, or innuendos
• Display of sexually explicit materials
• Unwelcome touching or physical contact
• Creating a sexually hostile work environment

Report any incidents immediately to management or HR. All reports will be investigated promptly and confidentially.`,
      contentEs: `El acoso sexual está estrictamente prohibido y no será tolerado. Esto incluye avances sexuales no deseados, solicitudes de favores sexuales y otra conducta verbal o física de naturaleza sexual.

Los ejemplos incluyen pero no se limitan a:
• Avances sexuales no deseados o proposiciones
• Chistes, comentarios o insinuaciones sexuales
• Exhibición de materiales sexualmente explícitos
• Toques o contacto físico no deseado
• Crear un ambiente de trabajo sexualmente hostil

Reporte cualquier incidente inmediatamente a la gerencia o RR.HH. Todos los reportes serán investigados de manera rápida y confidencial.`,
      requiresAcknowledgment: true,
      minimumReadTime: 35
    },
    {
      id: 'workplace-violence',
      title: 'Workplace Violence Prevention',
      titleEs: 'Prevención de Violencia en el Lugar de Trabajo',
      content: `We are committed to maintaining a safe, violence-free workplace. Threats, intimidation, and acts of violence are strictly prohibited.

Prohibited behaviors include:
• Physical violence or threats of violence
• Intimidation or threatening behavior
• Possession of weapons on company property
• Verbal abuse or threatening language
• Destruction of company property

Any employee who feels threatened should immediately contact security or management. All threats will be taken seriously and investigated.`,
      contentEs: `Estamos comprometidos a mantener un lugar de trabajo seguro y libre de violencia. Las amenazas, intimidación y actos de violencia están estrictamente prohibidos.

Los comportamientos prohibidos incluyen:
• Violencia física o amenazas de violencia
• Intimidación o comportamiento amenazante
• Posesión de armas en la propiedad de la empresa
• Abuso verbal o lenguaje amenazante
• Destrucción de propiedad de la empresa

Cualquier empleado que se sienta amenazado debe contactar inmediatamente a seguridad o gerencia. Todas las amenazas serán tomadas en serio e investigadas.`,
      requiresAcknowledgment: true,
      minimumReadTime: 30
    },
    {
      id: 'pay-policies',
      title: 'Pay Policies and Procedures',
      titleEs: 'Políticas y Procedimientos de Pago',
      content: `Understanding your pay structure and policies is important for your employment.

Key Pay Information:
• Pay periods are bi-weekly (every two weeks)
• Direct deposit is strongly encouraged
• Overtime is paid at 1.5x regular rate for hours over 40 per week
• Time must be accurately recorded using company systems
• Pay stubs are available through the employee portal

Time and Attendance:
• Arrive on time for all scheduled shifts
• Clock in/out using the designated system
• Meal breaks are unpaid and must be taken as scheduled
• Notify supervisor immediately of any scheduling conflicts`,
      contentEs: `Entender su estructura de pago y políticas es importante para su empleo.

Información Clave de Pago:
• Los períodos de pago son quincenales (cada dos semanas)
• Se recomienda encarecidamente el depósito directo
• Las horas extras se pagan a 1.5x la tarifa regular por horas superiores a 40 por semana
• El tiempo debe registrarse con precisión usando los sistemas de la empresa
• Los talones de pago están disponibles a través del portal del empleado

Tiempo y Asistencia:
• Llegue a tiempo para todos los turnos programados
• Marque entrada/salida usando el sistema designado
• Los descansos para comidas no son pagados y deben tomarse según lo programado
• Notifique al supervisor inmediatamente de cualquier conflicto de horario`,
      requiresAcknowledgment: true,
      minimumReadTime: 25
    },
    {
      id: 'confidentiality',
      title: 'Confidentiality and Data Protection',
      titleEs: 'Confidencialidad y Protección de Datos',
      content: `Protecting guest and company information is critical to our business.

Confidential Information includes:
• Guest personal information and preferences
• Company financial data and business strategies
• Employee personal information
• Proprietary systems and procedures
• Security codes and access information

Your Responsibilities:
• Never share confidential information with unauthorized persons
• Secure all documents and electronic files
• Report any suspected data breaches immediately
• Follow all password and security protocols
• Maintain confidentiality even after employment ends

Violations may result in immediate termination and legal action.`,
      contentEs: `Proteger la información de huéspedes y de la empresa es crítico para nuestro negocio.

La Información Confidencial incluye:
• Información personal y preferencias de huéspedes
• Datos financieros y estrategias comerciales de la empresa
• Información personal de empleados
• Sistemas y procedimientos propietarios
• Códigos de seguridad e información de acceso

Sus Responsabilidades:
• Nunca comparta información confidencial con personas no autorizadas
• Asegure todos los documentos y archivos electrónicos
• Reporte inmediatamente cualquier sospecha de violación de datos
• Siga todos los protocolos de contraseñas y seguridad
• Mantenga la confidencialidad incluso después de que termine el empleo

Las violaciones pueden resultar en terminación inmediata y acción legal.`,
      requiresAcknowledgment: true,
      minimumReadTime: 30
    }
  ];

  const t = {
    en: {
      title: 'Company Policy Acknowledgment',
      subtitle: 'Please review and acknowledge all company policies',
      readPolicy: 'Read Policy',
      acknowledge: 'I acknowledge that I have read and understand this policy',
      acknowledged: 'Acknowledged',
      notAcknowledged: 'Not Acknowledged',
      readTime: 'Reading time',
      seconds: 'seconds',
      minimumTime: 'Minimum reading time',
      continue: 'Continue to Review',
      back: 'Back',
      allPoliciesRequired: 'Please acknowledge all required policies before continuing',
      success: 'All policies acknowledged successfully',
      readingPolicy: 'Reading Policy...',
      closePolicy: 'Close Policy'
    },
    es: {
      title: 'Reconocimiento de Políticas de la Empresa',
      subtitle: 'Por favor revise y reconozca todas las políticas de la empresa',
      readPolicy: 'Leer Política',
      acknowledge: 'Reconozco que he leído y entiendo esta política',
      acknowledged: 'Reconocido',
      notAcknowledged: 'No Reconocido',
      readTime: 'Tiempo de lectura',
      seconds: 'segundos',
      minimumTime: 'Tiempo mínimo de lectura',
      continue: 'Continuar a Revisión',
      back: 'Atrás',
      allPoliciesRequired: 'Por favor reconozca todas las políticas requeridas antes de continuar',
      success: 'Todas las políticas reconocidas exitosamente',
      readingPolicy: 'Leyendo Política...',
      closePolicy: 'Cerrar Política'
    }
  };

  const currentT = t[language];

  const handlePolicyOpen = (policyId: string) => {
    setCurrentPolicy(policyId);
    setStartTime(Date.now());
  };

  const handlePolicyClose = () => {
    if (currentPolicy && startTime) {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      setReadTimes(prev => ({
        ...prev,
        [currentPolicy]: (prev[currentPolicy] || 0) + timeSpent
      }));
    }
    setCurrentPolicy(null);
    setStartTime(null);
  };

  const handleAcknowledgment = (policyId: string, acknowledged: boolean) => {
    setAcknowledgments(prev => ({
      ...prev,
      [policyId]: acknowledged
    }));
  };

  const canContinue = () => {
    return policies
      .filter(p => p.requiresAcknowledgment)
      .every(p => {
        const hasAcknowledged = acknowledgments[p.id];
        const hasReadEnough = (readTimes[p.id] || 0) >= p.minimumReadTime;
        return hasAcknowledged && hasReadEnough;
      });
  };

  const handleSubmit = () => {
    if (!canContinue()) {
      showToast(currentT.allPoliciesRequired, 'error');
      return;
    }

    showToast(currentT.success, 'success');
    onNext({
      acknowledgments,
      readTimes,
      acknowledgedAt: new Date().toISOString()
    });
  };

  const currentPolicyData = currentPolicy ? policies.find(p => p.id === currentPolicy) : null;

  if (currentPolicy && currentPolicyData) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {language === 'es' ? currentPolicyData.titleEs : currentPolicyData.title}
          </h2>
          <p className="text-sm text-gray-600">
            {currentT.minimumTime}: {currentPolicyData.minimumReadTime} {currentT.seconds}
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="prose max-w-none">
            <div className="whitespace-pre-line text-gray-800 leading-relaxed">
              {language === 'es' ? currentPolicyData.contentEs : currentPolicyData.content}
            </div>
          </div>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handlePolicyClose}>
            <Icon name="ChevronLeft" size={16} className="mr-2" />
            {currentT.closePolicy}
          </Button>
          
          <div className="text-sm text-gray-600">
            {currentT.readTime}: {Math.floor(((Date.now() - (startTime || Date.now())) / 1000))} {currentT.seconds}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentT.title}</h1>
        <p className="text-lg text-gray-600">{currentT.subtitle}</p>
      </div>

      <div className="space-y-6">
        {policies.map((policy) => {
          const isAcknowledged = acknowledgments[policy.id];
          const readTime = readTimes[policy.id] || 0;
          const hasReadEnough = readTime >= policy.minimumReadTime;
          
          return (
            <Card key={policy.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {language === 'es' ? policy.titleEs : policy.title}
                  </h3>
                  
                  <div className="flex items-center space-x-4 mb-4">
                    <Button
                      variant="outline"
                      onClick={() => handlePolicyOpen(policy.id)}
                      className="flex items-center"
                    >
                      <Icon name="FileText" size={16} className="mr-2" />
                      {currentT.readPolicy}
                    </Button>
                    
                    <div className="text-sm text-gray-600">
                      {currentT.readTime}: {readTime} / {policy.minimumReadTime} {currentT.seconds}
                    </div>
                    
                    {hasReadEnough && (
                      <Icon name="CheckCircle" size={16} className="text-green-600" />
                    )}
                  </div>

                  {policy.requiresAcknowledgment && (
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={`ack-${policy.id}`}
                        checked={isAcknowledged || false}
                        onChange={(e) => handleAcknowledgment(policy.id, e.target.checked)}
                        disabled={!hasReadEnough}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label 
                        htmlFor={`ack-${policy.id}`}
                        className={`text-sm ${!hasReadEnough ? 'text-gray-400' : 'text-gray-700'}`}
                      >
                        {currentT.acknowledge}
                      </label>
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  {isAcknowledged ? (
                    <div className="flex items-center text-green-600">
                      <Icon name="CheckCircle" size={20} className="mr-2" />
                      <span className="text-sm font-medium">{currentT.acknowledged}</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-400">
                      <Icon name="Clock" size={20} className="mr-2" />
                      <span className="text-sm">{currentT.notAcknowledged}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onBack}>
          <Icon name="ChevronLeft" size={16} className="mr-2" />
          {currentT.back}
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={!canContinue()}
          className={!canContinue() ? 'opacity-50 cursor-not-allowed' : ''}
        >
          {currentT.continue}
          <Icon name="ChevronRight" size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  );
};
