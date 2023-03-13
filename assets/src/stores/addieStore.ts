import { action, atom, map } from 'nanostores'

import { config } from '@/config'
import { Author, Message } from '@/models'
import addieScript from '@/screens/addie/addieScript'

export type UserResponse = {
  kind: 'text' | 'buttons' | 'end' | 'buttons_text'
  buttons?: string[]
  tooltips?: string[]
  placeholder?: string
}

class AddieStore {
  messages = atom<Message[]>([])

  response = atom<UserResponse | null>(null)

  awaitingResponse = atom<boolean>(false)

  error = atom<string | null>(null)

  // --- actions

  resetConversation = () => {
    if (config.dev) (window as any)['addieStore'] = addieStore
    this.response.set(null)
    this.error.set(null)
    this.awaitingResponse.set(false)
    this.messages.set([])
    addieScript.welcome()
  }

  addMessage = (message: Message) => {
    const messages = this.messages.get()
    this.messages.set([...messages, message])
  }

  addBotMessage = async (text: string) => {
    this.awaitingResponse.set(false)

    // add a little delay for realism
    await new Promise((resolve) => setTimeout(resolve, 500))
    this.addMessage(new Message(Author.BOT, text))
  }

  addUserMessage = (text: string) => {
    this.addMessage(new Message(Author.YOU, text))
  }

  setResponse = (response: UserResponse | null) => {
    this.response.set(response)
  }

  setError = (error: string | null) => {
    this.error.set(error)
  }
}

export const addieStore = new AddieStore()
