/* SystemJS module definition */
declare var module: NodeModule;
interface NodeModule {
  id: string;
}

declare module "*.json" {
  const value: any;
  export default value;
}

declare module "*.jpg" {
  const value: any;
  export default value;
}
declare module "*.png" {
  const value: any;
  export default value;
}
