import { Button, ConfirmModal, InlineSwitch, RadioButtonGroup } from '@grafana/ui';
import React, { useCallback, useState } from 'react';
import { DEFAULT_REGION, PROCESSING_LOCATIONS } from '../constants';
import { BigQueryQueryNG, EditorMode, QueryRowFilter } from '../types';
import { EditorHeader, FlexItem, InlineSelect } from '@grafana/experimental';

interface QueryHeaderProps {
  query: BigQueryQueryNG;
  onChange: (query: BigQueryQueryNG) => void;
  onRunQuery: () => void;
  onQueryRowChange: (queryRowFilter: QueryRowFilter) => void;
  queryRowFilter: QueryRowFilter;
  sqlCodeEditorIsDirty: boolean;
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

  return (
    <EditorHeader>
      <InlineSelect
        label="Processing location"
        value={location}
        placeholder="Select location"
        allowCustomValue
        onChange={({ value }) => value && onChange({ ...query, location: value || DEFAULT_REGION })}
        options={PROCESSING_LOCATIONS}
      />

      <InlineSwitch
        id="bq-filter"
        label="Filter"
        transparent={true}
        showLabel={true}
        value={queryRowFilter.filter}
        onChange={(ev) =>
          ev.target instanceof HTMLInputElement && onQueryRowChange({ ...queryRowFilter, filter: ev.target.checked })
        }
      />

      <InlineSwitch
        id="bq-group"
        label="Group"
        transparent={true}
        showLabel={true}
        value={queryRowFilter.group}
        onChange={(ev) =>
          ev.target instanceof HTMLInputElement && onQueryRowChange({ ...queryRowFilter, group: ev.target.checked })
        }
      />

      <InlineSwitch
        id="bq-order"
        label="Order"
        transparent={true}
        showLabel={true}
        value={queryRowFilter.order}
        onChange={(ev) =>
          ev.target instanceof HTMLInputElement && onQueryRowChange({ ...queryRowFilter, order: ev.target.checked })
        }
      />

      <InlineSwitch
        id="bq-preview"
        label="Preview"
        transparent={true}
        showLabel={true}
        value={queryRowFilter.preview}
        onChange={(ev) =>
          ev.target instanceof HTMLInputElement && onQueryRowChange({ ...queryRowFilter, preview: ev.target.checked })
        }
      />

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
  );
};

export default QueryHeader;
