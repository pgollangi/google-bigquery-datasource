import { SelectableValue } from '@grafana/data';
import { AccessoryButton, EditorList, InputGroup } from '@grafana/experimental';
import { Select } from '@grafana/ui';
import { BigQueryAPI } from 'api';
import React from 'react';
import { useAsync } from 'react-use';
// import { toRawSql } from 'sql.utils';
import { BigQueryQueryNG, QueryWithDefaults } from '../types';

interface SQLBuilderSelectRowProps {
  query: QueryWithDefaults;
  apiClient: BigQueryAPI;
  onQueryChange: (query: BigQueryQueryNG) => void;
}

export function SQLBuilderSelectRow({ query, apiClient, onQueryChange }: SQLBuilderSelectRowProps) {
  const state = useAsync(async () => {
    if (!query.location || !query.dataset || !query.table) {
      return;
    }
    const columns = await apiClient.getColumns(query.location, query.dataset, query.table);
    return columns.map<SelectableValue<string>>((d) => ({ label: d, value: d }));
  }, [apiClient, query.dataset, query.location, query.table]);

  return (
    <EditorList<string>
      items={query.sql.columns!}
      onChange={(item) => {
        onQueryChange({
          ...query,
          sql: { ...query.sql, columns: item },
          // rawSql: toRawSql(query.sql),
        });
      }}
      renderItem={makeRenderColumn({
        options: state.value,
        isLoading: state.loading,
        disabled: !query.table || !query.dataset || !query.location,
        table: query.table,
      })}
    />
  );
}

function makeRenderColumn({
  options,
  disabled,
  isLoading,
  table,
}: {
  options?: Array<SelectableValue<string>>;
  table?: string;
  disabled: boolean;
  isLoading: boolean;
}) {
  const renderColumn = function (item: string, onChangeItem: (item: string) => void, onDeleteItem: () => void) {
    return (
      <InputGroup>
        <Select
          value={item}
          options={options}
          onChange={(value) => onChangeItem(value.value || '')}
          disabled={disabled}
          isLoading={isLoading}
          width="auto"
        />
        <AccessoryButton aria-label="remove" icon="times" variant="secondary" onClick={onDeleteItem} />
      </InputGroup>
    );
  };
  return renderColumn;
}
