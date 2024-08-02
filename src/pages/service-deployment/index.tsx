import { Button, Input, Space, Toast } from "@douyinfe/semi-ui";
import { invoke } from "@tauri-apps/api";
import type { UnlistenFn } from "@tauri-apps/api/event";
import { appWindow } from "@tauri-apps/api/window";
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import type { FunctionComponent } from "react";
import { memo, useCallback, useEffect, useState } from "react";
import { useXTerm, type UseXTermProps } from "react-xtermjs";

const fitAddon = new FitAddon();
const webglAddon = new WebglAddon();
webglAddon.onContextLoss(() => {
  webglAddon.dispose();
});
const xtermAddons = [fitAddon, webglAddon];
const options: UseXTermProps = {
  addons: xtermAddons,
  options: {
    fontSize: 18,
    // fontFamily: "JetBrains Mono",
    cursorStyle: "block",
    cursorInactiveStyle: "none",
    disableStdin: true,
    convertEol: true,
    theme: {
      background: "#ffffff",
      cursor: "#ffffff",
      cursorAccent: "#ffffff",
      foreground: "#333333",
    },
  },
};
const ServiceDeployment: FunctionComponent = () => {
  const { instance, ref } = useXTerm(options);
  useEffect(() => {
    const resizeEventHandler = () => {
      fitAddon.fit();
    };
    resizeEventHandler();
    window.addEventListener("resize", resizeEventHandler);

    return () => {
      window.removeEventListener("resize", resizeEventHandler);
    };
  }, []);

  const serverSettingsList: ServerSettings[] = JSON.parse(localStorage.getItem("ServerSettingsList") || "[]");
  const [command, setCommand] = useState("");
  const handleValueChange = useCallback((value: string) => {
    setCommand(value);
  }, []);
  const executeCommand = useCallback(() => {
    invoke("execute_command_stream", {
      serverSettings: serverSettingsList[0],
      command,
    })
      .catch(e => {
        Toast.error(e?.message ?? e);
      });
  }, [command, serverSettingsList]);

  useEffect(() => {
    let stopFn: UnlistenFn | null = null;
    appWindow.listen<{ data: string }>("command-result", ({ payload: { data } }) => {
      instance?.writeln(data);
    })
      .then(fn => stopFn = fn);

    return () => {
      stopFn?.();
    };
  }, [instance]);

  return (
    <div>
      <h1 className="text-2xl">执行命令：</h1>

      <Space className="w-full">
        <Input value={command} onChange={handleValueChange} />
        <Button theme="solid" onClick={executeCommand}>执行</Button>
      </Space>

      <h2>执行结果：</h2>
      <div ref={ref} className="overflow-hidden rounded-semi-border-radius-medium border border-solid border-semi-color-border p-3" />
    </div>
  );
};

const ServiceDeploymentPage = memo(ServiceDeployment);
export default ServiceDeploymentPage;
