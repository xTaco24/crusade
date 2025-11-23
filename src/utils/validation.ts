import * as yup from 'yup';
import { ALLOWED_DOMAINS } from './constants';

export const validateEmail = (email: string): boolean => {
  return ALLOWED_DOMAINS.some(domain => email.endsWith(domain));
};

// Valida RUT chileno con dígito verificador (módulo 11).
// Requiere formato: sin puntos y con guion, por ejemplo 12345678-9 o 15318772-K
export const validateRUT = (rut: string): boolean => {
  if (!rut) return false;
  const normalized = rut.toUpperCase();
  // Exigir formato estrictamente sin puntos y con guion
  if (!/^\d{7,8}-[0-9K]$/.test(normalized)) return false;

  const [bodyStr, dv] = normalized.split('-');
  const body = bodyStr;

  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expected = 11 - (sum % 11);
  const dvCalc = expected === 11 ? '0' : expected === 10 ? 'K' : String(expected);
  return dv === dvCalc;
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 8;
};

export const loginSchema = yup.object({
  email: yup
    .string()
    .required('Email es requerido')
    .email('Email inválido')
    .test('domain', 'Email debe ser de dominio UNAB', validateEmail),
  password: yup
    .string()
    .required('Contraseña es requerida')
    .min(8, 'Contraseña debe tener al menos 8 caracteres'),
});

export const signupSchema = yup.object({
  email: yup
    .string()
    .required('Email es requerido')
    .email('Email inválido')
    .test('domain', 'Email debe ser de dominio UNAB', validateEmail),
  password: yup
    .string()
    .required('Contraseña es requerida')
    .min(8, 'Contraseña debe tener al menos 8 caracteres'),
  fullName: yup
    .string()
    .required('Nombre completo es requerido')
    .min(2, 'Nombre debe tener al menos 2 caracteres'),
  studentId: yup
    .string()
    .required('RUT es requerido')
    .test('rut', 'RUT inválido', (v) => validateRUT(v || '')),
});

export const electionSchema = yup.object({
  title: yup
    .string()
    .required('Título es requerido')
    .min(3, 'Título debe tener al menos 3 caracteres'),
  description: yup
    .string()
    .required('Descripción es requerida')
    .min(10, 'Descripción debe tener al menos 10 caracteres'),
  startDate: yup
    .string()
    .required('Fecha de inicio es requerida')
    .test('future-date', 'La fecha de inicio debe ser futura', function(value) {
      if (!value) return false;
      return new Date(value) > new Date();
    }),
  endDate: yup
    .string()
    .required('Fecha de fin es requerida')
    .test('after-start', 'La fecha de fin debe ser posterior a la de inicio', function(value) {
      const { startDate } = this.parent;
      if (!value || !startDate) return false;
      return new Date(value) > new Date(startDate);
    }),
  eligibleVoters: yup
    .number()
    .required('Número de votantes elegibles es requerido')
    .min(1, 'Debe haber al menos 1 votante elegible'),
  candidateLists: yup
    .array()
    .of(
      yup.object({
        name: yup.string().required('Nombre de la lista es requerido'),
        description: yup.string().required('Descripción de la lista es requerida'),
        color: yup.string().required('Color es requerido'),
        candidates: yup
          .array()
          .of(
            yup.object({
              name: yup.string().required('Nombre del candidato es requerido'),
              email: yup
                .string()
                .required('Email es requerido')
                .email('Email inválido')
                .test('domain', 'Email debe ser de dominio UNAB', validateEmail),
              studentId: yup
                .string()
                .required('RUT es requerido')
                .test('rut', 'RUT inválido', (v) => validateRUT(v || '')),
              position: yup.string().required('Cargo es requerido'),
              bio: yup.string(),
              proposals: yup.string(),
            })
          )
          .min(1, 'Debe haber al menos un candidato por lista'),
      })
    )
    .min(1, 'Debe haber al menos una lista de candidatos')
    .required('Listas de candidatos son requeridas'),
});