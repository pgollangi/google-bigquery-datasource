import { GrafanaTheme2 } from '@grafana/data';
import { CustomScrollbar, JSONFormatter, Tab, TabContent, TabsBar, Tooltip, useTheme2 } from '@grafana/ui';
import { BigQueryAPI, TableSchema } from 'api';
import { QueryEditorRaw } from 'QueryEditorRaw';
import React, { useRef, useState, useEffect } from 'react';
import { useAsyncFn } from 'react-use';
import { BigQueryQueryNG, QueryWithDefaults } from 'types';

export function CodeEditor({
  apiClient,
  queryWithDefaults,
  onChange,
  onRunQuery,
}: {
  apiClient: BigQueryAPI;
  queryWithDefaults: QueryWithDefaults;
  onChange: (query: BigQueryQueryNG) => void;
  onRunQuery: () => void;
}) {
  const schemaCache = useRef(new Map<string, TableSchema>());

  const [fetchTableSchemaState, fetchTableSchema] = useAsyncFn(
    async (l?: string, d?: string, t?: string) => {
      if (!Boolean(l && d && t) || !apiClient) {
        return null;
      }

      if (schemaCache.current?.has(t!)) {
        return schemaCache.current?.get(t!);
      }
      const schema = await apiClient.getTableSchema(l!, d!, t!);
      schemaCache.current.set(t!, schema);
      return schema;
    },
    [apiClient]
  );

  useEffect(() => {
    if (!queryWithDefaults.location || !queryWithDefaults.dataset || !queryWithDefaults.table) {
      return;
    }
    fetchTableSchema(queryWithDefaults.location, queryWithDefaults.dataset, queryWithDefaults.table);
  }, [fetchTableSchema, queryWithDefaults.location, queryWithDefaults.dataset, queryWithDefaults.table]);

  const [isSchemaOpen, setIsSchemaOpen] = useState(false);
  const theme: GrafanaTheme2 = useTheme2();
  const schemaTab = (
    <Tab
      label="Table schema"
      active={isSchemaOpen}
      onChangeTab={() => {
        if (!Boolean(queryWithDefaults.table)) {
          return;
        }
        setIsSchemaOpen(true);
      }}
      icon={fetchTableSchemaState.loading ? 'fa fa-spinner' : undefined}
    />
  );
  return (
    <>
      <TabsBar>
        <Tab label={'Query'} active={!isSchemaOpen} onChangeTab={() => setIsSchemaOpen(false)} />
        {queryWithDefaults.table ? schemaTab : <Tooltip content={'Choose table first'}>{schemaTab}</Tooltip>}
      </TabsBar>

      <TabContent>
        {!isSchemaOpen && <QueryEditorRaw query={queryWithDefaults} onChange={onChange} onRunQuery={onRunQuery} />}
        {isSchemaOpen && (
          <div
            style={{
              height: '300px',
              padding: `${theme.spacing(1)}`,
              marginBottom: `${theme.spacing(1)}`,
              border: `1px solid ${theme.colors.border.medium}`,
              overflow: 'auto',
            }}
          >
            {fetchTableSchemaState.value && fetchTableSchemaState.value.schema && queryWithDefaults.table && (
              <CustomScrollbar>
                <JSONFormatter json={fetchTableSchemaState.value.schema} open={2} />
              </CustomScrollbar>
            )}
          </div>
        )}
      </TabContent>
    </>
  );
}
