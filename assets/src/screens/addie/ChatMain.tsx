import { useEffect, useRef, useState } from 'preact/hooks'

import Input from '@/components/core/Input'
import Pressable from '@/components/core/Pressable'
import therapist from '@/images/therapist.png'
import { Author, Message } from '@/models'
import addieScript from '@/screens/addie/addieScript'
import { addieStore } from '@/stores/addieStore'
import { useStore } from '@nanostores/preact'

export default () => {
  useEffect(() => {
    addieStore.resetConversation()
  }, [])

  return (
    <div class="mx-auto max-w-2xl bg-white p-4 lg:p-10 flex flex-col h-full overflow-auto">
      <div class="flex mb-4 justify-between items-center">
        <img src={therapist} class="w-10 h-10" />
        <Pressable onClick={() => addieStore.resetConversation()} tooltip="Start Over">
          Start Over
        </Pressable>
      </div>
      <Messages />
      <AwaitingResponse />
      <Response />
      <ErrorMessage />
    </div>
  )
}

function Messages() {
  const divRef = useRef<HTMLDivElement>(null)
  const messages = useStore(addieStore.messages)

  useEffect(() => {
    const div = divRef.current
    if (!div) return
    const lastMessage = div.children[div.children.length - 1]
    if (lastMessage) lastMessage.scrollIntoView()
  }, [messages])

  return (
    <div ref={divRef} class="flex flex-col">
      {messages.map((message, i) => {
        const props = { message, prevMessage: messages[i - 1], key: i }
        return message.from == Author.BOT ? <BotMessage {...props} /> : <UserMessage {...props} />
      })}
    </div>
  )
}

function AwaitingResponse() {
  const awaitingResponse = useStore(addieStore.awaitingResponse)

  if (!awaitingResponse) return null

  return (
    <div class="flex flex-col mb-4 max-w-xl">
      <div class="bg-purple-300 px-4 py-2 rounded-lg">
        <div class="dot-flashing ml-4 my-2" />
      </div>
    </div>
  )
}

type MessageProps = { message: Message; prevMessage: Message | undefined }

function BotMessage({ message, prevMessage }: MessageProps) {
  return (
    <div class="flex flex-col mb-4 max-w-xl">
      <div class="bg-purple-300 px-4 py-2 rounded-lg whitespace-pre-wrap">{message.text}</div>
    </div>
  )
}

function UserMessage({ message }: MessageProps) {
  return (
    <div class="flex flex-col mb-4 items-end">
      <div class="bg-gray-200 px-4 py-2 rounded-lg">{message.text}</div>
    </div>
  )
}

function Response() {
  const divRef = useRef<HTMLDivElement>(null)
  const response = useStore(addieStore.response)

  useEffect(() => {
    if (divRef.current) divRef.current.scrollIntoView()
  }, [response])

  if (!response) return null

  if (response.kind == 'end') {
    return (
      <div ref={divRef}>
        If you have additional feedback, send it to Tim (tim@daybird.app).
        <a href="#" class="text-blue-600 block" onClick={() => addieStore.resetConversation()}>
          Start Over?
        </a>
      </div>
    )
  }

  return (
    <>
      {(response.kind == 'buttons' || response.kind == 'buttons_text') && (
        <>
          <div ref={divRef} class="flex gap-2 justify-center flex-wrap">
            {response.buttons?.map((button, i) => (
              <button
                class="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg border border-gray-700"
                onClick={() => {
                  addieStore.addUserMessage(button)
                  addieScript.handleButton(i)
                }}
              >
                {button}
              </button>
            ))}
          </div>
        </>
      )}

      {response.kind == 'buttons_text' && <div class="h-4 min-h-[1rem]" />}

      {(response.kind == 'text' || response.kind == 'buttons_text') && (
        <div ref={divRef}>
          <TextResponse />
        </div>
      )}
    </>
  )
}

function TextResponse() {
  const response = useStore(addieStore.response)
  const [textInput, setTextInput] = useState('')

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    if (textInput.trim().length == 0) return

    addieStore.addUserMessage(textInput)
    addieScript.handleInput(textInput)
    setTextInput('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        ref={(ref) => ref && ref.focus()}
        value={textInput}
        placeholder={response?.placeholder || 'Type your response here'}
        onChange={(e) => setTextInput((e.target as HTMLInputElement).value)}
        className={`appearance-none block w-full px-3 py-2 border border-gray-300
       rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500
     focus:border-blue-500 text-sm`}
      />
    </form>
  )
}

function ErrorMessage() {
  const error = useStore(addieStore.error)
  if (!error) return null

  return (
    <div
      class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4"
      role="alert"
    >
      <span class="block sm:inline">{error}</span>
    </div>
  )
}
