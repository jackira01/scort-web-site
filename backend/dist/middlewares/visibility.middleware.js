"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logHiddenProfileAccess = exports.getVisibilityFilter = exports.applyVisibilityFilter = exports.allowHiddenForAdmin = exports.enforceVisibilityForFeeds = exports.ensureVisibleProfiles = void 0;
const ensureVisibleProfiles = (req, res, next) => {
    if (!req.query.includeHidden) {
        req.query.visible = 'true';
    }
    next();
};
exports.ensureVisibleProfiles = ensureVisibleProfiles;
const enforceVisibilityForFeeds = (req, res, next) => {
    req.query.visible = 'true';
    delete req.query.includeHidden;
    next();
};
exports.enforceVisibilityForFeeds = enforceVisibilityForFeeds;
const allowHiddenForAdmin = (req, res, next) => {
    if (req.query.includeHidden !== 'true') {
        req.query.visible = 'true';
    }
    next();
};
exports.allowHiddenForAdmin = allowHiddenForAdmin;
const applyVisibilityFilter = (baseQuery, includeHidden = false) => {
    if (!includeHidden) {
        return baseQuery.where({ visible: true });
    }
    return baseQuery;
};
exports.applyVisibilityFilter = applyVisibilityFilter;
const getVisibilityFilter = (includeHidden = false) => {
    if (!includeHidden) {
        return { visible: true };
    }
    return {};
};
exports.getVisibilityFilter = getVisibilityFilter;
const logHiddenProfileAccess = (req, res, next) => {
    if (req.query.includeHidden === 'true') {
        console.log(`[Visibility] Admin access to hidden profiles from ${req.ip} at ${new Date().toISOString()}`);
    }
    next();
};
exports.logHiddenProfileAccess = logHiddenProfileAccess;
