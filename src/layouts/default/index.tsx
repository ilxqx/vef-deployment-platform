import { Icon, Layout, Nav } from "@douyinfe/semi-ui";
import type { OnSelectedData } from "@douyinfe/semi-ui/lib/es/navigation";
import { isEmpty } from "radash";
import { type FunctionComponent, useCallback, useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

import logoImage from "@/assets/dh-logo.jpg";
import SolarHospitalBoldDuotone from "~icons/solar/hospital-bold-duotone";
import SolarServer2BoldDuotone from "~icons/solar/server-2-bold-duotone";
import SolarSettingsBoldDuotone from "~icons/solar/settings-bold-duotone";

const { Header, Content } = Layout;

const defaultSelectedKeys = ["ServerSettings"];
const routerMap = {
  HospitalSettings: "/hospital-settings",
  ServerSettings: "/server-settings",
  DeploymentFlow: "/deployment-flow",
};

const DefaultLayout: FunctionComponent = () => {
  const [selectedKeys, setSelectedKeys] = useState(defaultSelectedKeys);

  const onSelect = useCallback(({ selectedKeys }: OnSelectedData) => {
    setSelectedKeys(selectedKeys.map(item => item.toString()));
  }, []);

  const location = useLocation();
  useEffect(() => {
    if (isEmpty(selectedKeys)) {
      for (const [key, value] of Object.entries(routerMap)) {
        if (value === location.pathname) {
          setSelectedKeys([key]);
          break;
        }
      }
    } else {
      if (location.pathname !== routerMap[selectedKeys[0] as keyof typeof routerMap]) {
        setSelectedKeys([]);
      }
    }
  }, [location, selectedKeys]);

  return (
    <Layout className="h-full border-semi-color-border">
      <Header className="bg-semi-color-bg-1">
        <div>
          <Nav mode="horizontal" selectedKeys={selectedKeys} onSelect={onSelect}>
            <Nav.Header>
              <img className="w-24" src={logoImage} />
            </Nav.Header>

            <Link to="/hospital-settings">
              <Nav.Item icon={<Icon size="large" svg={<SolarHospitalBoldDuotone />} />} itemKey="HospitalSettings" text="医院设置" />
            </Link>

            <Link to="/server-settings">
              <Nav.Item icon={<Icon size="large" svg={<SolarSettingsBoldDuotone />} />} itemKey="ServerSettings" text="服务器设置" />
            </Link>

            <Link to="/deployment-flow">
              <Nav.Item icon={<Icon size="large" svg={<SolarServer2BoldDuotone />} />} itemKey="DeploymentFlow" text="服务部署" />
            </Link>
          </Nav>
        </div>
      </Header>

      <Content className="bg-semi-color-bg-0 p-6">
        <Outlet />
      </Content>
    </Layout>
  );
};

export default DefaultLayout;
