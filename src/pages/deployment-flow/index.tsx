import { Col, Row } from "@douyinfe/semi-ui";
import type { Gutter } from "@douyinfe/semi-ui/lib/es/grid";
import { invoke } from "@tauri-apps/api";
import { cluster } from "radash";
import { type FunctionComponent, memo, type ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import FlowCard from "@/components/flow-card";
import TablerAppsFilled from "~icons/tabler/apps-filled";
import TablerBrandCodepen from "~icons/tabler/brand-codepen";
import TablerBrandDocker from "~icons/tabler/brand-docker";
import TablerBrandUbuntu from "~icons/tabler/brand-ubuntu";
import TablerBuildingHospital from "~icons/tabler/building-hospital";
import TablerChartHistogram from "~icons/tabler/chart-histogram";
import TablerCube3dSphere from "~icons/tabler/cube-3d-sphere";
import TablerDashboard from "~icons/tabler/dashboard";
import TablerDatabase from "~icons/tabler/database";
import TablerHexagonMinus from "~icons/tabler/hexagon-minus";
import TablerReport from "~icons/tabler/report";
import TablerServer2 from "~icons/tabler/server-2";
import TablerTestPipe from "~icons/tabler/test-pipe";

const iconMap: Record<string, ReactNode> = {
  docker: <TablerBrandDocker />,
  test: <TablerTestPipe />,
  ubuntu: <TablerBrandUbuntu />,
  server: <TablerServer2 />,
  database: <TablerDatabase />,
  report: <TablerReport />,
  dashboard: <TablerDashboard />,
  apps: <TablerAppsFilled />,
  chart: <TablerChartHistogram />,
  hospital: <TablerBuildingHospital />,
  redis: <TablerBrandCodepen />,
  minio: <TablerHexagonMinus />,
  base: <TablerCube3dSphere />,
};

const gutter: [Gutter, Gutter] = [16, 16];
const DeploymentFlow: FunctionComponent = () => {
  const [flows, setFlows] = useState<FlowDefinition[]>([]);
  useEffect(() => {
    const fetchData = async () => {
      const result = await invoke<FlowDefinition[]>(
        "list_flows",
      );
      setFlows(result);
    };
    fetchData();
  }, []);

  return (
    <div>
      {
        cluster(flows, 3).map((row, index) => {
          return (
            <Row key={index} gutter={gutter}>
              {
                row.map(flow => {
                  return (
                    <Col key={flow.name} span={8}>
                      <Link state={flow} to="/flow-execution">
                        <FlowCard description={flow.description} icon={iconMap[flow.icon]} title={flow.name} />
                      </Link>
                    </Col>
                  );
                })
              }
            </Row>
          );
        })
      }
    </div>
  );
};

const DeploymentFlowPage = memo(DeploymentFlow);
export default DeploymentFlowPage;
