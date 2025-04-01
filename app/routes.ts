import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("register", "routes/register.tsx"),
    route("createTable/:username", "routes/createTable.tsx"),   // TODO: change routing to use player_id
    route("joinTable/:username", "routes/joinTable.tsx"),       // TODO: change routing to use player_id
    route("table/:username/:table_id", "routes/table.tsx"),     // TODO: change routing to use player_id
    route("viewStatistics", "routes/viewStatistics.tsx")
] satisfies RouteConfig;
