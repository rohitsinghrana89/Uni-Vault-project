const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    tmdb_id: {
      type: Number,
      required: true,
      index: true
    },
    media_type: {
      type: String,
      default: 'movie',
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    poster: {
      type: String,
      default: null,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index to prevent duplicate entries for the same user & media item
watchlistSchema.index({ userId: 1, tmdb_id: 1 }, { unique: true });

// Transform output to match expected application API format
watchlistSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  obj.created_at = obj.createdAt;
  obj.updated_at = obj.updatedAt;
  return obj;
};

const Watchlist = mongoose.model('Watchlist', watchlistSchema);

module.exports = Watchlist;
