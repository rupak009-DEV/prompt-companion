import { createContext, useContext } from "react";

type TemplateSelectFn = (prompt: string, model: string) => void;

const TemplateContext = createContext<TemplateSelectFn | undefined>(undefined);

export const TemplateProvider = TemplateContext.Provider;

export function useTemplateSelect() {
  return useContext(TemplateContext);
}
