import { create } from "zustand";
import uuid from "react-uuid";

/** user의 정보는 페이지 최초 진입 시에 설정하도록 한다. */
const useStore = create((set) => ({
  user: {
    id: uuid().toString(),
    nickName: "user-123",
    key: "user-1",
    sessionId: undefined,
  },
  setUser: (newUser) => set({ user: newUser }),
}));

export default useStore;
