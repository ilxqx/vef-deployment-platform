import { Button, Col, Form, Icon, Modal, Notification, Popconfirm, Row, Space, Table, Toast } from "@douyinfe/semi-ui";
import type { ButtonProps } from "@douyinfe/semi-ui/lib/es/button";
import type { RuleItem } from "@douyinfe/semi-ui/lib/es/form";
import type { ColumnProps } from "@douyinfe/semi-ui/lib/es/table";
import { invoke } from "@tauri-apps/api";
import { isEmpty } from "radash";
import { type FunctionComponent, useCallback, useMemo, useRef, useState } from "react";

import { generateId } from "@/utils";
import SolarAddCircleLinear from "~icons/solar/add-circle-linear";
import SolarCheckReadOutline from "~icons/solar/check-read-outline";
import SolarPen2BoldDuotone from "~icons/solar/pen-2-bold-duotone";
import SolarTrashBinMinimalisticBoldDuotone from "~icons/solar/trash-bin-minimalistic-bold-duotone";
import SolarWiFiRouterBoldDuotone from "~icons/solar/wi-fi-router-bold-duotone";

import { HOSPITAL_SETTINGS } from "../hospital-settings";

export const SERVER_SETTINGS = "ServerSettingsList";

const { Input, InputNumber, Select } = Form;

const validationRules: Record<string, RuleItem[]> = {
  hospitalId: [{ required: true, message: "请选择医院" }],
  name: [{ required: true, message: "请输入名称" }],
  host: [
    { required: true, message: "请输入主机IP" },
    { pattern: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, message: "IP格式不正确" },
  ],
  port: [{ required: true, type: "number", message: "请输入端口" }],
  username: [{ required: true, message: "请输入用户名" }],
  password: [{ required: true, message: "请输入密码" }],
};

const okButtonProps: ButtonProps = {
  icon: <Icon svg={<SolarCheckReadOutline />} />,
};

const ServerSettingsPage: FunctionComponent = () => {
  const hospitalSettingsList: HospitalSettings[] = JSON.parse(localStorage.getItem(HOSPITAL_SETTINGS) || "[]");
  const hospitalOptions = useMemo(() => {
    return hospitalSettingsList.map(item => ({ label: item.name, value: item.id }));
  }, [hospitalSettingsList]);
  const [serverSettingsList, setServerSettingsList] = useState<ServerSettings[]>(
    JSON.parse(localStorage.getItem(SERVER_SETTINGS) || "[]"),
  );
  const serverSettingsColumns = useMemo<Array<ColumnProps<ServerSettings>>>(() => {
    return [
      {
        title: "医院",
        dataIndex: "hospitalId",
        render: value => {
          return <span>{hospitalOptions.find(item => item.value === value)?.label}</span>;
        },
      },
      {
        title: "名称",
        dataIndex: "name",
        width: 180,
      },
      {
        title: "主机IP",
        dataIndex: "host",
        width: 160,
      },
      {
        title: "端口",
        dataIndex: "port",
        align: "center",
        width: 80,
      },
      {
        title: "用户名",
        dataIndex: "username",
        width: 120,
      },
      {
        title: "密码",
        dataIndex: "password",
        width: 160,
      },
      {
        title: "操作",
        dataIndex: "operation",
        align: "center",
        width: 200,
        render: (_, settings) => {
          const { id } = settings;

          return (
            <Space>
              <Button
                icon={<Icon svg={<SolarPen2BoldDuotone />} />}
                theme="light"
                type="primary"
                onClick={() => {
                  setInitialSettings(settings);
                  setShowModal(true);
                }}
              >
                修改
              </Button>

              <Popconfirm
                content="确定要删除吗？"
                position="left"
                title="提示"
                onConfirm={() => {
                  const newList = serverSettingsList.filter(item => item.id !== id);
                  localStorage.setItem(SERVER_SETTINGS, JSON.stringify(newList));
                  setServerSettingsList(newList);
                  Toast.success("删除成功");
                }}
              >
                <Button icon={<Icon svg={<SolarTrashBinMinimalisticBoldDuotone />} />} theme="light" type="danger">删除</Button>
              </Popconfirm>
            </Space>
          );
        },
      },
    ];
  }, [serverSettingsList, hospitalOptions]);

  const [initialSettings, setInitialSettings] = useState<ServerSettings>();
  const [showModal, setShowModal] = useState(false);
  const onModalClose = useCallback(() => {
    setShowModal(false);
  }, []);
  const onAddButtonClick = useCallback(() => {
    setInitialSettings(undefined);
    setShowModal(true);
  }, []);
  const formRef = useRef<Form<ServerSettings>>(null);
  const triggerSubmit = useCallback((e: React.MouseEvent) => {
    formRef.current?.submit(e as unknown as React.FormEvent<HTMLFormElement>);
  }, []);
  const handleSubmit = useCallback((settings: ServerSettings) => {
    let newList;
    if (isEmpty(settings.id)) {
      settings.id = generateId();
      newList = [
        ...serverSettingsList,
        settings,
      ];
    } else {
      newList = serverSettingsList.map(item => {
        if (item.id === settings.id) {
          return settings;
        }
        return item;
      });
    }

    localStorage.setItem(SERVER_SETTINGS, JSON.stringify(newList));
    setServerSettingsList(newList);
    onModalClose();
    Toast.success("保存成功");
  }, [serverSettingsList, onModalClose]);

  const [testLoading, setTestLoading] = useState(false);
  const testConnection = useCallback(async () => {
    try {
      await formRef.current?.formApi.validate();
    } catch {
      Toast.warning("请先完善服务器信息");
      return;
    }

    const settings = formRef.current!.formApi.getValues();
    try {
      setTestLoading(true);
      const result = await invoke("test_ssh_connection", {
        serverSettings: {
          ...settings,
          id: settings.id ?? generateId(),
        },
      });
      Notification.success({
        title: "服务器连接成功",
        content: result,
        position: "top",
        duration: 5,
      });
    } catch (e: any) {
      Toast.error(e.message ?? e);
    } finally {
      setTestLoading(false);
    }
  }, []);

  return (
    <div className="flex flex-col gap-y-3">
      <div className="text-right">
        <Button icon={<Icon svg={<SolarAddCircleLinear />} />} theme="solid" onClick={onAddButtonClick}>
          添加服务器信息
        </Button>
      </div>

      <Table<ServerSettings> bordered columns={serverSettingsColumns} dataSource={serverSettingsList} pagination={false} rowKey="id" />

      <Modal
        mask={false}
        okButtonProps={okButtonProps}
        okText="保存"
        size="medium"
        title="服务器信息"
        visible={showModal}
        onCancel={onModalClose}
        onOk={triggerSubmit}
      >
        <Form<ServerSettings> ref={formRef} autoScrollToError initValues={initialSettings} labelAlign="right" labelPosition="left" labelWidth="80px" onSubmit={handleSubmit}>
          <div className="grid">
            <Row>
              <Col span={12}>
                <Select className="w-full" field="hospitalId" label="医院" optionList={hospitalOptions} rules={validationRules.hospitalId} />
              </Col>

              <Col span={12}>
                <Input field="name" label="名称" rules={validationRules.name} />
              </Col>
            </Row>

            <Row>
              <Col span={12}>
                <Input field="host" label="主机IP" rules={validationRules.host} />
              </Col>

              <Col span={12}>
                <InputNumber className="w-full" field="port" label="端口" max={65535} min={1} rules={validationRules.port} />
              </Col>
            </Row>

            <Row>
              <Col span={12}>
                <Input field="username" label="用户名" rules={validationRules.username} />
              </Col>

              <Col span={12}>
                <Input field="password" label="密码" rules={validationRules.password} />
              </Col>
            </Row>

            <Row>
              <Col span={24}>
                <Button className="ml-24" icon={<Icon svg={<SolarWiFiRouterBoldDuotone />} />} loading={testLoading} theme="solid" type="secondary" onClick={testConnection}>测试连接</Button>
              </Col>
            </Row>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ServerSettingsPage;
