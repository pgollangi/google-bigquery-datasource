import { SelectableValue, toOption } from '@grafana/data';
import { AccessoryButton, EditorField, Stack } from '@grafana/experimental';
import { Button, Select } from '@grafana/ui';
import { BigQueryAPI } from 'api';
import { QueryEditorExpressionType, QueryEditorFunctionExpression } from 'expressions';
import React from 'react';
import { useAsync } from 'react-use';
import { createFunctionField, toRawSql } from 'utils/sql.utils';
import { BigQueryQueryNG, QueryWithDefaults } from '../types';
import { BQ_AGGREGATE_FNS } from './query-editor-raw/bigQueryFunctions';

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
    return columns.map<SelectableValue<string>>(toOption);
  }, [apiClient, query.dataset, query.location, query.table]);

  return (
    <Stack gap={1} alignItems="end" wrap direction="column">
      {query.sql.columns?.map((item, index) => (
        <div key={index}>
          <Stack gap={1} alignItems="end">
            <EditorField label="Column" width={12}>
              <Select
                value={getColumnValue(item)}
                options={state.value}
                menuShouldPortal
                allowCustomValue
                onChange={({ value }) => {
                  const newItem = {
                    ...item,
                    parameters: item.parameters?.length
                      ? item.parameters.map((p) =>
                          p.type === QueryEditorExpressionType.FunctionParameter ? { ...p, name: value } : p
                        )
                      : [{ type: QueryEditorExpressionType.FunctionParameter, name: value } as const],
                  };
                  const newQuery = {
                    ...query,
                    sql: { ...query.sql, columns: query.sql.columns?.map((c, i) => (i === index ? newItem : c)) },
                  };
                  newQuery.rawSql = toRawSql(newQuery, apiClient.getDefaultProject());
                  onQueryChange(newQuery);
                }}
                disabled={!query.table || !query.dataset || !query.location}
                isLoading={state.loading}
                className="width-12"
              />
            </EditorField>

            <EditorField label="Aggregation" optional width={12}>
              <Select
                value={item.name ? toOption(item.name) : null}
                isClearable
                menuShouldPortal
                allowCustomValue
                options={BQ_AGGREGATE_FNS.map((v) => ({ label: v.name, value: v.name }))}
                onChange={(value) => {
                  const newItem = {
                    ...item,
                    name: value?.value,
                  };
                  const newQuery = {
                    ...query,
                    sql: { ...query.sql, columns: query.sql.columns?.map((c, i) => (i === index ? newItem : c)) },
                  };
                  newQuery.rawSql = toRawSql(newQuery, apiClient.getDefaultProject());
                  onQueryChange(newQuery);
                }}
                className="width-12"
              />
            </EditorField>
            <AccessoryButton
              aria-label="remove"
              icon="trash-alt"
              variant="secondary"
              size="md"
              onClick={() => {
                const clone = [...query.sql.columns!];
                clone.splice(index, 1);
                const newQuery = {
                  ...query,
                  sql: { ...query.sql, columns: clone },
                };
                newQuery.rawSql = toRawSql(newQuery, apiClient.getDefaultProject());
                onQueryChange(newQuery);
              }}
            />
          </Stack>
        </div>
      ))}
      <Button
        type="button"
        onClick={() => {
          const newQuery = { ...query, sql: { ...query.sql, columns: [...query.sql.columns!, createFunctionField()] } };
          onQueryChange(newQuery);
        }}
        variant="secondary"
        size="md"
        icon="plus"
        aria-label="Add"
        style={{ alignSelf: 'flex-start' }}
      />
    </Stack>
  );
}

function getColumnValue({ parameters }: QueryEditorFunctionExpression): SelectableValue<string> | undefined {
  const column = parameters?.find((p) => p.type === QueryEditorExpressionType.FunctionParameter);
  if (column?.name) {
    return toOption(column.name);
  }
  return undefined;
}
