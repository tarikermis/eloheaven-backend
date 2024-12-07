import IRaffleTicket, {
  RaffleTicketModel,
} from '@database/models/RaffleTicket';
import IUser from '@database/models/User';
import IRaffle, { RaffleModel } from '@database/models/Raffle';
import RaffleRepo from './RaffleRepo';

export default class RaffleTicketRepo {
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
    };

    return RaffleTicketModel.paginate(query, opt);
  }

  public static async findAll(): Promise<IRaffleTicket[]> {
    const find = await RaffleTicketModel.find().lean<IRaffleTicket[]>().exec();
    return find;
  }

  public static async findByUser(user: IUser): Promise<IRaffleTicket[]> {
    const now = new Date();
    const find = await RaffleTicketModel.find({ user })
      .lean<IRaffleTicket[]>()
      .exec();
    return find;
  }

  public static async findTickets(
    user: IUser,
    raffle: IRaffle,
  ): Promise<IRaffleTicket> {
    const find = await RaffleTicketModel.findOne({ user, raffle })
      .populate('raffle')
      .lean<IRaffleTicket>()
      .exec();
    return find;
  }

  public static async create(ticket: IRaffleTicket): Promise<IRaffleTicket> {
    const now = new Date();
    ticket.createdAt = now;
    const createdRaffleTicket = await RaffleTicketModel.create(ticket);
    return createdRaffleTicket.toObject();
  }

  public static updateInfo(ticket: IRaffleTicket): Promise<any> {
    return RaffleTicketModel.updateOne(
      { _id: ticket._id },
      { $set: { ...ticket } },
    )
      .lean()
      .exec();
  }

  public static delete(_id: string): Promise<any> {
    return RaffleTicketModel.deleteOne({ _id }).exec();
  }

  public static async participate(
    user: IUser,
    amount: number,
  ): Promise<boolean> {
    const lastActiveRaffle = await RaffleModel.findOne({ status: true })
      .lean<IRaffle>()
      .exec();
    if (!lastActiveRaffle) return false;

    const search = await RaffleTicketModel.findOne({
      user: user._id,
      raffle: lastActiveRaffle._id,
    })
      .lean<IRaffleTicket>()
      .exec();

    // create session if not found
    if (!search) {
      const now = new Date();
      const createdRaffleSession = {
        user: user,
        raffle: lastActiveRaffle,
        value: 0,
        createdAt: now,
      } as IRaffleTicket;

      const createdSession = await RaffleTicketModel.create(
        createdRaffleSession,
      );
    }

    // get tickets after creating/checking session for latest raffle
    this.getTickets(user, amount);
    return true;
  }

  public static async getTickets(
    user: IUser,
    amount: number,
  ): Promise<boolean> {
    const lastActiveRaffle = await RaffleModel.findOne({ status: true })
      .lean<IRaffle>()
      .exec();
    if (!lastActiveRaffle) return false;

    const search = await RaffleTicketModel.findOne({
      user: user._id,
      raffle: lastActiveRaffle._id,
    })
      .lean<IRaffleTicket>()
      .exec();

    const ticketCount = amount / lastActiveRaffle.ticketCost;
    if (!search.ticketList) search.ticketList = [];
    search.value += ticketCount;
    let latestTicketId = lastActiveRaffle.ticketCount;
    for (let i = 0; i < Math.floor(ticketCount); i++) {
      latestTicketId++;
      search.ticketList.push(latestTicketId);
    }
    lastActiveRaffle.ticketCount = latestTicketId;
    await RaffleRepo.updateInfo(lastActiveRaffle);
    await RaffleTicketRepo.updateInfo(search);

    return true;
  }
}
