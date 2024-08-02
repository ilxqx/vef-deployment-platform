import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { invoke } from "@tauri-apps/api";

import type { RootState } from "..";

export type FlowExecutionState = {
  currentFlow: FlowDefinition | null;
  currentStep: number;
  status: "idle" | "running" | "succeeded" | "failed";
  errorMessage: string | null;
};

const initialState: FlowExecutionState = {
  currentFlow: null,
  currentStep: 0,
  status: "idle",
  errorMessage: null,
};

export const executeFlow = createAsyncThunk("flowExecution/executeFlow", async ({ hospitalSettings, serverSettings, args }: {
  hospitalSettings: HospitalSettings;
  serverSettings: ServerSettings;
  args: Record<string, any>;
}, { getState }) => {
  const state = getState() as RootState;
  return await invoke("execute_flow", {
    hospitalSettings,
    serverSettings,
    flowName: state.flowExecution.currentFlow?.name,
    args,
  });
});

export const flowExecutionSlice = createSlice({
  name: "flowExecution",
  initialState,
  reducers: {
    changeFlowStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    clearFlowExecution: state => {
      state.currentFlow = null;
      state.currentStep = 0;
      state.status = "idle";
      state.errorMessage = null;
    },
    setFlowExecution: (state, action: PayloadAction<FlowDefinition>) => {
      state.currentFlow = action.payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(executeFlow.pending, state => {
        state.status = "running";
      })
      .addCase(executeFlow.fulfilled, state => {
        state.status = "succeeded";
      })
      .addCase(executeFlow.rejected, (state, action) => {
        state.status = "failed";
        state.errorMessage = action.error.message ?? null;
      });
  },
});

export const { changeFlowStep, clearFlowExecution, setFlowExecution } = flowExecutionSlice.actions;
export default flowExecutionSlice.reducer;
