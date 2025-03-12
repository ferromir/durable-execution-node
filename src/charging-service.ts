import { v4 as uuidv4 } from "uuid";

export interface Session {
  id: string;
  status: "failed" | "started" | "stopped";
  chargePointId: string;
  cost: number;
  currency: string;
}

export class ChargingService {
  constructor() {}

  start(chargePointId: string): Promise<Session> {
    return Promise.resolve({
      id: uuidv4(),
      status: "started",
      chargePointId,
      cost: 0,
      currency: "EUR",
    });
  }

  stop(session: Session): Promise<Session> {
    session.status = "stopped";
    return Promise.resolve(session);
  }

  sync(session: Session): Promise<Session> {
    return Promise.resolve({
      ...session,
      cost: session.cost + Math.random(),
    });
  }
}

// import { v4 as uuidv4 } from "uuid";

// export interface Session {
//   id: string;
//   status: "failed" | "started" | "stopped";
//   chargePointId: string;
//   cost: number;
//   currency: string;
// }

// export class ChargingService {
//   constructor() {}

//   start(chargePointId: string): Promise<Session> {
//     return Promise.resolve({
//       id: uuidv4(),
//       status: "started",
//       chargePointId,
//       cost: 0,
//       currency: "EUR",
//     });
//   }

//   stop(session: Session): Promise<Session> {
//     session.status = "stopped";
//     return Promise.resolve(session);
//   }

//   sync(session: Session): Promise<Session> {
//     return Promise.resolve({
//       ...session,
//       cost: session.cost + Math.random(),
//     });
//   }
// }
