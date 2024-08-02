import { ConfigProvider as UiConfigProvider } from "@douyinfe/semi-ui";
import zhCN from "@douyinfe/semi-ui/lib/es/locale/source/zh_CN";
import type { FunctionComponent, PropsWithChildren } from "react";

const ConfigProvider: FunctionComponent<PropsWithChildren> = props => {
  return (
    <UiConfigProvider locale={zhCN}>
      {props.children}
    </UiConfigProvider>
  );
};

export default ConfigProvider;
