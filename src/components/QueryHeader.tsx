import { Button, ConfirmModal, InlineSwitch, RadioButtonGroup, Select } from '@grafana/ui';
import React, { useCallback, useState } from 'react';
import { DEFAULT_REGION, PROCESSING_LOCATIONS, QUERY_FORMAT_OPTIONS } from '../constants';
import { BigQueryQueryNG, EditorMode, QueryFormat, QueryRowFilter, QueryWithDefaults } from '../types';
import { EditorField, EditorHeader, EditorRow, FlexItem, InlineSelect, Space } from '@grafana/experimental';
import { DatasetSelector } from './DatasetSelector';
import { TableSelector } from './TableSelector';
import { isQueryValid } from 'utils';
import { SelectableValue } from '@grafana/data';
import { BigQueryAPI } from 'api';

interface QueryHeaderProps {
  query: QueryWithDefaults;
  onChange: (query: BigQueryQueryNG) => void;
  onRunQuery: () => void;
  onQueryRowChange: (queryRowFilter: QueryRowFilter) => void;
  queryRowFilter: QueryRowFilter;
  sqlCodeEditorIsDirty: boolean;
  apiClient: BigQueryAPI;
}

const editorModes = [
  { label: 'Builder', value: EditorMode.Builder },
  { label: 'Code', value: EditorMode.Code },
];

const QueryHeader: React.FC<QueryHeaderProps> = ({
  query,
  sqlCodeEditorIsDirty,
  queryRowFilter,
  onChange,
  onRunQuery,
  onQueryRowChange,
  apiClient,
}) => {
  const { location, editorMode } = query;
  const [showConfirm, setShowConfirm] = useState(false);

  const onEditorModeChange = useCallback(
    (newEditorMode: EditorMode) => {
      if (sqlCodeEditorIsDirty && editorMode === EditorMode.Code) {
        setShowConfirm(true);
        return;
      }
      onChange({ ...query, editorMode: newEditorMode });
    },
    [sqlCodeEditorIsDirty, editorMode, onChange, query]
  );

  const processQuery = (q: BigQueryQueryNG) => {
    if (isQueryValid(q)) {
      onRunQuery();
    }
  };

  const onFormatChange = (e: SelectableValue) => {
    const next = { ...query, format: e.value || QueryFormat.Timeseries };
    onChange(next);
    processQuery(next);
  };

  const onDatasetChange = (e: SelectableValue) => {
    const next = {
      ...query,
      dataset: e.value,
      table: undefined,
    };

    onChange(next);
    processQuery(next);
  };

  const onTableChange = (e: SelectableValue) => {
    const next = {
      ...query,
      table: e.value,
    };
    onChange(next);
    processQuery(next);
  };

  return (
    <>
      <EditorHeader>
        <InlineSelect
          label="Processing location"
          value={location}
          placeholder="Select location"
          allowCustomValue
          onChange={({ value }) => value && onChange({ ...query, location: value || DEFAULT_REGION })}
          options={PROCESSING_LOCATIONS}
        />

        {editorMode === EditorMode.Builder && (
          <>
            <InlineSwitch
              id="bq-filter"
              label="Filter"
              transparent={true}
              showLabel={true}
              value={queryRowFilter.filter}
              onChange={(ev) =>
                ev.target instanceof HTMLInputElement &&
                onQueryRowChange({ ...queryRowFilter, filter: ev.target.checked })
              }
            />

            <InlineSwitch
              id="bq-group"
              label="Group"
              transparent={true}
              showLabel={true}
              value={queryRowFilter.group}
              onChange={(ev) =>
                ev.target instanceof HTMLInputElement &&
                onQueryRowChange({ ...queryRowFilter, group: ev.target.checked })
              }
            />

            <InlineSwitch
              id="bq-order"
              label="Order"
              transparent={true}
              showLabel={true}
              value={queryRowFilter.order}
              onChange={(ev) =>
                ev.target instanceof HTMLInputElement &&
                onQueryRowChange({ ...queryRowFilter, order: ev.target.checked })
              }
            />

            <InlineSwitch
              id="bq-preview"
              label="Preview"
              transparent={true}
              showLabel={true}
              value={queryRowFilter.preview}
              onChange={(ev) =>
                ev.target instanceof HTMLInputElement &&
                onQueryRowChange({ ...queryRowFilter, preview: ev.target.checked })
              }
            />
          </>
        )}

        <FlexItem grow={1} />

        <RadioButtonGroup options={editorModes} size="sm" value={editorMode} onChange={onEditorModeChange} />

        {editorMode === EditorMode.Code && (
          <Button variant="secondary" size="sm" onClick={() => onRunQuery()}>
            Run query
          </Button>
        )}

        <ConfirmModal
          isOpen={showConfirm}
          title="Are you sure?"
          body="You will lose manual changes done to the query if you go back to the visual builder."
          confirmText="Yes, I am sure."
          dismissText="No, continue editing the query manually."
          icon="exclamation-triangle"
          onConfirm={() => {
            setShowConfirm(false);
            onChange({ ...query, editorMode: EditorMode.Builder });
          }}
          onDismiss={() => setShowConfirm(false)}
        />
      </EditorHeader>

      <Space v={0.5} />

      <EditorRow>
        <EditorField label="Format" width={12}>
          <Select options={QUERY_FORMAT_OPTIONS} value={query.format} onChange={onFormatChange} className="width-12" />
        </EditorField>

        <EditorField label="Dataset" width={12}>
          <DatasetSelector
            apiClient={apiClient}
            location={query.location}
            value={query.dataset}
            onChange={onDatasetChange}
            className="width-12"
          />
        </EditorField>

        <EditorField label="Table">
          <TableSelector
            apiClient={apiClient}
            location={query.location}
            dataset={query.dataset}
            value={query.table}
            disabled={query.dataset === undefined}
            onChange={onTableChange}
            className="width-12"
            applyDefault
          />
        </EditorField>
      </EditorRow>
    </>
  );
};

export default QueryHeader;
