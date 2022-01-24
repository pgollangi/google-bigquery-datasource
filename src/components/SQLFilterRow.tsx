import { SelectableValue, toOption } from '@grafana/data';
import { AccessoryButton, EditorList, InputGroup } from '@grafana/experimental';
import { Input, Select } from '@grafana/ui';
import { BigQueryAPI } from 'api';
import { QueryEditorExpressionType, QueryEditorOperatorExpression, QueryEditorPropertyType } from 'expressions';
import React, { useMemo, useState } from 'react';
import { useAsync } from 'react-use';
import { BigQueryQueryNG, QueryWithDefaults } from 'types';
import {
  getFlattenedFilters,
  sanitizeOperator,
  setOperatorExpressionName,
  setOperatorExpressionProperty,
  setOperatorExpressionValue,
  toRawSql,
} from 'utils/sql.utils';
import { BQ_OPERATORS } from './query-editor-raw/bigQueryOperators';

interface SQLFilterRowProps {
  query: QueryWithDefaults;
  apiClient: BigQueryAPI;
  onQueryChange: (query: BigQueryQueryNG) => void;
}

const OPERATORS: Array<SelectableValue<string>> = BQ_OPERATORS.map((op) => ({
  description: op.description,
  value: op.operator,
  label: op.operator,
}));

export function SQLFilterRow({ query, onQueryChange, apiClient }: SQLFilterRowProps) {
  const filtersFromQuery = useMemo(() => getFlattenedFilters(query.sql ?? {}), [query.sql]);
  const [filters, setFilters] = useState<QueryEditorOperatorExpression[]>(filtersFromQuery);

  const onChange = (newItems: Array<Partial<QueryEditorOperatorExpression>>) => {
    // As new (empty object) items come in, with need to make sure they have the correct type
    const cleaned = newItems.map(
      (v): QueryEditorOperatorExpression => ({
        type: QueryEditorExpressionType.Operator,
        property: v.property ?? { type: QueryEditorPropertyType.String },
        operator: v.operator ?? {
          name: '=',
        },
      })
    );

    setFilters(cleaned);

    // Only save valid and complete filters into the query state
    const validExpressions: QueryEditorOperatorExpression[] = [];
    for (const operatorExpression of cleaned) {
      const validated = sanitizeOperator(operatorExpression);
      if (validated) {
        validExpressions.push(validated);
      }
    }

    const where = validExpressions.length
      ? {
          type: QueryEditorExpressionType.And as const,
          expressions: validExpressions,
        }
      : undefined;

    const newQuery = { ...query, sql: { ...query.sql, where } };
    newQuery.rawSql = toRawSql(newQuery, apiClient.getDefaultProject());

    onQueryChange(newQuery);
  };

  return <EditorList items={filters} onChange={onChange} renderItem={makeRenderFilter(query, apiClient)} />;
}

// Making component functions in the render body is not recommended, but it works for now.
// If some problems arise (perhaps with state going missing), consider this to be a potential cause
function makeRenderFilter(query: QueryWithDefaults, apiClient: BigQueryAPI) {
  function renderFilter(
    item: Partial<QueryEditorOperatorExpression>,
    onChange: (item: QueryEditorOperatorExpression) => void,
    onDelete: () => void
  ) {
    return <FilterItem query={query} filter={item} onChange={onChange} onDelete={onDelete} apiClient={apiClient} />;
  }

  return renderFilter;
}

interface FilterItemProps {
  query: QueryWithDefaults;
  filter: Partial<QueryEditorOperatorExpression>;
  apiClient: BigQueryAPI;
  onChange: (item: QueryEditorOperatorExpression) => void;
  onDelete: () => void;
}

function FilterItem({ query, filter, onChange, onDelete, apiClient }: FilterItemProps) {
  const state = useAsync(async () => {
    if (!query.location || !query.dataset || !query.table) {
      return;
    }
    const columns = await apiClient.getColumns(query.location, query.dataset, query.table);
    return columns.map<SelectableValue<string>>(toOption);
  }, [apiClient, query.dataset, query.location, query.table]);

  return (
    <InputGroup>
      <Select
        value={filter.property?.name ? toOption(filter.property?.name) : null}
        options={state.value}
        isLoading={state.loading}
        allowCustomValue
        onChange={({ value }) => value && onChange(setOperatorExpressionProperty(filter, value))}
        menuShouldPortal
        className="width-12"
      />

      <Select
        value={filter.operator?.name && toOption(filter.operator.name)}
        options={OPERATORS}
        onChange={({ value }) => value && onChange(setOperatorExpressionName(filter, value))}
        menuShouldPortal
        className="width-6"
      />

      <Input
        value={filter.operator?.value as string}
        onChange={(e) => e.currentTarget.value && onChange(setOperatorExpressionValue(filter, e.currentTarget.value))}
      />

      <AccessoryButton aria-label="remove" icon="times" variant="secondary" onClick={onDelete} />
    </InputGroup>
  );
}
