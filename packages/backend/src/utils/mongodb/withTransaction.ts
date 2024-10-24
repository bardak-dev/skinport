import mongoose, {Connection} from 'mongoose';

// getting right connection to prevent bugs
const connection: {
  cache?: Connection
  client: Connection
} = {
  cache: undefined,
  get client(): Connection {
    if(this.cache) {
      return this.cache;
    }
    this.cache = mongoose.connections[mongoose.connections.findIndex(({name}) => name === 'skinport')];
    return this.cache;
  }
};

const withTransactionResult = async (session: mongoose.ClientSession, closure: (session?: mongoose.ClientSession) => Promise<any>) => {
  let result: any;
  await session.withTransaction(() => {
    result = closure(session);
    return result;
  });
  return result;
};

export const withTransaction = async (
  fn: (session: mongoose.ClientSession) => Promise<any>,
  existingSession?: mongoose.ClientSession
): Promise<any> => {
  if(existingSession) {
    if(existingSession.inTransaction()) {
      return await fn(existingSession);
    }

    return await withTransactionResult(existingSession, fn);
  }

  const session = await connection.client.startSession();
  try {
    return await withTransactionResult(session, fn);
  } catch(e) {
    console.error(e);
    throw e;
  } finally {
    await session.endSession();
  }
};
