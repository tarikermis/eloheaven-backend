import {
  ITransaction,
  TransactionModel,
  TransactionTag,
} from '@database/models/Transaction';

export default class TransactionRepo {
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

    return TransactionModel.paginate(query, opt);
  }

  public static async create(transaction: ITransaction): Promise<ITransaction> {
    const now = new Date();
    transaction.createdAt = now;
    const createdTransaction = await TransactionModel.create(transaction);
    return createdTransaction;
  }

  public static async getStats(): Promise<any> {
    const states: any = Object.values(TransactionTag);
    const map: any = {};
    for (const tag of states) {
      const count = await TransactionModel.aggregate([
        {
          $match: {
            tag,
          },
        },
        {
          $group: {
            _id: 'null',
            amount: { $sum: '$amount' },
          },
        },
      ]);

      map[tag] = count.length > 0 ? count[0].amount : 0;
    }

    return map;
  }
}
