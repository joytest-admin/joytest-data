import {
  CreatePatientRequest,
  UpdatePatientRequest,
  PatientResponse,
  PatientEntity,
} from '../types/patient.types';
import {
  createPatient,
  updatePatient,
  deletePatient,
  findPatientById,
  findPatientsByDoctor,
  findAllPatients,
  searchPatientsByDoctor,
} from '../queries/patient.queries';
import { findUserById } from '../queries/user.queries';
import { UserRole } from '../types/auth.types';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { findTestResultsByPatient } from '../queries/test-result.queries';

const toPatientResponse = (
  patient: PatientEntity,
  tests?: PatientResponse['tests'],
): PatientResponse => ({
  id: patient.id,
  doctorId: patient.doctorId,
  identifier: patient.identifier,
  note: patient.note,
  yearOfBirth: patient.yearOfBirth,
  tests,
  createdAt: patient.createdAt,
  updatedAt: patient.updatedAt,
});

const assertDoctorExists = async (doctorId: string) => {
  const doctor = await findUserById(doctorId);
  if (!doctor || doctor.role !== UserRole.USER) {
    throw new BadRequestError('Doctor not found');
  }
  return doctor;
};

const sanitizeIdentifier = (identifier?: string): string => {
  const value = identifier?.trim();
  if (!value) {
    throw new BadRequestError('Identifier is required');
  }
  return value;
};

export const createPatientAdminService = async (
  data: CreatePatientRequest,
): Promise<PatientResponse> => {
  if (!data.doctorId) {
    throw new BadRequestError('doctorId is required');
  }
  await assertDoctorExists(data.doctorId);
  const patient = await createPatient(
    data.doctorId,
    sanitizeIdentifier(data.identifier),
    data.note?.trim() || null,
    data.yearOfBirth ?? null,
  );
  return toPatientResponse(patient);
};

export const createPatientForDoctorService = async (
  doctorId: string,
  data: CreatePatientRequest,
): Promise<PatientResponse> => {
  const patient = await createPatient(
    doctorId,
    sanitizeIdentifier(data.identifier),
    data.note?.trim() || null,
    data.yearOfBirth ?? null,
  );
  return toPatientResponse(patient);
};

export const getAllPatientsService = async (): Promise<PatientResponse[]> => {
  const patients = await findAllPatients();
  return patients.map((patient) => toPatientResponse(patient));
};

export const getPatientByIdAdminService = async (id: string): Promise<PatientResponse> => {
  const patient = await findPatientById(id);
  if (!patient) {
    throw new NotFoundError('Patient not found');
  }
  const tests = await findTestResultsByPatient(patient.id);
  return toPatientResponse(patient, tests);
};

export const updatePatientAdminService = async (
  id: string,
  data: UpdatePatientRequest,
): Promise<PatientResponse> => {
  const patient = await findPatientById(id);
  if (!patient) {
    throw new NotFoundError('Patient not found');
  }
  const updated = await updatePatient(id, {
    identifier: data.identifier ? sanitizeIdentifier(data.identifier) : undefined,
    note: data.note !== undefined ? (data.note ? data.note.trim() || null : null) : undefined,
    yearOfBirth: data.yearOfBirth !== undefined ? data.yearOfBirth : undefined,
  });
  return toPatientResponse(updated);
};

export const deletePatientAdminService = async (id: string): Promise<boolean> => {
  const patient = await findPatientById(id);
  if (!patient) {
    throw new NotFoundError('Patient not found');
  }
  return deletePatient(id);
};

export const getDoctorPatientsService = async (
  doctorId: string,
): Promise<PatientResponse[]> => {
  const patients = await findPatientsByDoctor(doctorId);
  return patients.map((patient) => toPatientResponse(patient));
};

const ensurePatientBelongsToDoctor = async (
  patientId: string,
  doctorId: string,
): Promise<PatientEntity> => {
  const patient = await findPatientById(patientId);
  if (!patient) {
    throw new NotFoundError('Patient not found');
  }
  if (patient.doctorId !== doctorId) {
    throw new ForbiddenError('You do not have access to this patient');
  }
  return patient;
};

export const getDoctorPatientByIdService = async (
  doctorId: string,
  patientId: string,
): Promise<PatientResponse> => {
  const patient = await ensurePatientBelongsToDoctor(patientId, doctorId);
  const tests = await findTestResultsByPatient(patient.id);
  return toPatientResponse(patient, tests);
};

export const updateDoctorPatientService = async (
  doctorId: string,
  patientId: string,
  data: UpdatePatientRequest,
): Promise<PatientResponse> => {
  await ensurePatientBelongsToDoctor(patientId, doctorId);
  const updated = await updatePatient(patientId, {
    identifier: data.identifier ? sanitizeIdentifier(data.identifier) : undefined,
    note: data.note !== undefined ? (data.note ? data.note.trim() || null : null) : undefined,
    yearOfBirth: data.yearOfBirth !== undefined ? data.yearOfBirth : undefined,
  });
  return toPatientResponse(updated);
};

export const deleteDoctorPatientService = async (
  doctorId: string,
  patientId: string,
): Promise<boolean> => {
  await ensurePatientBelongsToDoctor(patientId, doctorId);
  return deletePatient(patientId);
};

/**
 * Search patients by identifier or note (doctor only)
 * @param doctorId - Doctor ID to filter by
 * @param searchTerm - Search term to match against identifier or note
 * @param limit - Optional limit for results
 * @returns Array of matching patient responses
 */
export const searchDoctorPatientsService = async (
  doctorId: string,
  searchTerm: string,
  limit?: number,
): Promise<PatientResponse[]> => {
  if (!searchTerm || searchTerm.trim().length === 0) {
    throw new BadRequestError('Search term is required');
  }
  const patients = await searchPatientsByDoctor(doctorId, searchTerm.trim(), limit);
  return patients.map((patient) => toPatientResponse(patient));
};

