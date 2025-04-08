import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("register", "routes/register.tsx"),
    route("login", "routes/login.tsx"),
    route("createTable", "routes/createTable.tsx"),
    route("joinTable", "routes/joinTable.tsx"),
    route("table/:table_id", "routes/table.tsx"),
    route("viewStatistics", "routes/viewStatistics.tsx"),
    route("test", "routes/test.tsx"),
] satisfies RouteConfig;
