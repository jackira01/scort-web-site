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
exports.ContentSectionSchema = exports.ContentBlockSchema = exports.ContentPage = exports.ContentPageModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const content_types_1 = require("./content.types");
const ContentBlockSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: Object.values(content_types_1.ContentBlockType),
        required: true
    },
    value: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
        validate: {
            validator: function (value) {
                if (this.type === content_types_1.ContentBlockType.LIST) {
                    return Array.isArray(value) && value.length > 0 &&
                        value.every((item) => typeof item === 'string');
                }
                if (this.type === content_types_1.ContentBlockType.FAQ) {
                    return Array.isArray(value) && value.length > 0 &&
                        value.every((item) => typeof item === 'object' &&
                            typeof item.question === 'string' &&
                            typeof item.answer === 'string');
                }
                return typeof value === 'string' && value.trim().length > 0;
            },
            message: 'El valor debe ser un string no vacío para párrafos/imágenes/links, un array de strings para listas, o un array de objetos {question, answer} para FAQ'
        }
    },
    order: {
        type: Number,
        default: 0
    }
}, { _id: false });
exports.ContentBlockSchema = ContentBlockSchema;
const ContentSectionSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 200
    },
    order: {
        type: Number,
        required: true,
        min: 0
    },
    blocks: {
        type: [ContentBlockSchema],
        default: []
    }
}, { _id: false });
exports.ContentSectionSchema = ContentSectionSchema;
const ContentPageSchema = new mongoose_1.Schema({
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: /^[a-z0-9-_\/]+$/,
        minlength: 2,
        maxlength: 100
    },
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 200
    },
    sections: {
        type: [ContentSectionSchema],
        default: []
    },
    isActive: {
        type: Boolean,
        default: true
    },
    modifiedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true,
    collection: 'contentpages'
});
ContentPageSchema.index({ slug: 1 });
ContentPageSchema.index({ isActive: 1 });
ContentPageSchema.index({ createdAt: -1 });
ContentPageSchema.pre('save', function (next) {
    if (this.sections && this.sections.length > 0) {
        this.sections.sort((a, b) => a.order - b.order);
        this.sections.forEach((section) => {
            if (section.blocks && section.blocks.length > 0) {
                section.blocks.sort((a, b) => (a.order || 0) - (b.order || 0));
            }
        });
    }
    next();
});
ContentPageSchema.statics.findBySlug = function (slug) {
    return this.findOne({ slug, isActive: true });
};
ContentPageSchema.methods.validateStructure = function () {
    try {
        const invalidSections = this.sections.some(section => {
            if (!section.title || section.title.trim().length === 0) {
                return true;
            }
            return section.blocks.some(block => {
                if (block.type === content_types_1.ContentBlockType.LIST) {
                    return !Array.isArray(block.value) || block.value.length === 0 ||
                        block.value.some((item) => typeof item !== 'string' || item.trim().length === 0);
                }
                else if (block.type === content_types_1.ContentBlockType.FAQ) {
                    return !Array.isArray(block.value) || block.value.length === 0 ||
                        block.value.some((item) => typeof item !== 'object' ||
                            typeof item.question !== 'string' ||
                            item.question.trim().length === 0 ||
                            typeof item.answer !== 'string' ||
                            item.answer.trim().length === 0);
                }
                else {
                    return typeof block.value !== 'string' || block.value.trim().length === 0;
                }
            });
        });
        return !invalidSections;
    }
    catch (error) {
        console.error('Error en validateStructure:', error);
        return false;
    }
};
exports.ContentPageModel = mongoose_1.default.model('ContentPage', ContentPageSchema);
exports.ContentPage = exports.ContentPageModel;
