import React, { useEffect, useState, useRef } from 'react';
import { GrafanaTheme2, QueryEditorProps, SelectableValue } from '@grafana/data';
import { BigQueryDatasource } from './datasource';
import { DEFAULT_REGION, QUERY_FORMAT_OPTIONS } from './constants';
import { CustomScrollbar, JSONFormatter, Select, Tab, TabContent, TabsBar, Tooltip, useTheme2 } from '@grafana/ui';
import { QueryEditorRaw } from './QueryEditorRaw';
import { DatasetSelector } from './components/DatasetSelector';
import { TableSelector } from './components/TableSelector';
import { BigQueryQueryNG } from './bigquery_query';
import { BigQueryOptions, EditorMode, QueryFormat, QueryRowFilter } from './types';
import { getApiClient, TableSchema } from './api';
import { useAsync, useAsyncFn } from 'react-use';
import QueryHeader from './components/QueryHeader';
import { Space } from './components/ui/Space';
import EditorRow from './components/ui/EditorRow';
import EditorField from './components/ui/EditorField';

type Props = QueryEditorProps<BigQueryDatasource, BigQueryQueryNG, BigQueryOptions>;

function applyQueryDefaults(q: BigQueryQueryNG, ds: BigQueryDatasource) {
  const result = { ...q };

  result.dataset = q.dataset;
  result.location = q.location || ds.jsonData.defaultRegion || DEFAULT_REGION;
  result.format = q.format !== undefined ? q.format : QueryFormat.Table;
  result.rawSql = q.rawSql || '';
  result.editorMode = q.editorMode || EditorMode.Builder;

  return result;
}

const isQueryValid = (q: BigQueryQueryNG) => {
  return Boolean(q.location && q.dataset && q.table && q.rawSql);
};

export function QueryEditor(props: Props) {
  const schemaCache = useRef(new Map<string, TableSchema>());
  const {
    loading: apiLoading,
    error: apiError,
    value: apiClient,
  } = useAsync(async () => await getApiClient(props.datasource.id), [props.datasource]);

  const [isSchemaOpen, setIsSchemaOpen] = useState(false);
  const theme: GrafanaTheme2 = useTheme2();
  const [queryRowFilter, setQueryRowFilter] = useState<QueryRowFilter>({
    filter: false,
    group: false,
    order: false,
    preview: true,
  });

  const queryWithDefaults = applyQueryDefaults(props.query, props.datasource);

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

  const processQuery = (q: BigQueryQueryNG) => {
    if (isQueryValid(q)) {
      props.onRunQuery();
    }
  };

  const onFormatChange = (e: SelectableValue) => {
    const next = { ...props.query, format: e.value || QueryFormat.Timeseries };
    props.onChange(next);
    processQuery(next);
  };

  const onDatasetChange = (e: SelectableValue) => {
    const next = {
      ...queryWithDefaults,
      dataset: e.value,
      table: undefined,
    };

    setIsSchemaOpen(false);
    props.onChange(next);
    processQuery(next);
  };

  const onTableChange = (e: SelectableValue) => {
    const next = {
      ...queryWithDefaults,
      table: e.value,
    };
    props.onChange(next);
    fetchTableSchema(next.location, next.dataset, next.table);
    processQuery(next);
  };

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

  if (apiLoading || apiError || !apiClient) {
    return null;
  }

  return (
    <>
      <QueryHeader
        onChange={props.onChange}
        onRunQuery={props.onRunQuery}
        onQueryRowChange={setQueryRowFilter}
        queryRowFilter={queryRowFilter}
        query={queryWithDefaults}
        sqlCodeEditorIsDirty={false}
      />

      <Space v={0.5} />

      <EditorRow>
        <EditorField label="Format" width={12}>
          <Select
            options={QUERY_FORMAT_OPTIONS}
            value={queryWithDefaults.format}
            onChange={onFormatChange}
            className="width-12"
          />
        </EditorField>

        <EditorField label="Dataset" width={12}>
          <DatasetSelector
            apiClient={apiClient}
            location={queryWithDefaults.location!}
            value={queryWithDefaults.dataset}
            onChange={onDatasetChange}
            className="width-12"
          />
        </EditorField>

        <EditorField label="Table">
          <TableSelector
            apiClient={apiClient}
            location={queryWithDefaults.location!}
            dataset={queryWithDefaults.dataset!}
            value={queryWithDefaults.table}
            disabled={queryWithDefaults.dataset === undefined}
            onChange={onTableChange}
            className="width-12"
            applyDefault
          />
        </EditorField>
      </EditorRow>

      {queryWithDefaults.editorMode === EditorMode.Code && (
        <>
          <TabsBar>
            <Tab label={'Query'} active={!isSchemaOpen} onChangeTab={() => setIsSchemaOpen(false)} />
            {queryWithDefaults.table ? schemaTab : <Tooltip content={'Choose table first'}>{schemaTab}</Tooltip>}
          </TabsBar>

          <TabContent>
            {!isSchemaOpen && (
              <QueryEditorRaw query={queryWithDefaults} onChange={props.onChange} onRunQuery={props.onRunQuery} />
            )}
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
                {fetchTableSchemaState.value && fetchTableSchemaState.value.schema && props.query.table && (
                  <CustomScrollbar>
                    <JSONFormatter json={fetchTableSchemaState.value.schema} open={2} />
                  </CustomScrollbar>
                )}
              </div>
            )}
          </TabContent>
        </>
      )}
    </>
  );
}
