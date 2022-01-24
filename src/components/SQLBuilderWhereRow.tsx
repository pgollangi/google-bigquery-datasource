import { toOption } from '@grafana/data';
import { AccessoryButton, InputGroup } from '@grafana/experimental';
import { Button, Input, Select } from '@grafana/ui';
import { BigQueryAPI } from 'api';
import React, { useEffect, useState } from 'react';
import { BasicConfig, Fields, ImmutableTree, Query, Utils } from 'react-awesome-query-builder';
import useAsync from 'react-use/lib/useAsync';
import { BigQueryQueryNG, QueryWithDefaults } from 'types';
import { toRawSql } from 'utils/sql.utils';

interface SQLBuilderWhereRowProps {
  query: QueryWithDefaults;
  apiClient: BigQueryAPI;
  onQueryChange: (query: BigQueryQueryNG) => void;
}

const emptyInitValue = {
  id: Utils.uuid(),
  type: 'group',
  properties: {
    conjunction: 'AND',
  },
} as const;

export function SQLBuilderWhereRow({ query, apiClient, onQueryChange }: SQLBuilderWhereRowProps) {
  const [tree, setTree] = useState<ImmutableTree>();

  const state = useAsync(async () => {
    if (!query.location || !query.dataset || !query.table) {
      return;
    }
    const columns = await apiClient.getColumns(query.location, query.dataset, query.table);
    const fields: Fields = {};
    for (const col of columns) {
      fields[col] = {
        type: 'text',
      };
    }
    return fields;
  }, [apiClient, query.dataset, query.location, query.table]);

  useEffect(() => {
    if (state.value && !tree) {
      const initTree = Utils.checkTree(Utils.loadTree(query.sql.whereJsonTree ?? emptyInitValue), {
        ...BasicConfig,
        fields: state.value,
      });
      setTree(initTree);
    }
  }, [query.sql.whereJsonTree, state.value, tree]);

  if (state.loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {tree && state.value && (
        <Query
          {...BasicConfig}
          fields={state.value}
          value={tree}
          onChange={(changedTree, config) => {
            setTree(changedTree);
            const newQuery = {
              ...query,
              sql: {
                ...query.sql,
                whereJsonTree: Utils.getTree(changedTree),
                whereString: Utils.sqlFormat(changedTree, config),
              },
            } as BigQueryQueryNG;
            newQuery.rawSql = toRawSql(newQuery, apiClient.getDefaultProject());
            onQueryChange(newQuery);
          }}
          renderBuilder={(props) => {
            const firstPath = [props.tree.get('id'), props.tree.get('children1')?.first()?.get('id')];
            if (!tree.get('children1')) {
              return (
                <Button
                  onClick={() => {
                    const rootPath = [tree.get('id')];
                    props.actions.addRule(rootPath);
                  }}
                  variant="secondary"
                  size="md"
                  icon="plus"
                  aria-label="Add"
                />
              );
            }
            return (
              <InputGroup>
                <Select
                  width="auto"
                  value={props.tree.get('field')}
                  options={state.value ? Object.keys(state.value).map(toOption) : []}
                  allowCustomValue
                  onChange={({ value }) => value && props.actions.setField(firstPath, value)}
                  menuShouldPortal={true}
                />

                <Select
                  width="auto"
                  value={props.tree.get('operator')}
                  options={Object.keys(props.config.operators).map(toOption)}
                  onChange={({ value }) => value && props.actions.setOperator(firstPath, value)}
                  menuShouldPortal={true}
                />
                <Input onChange={(e) => props.actions.setValue(firstPath, 0, e.currentTarget.value, 'text')} />

                <AccessoryButton
                  aria-label="remove"
                  icon="times"
                  variant="secondary"
                  onClick={() => props.actions.removeRule(firstPath)}
                />
              </InputGroup>
            );
          }}
        />
      )}
    </div>
  );
}
