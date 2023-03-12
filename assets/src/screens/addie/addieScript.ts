import { addieStore } from '@/stores/addieStore'

enum State {
  WELCOME,
  ATTEND,
  BEDTIME,
  HOME,
  WEEKEND,
  WORK,
}

const LS_SEEN_BEFORE = 'addie-seen-before'
class AddieScript {
  state: State = State.WELCOME

  // --- welcome

  welcome = async () => {
    this.state = State.WELCOME

    if (!localStorage.getItem(LS_SEEN_BEFORE)) {
      await addieStore.addBotMessage(`Hi! I am Addie, your personal ADHD assistant.`)
      localStorage.setItem(LS_SEEN_BEFORE, 'true')
    } else {
      await addieStore.addBotMessage(`Hi again!`)
    }

    await addieStore.addBotMessage(`Let's start with an emotional check-in.

Take a deep breath and close your eyes. How are you feeling right now?`)

    addieStore.setResponse({
      kind: 'buttons',
      buttons: ['Calm & Present', 'On Autopilot', 'Unwell'],
    })
  }

  // --- attend to self

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
    this.state = State.ATTEND

    await addieStore.addBotMessage(`I'm sorry to hear that. Let's take a moment to attend to yourself.
What do you need right now?`)

    addieStore.setResponse({
      kind: 'text',
    })
  }

  handleAttendToSelf = async (input: string) => {
    await addieStore.addBotMessage(`Okay, let's do that. (TODO: GPT)`)
    await addieStore.addBotMessage(`I'll be here when you're ready.`)
    addieStore.setResponse({
      kind: 'end',
    })
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
    this.state = State.BEDTIME

    await addieStore.addBotMessage(`It's bedtime! Let's get ready for bed.

Are you sleepy?`)

    addieStore.setResponse({
      kind: 'buttons',
      buttons: ['Yes', 'No'],
    })
  }

  handleBedtime = async (index: number) => {
    if (index == 0) {
      await addieStore.addBotMessage(`Great! Let's get to bed.`)

      await addieStore.addBotMessage(`1. Put away your electronics (like this one).

2. Get into bed. Turn on your white noise machine (if you have one).

3. Close your eyes and take 3 deep breaths.

4. I'll see you tomorrow.`)

      addieStore.setResponse({
        kind: 'end',
      })
    } else if (index == 1) {
      await addieStore.addBotMessage(`Okay, let's get you ready for bed.

It's perfectly normal not to be sleepy yet. People with ADHD typically have a later circadian rhythm
and have a harder time falling asleep as well.`)

      await addieStore.addBotMessage(
        `Pick an activity that's relaxing and calming and does not involve screens.`
      )

      addieStore.setResponse({
        kind: 'text',
      })
    }
  }

  handleBedtimeText = async (input: string) => {
    await addieStore.addBotMessage(`That sounds like a great idea!`)
    await addieStore.addBotMessage('Go do that. Then come back and we can get ready for bed.')
    addieStore.setResponse({
      kind: 'buttons',
      buttons: ["I'm ready."],
    })
  }

  // --- routines

  homeRoutine = async () => {
    this.state = State.HOME
    await addieStore.addBotMessage(`Let's think about things to do around the home.`)

    addieStore.setResponse({
      kind: 'text',
    })
  }

  workRoutine = async () => {
    this.state = State.WORK
    await addieStore.addBotMessage(
      `You're probably at work. First things first. Check your calendar and see when your next meeting is`
    )

    addieStore.setResponse({
      kind: 'buttons',
      buttons: ["It's coming up soon", "It's in a few hours", 'No meetings'],
    })
  }

  weekendRoutine = async () => {
    this.state = State.WEEKEND
    await addieStore.addBotMessage(`It's the weekend!`)

    await addieStore.addBotMessage(`Stop talking to me and go outside.`)

    addieStore.setResponse({
      kind: 'end',
    })
  }

  // ---

  handleButton = async (index: number) => {
    addieStore.setResponse(null)
    if (this.state == State.WELCOME) {
      this.handleEmotionalCheckin(index)
    } else if (this.state == State.BEDTIME) {
      this.handleBedtime(index)
    }
  }

  handleInput = async (input: string) => {
    addieStore.setResponse(null)
    if (this.state == State.BEDTIME) {
      this.handleBedtimeText(input)
    }
  }
}

export default new AddieScript()
