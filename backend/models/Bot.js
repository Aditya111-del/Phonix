import Bot from './schemas/Bot.js';

export const BotModel = {
  findAll: async (filters = {}, pagination = {}) => {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const skip = (page - 1) * limit;

      let query = Bot.find();

      // Apply filters
      if (filters.status) {
        query = query.where('status').equals(filters.status);
      } else {
        // Default: only active bots
        query = query.where('status').equals('active');
      }

      if (filters.type) {
        query = query.where('type').equals(filters.type);
      }

      if (filters.isPublic !== undefined) {
        query = query.where('isPublic').equals(filters.isPublic);
      } else {
        // Default: only public bots
        query = query.where('isPublic').equals(true);
      }

      if (filters.uploadedBy) {
        query = query.where('uploadedBy').equals(filters.uploadedBy);
      }

      if (filters.search) {
        query = query.$or([
          { name: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } },
          { tags: { $regex: filters.search, $options: 'i' } },
        ]);
      }

      const total = await Bot.countDocuments(query);

      const bots = await query
        .sort({ downloads: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('uploadedBy', 'name email picture')
        .lean();

      console.log('[BotModel.findAll] Query result:', {
        filters,
        total,
        botsReturned: bots.length,
        skip,
        limit,
      });

      return {
        success: true,
        data: bots,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('[BotModel.findAll] Error:', error.message);
      throw error;
    }
  },

  findById: async (id) => {
    try {
      const bot = await Bot.findById(id).populate('uploadedBy', 'name email picture');
      return bot;
    } catch (error) {
      throw error;
    }
  },

  create: async (botData) => {
    try {
      const bot = new Bot(botData);
      await bot.save();
      await bot.populate('uploadedBy', 'name email picture');
      return bot;
    } catch (error) {
      throw error;
    }
  },

  update: async (id, updates) => {
    try {
      const bot = await Bot.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      });
      return bot;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const result = await Bot.findByIdAndDelete(id);
      return result ? true : false;
    } catch (error) {
      throw error;
    }
  },

  incrementDownloads: async (id) => {
    try {
      const bot = await Bot.findByIdAndUpdate(
        id,
        { $inc: { downloads: 1 } },
        { new: true }
      );
      return bot;
    } catch (error) {
      throw error;
    }
  },

  addReview: async (botId, rating) => {
    try {
      const bot = await Bot.findById(botId);
      if (!bot) throw new Error('Bot not found');

      const newTotal = bot.rating * bot.reviews + rating;
      bot.reviews += 1;
      bot.rating = newTotal / bot.reviews;

      await bot.save();
      return bot;
    } catch (error) {
      throw error;
    }
  },

  search: async (query, limit = 10) => {
    try {
      const bots = await Bot.find(
        {
          $text: { $search: query },
          status: 'active',
          isPublic: true,
        },
        {
          score: { $meta: 'textScore' },
        }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit);
      return bots;
    } catch (error) {
      throw error;
    }
  },
};
