/**
 * C:\etherworldQC\engine-lab\client\src\tools\troxt\chat\EtherWorldTroxtChat.tsx
 *
 * Interface principale du chat TROXT.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import type {
  FormEvent,
  KeyboardEvent,
} from 'react'

import {
  Bot,
  Eraser,
  Send,
  Sparkles,
  User,
} from 'lucide-react'

import { TROXT_EVENTS } from '../events'

import type {
  AgentRequest,
  AgentStatus,
  ChatMessage,
  ChatProject,
} from './chatTypes'

import './troxt-chat.css'

const STORAGE_KEY =
  'engine-lab:troxt-chat:v1'

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`
}

function readStoredMessages(): ChatMessage[] {
  try {
    const stored =
      window.localStorage.getItem(
        STORAGE_KEY
      )

    if (!stored) {
      return []
    }

    const parsed =
      JSON.parse(stored)

    return Array.isArray(parsed)
      ? parsed
      : []
  } catch {
    return []
  }
}

function createMessage(
  role: ChatMessage['role'],
  text: string,
  project: ChatProject
): ChatMessage {
  return {
    id: createId(role),
    role,
    text,
    createdAt: Date.now(),
    project,
  }
}

export function EtherWorldTroxtChat() {
  const [messages, setMessages] =
    useState<ChatMessage[]>(
      readStoredMessages
    )

  const [input, setInput] =
    useState('')

  const [project, setProject] =
    useState<ChatProject>('lab')

  const [status, setStatus] =
    useState<AgentStatus>('ready')

  const viewportRef =
    useRef<HTMLDivElement>(null)

  const appendMessage =
    useCallback(
      (message: ChatMessage) => {
        setMessages((current) =>
          [...current, message].slice(-250)
        )
      },
      []
    )

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(messages)
    )

    const viewport =
      viewportRef.current

    if (!viewport) {
      return
    }

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  useEffect(() => {
    const handleAgentMessage = (
      event: Event
    ): void => {
      const customEvent =
        event as CustomEvent<ChatMessage>

      if (!customEvent.detail) {
        return
      }

      appendMessage(
        customEvent.detail
      )

      setStatus('ready')
    }

    const handleAgentStatus = (
      event: Event
    ): void => {
      const customEvent =
        event as CustomEvent<{
          status: AgentStatus
        }>

      if (!customEvent.detail) {
        return
      }

      setStatus(
        customEvent.detail.status
      )
    }

    const handleClear = (): void => {
      setMessages([])
      window.localStorage.removeItem(
        STORAGE_KEY
      )
    }

    window.addEventListener(
      TROXT_EVENTS.message,
      handleAgentMessage
    )

    window.addEventListener(
      TROXT_EVENTS.status,
      handleAgentStatus
    )

    window.addEventListener(
      TROXT_EVENTS.clear,
      handleClear
    )

    return () => {
      window.removeEventListener(
        TROXT_EVENTS.message,
        handleAgentMessage
      )

      window.removeEventListener(
        TROXT_EVENTS.status,
        handleAgentStatus
      )

      window.removeEventListener(
        TROXT_EVENTS.clear,
        handleClear
      )
    }
  }, [appendMessage])

  const sendMessage =
    useCallback(async (): Promise<void> => {
      const text = input.trim()

      if (
        !text ||
        status === 'thinking' ||
        status === 'working'
      ) {
        return
      }

      const request: AgentRequest = {
        id: createId('request'),
        text,
        project,
        createdAt: Date.now(),

        context: {
          source: 'engine-lab',
          currentTool: 'troxt',
        },
      }

      appendMessage(
        createMessage(
          'user',
          text,
          project
        )
      )

      setInput('')
      setStatus('thinking')

      const agent =
        window.__ETHERWORLD_TROXT_AGENT__

      if (agent?.send) {
        try {
          const response =
            await agent.send(request)

          if (typeof response === 'string') {
            appendMessage(
              createMessage(
                'assistant',
                response,
                project
              )
            )
          } else if (response) {
            appendMessage(response)
          }

          setStatus('ready')
        } catch (error) {
          appendMessage(
            createMessage(
              'assistant',
              error instanceof Error
                ? `Erreur TROXT : ${error.message}`
                : 'Erreur TROXT inconnue.',
              project
            )
          )

          setStatus('error')
        }

        return
      }

      window.dispatchEvent(
        new CustomEvent(
          TROXT_EVENTS.request,
          {
            detail: request,
          }
        )
      )
    }, [
      appendMessage,
      input,
      project,
      status,
    ])

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ): void => {
    event.preventDefault()
    void sendMessage()
  }

  const handleKeyDown = (
    event:
      KeyboardEvent<HTMLTextAreaElement>
  ): void => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey
    ) {
      event.preventDefault()
      void sendMessage()
    }
  }

  const clearChat = (): void => {
    setMessages([])

    window.localStorage.removeItem(
      STORAGE_KEY
    )
  }

  const suggestedCommands = [
    'Ouvre Visual Forge',
    'Liste les outils disponibles',
    'Lance Visual Forge',
  ]

  return (
    <section className="troxt-chat">
      <header className="troxt-chat__header">
        <div className="troxt-chat__brand">
          <div className="troxt-chat__logo">
            <Sparkles size={19} />
          </div>

          <span>
            <strong>TROXT</strong>
            <small>
              ETHERWORLD ENGINE-LAB
            </small>
          </span>
        </div>

        <div className="troxt-chat__controls">
          <select
            value={project}
            onChange={(event) =>
              setProject(
                event.target
                  .value as ChatProject
              )
            }
          >
            <option value="lab">
              Engine-Lab
            </option>

            <option value="etherworld">
              EtherWorld
            </option>

            <option value="troxt">
              TROXT
            </option>
          </select>

          <button
            type="button"
            title="Effacer le chat"
            onClick={clearChat}
          >
            <Eraser size={15} />
          </button>
        </div>
      </header>

      <div
        className={
          `troxt-chat__status is-${status}`
        }
      >
        <span />
        {status}
      </div>

      <div
        ref={viewportRef}
        className="troxt-chat__messages"
      >
        {messages.length === 0 && (
          <div className="troxt-chat__welcome">
            <Bot size={34} />

            <strong>
              TROXT est prêt
            </strong>

            <p>
              Il peut contrôler les outils
              du laboratoire et communiquer
              avec Visual Forge.
            </p>

            <div className="troxt-chat__suggestions">
              {suggestedCommands.map(
                (command) => (
                  <button
                    key={command}
                    type="button"
                    onClick={() =>
                      setInput(command)
                    }
                  >
                    {command}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <article
            key={message.id}
            className={
              `troxt-chat__message is-${message.role}`
            }
          >
            <div className="troxt-chat__avatar">
              {message.role === 'user'
                ? <User size={15} />
                : <Bot size={15} />}
            </div>

            <div className="troxt-chat__bubble">
              <div className="troxt-chat__message-header">
                <strong>
                  {message.role === 'user'
                    ? 'Toi'
                    : message.role === 'system'
                      ? 'Système'
                      : 'TROXT'}
                </strong>

                <time>
                  {new Date(
                    message.createdAt
                  ).toLocaleTimeString(
                    'fr-CA',
                    {
                      hour: '2-digit',
                      minute: '2-digit',
                    }
                  )}
                </time>
              </div>

              <p>{message.text}</p>
            </div>
          </article>
        ))}
      </div>

      <form
        className="troxt-chat__composer"
        onSubmit={handleSubmit}
      >
        <textarea
          value={input}
          rows={3}
          placeholder="Donne une commande à TROXT…"
          onChange={(event) =>
            setInput(
              event.target.value
            )
          }
          onKeyDown={handleKeyDown}
        />

        <div className="troxt-chat__composer-footer">
          <small>
            Entrée pour envoyer ·
            Maj + Entrée pour une ligne
          </small>

          <button
            type="submit"
            disabled={
              !input.trim() ||
              status === 'thinking' ||
              status === 'working'
            }
          >
            <Send size={15} />
            Envoyer
          </button>
        </div>
      </form>
    </section>
  )
}
