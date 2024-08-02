import { Button, Col, Form, Icon, Modal, Popconfirm, Row, Space, Table, Toast } from "@douyinfe/semi-ui";
import type { ButtonProps } from "@douyinfe/semi-ui/lib/es/button";
import type { RuleItem } from "@douyinfe/semi-ui/lib/es/form";
import type { ColumnProps } from "@douyinfe/semi-ui/lib/es/table";
import { isEmpty } from "radash";
import { type FunctionComponent, memo, useCallback, useMemo, useRef, useState } from "react";

import { generateId } from "@/utils";
import SolarAddCircleLinear from "~icons/solar/add-circle-linear";
import SolarCheckReadOutline from "~icons/solar/check-read-outline";
import SolarPen2BoldDuotone from "~icons/solar/pen-2-bold-duotone";
import SolarTrashBinMinimalisticBoldDuotone from "~icons/solar/trash-bin-minimalistic-bold-duotone";

export const HOSPITAL_SETTINGS = "HospitalSettingsList";

const { Input } = Form;

const ipRule = { pattern: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, message: "IP格式不正确" };
const validationRules: Record<string, RuleItem[]> = {
  name: [{ required: true, message: "请输入名称" }],
  mainServerIp: [
    { required: true, message: "请输入主服务IP" },
    ipRule,
  ],
  databaseServerIp: [
    { required: true, message: "请输入数据库服务IP" },
    ipRule,
  ],
  redisServerIp: [
    { required: true, message: "请输入Redis服务IP" },
    ipRule,
  ],
  minioServerIp: [
    { required: true, message: "请输入Minio文件服务IP" },
    ipRule,
  ],
  reportServerIp: [
    { required: true, message: "请输入报表服务IP" },
    ipRule,
  ],
  filePreviewServerIp: [
    { required: true, message: "请输入文件预览服务IP" },
    ipRule,
  ],
  dashboardServerIp: [
    { required: true, message: "请输入Dashboard服务IP" },
    ipRule,
  ],
  bigScreenServerIp: [
    { required: true, message: "请输入大屏服务IP" },
    ipRule,
  ],
};
const autoFillFields = ["databaseServerIp", "redisServerIp", "minioServerIp", "reportServerIp", "filePreviewServerIp", "dashboardServerIp", "bigScreenServerIp"] as const;

const okButtonProps: ButtonProps = {
  icon: <Icon svg={<SolarCheckReadOutline />} />,
};
const scrollConfig = { x: "max-content" };

const HospitalSettings: FunctionComponent = () => {
  const [hospitalSettingsList, setHospitalSettingsList] = useState<HospitalSettings[]>(
    JSON.parse(localStorage.getItem(HOSPITAL_SETTINGS) || "[]"),
  );
  const hospitalSettingsColumns = useMemo<Array<ColumnProps<HospitalSettings>>>(() => {
    return [
      {
        title: "名称",
        dataIndex: "name",
        width: 240,
      },
      {
        title: "主服务IP",
        dataIndex: "mainServerIp",
        width: 160,
      },
      {
        title: "数据库服务IP",
        dataIndex: "databaseServerIp",
        width: 160,
      },
      {
        title: "Redis服务IP",
        dataIndex: "redisServerIp",
        width: 160,
      },
      {
        title: "Minio文件服务IP",
        dataIndex: "minioServerIp",
        width: 160,
      },
      {
        title: "报表服务IP",
        dataIndex: "reportServerIp",
        width: 160,
      },
      {
        title: "文件预览服务IP",
        dataIndex: "filePreviewServerIp",
        width: 160,
      },
      {
        title: "Dashboard服务IP",
        dataIndex: "dashboardServerIp",
        width: 160,
      },
      {
        title: "大屏服务IP",
        dataIndex: "bigScreenServerIp",
        width: 160,
      },
      {
        title: "操作",
        dataIndex: "operation",
        align: "center",
        width: 200,
        fixed: "right",
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
                  const newList = hospitalSettingsList.filter(item => item.id !== id);
                  localStorage.setItem(HOSPITAL_SETTINGS, JSON.stringify(newList));
                  setHospitalSettingsList(newList);
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
  }, [hospitalSettingsList]);

  const [initialSettings, setInitialSettings] = useState<HospitalSettings>();
  const [showModal, setShowModal] = useState(false);
  const onModalClose = useCallback(() => {
    setShowModal(false);
  }, []);
  const onAddButtonClick = useCallback(() => {
    setInitialSettings(undefined);
    setShowModal(true);
  }, []);
  const formRef = useRef<Form<HospitalSettings>>(null);
  const triggerSubmit = useCallback((e: React.MouseEvent) => {
    formRef.current?.submit(e as unknown as React.FormEvent<HTMLFormElement>);
  }, []);
  const handleSubmit = useCallback((settings: HospitalSettings) => {
    let newList;
    if (isEmpty(settings.id)) {
      settings.id = generateId();
      newList = [
        ...hospitalSettingsList,
        settings,
      ];
    } else {
      newList = hospitalSettingsList.map(item => {
        if (item.id === settings.id) {
          return settings;
        }
        return item;
      });
    }

    localStorage.setItem(HOSPITAL_SETTINGS, JSON.stringify(newList));
    setHospitalSettingsList(newList);
    onModalClose();
    Toast.success("保存成功");
  }, [hospitalSettingsList, onModalClose]);

  const onMainServerIpChange = useCallback((mainServerIp: string) => {
    for (const field of autoFillFields) {
      const value = formRef.current?.formApi.getValue(field);
      if (!value || ((mainServerIp.startsWith(value) || value.startsWith(mainServerIp)) && Math.abs(mainServerIp.length - value.length) < 3)) {
        formRef.current?.formApi.setValue(field, mainServerIp);
      }
    }
  }, []);

  return (
    <div className="flex flex-col gap-y-3">
      <div className="text-right">
        <Button icon={<Icon svg={<SolarAddCircleLinear />} />} theme="solid" onClick={onAddButtonClick}>
          添加服务器信息
        </Button>
      </div>

      <Table<HospitalSettings> bordered columns={hospitalSettingsColumns} dataSource={hospitalSettingsList} pagination={false} rowKey="id" scroll={scrollConfig} />

      <Modal
        mask={false}
        okButtonProps={okButtonProps}
        okText="保存"
        size="medium"
        title="医院信息"
        visible={showModal}
        width={800}
        onCancel={onModalClose}
        onOk={triggerSubmit}
      >
        <Form<HospitalSettings> ref={formRef} autoScrollToError initValues={initialSettings} labelAlign="right" labelPosition="left" labelWidth="140px" onSubmit={handleSubmit}>
          <div className="grid">
            <Row>
              <Col span={24}>
                <Input field="name" label="名称" rules={validationRules.name} />
              </Col>
            </Row>

            <Row>
              <Col span={12}>
                <Input field="mainServerIp" label="主服务IP" rules={validationRules.mainServerIp} onChange={onMainServerIpChange} />
              </Col>

              <Col span={12}>
                <Input field="databaseServerIp" label="数据库服务IP" rules={validationRules.databaseServerIp} />
              </Col>
            </Row>

            <Row>
              <Col span={12}>
                <Input field="redisServerIp" label="Redis服务IP" rules={validationRules.redisServerIp} />
              </Col>

              <Col span={12}>
                <Input field="minioServerIp" label="Minio文件服务IP" rules={validationRules.minioServerIp} />
              </Col>
            </Row>

            <Row>
              <Col span={12}>
                <Input field="reportServerIp" label="报表服务IP" rules={validationRules.reportServerIp} />
              </Col>

              <Col span={12}>
                <Input field="filePreviewServerIp" label="文件预览服务IP" rules={validationRules.filePreviewServerIp} />
              </Col>
            </Row>

            <Row>
              <Col span={12}>
                <Input field="dashboardServerIp" label="Dashboard服务IP" rules={validationRules.dashboardServerIp} />
              </Col>

              <Col span={12}>
                <Input field="bigScreenServerIp" label="大屏服务IP" rules={validationRules.bigScreenServerIp} />
              </Col>
            </Row>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

const HospitalSettingsPage = memo(HospitalSettings);
export default HospitalSettingsPage;
