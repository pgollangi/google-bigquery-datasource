// COPIED FROM GRAFANA UI
import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { stylesFactory } from '@grafana/ui';
import { getFocusStyle, sharedInputStyle } from './commonStyles';

interface StyleDeps {
  theme: GrafanaTheme2;
  invalid: boolean;
  width?: number;
}

export const getInputStyles = stylesFactory(({ theme, invalid = false, width }: StyleDeps) => {
  const prefixSuffixStaticWidth = '28px';
  const prefixSuffix = css`
    position: absolute;
    top: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-grow: 0;
    flex-shrink: 0;
    font-size: ${theme.typography.size.md};
    height: 100%;
    /* Min width specified for prefix/suffix classes used outside React component*/
    min-width: ${prefixSuffixStaticWidth};
    color: ${theme.colors.text.secondary};
  `;

  return {
    // Wraps inputWrapper and addons
    wrapper: cx(
      css`
        label: input-wrapper;
        display: flex;
        width: ${width ? `${theme.spacing(width)}` : '100%'};
        height: ${theme.spacing(theme.components.height.md)};
        border-radius: ${theme.shape.borderRadius()};
        &:hover {
          > .prefix,
          .suffix,
          .input {
            border-color: ${invalid ? theme.colors.error.border : theme.colors.primary.border};
          }

          // only show number buttons on hover
          input[type='number'] {
            -moz-appearance: number-input;
            -webkit-appearance: number-input;
            appearance: textfield;
          }

          input[type='number']::-webkit-inner-spin-button,
          input[type='number']::-webkit-outer-spin-button {
            -webkit-appearance: inner-spin-button !important;
            opacity: 1;
          }
        }
      `
    ),
    // Wraps input and prefix/suffix
    inputWrapper: css`
      label: input-inputWrapper;
      position: relative;
      flex-grow: 1;
      /* we want input to be above addons, especially for focused state */
      z-index: 1;

      /* when input rendered with addon before only*/
      &:not(:first-child):last-child {
        > input {
          border-left: none;
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
        }
      }

      /* when input rendered with addon after only*/
      &:first-child:not(:last-child) {
        > input {
          border-right: none;
          border-top-right-radius: 0;
          border-bottom-right-radius: 0;
        }
      }

      /* when rendered with addon before and after */
      &:not(:first-child):not(:last-child) {
        > input {
          border-right: none;
          border-top-right-radius: 0;
          border-bottom-right-radius: 0;
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
        }
      }

      input {
        /* paddings specified for classes used outside React component */
        &:not(:first-child) {
          padding-left: ${prefixSuffixStaticWidth};
        }
        &:not(:last-child) {
          padding-right: ${prefixSuffixStaticWidth};
        }
        &[readonly] {
          cursor: default;
        }
      }
    `,

    input: cx(
      getFocusStyle(theme.v1),
      sharedInputStyle(theme, invalid),
      css`
        label: input-input;
        position: relative;
        z-index: 0;
        flex-grow: 1;
        border-radius: ${theme.shape.borderRadius()};
        height: 100%;
        width: 100%;
      `
    ),
    inputDisabled: css`
      background-color: ${theme.colors.action.disabledBackground};
      color: ${theme.colors.action.disabledText};
      border: 1px solid ${theme.colors.action.disabledBackground};
      &:focus {
        box-shadow: none;
      }
    `,
    addon: css`
      label: input-addon;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-grow: 0;
      flex-shrink: 0;
      position: relative;

      &:first-child {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
        > :last-child {
          border-top-right-radius: 0;
          border-bottom-right-radius: 0;
        }
      }

      &:last-child {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
        > :first-child {
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
        }
      }
      > *:focus {
        /* we want anything that has focus and is an addon to be above input */
        z-index: 2;
      }
    `,
    prefix: cx(
      prefixSuffix,
      css`
        label: input-prefix;
        padding-left: ${theme.spacing(1)};
        padding-right: ${theme.spacing(0.5)};
        border-right: none;
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
      `
    ),
    suffix: cx(
      prefixSuffix,
      css`
        label: input-suffix;
        padding-left: ${theme.spacing(1)};
        padding-right: ${theme.spacing(1)};
        margin-bottom: -2px;
        border-left: none;
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
        right: 0;
      `
    ),
    loadingIndicator: css`
      & + * {
        margin-left: ${theme.spacing(0.5)};
      }
    `,
  };
});
