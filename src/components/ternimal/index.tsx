import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { forwardRef, memo, useEffect, useImperativeHandle } from "react";
import { useXTerm, type UseXTermProps } from "react-xtermjs";

export type TerminalRef = {
  write: (data: string) => void;
  writeln: (data: string) => void;
  reset: () => void;
};

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
    lineHeight: 1.2,
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
const InternalTerminal = forwardRef<TerminalRef>(function OriginalTerminal(_, forwardedRef) {
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

  useImperativeHandle(forwardedRef, () => {
    return {
      write: (data: string) => {
        instance?.write(data);
      },
      writeln: (data: string) => {
        instance?.writeln(data);
      },
      reset: () => {
        instance?.reset();
      },
    };
  });

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-semi-border-radius-medium border border-solid border-semi-color-border p-3"
      style={{
        height: "calc(100vh - 51px - 42px - 10px)",
        width: "calc(100vw - 280px - 42px - 21px)",
      }}
    />
  );
});

const Terminal = memo(InternalTerminal);
export default Terminal;
