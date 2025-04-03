import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("register", "routes/register.tsx"),
    route("login", "routes/login.tsx"),
    route("createTable/:player_id", "routes/createTable.tsx"),      // ADD TOKEN
    route("joinTable/:player_id", "routes/joinTable.tsx"),          // ADD TOKEN
    route("table/:player_id/:table_id/", "routes/table.tsx"),       // ADD TOKEN
    route("viewStatistics", "routes/viewStatistics.tsx")
] satisfies RouteConfig;
