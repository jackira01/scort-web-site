"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const security_middleware_1 = require("./middlewares/security.middleware");
const db_1 = require("./config/db");
const attribute_group_routes_1 = __importDefault(require("./modules/attribute-group/attribute-group.routes"));
const blog_routes_1 = __importDefault(require("./modules/blog/blog.routes"));
const cleanup_routes_1 = __importDefault(require("./modules/cleanup/cleanup.routes"));
const news_routes_1 = __importDefault(require("./modules/news/news.routes"));
const config_parameter_routes_1 = require("./modules/config-parameter/config-parameter.routes");
const feeds_routes_1 = __importDefault(require("./modules/feeds/feeds.routes"));
const filters_routes_1 = __importDefault(require("./modules/filters/filters.routes"));
const plans_routes_1 = __importDefault(require("./modules/plans/plans.routes"));
const profile_routes_1 = __importDefault(require("./modules/profile/profile.routes"));
const profile_verification_routes_1 = __importDefault(require("./modules/profile-verification/profile-verification.routes"));
const agency_conversion_routes_1 = __importDefault(require("./routes/agency-conversion.routes"));
const auth_1 = __importDefault(require("./routes/auth"));
const email_routes_1 = __importDefault(require("./routes/email.routes"));
const email_inbox_1 = require("./modules/email-inbox");
const invoice_routes_1 = __importDefault(require("./modules/payments/invoice.routes"));
const coupons_1 = require("./modules/coupons");
const sponsored_profiles_1 = require("./modules/sponsored-profiles");
const content_1 = require("./modules/content");
const user_routes_1 = __importDefault(require("./modules/user/user.routes"));
const emails_1 = __importDefault(require("./routes/admin/emails"));
const visibility_middleware_1 = require("./middlewares/visibility.middleware");
dotenv_1.default.config();
(0, db_1.connectDB)();
const { ORIGIN_ALLOWED, ENVIROMENT } = process.env;
const app = (0, express_1.default)();
const whitelist = JSON.parse(ORIGIN_ALLOWED || '[]');
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || whitelist.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
};
if (ENVIROMENT === 'development') {
    app.use((0, cors_1.default)());
}
else {
    app.use((0, cors_1.default)(corsOptions));
}
app.use((0, compression_1.default)({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression_1.default.filter(req, res);
    },
    threshold: 1024,
    level: 6,
}));
app.use(security_middleware_1.securityMiddleware);
app.use(security_middleware_1.generalRateLimit);
app.use(express_1.default.json({
    limit: '10mb',
    type: ['application/json', 'text/plain']
}));
app.use(express_1.default.urlencoded({
    extended: true,
    limit: '10mb',
    parameterLimit: 1000
}));
if (process.env.NODE_ENV === 'production') {
    app.use((0, morgan_1.default)('combined'));
}
else {
    app.use((0, morgan_1.default)('dev'));
}
app.get('/ping', (req, res) => {
    res.json({ message: 'pong', timestamp: new Date().toISOString() });
});
app.get('/', (req, res) => {
    res.send('Backend API is running 🚀');
});
app.use('/api/attribute-groups', attribute_group_routes_1.default);
app.use('/api/blogs', blog_routes_1.default);
app.use('/api/cleanup', cleanup_routes_1.default);
app.use('/api/news', news_routes_1.default);
app.use('/api/config-parameters', config_parameter_routes_1.configParameterRoutes);
app.use('/api/feeds', security_middleware_1.publicApiRateLimit, visibility_middleware_1.enforceVisibilityForFeeds, feeds_routes_1.default);
app.use('/api/filters', filters_routes_1.default);
app.use('/api/plans', plans_routes_1.default);
app.use('/api/profile', profile_routes_1.default);
app.use('/api/profile-verification', profile_verification_routes_1.default);
app.use('/api/agency-conversion', agency_conversion_routes_1.default);
app.use('/api/auth', security_middleware_1.authRateLimit, auth_1.default);
app.use('/api/email', email_routes_1.default);
app.use('/api/email-inbox', email_inbox_1.emailInboxRoutes);
app.use('/api/invoices', invoice_routes_1.default);
app.use('/api/coupons', coupons_1.couponRoutes);
app.use('/api/sponsored-profiles', security_middleware_1.publicApiRateLimit, sponsored_profiles_1.sponsoredProfilesRoutes);
app.use('/api/content', content_1.contentRoutes);
app.use('/api/user', user_routes_1.default);
app.use('/api/admin/emails', emails_1.default);
exports.default = app;
