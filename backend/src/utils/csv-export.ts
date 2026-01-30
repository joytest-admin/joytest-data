/**
 * CSV export utility
 * Converts test results to CSV format
 */

import { TestResultResponse } from '../types/test.types';

/**
 * Escape a CSV field value
 * Handles quotes, commas, and newlines
 */
function escapeCsvField(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);
  
  // If the value contains comma, quote, or newline, wrap it in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Convert test results to CSV format
 * @param results - Array of test results
 * @returns CSV string
 */
export function generateTestResultsCsv(results: TestResultResponse[]): string {
  // CSV Header
  const headers = [
    'ID',
    'Datum vytvoření',
    'Město',
    'IČP',
    'Typ testu',
    'Ročník narození',
    'Příznaky',
    'Patogen',
    'Identifikátor pacienta',
    'Další informace',
    'SARI',
    'ATB',
    'Antivirotika',
    'Obezita',
    'Respirační podpora',
    'ECMO',
    'Těhotenství',
    'Trimestr',
    'Očkování',
    'Datum aktualizace',
  ];

  // Build CSV rows
  const rows = results.map((result) => {
    const yearOfBirth = result.dateOfBirth ? String(new Date(result.dateOfBirth).getFullYear()) : '';
    const symptoms = result.symptoms ? result.symptoms.join('; ') : '';
    
    return [
      escapeCsvField(result.id),
      escapeCsvField(result.createdAt ? new Date(result.createdAt).toLocaleString('cs-CZ') : ''),
      escapeCsvField(result.cityName || ''),
      escapeCsvField(result.icpNumber),
      escapeCsvField(result.testTypeName || ''),
      escapeCsvField(yearOfBirth),
      escapeCsvField(symptoms),
      escapeCsvField((result.pathogenNames || []).join('; ') || ''),
      escapeCsvField(result.patientIdentifier || ''),
      escapeCsvField(result.otherInformations || ''),
      escapeCsvField(result.sari ? 'Ano' : 'Ne'),
      escapeCsvField(result.atb ? 'Ano' : 'Ne'),
      escapeCsvField(result.antivirals ? 'Ano' : 'Ne'),
      escapeCsvField(result.obesity ? 'Ano' : 'Ne'),
      escapeCsvField(result.respiratorySupport ? 'Ano' : 'Ne'),
      escapeCsvField(result.ecmo ? 'Ano' : 'Ne'),
      escapeCsvField(result.pregnancy ? 'Ano' : 'Ne'),
      escapeCsvField(
        result.trimester 
          ? `${result.trimester}. Trimestr` 
          : ''
      ),
      escapeCsvField(
        result.vaccinations && result.vaccinations.length > 0
          ? result.vaccinations.map((v) => v.vaccinationName || v.vaccinationId).join('; ')
          : ''
      ),
      escapeCsvField(result.updatedAt ? new Date(result.updatedAt).toLocaleString('cs-CZ') : ''),
    ];
  });

  // Combine header and rows
  const csvLines = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ];

  return csvLines.join('\n');
}

/**
 * Generate filename for CSV export
 * @param type - Export type ('interval' or 'patient')
 * @param params - Additional parameters for filename
 * @returns Filename string
 */
export function generateCsvFilename(
  type: 'interval' | 'patient',
  params?: { startDate?: string; endDate?: string; patientIdentifier?: string },
): string {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  if (type === 'interval' && params?.startDate && params?.endDate) {
    const start = params.startDate.split('T')[0];
    const end = params.endDate.split('T')[0];
    return `test-results-${start}-to-${end}-${timestamp}.csv`;
  }
  
  if (type === 'patient' && params?.patientIdentifier) {
    const safeIdentifier = params.patientIdentifier.replace(/[^a-zA-Z0-9-_]/g, '_');
    return `test-results-patient-${safeIdentifier}-${timestamp}.csv`;
  }
  
  return `test-results-${timestamp}.csv`;
}

