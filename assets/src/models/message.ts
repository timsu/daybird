export enum Author {
  BOT,
  YOU,
}

export class Message {
  constructor(public from: Author, public text: string) {}
}

export type GPTMessage = {
  role: 'assistant' | 'user' | 'system'
  content: string
}
