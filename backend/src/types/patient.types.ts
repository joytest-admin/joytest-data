import { TestResultResponse } from './test.types';

export interface PatientEntity {
  id: string;
  doctorId: string;
  identifier: string;
  note: string | null;
  yearOfBirth: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePatientRequest {
  doctorId?: string; // required for admin endpoints
  identifier: string;
  note?: string;
  yearOfBirth?: number | null;
}

export interface UpdatePatientRequest {
  identifier?: string;
  note?: string | null;
  yearOfBirth?: number | null;
}

export interface PatientResponse {
  id: string;
  doctorId: string;
  identifier: string;
  note: string | null;
  yearOfBirth: number | null;
  tests?: TestResultResponse[];
  createdAt: Date;
  updatedAt: Date;
}

