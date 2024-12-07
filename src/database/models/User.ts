import { model, Schema, Document, PaginateModel } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import IRole from './Role';
import {
  IBoosterDetails,
  BoosterDetailsSchema,
} from './references/user/BoosterDetails';
import { IUserProfile, UserProfileSchema } from './references/user/UserProfile';
import axios from 'axios';

export const DOCUMENT_NAME = 'User';
export const COLLECTION_NAME = 'users';

async function generateAvatar() {
  try {
    const options = {
      seed: Math.random().toString(36).substring(7), // Random seed
      dataUri: true, // Return SVG content directly
    };

    const response = await axios.get(
      'https://api.dicebear.com/8.x/pixel-art/svg',
      {
        params: options,
        responseType: 'text',
      },
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching avatar:', error);
    return '/cdn/public/avatars/default.svg';
  }
}

export default interface IUser extends Document {
  username: string;
  password: string;
  email: string;
  balance: number;
  profilePicture: string;
  role: IRole;
  emailVerified: boolean;
  status: boolean;
  appear: 'online' | 'offline';
  boosterDetails?: IBoosterDetails;
  profile?: IUserProfile;
  firstLoginIp?: string;
  lastLoginIp?: string;
  lastLoginAt?: Date;
  discordId?: string;
  documents?: string[];
  pwdResetToken?: string;
  pwdResetTokenExpire?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  gclid?: string;
}

const schema = new Schema(
  {
    username: {
      type: Schema.Types.String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
      index: { unique: true },
    },
    password: {
      type: Schema.Types.String,
      required: true,
      maxlength: 64,
      select: false,
    },
    email: {
      type: Schema.Types.String,
      required: true,
      unique: true,
      trim: true,
      select: false,
    },
    balance: {
      type: Schema.Types.Number,
      required: true,
      default: 0,
    },
    profilePicture: {
      type: Schema.Types.String,
      trim: true,
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
      select: false,
    },
    emailVerified: {
      type: Schema.Types.Boolean,
      default: false,
    },
    status: {
      type: Schema.Types.Boolean,
      default: true,
    },
    appear: {
      type: Schema.Types.String,
      default: 'offline',
    },
    boosterDetails: BoosterDetailsSchema,
    profile: UserProfileSchema,
    firstLoginIp: {
      type: Schema.Types.String,
      default: '0.0.0.0',
    },
    lastLoginIp: {
      type: Schema.Types.String,
      default: '0.0.0.0',
    },
    lastLoginAt: {
      type: Date,
      required: true,
    },
    discordId: {
      type: Schema.Types.String,
      select: false,
    },
    documents: {
      type: [Schema.Types.String],
      select: false,
    },
    pwdResetToken: {
      type: Schema.Types.String,
      select: false,
    },
    pwdResetTokenExpire: {
      type: Date,
      select: false,
    },
    createdAt: {
      type: Date,
      required: true,
    },
    updatedAt: {
      type: Date,
      required: true,
    },
    gclid: {
      type: Schema.Types.String,
      required: false,
    },
    consent: {
      type: Schema.Types.Boolean,
    },
  },
  {
    versionKey: false,
  },
);

schema.pre('save', async function (next) {
  if (!this.profilePicture) {
    try {
      const svgContent = await generateAvatar();
      this.profilePicture = `data:image/svg+xml;base64,${Buffer.from(
        svgContent,
      ).toString('base64')}`;
    } catch (error) {
      console.error('Error generating default profile picture:', error);
      this.profilePicture = '/cdn/public/avatars/default.svg'; // Use a default SVG image if generation fails
    }
  }
  next();
});

schema.plugin(paginate);

export const UserModel = model<IUser, PaginateModel<IUser>>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME,
);
