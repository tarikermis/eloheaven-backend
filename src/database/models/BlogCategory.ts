import { Schema, model, Document, PaginateModel } from 'mongoose';
import paginate from 'mongoose-paginate-v2';

export const DOCUMENT_NAME = 'BlogCategory';
export const COLLECTION_NAME = 'blog_categories';

export default interface IBlogCategory extends Document {
  title?: string;
  description: string;
  createdAt: Date;
}

const schema = new Schema(
  {
    title: {
      type: Schema.Types.String,
      required: true,
    },
    description: {
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

export const BlogCategoryModel = model<
  IBlogCategory,
  PaginateModel<IBlogCategory>
>(DOCUMENT_NAME, schema, COLLECTION_NAME);
