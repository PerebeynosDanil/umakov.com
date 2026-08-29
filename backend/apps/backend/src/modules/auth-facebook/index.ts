import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import { FacebookAuthService } from "./service";

export default ModuleProvider(Modules.AUTH, {
  services: [FacebookAuthService],
});
