import { DataQuery, DataSourceJsonData } from '@grafana/data';
import { BigQueryAPI } from 'api';

export enum GoogleAuthType {
  JWT = 'jwt',
  GCE = 'gce',
}

export enum QueryPriority {
  Interactive = 'INTERACTIVE',
  Batch = 'BATCH',
}

export enum EditorMode {
  'Builder',
  'Code',
}

export interface QueryRowFilter {
  filter: boolean;
  group: boolean;
  order: boolean;
  preview: boolean;
}

export interface BigQueryOptions extends DataSourceJsonData {
  authenticationType: GoogleAuthType;
  flatRateProject?: string;
  processingLocation?: string;
  queryPriority?: QueryPriority;
  tokenUri?: string;
  clientEmail?: string;
  defaultProject?: string;
}

export interface BigQuerySecureJsonData {
  privateKey?: string;
}

export enum GroupType {
  Time = 'time',
  Column = 'column',
}

export enum QueryFormat {
  Timeseries = 0,
  Table = 1,
}

export interface QueryModel extends DataQuery {
  rawSql: string;
  format: QueryFormat;
  connectionArgs: {
    dataset: string;
    table: string;
    location: string;
  };
}

export interface SQLExpression {
  columns?: string[];
  from?: string;
  where?: string;
  groupBy?: string;
  orderBy?: string;
  orderByDirection?: string;
  limit?: number;
}

export interface ResourceSelectorProps {
  apiClient: BigQueryAPI;
  location: string;
  disabled?: boolean;
  className?: string;
  applyDefault?: boolean;
}

export interface BigQueryQueryNG extends DataQuery {
  dataset?: string;
  table?: string;

  format: QueryFormat;
  orderByCol?: string;
  orderBySort?: string;
  location?: string;
  timeColumn: string;
  timeColumnType?: 'TIMESTAMP' | 'DATE' | 'DATETIME' | 'int4';
  metricColumn: string;
  group?: Array<{ type: GroupType; params: string[] }>;
  where?: any[];
  select?: any[];
  rawQuery?: boolean;
  rawSql: string;
  partitioned?: boolean;
  partitionedField?: string;
  convertToUTC?: boolean;
  sharded?: boolean;
  queryPriority?: QueryPriority;
  timeShift?: string;
  editorMode?: EditorMode;
  sql?: SQLExpression;
}
