import { OrderModel } from '@database/models/Order';
import { deleteDiscordChannel } from '@core/discord/utils/dmUtils';
import { fetchOrders, exportToSpreadsheet } from '@helpers/gclidtospreadsheet';
import { spreadsheetId } from '@config';
const cron = require('node-cron');

console.log('LOADED');
if (process.env.NODE_ENV === 'production') {
  cron.schedule('0 0 * * *', async () => {
    try {
      const deletionTime = new Date();
      deletionTime.setHours(deletionTime.getHours() - 2); // 2 hour later

      const orders = await OrderModel.find({
        DeletionFlag: true,
        flagTime: { $exists: true },
      });

      for (const order of orders) {
        const guildId = '775847108078731275';
        await deleteDiscordChannel(guildId, `${order.orderId}`);
      }
      await OrderModel.updateMany(
        { DeletionFlag: true, flagTime: { $lte: deletionTime } },
        { $set: { DeletionFlag: false, flagTime: null } },
      );
      console.log('Channels will get deleted 2 hours later.');
    } catch (error) {
      console.error('Error in deleting channels:', error);
    }
  });

  const spreadsheetId = process.env.SPREADSHEET_ID || '';
  const googleServiceAccountEmail =
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
  const googlePrivateKey = process.env.GOOGLE_PRIVATE_KEY || '';
  console.log(
    '***************************************',
    spreadsheetId,
    googleServiceAccountEmail,
    googlePrivateKey,
  );
  if (spreadsheetId && googleServiceAccountEmail && googlePrivateKey) {
    cron.schedule('0 2 * * *', () => {
      console.log('Running a task every day at 2:00 AM');
      fetchOrders()
        .then((orders) => exportToSpreadsheet(orders, spreadsheetId))
        .catch((error: any) => console.error('An error occurred:', error));
    });
  } else {
    console.error(
      'Required environment variables are not set. Cron job will not be scheduled.',
    );
  }
}
