import mongoose from 'mongoose';
import Logger from '@core/Logger';
import { db } from '@config';
import AutoIncrementFactory from 'mongoose-sequence';

// Build the connection string
const dbURI = `mongodb://${db.user}:${encodeURIComponent(db.pass)}@${db.host}:${
  db.port
}/${db.name}`;

const options = {
  useNewUrlParser: true,
  // useCreateIndex: true,
  useUnifiedTopology: true,
  // useFindAndModify: false,
  autoIndex: true,
  // poolSize: 10,
  // bufferMaxEntries: 0,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

// Create the database connection
mongoose.connect(dbURI, options).catch((e) => {
  Logger.info('🚫 Mongoose connection error.');
  Logger.error(e);
});

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', () => {
  Logger.info('✅ Connected to database!');
});

// If the connection throws an error
mongoose.connection.on('error', (err) => {
  Logger.error('🚫 Mongoose default connection error: ' + err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', () => {
  Logger.info('🚫 Mongoose default connection disconnected!');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    Logger.info(
      '🚫 Mongoose default connection disconnected through app termination!',
    );
    process.exit(0);
  });
});

export const AutoIncrement = AutoIncrementFactory(mongoose as any);
