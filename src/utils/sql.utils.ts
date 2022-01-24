import {
  QueryEditorArrayExpression,
  QueryEditorExpressionType,
  QueryEditorFunctionExpression,
  QueryEditorGroupByExpression,
  QueryEditorOperatorExpression,
  QueryEditorPropertyExpression,
  QueryEditorPropertyType,
} from 'expressions';
import { isEmpty } from 'lodash';
import { BigQueryQueryNG, SQLExpression } from 'types';

export function toRawSql(query: BigQueryQueryNG, projectId: string): string {
  let rawQuery = '';
  if (query.sql?.columns) {
    const columns = query.sql.columns.map((c) => {
      let rawColumn = '';
      if (c.name) {
        rawColumn += `${c.name}(${c.parameters?.map((p) => `${p.name}`)})`;
      } else {
        rawColumn += `${c.parameters?.map((p) => `${p.name}`)}`;
      }
      return rawColumn;
    });
    rawQuery += `SELECT ${columns.join(', ')} `;
  }

  if (query.dataset && query.table) {
    rawQuery += `FROM ${projectId}.${query.dataset}.${query.table} `;
  }

  if (query.sql?.where) {
    const where = getFlattenedFilters(query.sql);
    rawQuery += `WHERE ${where
      .map((v) => `${v.property.name} ${v.operator.name} "${v.operator.value}" `)
      .join('AND ')} `;
  }

  if (query.sql?.groupBy?.length) {
    const groupBy = query.sql.groupBy.map((g) => g.property.name).filter((g) => !isEmpty(g));
    rawQuery += `GROUP BY ${groupBy.join(', ')} `;
  }

  if (query.sql?.orderBy?.property.name) {
    rawQuery += `ORDER BY ${query.sql.orderBy.property.name} `;
  }

  if (query.sql?.orderByDirection) {
    rawQuery += `${query.sql.orderByDirection} `;
  }

  if (query.sql?.limit) {
    rawQuery += `LIMIT ${query.sql.limit} `;
  }
  return rawQuery;
}

/**
 * Creates a GroupByExpression for a specified field
 */
export function setGroupByField(field?: string): QueryEditorGroupByExpression {
  return {
    type: QueryEditorExpressionType.GroupBy,
    property: {
      type: QueryEditorPropertyType.String,
      name: field,
    },
  };
}

/**
 * Creates a PropertyExpression for a specified field
 */
export function setPropertyField(field?: string): QueryEditorPropertyExpression {
  return {
    type: QueryEditorExpressionType.Property,
    property: {
      type: QueryEditorPropertyType.String,
      name: field,
    },
  };
}

export function createFunctionField(functionName?: string): QueryEditorFunctionExpression {
  return {
    type: QueryEditorExpressionType.Function,
    name: functionName,
    parameters: [],
  };
}

/** Given a partial operator expression, return a non-partial if it's valid, or undefined */
export function sanitizeOperator(
  expression: Partial<QueryEditorOperatorExpression>
): QueryEditorOperatorExpression | undefined {
  const key = expression.property?.name;
  const value = expression.operator?.value;
  const operator = expression.operator?.name;

  if (key && value && operator) {
    return {
      type: QueryEditorExpressionType.Operator,
      property: {
        type: QueryEditorPropertyType.String,
        name: key,
      },
      operator: {
        value,
        name: operator,
      },
    };
  }

  return undefined;
}

/**
 * Sets the left hand side (InstanceId) in an OperatorExpression
 * Accepts a partial expression to use in an editor
 */
export function setOperatorExpressionProperty(
  expression: Partial<QueryEditorOperatorExpression>,
  property: string
): QueryEditorOperatorExpression {
  return {
    type: QueryEditorExpressionType.Operator,
    property: {
      type: QueryEditorPropertyType.String,
      name: property,
    },
    operator: expression.operator ?? {},
  };
}

/**
 * Sets the operator ("==") in an OperatorExpression
 * Accepts a partial expression to use in an editor
 */
export function setOperatorExpressionName(
  expression: Partial<QueryEditorOperatorExpression>,
  name: string
): QueryEditorOperatorExpression {
  return {
    type: QueryEditorExpressionType.Operator,
    property: expression.property ?? {
      type: QueryEditorPropertyType.String,
    },
    operator: {
      ...expression.operator,
      name,
    },
  };
}

/**
 * Sets the right hand side ("i-abc123445") in an OperatorExpression
 * Accepts a partial expression to use in an editor
 */
export function setOperatorExpressionValue(
  expression: Partial<QueryEditorOperatorExpression>,
  value: string
): QueryEditorOperatorExpression {
  return {
    type: QueryEditorExpressionType.Operator,
    property: expression.property ?? {
      type: QueryEditorPropertyType.String,
    },
    operator: {
      ...expression.operator,
      value,
    },
  };
}

/**
 * Given an array of Expressions, flattens them to the leaf Operator expressions.
 * Note, this loses context of any nested ANDs or ORs, so will not be useful once we support nested conditions
 */
function flattenOperatorExpressions(
  expressions: QueryEditorArrayExpression['expressions']
): QueryEditorOperatorExpression[] {
  return expressions.flatMap((expression) => {
    if (expression.type === QueryEditorExpressionType.Operator) {
      return expression;
    }

    if (expression.type === QueryEditorExpressionType.And || expression.type === QueryEditorExpressionType.Or) {
      return flattenOperatorExpressions(expression.expressions);
    }

    // Expressions that we don't expect to find in the WHERE filter will be ignored
    return [];
  });
}

/**
 * Returns a flattened list of WHERE filters, losing all context of nested filters or AND vs OR. Not suitable
 * if the UI supports nested conditions
 */
export function getFlattenedFilters(sql: SQLExpression): QueryEditorOperatorExpression[] {
  const where = sql.where;
  return flattenOperatorExpressions(where?.expressions ?? []);
}
