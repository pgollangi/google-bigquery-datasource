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

  //   if (sql.limit) {
  rawQuery += `LIMIT 10 `;
  //   }
  return rawQuery;
}
