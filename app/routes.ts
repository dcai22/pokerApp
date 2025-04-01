import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("register", "routes/register.tsx"),
    route("createTable", "routes/createTable.tsx"),
    route("joinTable", "routes/joinTable.tsx"),
    route("table", "routes/table.tsx"),
    route("viewStatistics", "routes/viewStatistics.tsx")
] satisfies RouteConfig;
