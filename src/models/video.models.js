import mongoose from 'mongoose'
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
const videoSchema = new mongoose.Schema({
    videoFile: {
        type: String, // cloudinary url
        required: true
    },
    thumbnail: {
        type: String, // cloudinary url
        required: true
    },
    title: {
        type: String,
        required: true,
        index: true
    },
    description: {
        type: String,
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    duration: {
        type: Number,
        required: true
    },
    views: {
        type: Number,
        default: 0,
        required: true
    },
    isPublished: {
        type: Boolean,
        default: true
    }
}, {timestamps: true})


videoSchema.plugin(mongooseAggregatePaginate)

export const Videos = mongoose.model("Videos", videoSchema);