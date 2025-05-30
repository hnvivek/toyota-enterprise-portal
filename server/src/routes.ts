import { BranchController } from "./controllers/BranchController";
import { DashboardController } from "./controllers/DashboardController";
import { checkJwt } from "./middleware/checkJwt";

export const Routes = [{
    method: "get",
    route: "/api/branches",
    controller: BranchController,
    action: "all",
    middleware: [checkJwt]
}, {
    method: "get",
    route: "/api/dashboard/summary",
    controller: DashboardController,
    action: "summary",
    middleware: [checkJwt]
}, {
    method: "get",
    route: "/api/events/recent",
    controller: DashboardController,
    action: "recentEvents",
    middleware: [checkJwt]
}]; 