import type { FunctionComponent } from "react";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";

import router from "../router";
import { store } from "../store";
import ConfigProvider from "./config-provider";

const App: FunctionComponent = () => {
  return (
    <Provider store={store}>
      <ConfigProvider>
        <RouterProvider router={router} />
      </ConfigProvider>
    </Provider>
  );
};

export default App;
