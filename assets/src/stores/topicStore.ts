import { action, atom } from 'nanostores'
import { RouterOnChangeArgs } from 'preact-router'

import { Session } from '@/api/topicflow'
import { DataBackedTopic, EphemeralTopic } from '@/api/topicflowTopic'
import { config, paths } from '@/config'
import { User } from '@/models'
import { authStore } from '@/stores/authStore'
import { logger } from '@/utils'

class TopicStore {
  // --- stores

  token: string | undefined

  topicflow: Session | undefined

  ready = atom<boolean>(false)

  // --- topicflow initialization

  initTopicflow = () => {
    if (authStore.debugMode()) (window as any)['topicStore'] = topicStore

    const clientId = authStore.clientId
    const type = 'main'
    this.token = authStore.authTokens.get()?.access?.token

    this.topicflow = new Session(config.topicflowUrl, `${clientId}|${type}`)
    this.topicflow.login(this.token!).catch((e) => logger.warn('socketService:init-topicflow', e))
    this.ready.set(true)
  }

  initDataTopic = (topic: string) => {
    if (this.topicflow?.status == 'logged_out') this.reconnectTopicflow()
    return new DataBackedTopic(this.topicflow!.subscribe(topic))
  }

  initEphemeralTopic = (topic: string) => {
    if (this.topicflow?.status == 'logged_out') this.reconnectTopicflow()
    return new EphemeralTopic(this.topicflow!.subscribe(topic))
  }

  isReconnectTopicflow: boolean = false
  reconnectTopicflow() {
    if (!this.topicflow) throw 'Topicflow was null'
    if (
      this.isReconnectTopicflow ||
      this.topicflow.status == 'connected' ||
      this.topicflow.status == 'trying'
    )
      return
    this.isReconnectTopicflow = true
    logger.debug('Reconnecting topicflow', this.topicflow.status)

    this.topicflow?.login(this.token!).catch((e) => {
      logger.warn('socketService:reconnect-topicflow', e)
      setTimeout(() => this.reconnectTopicflow(), 3000)
    })

    this.isReconnectTopicflow = false
  }
}

export const topicStore = new TopicStore()
if (config.dev) (window as any)['topicStore'] = topicStore
