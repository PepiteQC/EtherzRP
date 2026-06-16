import type { ComponentType } from "react";
import * as AdminConsoleModule from "../../admin/AdminConsole";

const adminConsoleExports = AdminConsoleModule as Record<string, unknown>;
const AdminConsole = (adminConsoleExports.default ?? adminConsoleExports.AdminConsole) as ComponentType<any>;

export default AdminConsole;
export * from "../../admin/AdminConsole";
