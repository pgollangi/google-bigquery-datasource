// COPIED FROM GRAFANA UI
import { GrafanaTheme } from '@grafana/data';

export const focusCss = (theme: GrafanaTheme) => `
  outline: 2px dotted transparent;
  outline-offset: 2px;
  box-shadow: 0 0 0 2px ${theme.colors.bodyBg}, 0 0 0px 4px ${theme.colors.formFocusOutline};
  transition: all 0.2s cubic-bezier(0.19, 1, 0.22, 1);
`;
