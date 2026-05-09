import { create } from "zustand";

type QuizState = {
  answers: Record<string, string>;
  setAnswer: (id: string, value: string) => void;
  reset: () => void;
};

export const useQuizStore = create<QuizState>((set) => ({
  answers: {},
  setAnswer: (id, value) =>
    set((s) => ({ answers: { ...s.answers, [id]: value } })),
  reset: () => set({ answers: {} }),
}));
