import { QueryEditorProps } from '@grafana/data';
import { EditorField, EditorRow, EditorRows, Space } from '@grafana/experimental';
import { CodeEditor } from '@grafana/ui';
import { CodeEditor as RawCodeEditor } from 'components/CodeEditor';
import { SQLBuilderSelectRow } from 'components/SQLBuilderSelectRow';
import React, { useState, useEffect } from 'react';
import { useAsync } from 'react-use';
import { applyQueryDefaults } from 'utils';
import { getApiClient } from './api';
import QueryHeader from './components/QueryHeader';
import { BigQueryDatasource } from './datasource';
import { BigQueryOptions, BigQueryQueryNG, EditorMode, QueryRowFilter } from './types';

type Props = QueryEditorProps<BigQueryDatasource, BigQueryQueryNG, BigQueryOptions>;

export function QueryEditor(props: Props) {
  const { loading: apiLoading, error: apiError, value: apiClient } = useAsync(
    async () => await getApiClient(props.datasource.id),
    [props.datasource]
  );

  const [queryRowFilter, setQueryRowFilter] = useState<QueryRowFilter>({
    filter: false,
    group: false,
    order: false,
    preview: true,
  });

  const queryWithDefaults = applyQueryDefaults(props.query, props.datasource);

  useEffect(() => {
    return () => {
      getApiClient(props.datasource.id).then((client) => client.dispose());
    };
  }, [props.datasource.id]);

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
        // TODO: add proper dirty check
        sqlCodeEditorIsDirty={!!queryWithDefaults.sql.columns?.length}
        apiClient={apiClient}
      />

      <Space v={0.5} />

      {queryWithDefaults.editorMode !== EditorMode.Code && (
        <EditorRows>
          <EditorRow>
            <EditorField label="Column">
              <SQLBuilderSelectRow query={queryWithDefaults} onQueryChange={props.onChange} apiClient={apiClient} />
            </EditorField>
          </EditorRow>
          {queryRowFilter.preview && queryWithDefaults.rawSql && (
            <EditorRow>
              <EditorField label="Preview">
                {/* TODO: Figure out how to not hardcode width */}
                <CodeEditor height={80} width={800} language="sql" value={queryWithDefaults.rawSql} readOnly={true} />
              </EditorField>
            </EditorRow>
          )}
        </EditorRows>
      )}

      {queryWithDefaults.editorMode === EditorMode.Code && (
        <RawCodeEditor
          apiClient={apiClient}
          queryWithDefaults={queryWithDefaults}
          onChange={props.onChange}
          onRunQuery={props.onRunQuery}
        />
      )}
    </>
  );
}
