import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type UserState = {
  name: string;
  age: number;
};

const initialState: UserState = {
  name: "Venus",
  age: 18,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    changeName: (state, action: PayloadAction<string>) => {
      state.name = action.payload;
    },
    changeAge: (state, action: PayloadAction<number>) => {
      state.age = action.payload;
    },
  },
});

export const { changeName, changeAge } = userSlice.actions;
export default userSlice.reducer;
