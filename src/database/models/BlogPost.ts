import { Schema, model, Document, PaginateModel } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import IBlogCategory from './BlogCategory';
import IUser from './User';

export const DOCUMENT_NAME = 'BlogPost';
export const COLLECTION_NAME = 'blog_posts';

export default interface IBlogPost extends Document {
  title: string;
  body: string;
  description: string;
  keywords: string[];
  category: IBlogCategory;
  thumbnail: string;
  author?: IUser;
  slug: string;
  readingTime: string;
  createdAt: Date;
  language: string;
}

const schema = new Schema(
  {
    title: {
      type: Schema.Types.String,
      required: true,
    },
    body: {
      type: Schema.Types.String,
      required: true,
    },
    description: {
      type: Schema.Types.String,
      required: true,
    },
    keywords: {
      type: [Schema.Types.String],
      required: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'BlogCategory',
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    slug: {
      type: Schema.Types.String,
    },
    thumbnail: {
      type: Schema.Types.String,
    },
    readingTime: {
      type: Schema.Types.String,
    },
    language: {
      type: Schema.Types.String,
      required: true,
    },
    createdAt: {
      type: Date,
      required: true,
    },
  },
  {
    versionKey: false,
  },
);

schema.plugin(paginate);

export const BlogPostModel = model<IBlogPost, PaginateModel<IBlogPost>>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME,
);
