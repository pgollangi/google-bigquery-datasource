import { isEmpty } from 'lodash';
import { BigQueryQueryNG } from 'types';

export function toRawSql(query: BigQueryQueryNG, projectId: string): string {
  let rawQuery = '';
  if (query.sql?.columns) {
    const filteredColumns = query.sql.columns.filter((c) => !isEmpty(c));
    rawQuery += `SELECT ${filteredColumns.join(', ')} `;
  }

  if (query.dataset && query.table) {
    rawQuery += `FROM ${projectId}.${query.dataset}.${query.table} `;
  }

  if (query.sql?.orderBy) {
    rawQuery += `ORDER BY ${query.sql.orderBy} `;
  }

  if (query.sql?.orderByDirection) {
    rawQuery += `${query.sql.orderByDirection} `;
  }

  if (query.sql?.limit) {
    rawQuery += `LIMIT ${query.sql.limit} `;
  }
  return rawQuery;
}
