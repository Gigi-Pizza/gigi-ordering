// The ordering stack is imported as @esm.sh/* (resolved at runtime via the import
// map, kept external in the production build). For tsc, map each to the real
// installed package's types. (@esm.sh/react is declared in esm-sh-react.d.ts.)
declare module "@esm.sh/effect" {
  export * from "effect";
}
declare module "@esm.sh/xstate" {
  export * from "xstate";
}
declare module "@esm.sh/@xstate/react" {
  export * from "@xstate/react";
}
declare module "@esm.sh/@tanstack/react-form" {
  export * from "@tanstack/react-form";
}
declare module "@esm.sh/react-dom/client" {
  export * from "react-dom/client";
}
