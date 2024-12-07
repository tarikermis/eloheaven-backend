import IBlogCategory, {
  BlogCategoryModel,
} from '@database/models/BlogCategory';
import IBlogPost, { BlogPostModel } from '@models/BlogPost';
import { Types } from 'mongoose';

export default class BlogPostRepo {
  public static paginate(
    query: object,
    options: {
      limit: number;
      page: number;
      select?: string;
      populate?: any;
    },
  ) {
    const opt = {
      limit: options.limit,
      page: options.page,
      select: options.select,
      populate: options.populate,
      sort: [['_id', 'desc']],
    };

    return BlogPostModel.paginate(query, opt);
  }

  public static async create(post: IBlogPost): Promise<IBlogPost> {
    const now = new Date();
    post.createdAt = now;
    const createdLog = await BlogPostModel.create(post);
    return createdLog.toObject();
  }

  public static async findAll(): Promise<IBlogPost[]> {
    const posts = await BlogPostModel.find();
    return posts;
  }

  public static async findByAuthor(
    id: Types.ObjectId,
  ): Promise<IBlogPost[] | null> {
    const posts = await BlogPostModel.find({ author: id });
    return posts;
  }

  public static async findCategoryById(
    id: Types.ObjectId,
  ): Promise<IBlogCategory | null> {
    const cat = await BlogCategoryModel.findOne({ _id: id });
    return cat;
  }

  public static async findById(id: Types.ObjectId): Promise<IBlogPost | null> {
    const post = await BlogPostModel.findOne({ _id: id }).populate([
      {
        path: 'category',
        select: { _id: 1, title: 1, description: 1 },
      },
      {
        path: 'author',
        select: { _id: 1, username: 1, profilePicture: 1, appear: 1 },
      },
    ]);
    return post;
  }

  public static async findBySlug(slug: string): Promise<IBlogPost | null> {
    const post = await BlogPostModel.findOne({ slug }).populate([
      {
        path: 'category',
        select: { _id: 1, title: 1, description: 1 },
      },
      {
        path: 'author',
        select: { _id: 1, username: 1, profilePicture: 1, appear: 1 },
      },
    ]);
    return post;
  }

  public static updateInfo(post: IBlogPost): Promise<IBlogPost> {
    return BlogPostModel.updateOne({ _id: post._id }, { $set: { ...post } })
      .lean<IBlogPost>()
      .exec();
  }

  public static delete(_id: string): Promise<any> {
    return BlogPostModel.deleteOne({ _id }).exec();
  }
}
