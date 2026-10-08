import { createTheme } from "flowbite-react";

export const flowbiteTheme = createTheme({
  button: {
    base: "font-bold border-2 border-tinta rounded-md min-h-11 px-5 transition-[transform,box-shadow] duration-100 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
    color: {
      primary: "bg-pulpen text-white shadow-hard hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
      secondary: "bg-kertas text-tinta shadow-hard hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
      highlight: "bg-kuning text-karbon border-karbon shadow-hard hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
      failure: "bg-stempel text-white shadow-hard hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
    },
  },
  card: {
    root: {
      base: "bg-kertas border-2 border-tinta rounded-[10px] overflow-hidden",
    },
  },
  textInput: {
    field: {
      input: {
        base: "bg-kertas border-2 border-tinta rounded-md min-h-11 px-3 placeholder:text-tinta-pudar text-tinta focus:ring-0 focus:shadow-[3px_3px_0_0_var(--pulpen)] w-full text-base",
      },
    },
  },
  textarea: {
    base: "bg-kertas border-2 border-tinta rounded-md p-3 placeholder:text-tinta-pudar text-tinta focus:ring-0 focus:shadow-[3px_3px_0_0_var(--pulpen)] w-full text-base",
  },
  select: {
    field: {
      select: {
        base: "bg-kertas border-2 border-tinta rounded-md min-h-11 px-3 text-tinta focus:ring-0 focus:shadow-[3px_3px_0_0_var(--pulpen)] w-full text-base",
      },
    },
  },
  badge: {
    root: {
      base: "inline-flex items-center gap-1.5 border-2 border-tinta rounded-full px-3 py-1 text-sm font-semibold text-tinta",
    },
  },
  modal: {
    content: {
      base: "relative h-full w-full p-4 md:h-auto",
      inner: "relative rounded-[10px] bg-kertas border-2 border-tinta shadow-hard-lg flex flex-col max-h-[90vh]",
    },
    header: {
      base: "flex items-start justify-between rounded-t-[10px] p-5 border-b-2 border-dashed border-tinta/30",
    },
    body: {
      base: "p-6 flex-1 overflow-auto",
    },
    footer: {
      base: "flex items-center justify-end gap-3 rounded-b-[10px] p-5 border-t-2 border-dashed border-tinta/30",
    },
  },
});
