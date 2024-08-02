import { Button, Col, Form, Icon, Modal, Progress, Row, Select, Spin, Steps, Toast } from "@douyinfe/semi-ui";
import type { ButtonProps } from "@douyinfe/semi-ui/lib/es/button";
import type { RuleItem } from "@douyinfe/semi-ui/lib/es/form";
import type { UnlistenFn } from "@tauri-apps/api/event";
import { appWindow } from "@tauri-apps/api/window";
import { isEmpty } from "radash";
import { type FunctionComponent, memo, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { FormFilePicker } from "@/components/file-picker";
import Terminal, { type TerminalRef } from "@/components/ternimal";
import { changeFlowStep, clearFlowExecution, executeFlow, type FlowExecutionState, setFlowExecution } from "@/store/features/flow-execution-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import SolarHospitalBoldDuotone from "~icons/solar/hospital-bold-duotone";
import SolarPlayCircleBoldDuotone from "~icons/solar/play-circle-bold-duotone";
import SolarPlayCircleOutline from "~icons/solar/play-circle-outline";
import SolarServer2BoldDuotone from "~icons/solar/server-2-bold-duotone";

import { HOSPITAL_SETTINGS } from "../hospital-settings";
import { SERVER_SETTINGS } from "../server-settings";

function calculateDescription(flowExecution: FlowExecutionState, index: number): ReactNode {
  if (flowExecution.status === "idle" || index > flowExecution.currentStep) {
    return "待执行";
  }
  if (index < flowExecution.currentStep) {
    return <span className="text-green-500">执行成功</span>;
  }
  if (index === flowExecution.currentStep) {
    if (flowExecution.status === "failed") {
      return (
        <span className="text-red-500">
          执行失败:
          {" "}
          {flowExecution.errorMessage}
        </span>
      );
    } else if (flowExecution.status === "succeeded") {
      return <span className="text-green-500">执行成功</span>;
    } else {
      return <span className="text-indigo-500">执行中...</span>;
    }
  }
}
function calculateTitle(flowExecution: FlowExecutionState, index: number): ReactNode {
  const title = flowExecution.currentFlow?.steps[index].name;
  if (flowExecution.status === "idle" || index > flowExecution.currentStep) {
    return title;
  }
  if (index < flowExecution.currentStep) {
    return <span className="font-bold text-green-500">{title}</span>;
  }
  if (index === flowExecution.currentStep) {
    if (flowExecution.status === "failed") {
      return <span className="font-bold text-red-500">{title}</span>;
    } else if (flowExecution.status === "succeeded") {
      return <span className="font-bold text-green-500">{title}</span>;
    } else {
      return <span className="font-bold text-indigo-500">{title}</span>;
    }
  }
}

const okButtonProps: ButtonProps = {
  icon: <Icon svg={<SolarPlayCircleOutline />} />,
};

const { Input, InputNumber } = Form;

const FlowExecution: FunctionComponent = () => {
  const dispatch = useAppDispatch();
  const flowExecution = useAppSelector(({ flowExecution }) => {
    return flowExecution;
  });
  const location = useLocation();
  useEffect(() => {
    const flowDefinition = location.state as FlowDefinition;
    dispatch(clearFlowExecution());
    dispatch(setFlowExecution(flowDefinition));
  }, [dispatch, location]);

  const terminalRef = useRef<TerminalRef>(null);
  useEffect(() => {
    let stopFn: UnlistenFn | null = null;
    appWindow.listen<{ data: string }>("command-result", ({ payload: { data } }) => {
      terminalRef.current?.write(data);
    })
      .then(fn => stopFn = fn);

    return () => {
      stopFn?.();
    };
  }, [terminalRef]);

  useEffect(() => {
    let stopFn: UnlistenFn | null = null;
    appWindow.listen<{ data: number }>("flow-step-change", ({ payload: { data } }) => {
      dispatch(changeFlowStep(data));
    })
      .then(fn => stopFn = fn);

    return () => {
      stopFn?.();
    };
  }, [dispatch]);

  useEffect(() => {
    let stopFn: UnlistenFn | null = null;
    appWindow.listen<ProgressReporterEvent>("file-progress", ({ payload }) => {
      setCurrentProgress(prevProgress => {
        if (payload.progressPercent === 100) {
          return {
            totalSize: 0,
            totalSizeFormat: "",
            processedSize: 0,
            processedSizeFormat: "",
            progressPercent: 0,
          };
        }
        if (prevProgress.progressPercent < payload.progressPercent) {
          return {
            ...payload,
            progressPercent: Number(payload.progressPercent.toFixed(0)),
          };
        }

        return prevProgress;
      });
    })
      .then(fn => stopFn = fn);

    return () => {
      stopFn?.();
    };
  }, []);

  const hospitalSettingsList: HospitalSettings[] = JSON.parse(localStorage.getItem(HOSPITAL_SETTINGS) || "[]");
  const hospitalOptions = hospitalSettingsList.map(item => ({ label: item.name, value: item.id }));
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>();

  const serverSettingsList: ServerSettings[] = JSON.parse(localStorage.getItem(SERVER_SETTINGS) || "[]");
  const serverOptions = useMemo(() => {
    return serverSettingsList
      .filter(serverSettings => serverSettings.hospitalId === selectedHospitalId)
      .map(serverSettings => ({
        label: serverSettings.name,
        value: serverSettings.id,
      }));
  }, [serverSettingsList, selectedHospitalId]);
  const [selectedServerId, setSelectedServerId] = useState<string>();

  const dispatchFlowExecution = useCallback(() => {
    if (isEmpty(selectedServerId)) {
      Toast.warning("请先选择一个服务器");
      return;
    }

    if (flowExecution.currentFlow?.parameters.length) {
      setShowModal(true);
      return;
    }

    const hospitalSettings = hospitalSettingsList.find(hospitalSettings => hospitalSettings.id === selectedHospitalId)!;
    const serverSettings = serverSettingsList.find(serverSettings => serverSettings.id === selectedServerId)!;
    dispatch(
      executeFlow({
        hospitalSettings,
        serverSettings,
        args: {},
      }),
    );
  }, [dispatch, selectedHospitalId, hospitalSettingsList, selectedServerId, serverSettingsList, flowExecution]);

  const [currentProgress, setCurrentProgress] = useState<ProgressReporterEvent>({
    totalSize: 0,
    totalSizeFormat: "",
    processedSize: 0,
    processedSizeFormat: "",
    progressPercent: 0,
  });

  const formatPercent = useCallback((percent: number) => {
    return (
      <div className="flex flex-col items-center gap-y-2">
        <span className="text-4xl font-bold text-blue-500">
          {percent}
          {" "}
          %
        </span>

        <span className="text-lg font-semibold">
          <span className="text-green-500">{currentProgress.processedSizeFormat}</span>
          {" "}
          /
          {" "}
          <span className="text-slate-500">{currentProgress.totalSizeFormat}</span>
        </span>
      </div>
    );
  }, [currentProgress]);

  const [showModal, setShowModal] = useState(false);
  const onModalClose = useCallback(() => {
    setShowModal(false);
  }, []);
  const formRef = useRef<Form>(null);
  const triggerSubmit = useCallback((e: React.MouseEvent) => {
    formRef.current?.submit(e as unknown as React.FormEvent<HTMLFormElement>);
  }, []);
  const handleSubmit = useCallback((values: any) => {
    const hospitalSettings = hospitalSettingsList.find(hospitalSettings => hospitalSettings.id === selectedHospitalId)!;
    const serverSettings = serverSettingsList.find(serverSettings => serverSettings.id === selectedServerId)!;
    dispatch(
      executeFlow({
        hospitalSettings,
        serverSettings,
        args: values,
      }),
    );
    onModalClose();
  }, [dispatch, selectedHospitalId, hospitalSettingsList, selectedServerId, serverSettingsList, onModalClose]);

  return (
    <div className="h-full">
      <div className="flex size-full flex-row gap-x-6">
        <div className="flex w-80 flex-col gap-y-6">
          <Select optionList={hospitalOptions} placeholder="请选择医院" prefix={<Icon size="large" svg={<SolarHospitalBoldDuotone />} />} size="large" value={selectedHospitalId} onSelect={value => setSelectedHospitalId(value as string)} />
          <Select optionList={serverOptions} placeholder="请选择服务器" prefix={<Icon size="large" svg={<SolarServer2BoldDuotone />} />} size="large" value={selectedServerId} onSelect={value => setSelectedServerId(value as string)} />

          <div className="flex flex-row items-center justify-between gap-x-3">
            <h2 className="text-lg font-bold text-slate-700">{flowExecution.currentFlow?.name}</h2>
            <Button icon={<Icon size="large" svg={<SolarPlayCircleBoldDuotone />} />} onClick={dispatchFlowExecution} />
          </div>

          <div className="h-[calc(100vh-102px-175px)] overflow-y-auto">
            <Steps current={flowExecution.currentStep} direction="vertical" status={flowExecution.status === "idle" ? "wait" : flowExecution.status === "running" ? "process" : flowExecution.status === "succeeded" ? "finish" : "error"} type="basic">
              {
                flowExecution.currentFlow?.steps.map((step, index) => {
                  if (flowExecution.currentStep === index && flowExecution.status === "running") {
                    return (
                      <Steps.Step
                        key={step.name}
                        description={calculateDescription(flowExecution, index)}
                        icon={<div className="flex size-[24px] items-center justify-center"><Spin /></div>}
                        title={calculateTitle(flowExecution, index)}
                      />
                    );
                  }

                  return (
                    <Steps.Step
                      key={step.name}
                      description={calculateDescription(flowExecution, index)}
                      title={calculateTitle(flowExecution, index)}
                    />
                  );
                })
              }
            </Steps>
          </div>

          <Modal
            mask={false}
            okButtonProps={okButtonProps}
            okText="启动"
            size="medium"
            title="启动参数"
            visible={showModal}
            onCancel={onModalClose}
            onOk={triggerSubmit}
          >
            <Form ref={formRef} autoScrollToError labelAlign="right" labelPosition="left" labelWidth="160px" onSubmit={handleSubmit}>
              <div className="grid">
                <Row>
                  {
                    flowExecution.currentFlow?.parameters.map(param => {
                      const rules: RuleItem[] = param.required
                        ? param.type === "text"
                          ? [{ type: "string", required: true, message: "此参数必须" }]
                          : param.type === "number"
                            ? [{ type: "number", required: true, message: "此参数必须" }]
                            : param.type === "file" && !param.multiple
                              ? [{ type: "string", required: true, message: "此参数必须" }]
                              : param.type === "file" && param.multiple
                                ? [{ type: "array", required: true, message: "此参数必须" }]
                                : []
                        : [];

                      const component = param.type === "text"
                        ? <Input field={param.name} label={param.label} rules={rules} />
                        : param.type === "number"
                          ? <InputNumber className="w-full" field={param.name} label={param.label} rules={rules} />
                          : param.type === "file"
                            ? <FormFilePicker field={param.name} label={param.label} multiple={param.multiple} rules={rules} />
                            : <div>unknown type</div>;

                      return (
                        <Col key={param.name} span={24}>
                          {component}
                        </Col>
                      );
                    })
                  }
                </Row>
              </div>
            </Form>
          </Modal>
        </div>

        <div className="relative h-full">
          <Terminal ref={terminalRef} />

          {
            currentProgress.progressPercent > 0 && currentProgress.progressPercent < 100 && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90">
                <Progress
                  showInfo
                  aria-label="file download speed"
                  format={formatPercent}
                  percent={currentProgress.progressPercent}
                  strokeWidth={16}
                  type="circle"
                  width={240}
                />
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
};

const FlowExecutionPage = memo(FlowExecution);
export default FlowExecutionPage;
