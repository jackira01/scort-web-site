"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGroup = exports.removeVariant = exports.addVariant = exports.deleteGroup = exports.patchVariant = exports.getByKey = exports.list = exports.create = void 0;
const service = __importStar(require("./attribute-group.service"));
const create = async (req, res) => {
    try {
        const group = await service.createAttributeGroup(req.body);
        res.status(201).json(group);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating attribute group', error });
    }
};
exports.create = create;
const list = async (_, res) => {
    const groups = await service.getAttributeGroups();
    res.json(groups);
};
exports.list = list;
const getByKey = async (req, res) => {
    const group = await service.getAttributeGroupByKey(req.params.key);
    if (!group)
        return res.status(404).json({ message: 'Not found' });
    res.json(group);
};
exports.getByKey = getByKey;
const patchVariant = async (req, res) => {
    try {
        const updated = await service.updateVariant(req.body);
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating variant', error });
    }
};
exports.patchVariant = patchVariant;
const deleteGroup = async (req, res) => {
    try {
        await service.deleteAttributeGroup(req.params.id);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting attribute group', error });
    }
};
exports.deleteGroup = deleteGroup;
const addVariant = async (req, res) => {
    try {
        const updated = await service.addVariant(req.params.id, req.body);
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ message: 'Error adding variant', error });
    }
};
exports.addVariant = addVariant;
const removeVariant = async (req, res) => {
    try {
        const { variantIndex } = req.body;
        const updated = await service.removeVariant(req.params.id, variantIndex);
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ message: 'Error removing variant', error });
    }
};
exports.removeVariant = removeVariant;
const updateGroup = async (req, res) => {
    try {
        const updated = await service.updateGroup(req.params.id, req.body);
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating group', error });
    }
};
exports.updateGroup = updateGroup;
