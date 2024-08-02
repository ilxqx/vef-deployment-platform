import { configureStore } from "@reduxjs/toolkit";

import flowExecutionReducer from "./features/flow-execution-slice";
import userReducer from "./features/user-slice";

export const store = configureStore({
  reducer: {
    flowExecution: flowExecutionReducer,
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
