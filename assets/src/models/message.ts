export enum Author {
  BOT,
  YOU,
}

export class Message {
  constructor(public from: Author, public text: string) {}
}
