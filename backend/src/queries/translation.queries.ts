/**
 * Translation database queries
 * Handles all database operations for translations
 */

import { getDatabasePool } from '../utils/database';
import { TranslationEntity, TranslationEntityType } from '../types/translation.types';
import { NotFoundError, InternalServerError } from '../utils/errors';
import { mapTranslationRow } from '../utils/db-mapper';

/**
 * Find translation by ID
 * @param id - Translation ID
 * @returns Translation entity or null if not found
 */
export const findTranslationById = async (id: string): Promise<TranslationEntity | null> => {
  const pool = getDatabasePool();
  const result = await pool.query('SELECT * FROM translations WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return mapTranslationRow(result.rows[0]);
};

/**
 * Find translations by entity type and ID
 * @param entityType - Type of entity
 * @param entityId - Entity ID
 * @returns Array of translation entities
 */
export const findTranslationsByEntity = async (
  entityType: TranslationEntityType,
  entityId: string,
): Promise<TranslationEntity[]> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    'SELECT * FROM translations WHERE entity_type = $1 AND entity_id = $2 ORDER BY language_code',
    [entityType, entityId],
  );

  return result.rows.map(mapTranslationRow);
};

/**
 * Find translation by entity type, ID, and language code
 * @param entityType - Type of entity
 * @param entityId - Entity ID
 * @param languageCode - Language code
 * @returns Translation entity or null if not found
 */
export const findTranslationByEntityAndLanguage = async (
  entityType: TranslationEntityType,
  entityId: string,
  languageCode: string,
): Promise<TranslationEntity | null> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    'SELECT * FROM translations WHERE entity_type = $1 AND entity_id = $2 AND language_code = $3',
    [entityType, entityId, languageCode],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapTranslationRow(result.rows[0]);
};

/**
 * Find all translations with entity names (for admin UI)
 * @param entityType - Optional filter by entity type
 * @param languageCode - Optional filter by language code
 * @returns Array of translations with entity names
 */
export const findAllTranslationsWithEntityNames = async (
  entityType?: TranslationEntityType,
  languageCode?: string,
): Promise<Array<TranslationEntity & { entityName: string }>> => {
  const pool = getDatabasePool();

  let query = `
    SELECT 
      t.*,
      CASE 
        WHEN t.entity_type = 'test_type' THEN tt.name
        WHEN t.entity_type = 'vaccination' THEN v.name
        WHEN t.entity_type = 'common_symptom' THEN cs.name
        WHEN t.entity_type = 'pathogen' THEN p.name
      END as entity_name
    FROM translations t
    LEFT JOIN test_types tt ON t.entity_type = 'test_type' AND t.entity_id = tt.id
    LEFT JOIN vaccinations v ON t.entity_type = 'vaccination' AND t.entity_id = v.id
    LEFT JOIN common_symptoms cs ON t.entity_type = 'common_symptom' AND t.entity_id = cs.id
    LEFT JOIN pathogens p ON t.entity_type = 'pathogen' AND t.entity_id = p.id
  `;

  const params: any[] = [];
  const conditions: string[] = [];
  let paramIndex = 1;

  if (entityType) {
    conditions.push(`t.entity_type = $${paramIndex}`);
    params.push(entityType);
    paramIndex++;
  }

  if (languageCode) {
    conditions.push(`t.language_code = $${paramIndex}`);
    params.push(languageCode);
    paramIndex++;
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY t.entity_type, t.entity_id, t.language_code';

  const result = await pool.query(query, params);

  return result.rows.map((row) => ({
    ...mapTranslationRow(row),
    entityName: row.entity_name || '',
  }));
};

/**
 * Create a new translation
 * @param translation - Translation data
 * @returns Created translation entity
 */
export const createTranslation = async (translation: {
  entityType: TranslationEntityType;
  entityId: string;
  languageCode: string;
  translation: string;
}): Promise<TranslationEntity> => {
  const pool = getDatabasePool();

  // Verify that the entity exists
  let entityExists = false;
  switch (translation.entityType) {
    case TranslationEntityType.TEST_TYPE:
      const testTypeResult = await pool.query('SELECT id FROM test_types WHERE id = $1', [translation.entityId]);
      entityExists = testTypeResult.rows.length > 0;
      break;
    case TranslationEntityType.VACCINATION:
      const vaccinationResult = await pool.query('SELECT id FROM vaccinations WHERE id = $1', [translation.entityId]);
      entityExists = vaccinationResult.rows.length > 0;
      break;
    case TranslationEntityType.COMMON_SYMPTOM:
      const symptomResult = await pool.query('SELECT id FROM common_symptoms WHERE id = $1', [translation.entityId]);
      entityExists = symptomResult.rows.length > 0;
      break;
    case TranslationEntityType.PATHOGEN:
      const pathogenResult = await pool.query('SELECT id FROM pathogens WHERE id = $1', [translation.entityId]);
      entityExists = pathogenResult.rows.length > 0;
      break;
  }

  if (!entityExists) {
    throw new NotFoundError(`Entity with type ${translation.entityType} and id ${translation.entityId} not found`);
  }

  const result = await pool.query(
    `INSERT INTO translations (entity_type, entity_id, language_code, translation)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [translation.entityType, translation.entityId, translation.languageCode, translation.translation],
  );

  if (result.rows.length === 0) {
    throw new InternalServerError('Failed to create translation');
  }

  return mapTranslationRow(result.rows[0]);
};

/**
 * Update a translation
 * @param id - Translation ID
 * @param translation - Updated translation text
 * @returns Updated translation entity
 */
export const updateTranslation = async (
  id: string,
  translation: string,
): Promise<TranslationEntity> => {
  const pool = getDatabasePool();

  const result = await pool.query(
    `UPDATE translations 
     SET translation = $1, updated_at = now()
     WHERE id = $2
     RETURNING *`,
    [translation, id],
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Translation not found');
  }

  return mapTranslationRow(result.rows[0]);
};

/**
 * Delete a translation
 * @param id - Translation ID
 * @returns True if deleted successfully
 */
export const deleteTranslation = async (id: string): Promise<boolean> => {
  const pool = getDatabasePool();

  const result = await pool.query('DELETE FROM translations WHERE id = $1 RETURNING id', [id]);

  return result.rows.length > 0;
};

