import { decode } from 'base64-arraybuffer'
import { prosemirrorToYDoc, yDocToProsemirrorJSON } from 'y-prosemirror'
import * as Y from 'yjs'

import { API } from '@/api'
import { config } from '@/config'
import { DailyNote, dateToPeriodDateString, Doc, GPTMessage, Period } from '@/models'
import { createEditor, loadDoc } from '@/screens/addie/HeadlessEditor'
import { addieStore, UserResponse } from '@/stores/addieStore'
import { authStore } from '@/stores/authStore'
import { docStore } from '@/stores/docStore'
import { journalStore } from '@/stores/journalStore'
import { projectStore } from '@/stores/projectStore'
import tracker from '@/stores/tracker'
import { assertIsDefined, unwrapError } from '@/utils'
import { Editor } from '@tiptap/core'

const LS_SEEN_BEFORE = 'addie-seen-before'

type ButtonHandler = (index: number) => void
type InputHandler = (input: string) => void

const coachDescription = `friendly ADHD coach who gives 1-paragraph answers`
const datePreamble = () => `It's ${new Date().toLocaleString()}.`

class AddieScript {
  messageHistory: GPTMessage[] = []

  buttonHandler: ButtonHandler = () => {}
  inputHandler: InputHandler = () => {}

  seenMenu = false

  setUserResponse = (
    response: UserResponse,
    buttonHandler: ButtonHandler | null,
    inputHandler: InputHandler | null
  ) => {
    addieStore.setResponse(response)
    if (buttonHandler) this.buttonHandler = buttonHandler
    if (inputHandler) this.inputHandler = inputHandler
  }

  // --- welcome

  welcome = async () => {
    this.seenMenu = false
    if (!localStorage.getItem(LS_SEEN_BEFORE)) {
      await addieStore.addBotMessage(`Hi! I am Addie, your personal ADHD assistant.

Visit me any time you need help.`)
      localStorage.setItem(LS_SEEN_BEFORE, 'true')
    } else {
      const user = authStore.loggedInUser.get()!
      await addieStore.addBotMessage(user.name ? `Hi again, ${user.name}!` : `Hi again!`)
    }

    this.mainMenu()
  }

  mainMenu = async () => {
    await addieStore.addBotMessage(`What can I help you with today?`)

    const buttons = ['What should I do?', 'Journal', 'Advice']
    if (this.seenMenu) buttons.push('All done')
    else this.seenMenu = true

    this.setUserResponse(
      {
        kind: 'buttons',
        buttons: buttons,
      },
      this.handleMainMenu,
      null
    )
  }

  handleMainMenu = async (index: number) => {
    if (index == 0) {
      this.doCheckin()
      // } else if (index == 1) {
      //   this.doRemember()
    } else if (index == 1) {
      this.doJournal()
    } else if (index == 2) {
      this.doHelp()
    } else {
      this.finishConversation()
    }
  }

  // --- attend to self

  doCheckin = async () => {
    tracker.addieEvent('checkin')
    await addieStore.addBotMessage(`Let's start with an emotional check-in.

Take a deep breath and close your eyes. How are you feeling right now?`)

    this.setUserResponse(
      {
        kind: 'buttons',
        buttons: ['Calm & Present', 'On Autopilot', 'Unwell'],
      },
      this.handleEmotionalCheckin,
      null
    )
  }

  handleEmotionalCheckin = async (index: number) => {
    if (index == 0) {
      this.timeOfDayCheck()
    } else if (index == 1) {
      await addieStore.addBotMessage(`Take a moment to be present to yourself and your needs.`)
      await new Promise((resolve) => setTimeout(resolve, 4000))
      this.timeOfDayCheck()
    } else if (index == 2) {
      this.attendToSelf()
    }
  }

  attendToSelf = async () => {
    tracker.addieEvent('attendSelf')
    await addieStore.addBotMessage(`I'm sorry to hear that. Take a moment to attend to yourself.

What do you need right now?`)

    this.setUserResponse(
      {
        kind: 'text',
      },
      null,
      this.handleAttendToSelf
    )

    this.messageHistory = [
      {
        role: 'system',
        content: `You are a ${coachDescription} helping a user who is not feeling well to ' +
          'feel ready for coaching. ${datePreamble()}`,
      },
      {
        role: 'assistant',
        content: 'Take a moment to attend to yourself. What do you need right now?',
      },
    ]
  }

  handleAttendToSelf = async (input: string) => {
    this.gptLoop(input, ['Ready to continue.'])
  }

  // --- time of day check

  timeOfDayCheck = async () => {
    const date = new Date()
    const dayOfWeek = date.getDay()
    const hour = new Date().getHours()
    const isWeekend = dayOfWeek == 0 || dayOfWeek == 6

    if (hour > 22 || hour < 5) {
      this.bedtimeRoutine()
    } else if (hour > 17 || hour < 8) {
      this.homeRoutine()
    } else if (isWeekend) {
      this.weekendRoutine()
    } else {
      this.workRoutine()
    }
  }

  // --- bedtime

  bedtimeRoutine = async () => {
    tracker.addieEvent('bedtime')
    await addieStore.addBotMessage(`It's bedtime! Let's get ready for bed.

Are you sleepy?`)

    this.setUserResponse(
      {
        kind: 'buttons',
        buttons: ['Yes', 'No', "I'm not ready"],
      },
      this.handleBedtime,
      null
    )
  }

  handleBedtime = async (index: number) => {
    if (index == 0) {
      await addieStore.addBotMessage(`Great! Let's get to bed.`)

      await addieStore.addBotMessage(`1. Put away your electronics (like this one).

2. Get into bed. Turn on your white noise machine (if you have one).

3. Close your eyes and take 3 deep breaths.

4. I'll see you tomorrow.`)

      this.finishConversation()
    } else if (index == 1) {
      await addieStore.addBotMessage(`Okay, let's get you ready for bed.

It's perfectly normal not to be sleepy yet. People with ADHD typically have a later circadian rhythm and have a harder time falling asleep as well.`)

      await addieStore.addBotMessage(
        `Pick an activity that's relaxing and calming and does not involve screens.`
      )

      this.setUserResponse(
        {
          kind: 'text',
        },
        null,
        this.handleBedtimeText
      )
    } else if (index == 2) {
      await addieStore.addBotMessage(
        `Okay, but remember that sleep is extra important for people with ADHD.`
      )
      this.homeRoutine()
    } else if (index == 3) {
      this.workRoutine()
    }
  }

  handleBedtimeText = async (input: string) => {
    await addieStore.addBotMessage(`That sounds like a great idea!`)
    await addieStore.addBotMessage('Go do that. Then come back and we can get ready for bed.')

    this.setUserResponse(
      {
        kind: 'buttons',
        buttons: ["I'm ready."],
      },
      this.handleBedtime,
      null
    )
  }

  // --- work / home routines

  homeRoutine = async () => {
    tracker.addieEvent('homeRoutine')
    await addieStore.addBotMessage(`What are your important things to do right now?`)

    this.setUserResponse(
      {
        kind: 'text',
      },
      this.handleHomeButton,
      this.handleHomeRoutine
    )

    this.messageHistory = [
      {
        role: 'system',
        content: `You are a ${coachDescription} helping the user focus and get tasks done. ${datePreamble()}`,
      },
      {
        role: 'assistant',
        content: 'What are your important things to do at home?',
      },
    ]
  }

  handleHomeRoutine = async (input: string) => {
    this.gptLoop(input, ['All Done'])
  }

  handleHomeButton = async (index: number) => {
    this.finishConversation()
  }

  workRoutine = async () => {
    tracker.addieEvent('workRoutine')
    await addieStore.addBotMessage(
      `You're probably at work. First things first. Check your calendar and see when your next meeting is`
    )

    this.setUserResponse(
      {
        kind: 'buttons',
        buttons: ['Soon', 'Less than an hour', 'In a few hours', 'No meetings left'],
      },
      this.handleWorkRoutine,
      null
    )
  }

  handleWorkRoutine = async (index: number) => {
    if (index == 0) {
      await addieStore.addBotMessage(`Get prepared for it and don't be late.`)
      this.finishConversation()
      return
    } else if (index == 1) {
      await addieStore.addBotMessage(
        `You don't have too much time, so let's work on a few small tasks.`
      )
      this.workContext = 'I have a meeting in less than an hour.'
      this.handleWorkRoutineText('')
    } else {
      await addieStore.addBotMessage(
        `You've got a good chunk of time to do some deep work. What's important?`
      )
      this.workContext = 'I have a few hours for deep work.'
      this.handleWorkRoutineText('')
    }

    this.workTasks = []

    this.setUserResponse(
      {
        kind: 'text',
        placeholder: 'What do you want to do?',
      },
      this.handleWorkRoutineButton,
      this.handleWorkRoutineText
    )
  }

  workTasks: string[] = []
  workContext: string | undefined

  handleWorkRoutineText = async (input: string) => {
    this.workTasks.push(input)

    this.setUserResponse(
      {
        kind: 'buttons_text',
        placeholder: 'Anything else?',
        buttons: ['Next'],
      },
      this.handleWorkRoutineButton,
      this.handleWorkRoutineText
    )
  }

  handleWorkRoutineButton = async (input: number) => {
    await addieStore.addBotMessage(
      `That sounds like a great idea! Do you want to talk it through, ` +
        `or are you ready to do it?`
    )

    this.setUserResponse(
      {
        kind: 'buttons_text',
        buttons: ['Ready to work', 'Talk it through'],
      },
      this.handleTaskTalkButtons,
      this.handleTaskTalkText
    )
  }

  weekendRoutine = async () => {
    tracker.addieEvent('weekendRoutine')
    await addieStore.addBotMessage(`It's the weekend! How can you spend this time well?`)

    this.setUserResponse(
      {
        kind: 'text',
      },
      this.handleHomeButton,
      this.handleHomeRoutine
    )

    this.messageHistory = [
      {
        role: 'system',
        content: `You are a ${coachDescription} helping the user recharge and improve. ${datePreamble()}`,
      },
      {
        role: 'assistant',
        content: "It's the weekend! How can you spend this time well?",
      },
    ]
  }

  // --- talk it through

  handleTaskTalkButtons = async (index: number) => {
    if (index == 0) {
      this.finishConversation()
    } else if (index == 1) {
      this.messageHistory = [
        {
          role: 'system',
          content: `You are a ${coachDescription} helping the user focus and get tasks done. ${datePreamble()}`,
        },
        {
          role: 'assistant',
          content: 'What are your important tasks?',
        },
      ]

      this.handleTaskTalkText(`${this.workContext} I want to do: ${this.workTasks.join(',')}`)
    }
  }

  handleTaskTalkText = async (input: string) => {
    this.gptLoop(input, ['All Done'])
  }

  // --- remember

  doRemember = async () => {}

  editor: Editor | undefined
  ydoc: Y.Doc | undefined

  doJournal = async () => {
    tracker.addieEvent('journal')
    const today = new Date()
    const date = dateToPeriodDateString(Period.DAY, today)
    addieStore.awaitingResponse.set(true)
    const project = projectStore.currentProject.get()!

    const entries = await journalStore.loadNotes(project, Period.DAY, date, date)
    this.ydoc = new Y.Doc()

    if (entries?.length) {
      const journalEntry = entries[0]
      loadDoc(project, journalEntry.id, this.ydoc)
      await addieStore.addBotMessage(`Adding to your existing journal for today.`)

      this.setUserResponse(
        {
          kind: 'buttons_text',
          buttons: ['Done', 'Show Journal'],
        },
        this.handleJournalButtons,
        this.handleJournal
      )
    } else {
      await addieStore.addBotMessage(
        `Today is ${new Date().toLocaleDateString()}. What would you like to write?`
      )
      this.setUserResponse(
        {
          kind: 'buttons_text',
          buttons: ['Done'],
        },
        this.handleJournalButtons,
        this.handleJournal
      )
    }
    this.editor = createEditor(this.ydoc)
  }

  handleJournalButtons = async (index: number) => {
    if (index == 0) {
      this.editor = undefined
      this.ydoc = undefined
      this.mainMenu()
    } else if (index == 1) {
      tracker.addieEvent('seeJournal')
      await addieStore.addBotMessage(`Here's what you've written so far:`)
      await addieStore.addBotMessage(this.editor?.getText() || '')
      this.setUserResponse(
        {
          kind: 'buttons_text',
          buttons: ['Done'],
        },
        this.handleJournalButtons,
        this.handleJournal
      )
    }
  }

  handleJournal = async (input: string) => {
    tracker.addieEvent('writeJournal')
    assertIsDefined(this.editor, 'editor')
    assertIsDefined(this.ydoc, 'ydoc')

    const len = this.editor.state.doc.nodeSize
    const transaction = this.editor.state.tr.insertText(input + '\n')
    const newState = this.editor.state.apply(transaction)
    this.editor.view.updateState(newState)
    const date = dateToPeriodDateString(Period.DAY, new Date())

    const contents = Y.encodeStateAsUpdate(this.ydoc)
    const project = projectStore.currentProject.get()!
    const text = this.editor.getText()
    const snippet = text.substring(0, 252).trim()

    journalStore
      .saveNote(project, Period.DAY, date, contents, snippet)
      .then((note) => docStore.saveDoc(project, note.id, contents))

    this.setUserResponse(
      {
        kind: 'buttons_text',
        buttons: ['Done'],
      },
      this.handleJournalButtons,
      this.handleJournal
    )
  }

  // --- help

  doHelp = async () => {
    tracker.addieEvent('getHelp')
    await addieStore.addBotMessage(`What would you like help with?`)

    this.setUserResponse(
      {
        kind: 'buttons_text',
        buttons: ['Back to menu'],
      },
      this.handleHelpButton,
      this.handleHelp
    )

    this.messageHistory = [
      {
        role: 'system',
        content: `You are a ${coachDescription} helping the user inside an ADHD assistant app. ${datePreamble()}`,
      },
      {
        role: 'assistant',
        content: 'What would you like help with?',
      },
    ]
  }

  handleHelp = async (input: string) => {
    this.gptLoop(input, ['Back to menu', 'All done'])
  }

  handleHelpButton = async (index: number) => {
    if (index == 0) {
      this.mainMenu()
    } else if (index == 1) {
      this.finishConversation()
    }
  }

  // --- end

  finishConversation = async () => {
    await addieStore.addBotMessage(`Thanks for talking with me! How was this conversation?`)

    this.setUserResponse(
      {
        kind: 'buttons',
        buttons: ['Great', 'OK', 'Bad'],
      },
      this.handleFinishButtons,
      null
    )
  }

  handleFinishButtons = async (index: number) => {
    const messages = addieStore.messages.get().length
    if (index == 0) {
      tracker.addieRating('great', messages)
    } else if (index == 1) {
      tracker.addieRating('ok', messages)
    } else if (index == 2) {
      tracker.addieRating('bad', messages)
    }
    addieStore.setResponse({ kind: 'end' })
  }

  // ---

  gptLoop = async (input: string, buttons: string[]) => {
    tracker.addieGPTChat(input)
    this.messageHistory.push({
      role: 'user',
      content: input,
    })

    try {
      addieStore.setError(null)
      addieStore.awaitingResponse.set(true)
      const { response, status } = await API.generateChat(this.messageHistory)

      this.messageHistory.push({
        role: 'assistant',
        content: response,
      })
      await addieStore.addBotMessage(response)

      // if the response was incomplete, get more (only one time)
      if (status == 206) {
        addieStore.awaitingResponse.set(true)
        const { response } = await API.generateChat(this.messageHistory)
        this.messageHistory.push({
          role: 'assistant',
          content: response,
        })
        await addieStore.addBotMessage(response)
      }

      addieStore.setResponse({
        kind: 'buttons_text',
        buttons,
      })
    } catch (error) {
      addieStore.setError(unwrapError(error))
      addieStore.setResponse({
        kind: 'buttons_text',
        buttons,
      })
    } finally {
      addieStore.awaitingResponse.set(false)
    }
  }

  // ---

  handleButton = async (index: number) => {
    addieStore.setResponse(null)
    this.buttonHandler(index)
  }

  handleInput = async (input: string) => {
    addieStore.setResponse(null)
    this.inputHandler(input)
  }
}

const addieScript = new AddieScript()
if (config.dev) (window as any)['addieScript'] = addieScript
export default addieScript
