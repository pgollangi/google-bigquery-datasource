import { SelectableValue } from '@grafana/data';
import { EditorField, Space } from '@grafana/experimental';
import { Input, RadioButtonGroup, Select } from '@grafana/ui';
import { BigQueryAPI } from 'api';
import React from 'react';
import { useAsync } from 'react-use';
import { BigQueryQueryNG, QueryWithDefaults } from 'types';
import { toRawSql } from 'utils/sql.utils';

type SQLOrderByRowProps = {
  query: QueryWithDefaults;
  onQueryChange: (query: BigQueryQueryNG) => void;
  apiClient: BigQueryAPI;
};

const sortOrderOptions = [
  { description: 'Sort by ascending', value: 'ASC', icon: 'sort-amount-up' } as const,
  { description: 'Sort by descending', value: 'DESC', icon: 'sort-amount-down' } as const,
];

export function SQLOrderByRow({ query, onQueryChange, apiClient }: SQLOrderByRowProps) {
  const state = useAsync(async () => {
    if (!query.location || !query.dataset || !query.table) {
      return;
    }
    const columns = await apiClient.getColumns(query.location, query.dataset, query.table, true);
    return columns.map<SelectableValue<string>>((d) => ({ label: d, value: d }));
  }, [apiClient, query.dataset, query.location, query.table]);

  const onSortOrderChange = (item: 'ASC' | 'DESC') => {
    const newQuery = { ...query, sql: { ...query.sql, orderByDirection: item } };
    newQuery.rawSql = toRawSql(newQuery, apiClient.getDefaultProject());
    onQueryChange(newQuery);
  };

  return (
    <>
      <EditorField label="Order by" width={12}>
        <>
          <Select
            options={state.value}
            value={query.sql?.orderBy}
            isClearable
            onChange={(e) => {
              const newQuery = { ...query, sql: { ...query.sql, orderBy: e?.value } };
              if (e === null) {
                newQuery.sql.orderByDirection = undefined;
              }
              newQuery.rawSql = toRawSql(newQuery, apiClient.getDefaultProject());
              onQueryChange(newQuery);
            }}
            className="width-12"
          />

          <Space h={1.5} />

          <RadioButtonGroup
            options={sortOrderOptions}
            disabled={!query.sql?.orderBy}
            value={query.sql.orderByDirection}
            onChange={onSortOrderChange}
          />
        </>
      </EditorField>
      <EditorField label="Limit" optional width={12}>
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
    </>
  );
}
