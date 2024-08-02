import { createBrowserRouter, Navigate } from "react-router-dom";

import FlowExecutionPage from "@/pages/flow-execution";
import HospitalSettingsPage from "@/pages/hospital-settings";

import DefaultLayout from "../layouts/default";
import DeploymentFlowPage from "../pages/deployment-flow";
import ServerSettingsPage from "../pages/server-settings/index";

const router = createBrowserRouter([
  {
    path: "/",
    element: <DefaultLayout />,
    children: [
      {
        index: true,
        element: <Navigate replace to="/hospital-settings" />,
      },
      {
        path: "hospital-settings",
        element: <HospitalSettingsPage />,
      },
      {
        path: "server-settings",
        element: <ServerSettingsPage />,
      },
      {
        path: "deployment-flow",
        element: <DeploymentFlowPage />,
      },
      {
        path: "flow-execution",
        element: <FlowExecutionPage />,
      },
    ],
  },
]);

export default router;
