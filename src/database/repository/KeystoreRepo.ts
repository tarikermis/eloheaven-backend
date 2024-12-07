import { Types } from 'mongoose';
import IUser from '@models/User';
import IKeystore, { KeystoreModel } from '@models/Keystore';

export default class KeystoreRepo {
  public static findforKey(
    user: IUser,
    key: string,
  ): Promise<IKeystore | null> {
    return KeystoreModel.findOne({
      user: user,
      primaryKey: key,
      status: true,
    }).exec();
  }

  public static remove(id: Types.ObjectId): Promise<IKeystore | null> {
    return KeystoreModel.findByIdAndRemove(id).lean<IKeystore>().exec();
  }

  public static removeAll(user: IUser): Promise<IKeystore | null> {
    return KeystoreModel.deleteMany({ user: user._id })
      .lean<IKeystore>()
      .exec();
  }

  public static find(
    user: IUser,
    primaryKey: string,
    secondaryKey: string,
  ): Promise<IKeystore | null> {
    return KeystoreModel.findOne({
      user: user,
      primaryKey: primaryKey,
      secondaryKey: secondaryKey,
    })
      .lean<IKeystore>()
      .exec();
  }

  public static async create(
    user: IUser,
    primaryKey: string,
    secondaryKey: string,
  ): Promise<IKeystore> {
    const now = new Date();
    const keystore = await KeystoreModel.create({
      user: user,
      primaryKey: primaryKey,
      secondaryKey: secondaryKey,
      createdAt: now,
    } as IKeystore);
    return keystore.toObject();
  }
}
