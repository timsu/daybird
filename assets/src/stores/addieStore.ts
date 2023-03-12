import { action, atom, map } from 'nanostores'

import { config } from '@/config'
import { Author, Message } from '@/models'
import addieScript from '@/screens/addie/addieScript'

type Response = {
  kind: 'text' | 'buttons' | 'end'
  buttons?: string[]
}

class AddieStore {
  messages = atom<Message[]>([])

  response = atom<Response | null>(null)

  error = atom<string | null>(null)

  // --- actions

  resetConversation = () => {
    if (config.dev) (window as any)['addieStore'] = addieStore
    this.messages.set([])
    addieScript.welcome()
  }

  addMessage = (message: Message) => {
    const messages = this.messages.get()
    this.messages.set([...messages, message])
  }

  addBotMessage = async (text: string) => {
    // add a little delay for realism
    await new Promise((resolve) => setTimeout(resolve, 500))
    this.addMessage(new Message(Author.BOT, text))
  }

  addUserMessage = (text: string) => {
    this.addMessage(new Message(Author.YOU, text))
  }

  setResponse = (response: Response | null) => {
    this.response.set(response)
  }

  setError = (error: string | null) => {
    this.error.set(error)
  }
}

export const addieStore = new AddieStore()
