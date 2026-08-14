const mongoose = require('mongoose');

const recentlyViewedSchema = new mongoose.Schema(
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
    },
    viewed_at: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Unique index so an existing title has its viewed_at timestamp refreshed
recentlyViewedSchema.index({ userId: 1, tmdb_id: 1 }, { unique: true });

const RecentlyViewed = mongoose.model('RecentlyViewed', recentlyViewedSchema);

module.exports = RecentlyViewed;
