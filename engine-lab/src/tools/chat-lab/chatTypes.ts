## FICHIER 1/4

```text
C:\etherworldQC\engine-lab\client\src\tools\chat-lab\chatTypes.ts
```

```ts
export type ChatProject = 'etherworld' | 'troxt' | 'lab'

export type ChatRole =
  | 'user'
  | 'assistant'
  | 'system'

export type AgentStatus =
  | 'ready'
  | 'thinking'
  | 'working'
  | 'error'
  | 'offline'

export interface ChatMessage {
  id: string
  role: ChatRole
  text: string
  createdAt: number
  project: ChatProject
  metadata?: Record<string, unknown>
}

export interface AgentRequest {
  id: string
  text: string
  project: ChatProject
  createdAt: number

  context: {
    source: 'engine-lab-chat'
    currentTool: 'chat-lab'
    sceneName?: string
    selection?: unknown
  }
}

export interface AgentStatusEvent {
  status: AgentStatus
  label?: string
}

export const CHAT_EVENTS = {
  request: 'etherworld-troxt-agent:request',
  message: 'etherworld-troxt-agent:message',
  status: 'etherworld-troxt-agent:status',
  clear: 'etherworld-troxt-agent:clear',
} as const

declare global {
  interface Window {
    __ETHERWORLD_TROXT_AGENT__?: {
      send?: (
        request: AgentRequest
      ) => Promise<
        ChatMessage |
        string |
        void
      >

      getStatus?: () => AgentStatus
    }
  }
}
```

---

## FICHIER 2/4

```text
C:\etherworldQC\engine-lab\client\src\tools\chat-lab\EtherWorldTroxtChat.tsx
```

```tsx
import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  Bot,
  Download,
  Eraser,
  Send,
  Sparkles,
  User,
  Wifi,
  WifiOff,
} from 'lucide-react'

import {
  AgentRequest,
  AgentStatus,
  AgentStatusEvent,
  CHAT_EVENTS,
  ChatMessage,
  ChatProject,
} from './chatTypes'

import './chat-lab.css'

const STORAGE_KEY =
  'engine-lab:etherworld-troxt-chat:v1'

const MAX_MESSAGES = 250

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'system',
  text:
    'Chat Engine-Lab prêt. Les demandes sont envoyées à l’agent EtherWorld/TROXT lorsqu’il est branché.',
  createdAt: Date.now(),
  project: 'lab',
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`
}

function readStoredMessages(): ChatMessage[] {
  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY
      )

    if (!raw) {
      return [WELCOME_MESSAGE]
    }

    const parsed =
      JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      return [WELCOME_MESSAGE]
    }

    return parsed.slice(
      -MAX_MESSAGES
    )
  } catch {
    return [WELCOME_MESSAGE]
  }
}

function formatTime(
  timestamp: number
) {
  return new Intl.DateTimeFormat(
    'fr-CA',
    {
      hour: '2-digit',
      minute: '2-digit',
    }
  ).format(timestamp)
}

function normalizeReply(
  reply: ChatMessage | string,
  project: ChatProject
): ChatMessage {
  if (typeof reply === 'string') {
    return {
      id: makeId('assistant'),
      role: 'assistant',
      text: reply,
      createdAt: Date.now(),
      project,
    }
  }

  return {
    ...reply,

    id:
      reply.id ||
      makeId('assistant'),

    role:
      reply.role ||
      'assistant',

    createdAt:
      reply.createdAt ||
      Date.now(),

    project:
      reply.project ||
      project,
  }
}

export function EtherWorldTroxtChat() {
  const [
    messages,
    setMessages,
  ] = useState<ChatMessage[]>(
    readStoredMessages
  )

  const [
    input,
    setInput,
  ] = useState('')

  const [
    project,
    setProject,
  ] = useState<ChatProject>(
    'lab'
  )

  const [
    status,
    setStatus,
  ] = useState<AgentStatus>(
    () =>
      window
        .__ETHERWORLD_TROXT_AGENT__
        ?.getStatus?.() ||
      'offline'
  )

  const [
    statusLabel,
    setStatusLabel,
  ] = useState(
    'Agent non branché'
  )

  const [
    pendingRequestId,
    setPendingRequestId,
  ] = useState<
    string | null
  >(null)

  const viewportRef =
    useRef<HTMLDivElement>(
      null
    )

  const textareaRef =
    useRef<HTMLTextAreaElement>(
      null
    )

  const responseTimerRef =
    useRef<number | null>(
      null
    )

  const visibleMessages =
    useMemo(
      () =>
        messages.slice(
          -MAX_MESSAGES
        ),
      [messages]
    )

  const appendMessage =
    useCallback(
      (
        message: ChatMessage
      ) => {
        setMessages(
          (current) =>
            [
              ...current,
              message,
            ].slice(
              -MAX_MESSAGES
            )
        )
      },
      []
    )

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        messages.slice(
          -MAX_MESSAGES
        )
      )
    )
  }, [messages])

  useEffect(() => {
    const viewport =
      viewportRef.current

    if (!viewport) return

    viewport.scrollTo({
      top:
        viewport.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, status])

  useEffect(() => {
    const onAgentMessage = (
      event: Event
    ) => {
      const custom =
        event as CustomEvent<
          ChatMessage |
          string
        >

      if (!custom.detail) {
        return
      }

      appendMessage(
        normalizeReply(
          custom.detail,
          project
        )
      )

      setPendingRequestId(
        null
      )

      setStatus('ready')
      setStatusLabel('Prêt')

      if (
        responseTimerRef.current
      ) {
        window.clearTimeout(
          responseTimerRef.current
        )

        responseTimerRef.current =
          null
      }
    }

    const onAgentStatus = (
      event: Event
    ) => {
      const custom =
        event as CustomEvent<
          AgentStatusEvent
        >

      if (!custom.detail) {
        return
      }

      setStatus(
        custom.detail.status
      )

      setStatusLabel(
        custom.detail.label ||
          (
            custom.detail
              .status ===
            'ready'
              ? 'Prêt'

              : custom.detail
                    .status ===
                  'thinking'
                ? 'Réflexion'

                : custom.detail
                      .status ===
                    'working'
                  ? 'Travail en cours'

                  : custom.detail
                        .status ===
                      'error'
                    ? 'Erreur'

                    : 'Agent non branché'
          )
      )
    }

    window.addEventListener(
      CHAT_EVENTS.message,
      onAgentMessage
    )

    window.addEventListener(
      CHAT_EVENTS.status,
      onAgentStatus
    )

    return () => {
      window.removeEventListener(
        CHAT_EVENTS.message,
        onAgentMessage
      )

      window.removeEventListener(
        CHAT_EVENTS.status,
        onAgentStatus
      )

      if (
        responseTimerRef.current
      ) {
        window.clearTimeout(
          responseTimerRef.current
        )
      }
    }
  }, [
    appendMessage,
    project,
  ])

  const clearConversation =
    useCallback(() => {
      setMessages([
        WELCOME_MESSAGE,
      ])

      setPendingRequestId(
        null
      )

      window.dispatchEvent(
        new CustomEvent(
          CHAT_EVENTS.clear
        )
      )

      textareaRef.current?.focus()
    }, [])

  const exportConversation =
    useCallback(() => {
      const payload = {
        exportedAt:
          new Date().toISOString(),

        project,
        messages,
      }

      const blob =
        new Blob(
          [
            JSON.stringify(
              payload,
              null,
              2
            ),
          ],
          {
            type:
              'application/json',
          }
        )

      const url =
        URL.createObjectURL(
          blob
        )

      const link =
        document.createElement(
          'a'
        )

      link.href = url

      link.download =
        `engine-lab-chat-${project}-${Date.now()}.json`

      link.click()

      URL.revokeObjectURL(
        url
      )
    }, [
      messages,
      project,
    ])

  const sendMessage =
    useCallback(
      async () => {
        const text =
          input.trim()

        if (
          !text ||
          pendingRequestId
        ) {
          return
        }

        const requestId =
          makeId('request')

        const request: AgentRequest =
          {
            id: requestId,
            text,
            project,
            createdAt:
              Date.now(),

            context: {
              source:
                'engine-lab-chat',

              currentTool:
                'chat-lab',
            },
          }

        appendMessage({
          id: makeId('user'),
          role: 'user',
          text,

          createdAt:
            request.createdAt,

          project,
        })

        setInput('')

        setPendingRequestId(
          requestId
        )

        setStatus('thinking')

        setStatusLabel(
          'Analyse de la demande'
        )

        const directAgent =
          window
            .__ETHERWORLD_TROXT_AGENT__
            ?.send

        try {
          if (directAgent) {
            const reply =
              await directAgent(
                request
              )

            if (reply) {
              appendMessage(
                normalizeReply(
                  reply,
                  project
                )
              )

              setPendingRequestId(
                null
              )

              setStatus(
                'ready'
              )

              setStatusLabel(
                'Prêt'
              )

              return
            }
          }

          window.dispatchEvent(
            new CustomEvent<AgentRequest>(
              CHAT_EVENTS.request,
              {
                detail:
                  request,
              }
            )
          )

          responseTimerRef.current =
            window.setTimeout(
              () => {
                setPendingRequestId(
                  (
                    current
                  ) => {
                    if (
                      current !==
                      requestId
                    ) {
                      return current
                    }

                    appendMessage({
                      id:
                        makeId(
                          'system'
                        ),

                      role:
                        'system',

                      text:
                        'La demande a été envoyée, mais aucun agent n’est encore branché au Chat Lab.',

                      createdAt:
                        Date.now(),

                      project,
                    })

                    setStatus(
                      'offline'
                    )

                    setStatusLabel(
                      'Agent non branché'
                    )

                    return null
                  }
                )
              },
              1800
            )
        } catch (error) {
          appendMessage({
            id:
              makeId(
                'system'
              ),

            role:
              'system',

            text:
              error instanceof
              Error
                ? `Erreur de l’agent : ${error.message}`
                : 'Erreur inconnue pendant l’envoi.',

            createdAt:
              Date.now(),

            project,
          })

          setPendingRequestId(
            null
          )

          setStatus('error')

          setStatusLabel(
            'Erreur'
          )
        }
      },
      [
        appendMessage,
        input,
        pendingRequestId,
        project,
      ]
    )

  const onSubmit = (
    event: FormEvent
  ) => {
    event.preventDefault()

    void sendMessage()
  }

  const onInputKeyDown = (
    event:
      KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (
      event.key ===
        'Enter' &&
      !event.shiftKey
    ) {
      event.preventDefault()

      void sendMessage()
    }
  }

  return (
    <section className="ew-chat">
      <header className="ew-chat__header">
        <div className="ew-chat__identity">
          <div className="ew-chat__logo">
            <Sparkles
              size={20}
            />
          </div>

          <div>
            <strong>
              ETHERWORLD /
              TROXT
            </strong>

            <span>
              ENGINE-LAB CHAT
            </span>
          </div>
        </div>

        <div className="ew-chat__toolbar">
          <label className="ew-chat__project">
            <span>
              Projet
            </span>

            <select
              value={
                project
              }

              onChange={(
                event
              ) =>
                setProject(
                  event
                    .target
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
          </label>

          <button
            type="button"
            className="ew-chat__icon-button"
            onClick={
              exportConversation
            }
            title="Exporter la conversation"
          >
            <Download
              size={16}
            />
          </button>

          <button
            type="button"
            className="ew-chat__icon-button"
            onClick={
              clearConversation
            }
            title="Effacer la conversation"
          >
            <Eraser
              size={16}
            />
          </button>
        </div>
      </header>

      <div className="ew-chat__status">
        <span
          className={
            `ew-chat__status-dot is-${status}`
          }
        />

        {status ===
        'offline' ? (
          <WifiOff
            size={14}
          />
        ) : (
          <Wifi
            size={14}
          />
        )}

        <span>
          {statusLabel}
        </span>
      </div>

      <div
        ref={
          viewportRef
        }
        className="ew-chat__messages"
      >
        {visibleMessages.map(
          (
            message
          ) => {
            const isUser =
              message.role ===
              'user'

            return (
              <article
                key={
                  message.id
                }

                className={
                  `ew-chat__message is-${message.role}`
                }
              >
                <div className="ew-chat__avatar">
                  {isUser ? (
                    <User
                      size={16}
                    />
                  ) : (
                    <Bot
                      size={16}
                    />
                  )}
                </div>

                <div className="ew-chat__bubble">
                  <div className="ew-chat__meta">
                    <strong>
                      {isUser
                        ? 'Toi'

                        : message.role ===
                            'assistant'
                          ? 'Agent'

                          : 'Engine-Lab'}
                    </strong>

                    <span>
                      {formatTime(
                        message.createdAt
                      )}
                    </span>
                  </div>

                  <p>
                    {
                      message.text
                    }
                  </p>
                </div>
              </article>
            )
          }
        )}

        {pendingRequestId && (
          <article className="ew-chat__message is-assistant">
            <div className="ew-chat__avatar">
              <Bot
                size={16}
              />
            </div>

            <div className="ew-chat__bubble ew-chat__thinking">
              <span />
              <span />
              <span />
            </div>
          </article>
        )}
      </div>

      <form
        className="ew-chat__composer"
        onSubmit={
          onSubmit
        }
      >
        <textarea
          ref={
            textareaRef
          }

          value={
            input
          }

          onChange={(
            event
          ) =>
            setInput(
              event
                .target
                .value
            )
          }

          onKeyDown={
            onInputKeyDown
          }

          placeholder="Écris une demande pour l’agent EtherWorld/TROXT…"

          rows={3}

          maxLength={
            8000
          }
        />

        <div className="ew-chat__composer-footer">
          <span>
            Entrée pour
            envoyer ·
            Maj+Entrée pour
            une nouvelle ligne
          </span>

          <button
            type="submit"

            disabled={
              !input.trim() ||
              Boolean(
                pendingRequestId
              )
            }
          >
            <Send
              size={16}
            />

            Envoyer
          </button>
        </div>
      </form>
    </section>
  )
}
```

---

## FICHIER 3/4

```text
C:\etherworldQC\engine-lab\client\src\tools\chat-lab\ChatLabTool.tsx
```

```tsx
import {
  EtherWorldTroxtChat,
} from './EtherWorldTroxtChat'

export default function ChatLabTool() {
  return (
    <EtherWorldTroxtChat />
  )
}
```

---

## FICHIER 4/4

```text
C:\etherworldQC\engine-lab\client\src\tools\chat-lab\chat-lab.css
```

```css
.ew-chat {
  width: min(
    980px,
    calc(100vw - 32px)
  );

  height: min(
    760px,
    calc(100vh - 32px)
  );

  margin:
    16px auto;

  display: grid;

  grid-template-rows:
    auto
    auto
    1fr
    auto;

  overflow: hidden;

  color:
    #f8fafc;

  border:
    1px solid
    rgba(
      88,
      220,
      255,
      0.22
    );

  border-radius:
    24px;

  background:
    radial-gradient(
      circle at top left,
      rgba(
        45,
        80,
        255,
        0.16
      ),
      transparent 32%
    ),
    radial-gradient(
      circle at bottom right,
      rgba(
        216,
        55,
        255,
        0.13
      ),
      transparent 30%
    ),
    rgba(
      5,
      8,
      18,
      0.96
    );

  box-shadow:
    0 30px 90px
      rgba(
        0,
        0,
        0,
        0.5
      ),
    inset 0 1px 0
      rgba(
        255,
        255,
        255,
        0.06
      );

  font-family:
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

.ew-chat *,
.ew-chat *::before,
.ew-chat *::after {
  box-sizing:
    border-box;
}

.ew-chat__header {
  min-height:
    74px;

  padding:
    14px 18px;

  display:
    flex;

  align-items:
    center;

  justify-content:
    space-between;

  gap:
    18px;

  border-bottom:
    1px solid
    rgba(
      255,
      255,
      255,
      0.08
    );

  background:
    rgba(
      8,
      12,
      26,
      0.82
    );

  backdrop-filter:
    blur(18px);
}

.ew-chat__identity,
.ew-chat__toolbar,
.ew-chat__status,
.ew-chat__project,
.ew-chat__composer-footer,
.ew-chat__message,
.ew-chat__meta {
  display:
    flex;

  align-items:
    center;
}

.ew-chat__identity {
  gap:
    12px;
}

.ew-chat__identity strong,
.ew-chat__identity span {
  display:
    block;
}

.ew-chat__identity strong {
  font-size:
    14px;

  letter-spacing:
    0.08em;
}

.ew-chat__identity span {
  margin-top:
    3px;

  color:
    rgba(
      225,
      239,
      255,
      0.5
    );

  font-size:
    10px;

  font-weight:
    800;

  letter-spacing:
    0.18em;
}

.ew-chat__logo {
  width:
    44px;

  height:
    44px;

  display:
    grid;

  place-items:
    center;

  border-radius:
    15px;

  color:
    #e9fbff;

  background:
    linear-gradient(
      135deg,
      #4f46e5,
      #06b6d4
    );

  box-shadow:
    0 0 26px
    rgba(
      34,
      211,
      238,
      0.26
    );
}

.ew-chat__toolbar {
  gap:
    9px;
}

.ew-chat__project {
  gap:
    8px;

  padding:
    7px 10px;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.09
    );

  border-radius:
    12px;

  background:
    rgba(
      255,
      255,
      255,
      0.04
    );
}

.ew-chat__project span {
  color:
    rgba(
      255,
      255,
      255,
      0.48
    );

  font-size:
    10px;

  font-weight:
    800;

  text-transform:
    uppercase;
}

.ew-chat__project select {
  border:
    0;

  outline:
    0;

  color:
    #eafaff;

  background:
    transparent;

  font-size:
    12px;

  font-weight:
    800;
}

.ew-chat__project option {
  color:
    #0f172a;
}

.ew-chat__icon-button {
  width:
    38px;

  height:
    38px;

  display:
    grid;

  place-items:
    center;

  margin:
    0;

  padding:
    0;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.1
    );

  border-radius:
    12px;

  color:
    rgba(
      255,
      255,
      255,
      0.72
    );

  background:
    rgba(
      255,
      255,
      255,
      0.045
    );

  cursor:
    pointer;
}

.ew-chat__icon-button:hover {
  color:
    #67e8f9;

  border-color:
    rgba(
      103,
      232,
      249,
      0.4
    );
}

.ew-chat__status {
  min-height:
    38px;

  gap:
    7px;

  padding:
    0 18px;

  color:
    rgba(
      255,
      255,
      255,
      0.55
    );

  border-bottom:
    1px solid
    rgba(
      255,
      255,
      255,
      0.06
    );

  font-size:
    11px;

  font-weight:
    750;
}

.ew-chat__status-dot {
  width:
    8px;

  height:
    8px;

  border-radius:
    999px;

  background:
    #64748b;
}

.ew-chat__status-dot.is-ready {
  background:
    #22c55e;

  box-shadow:
    0 0 10px
    rgba(
      34,
      197,
      94,
      0.8
    );
}

.ew-chat__status-dot.is-thinking,
.ew-chat__status-dot.is-working {
  background:
    #22d3ee;

  box-shadow:
    0 0 10px
    rgba(
      34,
      211,
      238,
      0.8
    );

  animation:
    ew-chat-pulse
    1s
    infinite
    alternate;
}

.ew-chat__status-dot.is-error {
  background:
    #fb7185;
}

.ew-chat__messages {
  min-height:
    0;

  overflow-y:
    auto;

  padding:
    22px;

  scrollbar-width:
    thin;

  scrollbar-color:
    rgba(
      103,
      232,
      249,
      0.34
    )
    transparent;
}

.ew-chat__message {
  align-items:
    flex-start;

  gap:
    10px;

  margin-bottom:
    17px;
}

.ew-chat__message.is-user {
  flex-direction:
    row-reverse;
}

.ew-chat__avatar {
  width:
    34px;

  height:
    34px;

  flex:
    0 0 auto;

  display:
    grid;

  place-items:
    center;

  border:
    1px solid
    rgba(
      103,
      232,
      249,
      0.22
    );

  border-radius:
    12px;

  color:
    #67e8f9;

  background:
    rgba(
      14,
      31,
      55,
      0.84
    );
}

.ew-chat__message.is-user
.ew-chat__avatar {
  color:
    #c4b5fd;

  border-color:
    rgba(
      196,
      181,
      253,
      0.25
    );

  background:
    rgba(
      55,
      34,
      92,
      0.76
    );
}

.ew-chat__bubble {
  max-width:
    min(
      74%,
      680px
    );

  padding:
    12px 14px;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.075
    );

  border-radius:
    6px
    17px
    17px
    17px;

  background:
    rgba(
      14,
      22,
      40,
      0.9
    );

  box-shadow:
    0 12px 32px
    rgba(
      0,
      0,
      0,
      0.18
    );
}

.ew-chat__message.is-user
.ew-chat__bubble {
  border-radius:
    17px
    6px
    17px
    17px;

  border-color:
    rgba(
      139,
      92,
      246,
      0.22
    );

  background:
    linear-gradient(
      135deg,
      rgba(
        79,
        70,
        229,
        0.28
      ),
      rgba(
        91,
        33,
        182,
        0.22
      )
    );
}

.ew-chat__message.is-system
.ew-chat__bubble {
  border-color:
    rgba(
      250,
      204,
      21,
      0.2
    );

  background:
    rgba(
      69,
      51,
      12,
      0.24
    );
}

.ew-chat__meta {
  justify-content:
    space-between;

  gap:
    16px;

  margin-bottom:
    6px;
}

.ew-chat__meta strong {
  color:
    #e8fbff;

  font-size:
    11px;
}

.ew-chat__meta span {
  color:
    rgba(
      255,
      255,
      255,
      0.34
    );

  font-size:
    9px;
}

.ew-chat__bubble p {
  margin:
    0;

  color:
    rgba(
      248,
      250,
      252,
      0.88
    );

  white-space:
    pre-wrap;

  overflow-wrap:
    anywhere;

  font-size:
    13px;

  line-height:
    1.62;
}

.ew-chat__thinking {
  display:
    flex;

  gap:
    5px;

  min-width:
    64px;
}

.ew-chat__thinking span {
  width:
    7px;

  height:
    7px;

  border-radius:
    999px;

  background:
    #22d3ee;

  animation:
    ew-chat-thinking
    0.9s
    infinite
    alternate;
}

.ew-chat__thinking
span:nth-child(2) {
  animation-delay:
    0.15s;
}

.ew-chat__thinking
span:nth-child(3) {
  animation-delay:
    0.3s;
}

.ew-chat__composer {
  padding:
    14px;

  border-top:
    1px solid
    rgba(
      255,
      255,
      255,
      0.075
    );

  background:
    rgba(
      7,
      11,
      23,
      0.9
    );
}

.ew-chat__composer textarea {
  width:
    100%;

  min-height:
    76px;

  max-height:
    180px;

  resize:
    vertical;

  outline:
    none;

  padding:
    13px 14px;

  border:
    1px solid
    rgba(
      103,
      232,
      249,
      0.14
    );

  border-radius:
    16px;

  color:
    #f8fafc;

  background:
    rgba(
      2,
      6,
      23,
      0.72
    );

  font:
    inherit;

  font-size:
    13px;

  line-height:
    1.5;
}

.ew-chat__composer
textarea:focus {
  border-color:
    rgba(
      103,
      232,
      249,
      0.42
    );

  box-shadow:
    0 0 0 3px
    rgba(
      34,
      211,
      238,
      0.07
    );
}

.ew-chat__composer-footer {
  justify-content:
    space-between;

  gap:
    12px;

  margin-top:
    10px;
}

.ew-chat__composer-footer
> span {
  color:
    rgba(
      255,
      255,
      255,
      0.34
    );

  font-size:
    10px;
}

.ew-chat__composer-footer
button {
  display:
    inline-flex;

  align-items:
    center;

  gap:
    8px;

  margin:
    0;

  padding:
    9px 15px;

  border:
    1px solid
    rgba(
      103,
      232,
      249,
      0.35
    );

  border-radius:
    12px;

  color:
    #e8fcff;

  background:
    linear-gradient(
      135deg,
      #4f46e5,
      #0891b2
    );

  font-weight:
    850;

  cursor:
    pointer;
}

.ew-chat__composer-footer
button:disabled {
  cursor:
    not-allowed;

  opacity:
    0.38;
}

@keyframes ew-chat-thinking {
  from {
    transform:
      translateY(1px);

    opacity:
      0.35;
  }

  to {
    transform:
      translateY(-3px);

    opacity:
      1;
  }
}

@keyframes ew-chat-pulse {
  from {
    opacity:
      0.45;
  }

  to {
    opacity:
      1;
  }
}

@media (
  max-width:
    720px
) {
  .ew-chat {
    width:
      100vw;

    height:
      100vh;

    margin:
      0;

    border:
      0;

    border-radius:
      0;
  }

  .ew-chat__header {
    align-items:
      flex-start;
  }

  .ew-chat__toolbar {
    flex-wrap:
      wrap;

    justify-content:
      flex-end;
  }

  .ew-chat__project
  > span {
    display:
      none;
  }

  .ew-chat__bubble {
    max-width:
      86%;
  }

  .ew-chat__composer-footer
  > span {
    display:
      none;
  }

  .ew-chat__composer-footer {
    justify-content:
      flex-end;
  }
}
```
