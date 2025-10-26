const HANDICRAFTS_TABLE = process.env.HANDICRAFTS_TABLE || "handicrafts-dev" ;
const CART_TABLE = process.env.CART_TABLE || "carts-dev";
const SESSIONS_TABLE = process.env.SESSIONS_TABLE || "session-dev";

module.exports = {
    HANDICRAFTS_TABLE,
    CART_TABLE,
    SESSIONS_TABLE
}