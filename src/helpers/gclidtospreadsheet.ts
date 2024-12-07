import { OrderModel } from '@database/models/Order';
import { UserModel } from '@database/models/User'; // Import UserModel
import { googleServiceAccountEmail, googlePrivateKey } from '@config';
import { JWT } from 'google-auth-library';
const { GoogleSpreadsheet } = require('google-spreadsheet');

export async function fetchOrders() {
  let orders;
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  try {
    const orders = await OrderModel.aggregate([
      {
        $match: {
          gclid: { $exists: true, $ne: null },
          createdAt: { $gte: oneDayAgo },
          state: { $nin: ['not_paid', 'cancelled'] },
        },
      },
      {
        $lookup: {
          from: UserModel.collection.name,
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $unwind: '$customer',
      },
      {
        $project: {
          gclid: 1,
          createdAt: 1,
          totalPriceDivided: { $divide: ['$totalPrice', 100] },
          conversionName: { $literal: 'Purchase OCT' },
          currency: { $literal: 'USD' },
          ip: {
            $ifNull: ['$customer.lastLoginIp', '$customer.firstLoginIp'],
          },
        },
      },
    ]);

    return orders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
}

const spreadsheetId = '1sNZia4DiqB2GNFWXhFkP5-miEjywmllxRmsS9V1EviI';

export async function exportToSpreadsheet(data: any, spreadsheetId: any) {
  try {
    const private_key = googlePrivateKey.replace(/\\n/g, '\n');
    const serviceAccountAuth = new JWT({
      email: googleServiceAccountEmail,
      key: private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);
    await doc.loadInfo();

    const sheet = doc.sheetsByIndex[0];

    await sheet.loadCells({
      startRowIndex: 0,
      endRowIndex: sheet.rowCount,
      startColumnIndex: 0,
      endColumnIndex: 6,
    });

    let firstEmptyRow = -1;
    for (let row = 0; row < sheet.rowCount; row++) {
      const cell = sheet.getCell(row, 0);
      if (!cell.value) {
        firstEmptyRow = row;
        break;
      }
    }

    if (firstEmptyRow === -1) {
      console.log('No empty cell found in column A');
      return;
    }
    const latestRow = sheet.getCell(firstEmptyRow - 1, 2);
    if (latestRow && latestRow.value) {
      const dateFromNumber = new Date(
        (latestRow.value - 25569) * 24 * 60 * 60 * 1000,
      );

      const now = new Date();

      now.setHours(2, 0, 0, 0);

      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      if (dateFromNumber >= twentyFourHoursAgo) {
        console.log(
          'Data has already been appended to the spreadsheet within the last 24 hours',
        );
        return;
      }
    }
    for (let index = 0; index < data.length; index++) {
      const order = data[index];
      const formattedDate = `=DATE(${order.createdAt.getFullYear()},${
        order.createdAt.getMonth() + 1
      },${order.createdAt.getDate()})+TIME(${order.createdAt.getHours()},${order.createdAt.getMinutes()},${order.createdAt.getSeconds()})`;

      const dateCell = sheet.getCell(firstEmptyRow + index, 2);
      dateCell.value = formattedDate;

      sheet.getCell(firstEmptyRow + index, 0).value = order.gclid;
      sheet.getCell(firstEmptyRow + index, 1).value = order.conversionName;
      sheet.getCell(firstEmptyRow + index, 2).value = formattedDate;
      sheet.getCell(firstEmptyRow + index, 3).value = order.totalPriceDivided;
      sheet.getCell(firstEmptyRow + index, 4).value = order.currency;
      sheet.getCell(firstEmptyRow + index, 5).value = order.ip;
    }

    await sheet.saveUpdatedCells();

    console.log(
      'Data successfully appended to the spreadsheet starting from row ' +
        (firstEmptyRow + 1),
    );
  } catch (error) {
    console.error('Error exporting to spreadsheet:', error);
    throw error;
  }
}
