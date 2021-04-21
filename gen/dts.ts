import { parse, Root, Service } from "../proto.ts";

export function serviceTyping(svc: Service) {
  const methods = Object.keys(svc.methods).map((name) => {
    const call = svc.methods[name];
    const req = call.requestType;
    const res = call.responseType;

    let returnType = `Promise<${res}>`;
    if (call.responseStream) {
      returnType = `AsyncGenerator<${res}>`;
    }
    return `  ${name}(request: ${req}): ${returnType};`;
  });

  return `export interface ${svc.name} {\n${methods.join("\n")}\n}`;
}

function* allServicesOf(root: Root): Generator<Service> {
  const svc = (root as unknown) as Service;
  if (root && svc.methods) {
    yield svc;
  }
  for (const key of Object.keys(root.nested || {})) {
    yield* allServicesOf(root.nested![key] as Root);
  }
}

export function fromProto(_root: string | Root): string {
  let root = _root as Root;
  if (typeof root === "string") {
    root = parse(root).root;
  }

  const services = [...allServicesOf(root)].map(serviceTyping);

  const dts = `
/* this code was generated by automated tool, 
   should not edit by hand */

${services.join("\n")}`;

  return dts.slice(1);
}
