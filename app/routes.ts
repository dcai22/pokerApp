import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("register", "routes/register.tsx"),
    route("login", "routes/login.tsx"),
    route("createTable/:player_id", "routes/createTable.tsx"),
    route("joinTable/:player_id", "routes/joinTable.tsx"),       // TODO: change routing to use player_id
    route("table/:player_id/:table_id", "routes/table.tsx"),   // TODO: change routing to use player_id and table_id
    route("viewStatistics", "routes/viewStatistics.tsx")
] satisfies RouteConfig;
