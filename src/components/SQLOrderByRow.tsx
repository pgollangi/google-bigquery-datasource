import { EditorField } from '@grafana/experimental';
import { Input } from '@grafana/ui';
import { BigQueryAPI } from 'api';
import { toRawSql } from 'utils/sql.utils';
import React from 'react';
import { BigQueryQueryNG, QueryWithDefaults } from 'types';

type SQLOrderByRowProps = {
  query: QueryWithDefaults;
  onQueryChange: (query: BigQueryQueryNG) => void;
  apiClient: BigQueryAPI;
};

export function SQLOrderByRow({ query, onQueryChange, apiClient }: SQLOrderByRowProps) {
  return (
    <EditorField label="Limit" optional>
      <Input
        type="number"
        value={query.sql.limit}
        onChange={(e) => {
          const newQuery = { ...query, sql: { ...query.sql, limit: Number.parseInt(e.currentTarget.value, 10) } };
          newQuery.rawSql = toRawSql(newQuery, apiClient.getDefaultProject());
          onQueryChange(newQuery);
        }}
      />
    </EditorField>
  );
}
