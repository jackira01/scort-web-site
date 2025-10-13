"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.News = void 0;
const mongoose_1 = require("mongoose");
const newsSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, 'El título es requerido'],
        trim: true,
        maxlength: [200, 'El título no puede exceder 200 caracteres']
    },
    content: {
        type: [String],
        required: [true, 'El contenido es requerido'],
        validate: {
            validator: function (v) {
                return v && v.length > 0;
            },
            message: 'Debe incluir al menos un elemento en el contenido'
        }
    },
    imageUrl: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                if (!v)
                    return true;
                return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
            },
            message: 'La URL de la imagen debe ser una URL válida de imagen'
        }
    },
    published: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
newsSchema.index({ published: 1, createdAt: -1 });
newsSchema.index({ title: 'text' });
exports.News = (0, mongoose_1.model)('News', newsSchema);
exports.default = exports.News;
