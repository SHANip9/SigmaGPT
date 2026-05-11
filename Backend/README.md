# 🧵 SigmaGPT — Thread Workflow Diagram

## Architecture Overview

```mermaid
graph TB
    subgraph Frontend ["🖥️ Frontend (React)"]
        MC["MyContext.jsx<br/><i>Creates shared context</i>"]
        APP["App.jsx<br/><i>State owner + Provider</i>"]
        SB["Sidebar.jsx<br/><i>Thread list + CRUD</i>"]
        CW["ChatWindow.jsx<br/><i>Input + send message</i>"]
        CH["Chat.jsx<br/><i>Render messages + typing effect</i>"]
    end

    subgraph Backend ["⚙️ Backend (Express)"]
        SRV["server.js<br/><i>Express app + DB connect</i>"]
        RT["routes/chat.js<br/><i>API endpoints</i>"]
        MDL["models/Thread.js<br/><i>Mongoose schemas</i>"]
        OAI["utils/openai.js<br/><i>OpenAI API call</i>"]
    end

    DB[(MongoDB)]

    APP -->|provides context| MC
    MC -->|consumed by| SB
    MC -->|consumed by| CW
    MC -->|consumed by| CH
    APP -->|renders| SB
    APP -->|renders| CW
    CW -->|renders| CH
    SB -->|HTTP requests| RT
    CW -->|HTTP requests| RT
    SRV -->|mounts /api| RT
    RT -->|queries| MDL
    MDL -->|reads/writes| DB
    RT -->|calls| OAI
    OAI -->|calls| OPENAI["OpenAI API"]
```

---

## Shared State (via Context)

All thread-related state lives in [App.jsx](file:///f:/Major%20Projects/SigmaGPT/Frontend/src/App.jsx) and is shared through [MyContext.jsx](file:///f:/Major%20Projects/SigmaGPT/Frontend/src/MyContext.jsx):

| State Variable | Type | Purpose |
|---|---|---|
| `currThreadId` | `string` | UUID of the currently active thread |
| `allThreads` | `[{threadId, title}]` | List of all threads shown in sidebar |
| `prevChats` | `[{role, content}]` | All messages of the current thread |
| `prompt` | `string` | Current user input text |
| `reply` | `string \| null` | Latest assistant reply (triggers typing animation) |
| `newChat` | `boolean` | Whether the UI is in "new chat" mode |

---

## Data Model (MongoDB)

Defined in [Thread.js](file:///f:/Major%20Projects/SigmaGPT/Backend/models/Thread.js):

```mermaid
erDiagram
    THREAD {
        String threadId PK "UUID from frontend"
        String title "First user message"
        Date createdAt
        Date updatedAt
    }
    MESSAGE {
        String role "user | assistant"
        String content "Message text"
        Date timestamp
    }
    THREAD ||--o{ MESSAGE : "messages[]"
```

---

## 4 Thread Operations — Step-by-Step Flows

### 1️⃣ Create New Chat (no backend call)

> Triggered when user clicks the **✏️ New Chat** button in the sidebar.

```mermaid
sequenceDiagram
    participant User
    participant Sidebar
    participant App as App.jsx (State)

    User->>Sidebar: Clicks "New Chat" button
    Sidebar->>App: setNewChat(true)
    Sidebar->>App: setPrompt("")
    Sidebar->>App: setReply(null)
    Sidebar->>App: setCurrThreadId(uuidv1()) 🆕
    Sidebar->>App: setPrevChats([])
    App-->>User: UI shows "Start a New Chat!" heading
```

**What happens:**
- A brand-new UUID is generated client-side (`uuidv1()`)
- All chat state is cleared — no backend call yet
- The thread is **NOT saved to the database** until the user actually sends a message
- [Sidebar.jsx](file:///f:/Major%20Projects/SigmaGPT/Frontend/src/Sidebar.jsx#L26-L32) → `createNewChat()`

---

### 2️⃣ Send Message (Creates Thread or Appends to Existing)

> Triggered when user types a message and hits **Enter** or clicks **Send**.

```mermaid
sequenceDiagram
    participant User
    participant CW as ChatWindow.jsx
    participant Backend as routes/chat.js
    participant DB as MongoDB
    participant OAI as OpenAI API
    participant Chat as Chat.jsx

    User->>CW: Types message + hits Enter
    CW->>CW: setLoading(true), setNewChat(false)

    CW->>Backend: POST /api/chat<br/>{threadId, message}

    alt Thread NOT in DB (new thread)
        Backend->>DB: Create new Thread doc<br/>title = first message
        Note over Backend: thread = new Thread({threadId, title: message, messages: [user msg]})
    else Thread EXISTS in DB
        Backend->>DB: Push user message to existing thread.messages[]
    end

    Backend->>Backend: Slice last 10 messages as history
    Backend->>OAI: Send history to GPT-5.5
    OAI-->>Backend: Assistant reply
    Backend->>DB: Push assistant reply to thread.messages[]
    Backend->>DB: Update thread.updatedAt
    Backend->>DB: thread.save()
    Backend-->>CW: {reply: "..."}

    CW->>CW: setReply(res.reply)
    CW->>CW: setLoading(false)

    Note over CW: useEffect triggers on [reply] change
    CW->>CW: setPrevChats([...prev, userMsg, assistantMsg])
    CW->>CW: setPrompt("")

    Note over Chat: useEffect triggers on [prevChats, reply]
    Chat->>Chat: Word-by-word typing animation (40ms interval)
    Chat-->>User: Animated reply appears
```

**Key decision point — New vs Existing thread:**

| Condition | What Happens | File |
|---|---|---|
| `Thread.findOne({threadId})` returns `null` | **New Thread created** in DB with `title = first message` | [routes/chat.js:L80-L86](file:///f:/Major%20Projects/SigmaGPT/Backend/routes/chat.js#L80-L86) |
| Thread already exists | User message **pushed** to existing `messages[]` array | [routes/chat.js:L87-L89](file:///f:/Major%20Projects/SigmaGPT/Backend/routes/chat.js#L87-L89) |

**After the reply returns:**
- [ChatWindow.jsx](file:///f:/Major%20Projects/SigmaGPT/Frontend/src/ChatWindow.jsx#L40-L54) `useEffect([reply])` appends both user + assistant messages to `prevChats`
- [Chat.jsx](file:///f:/Major%20Projects/SigmaGPT/Frontend/src/Chat.jsx#L12-L32) `useEffect([prevChats, reply])` animates the latest reply word-by-word

---

### 3️⃣ Switch Thread (Load Existing Chat)

> Triggered when user clicks on a thread title in the sidebar.

```mermaid
sequenceDiagram
    participant User
    participant Sidebar
    participant App as App.jsx (State)
    participant Backend as routes/chat.js
    participant DB as MongoDB
    participant Chat as Chat.jsx

    User->>Sidebar: Clicks on thread title
    Sidebar->>App: setCurrThreadId(newThreadId)

    Sidebar->>Backend: GET /api/thread/:threadId
    Backend->>DB: Thread.findOne({threadId})
    DB-->>Backend: thread document
    Backend-->>Sidebar: thread.messages[]

    Sidebar->>App: setPrevChats(res) — full message array
    Sidebar->>App: setNewChat(false)
    Sidebar->>App: setReply(null)

    Note over Chat: reply=null → setLatestReply(null)
    Chat-->>User: All messages rendered instantly (no typing effect)

    Note over Sidebar: useEffect([currThreadId]) triggers
    Sidebar->>Backend: GET /api/thread (refresh list)
    Backend-->>Sidebar: Updated thread list
    Sidebar->>App: setAllThreads(filteredData)
```

**Why `setReply(null)` matters:**
- Setting reply to `null` makes `Chat.jsx` set `latestReply = null`
- This skips the typing animation and renders the **last message instantly** via the `non-typing` branch
- [Chat.jsx:L55-L58](file:///f:/Major%20Projects/SigmaGPT/Frontend/src/Chat.jsx#L55-L58) — renders `prevChats[last].content` directly

---

### 4️⃣ Delete Thread

> Triggered when user clicks the **🗑️ trash** icon on a thread.

```mermaid
sequenceDiagram
    participant User
    participant Sidebar
    participant Backend as routes/chat.js
    participant DB as MongoDB
    participant App as App.jsx (State)

    User->>Sidebar: Clicks trash icon (e.stopPropagation)
    
    Sidebar->>Backend: DELETE /api/thread/:threadId
    Backend->>DB: Thread.findOneAndDelete({threadId})
    DB-->>Backend: Deleted document
    Backend-->>Sidebar: {success: "Thread deleted successfully"}

    Sidebar->>App: setAllThreads(prev.filter(t => t.threadId !== threadId))
    Note over Sidebar: Optimistic UI update — no re-fetch needed

    alt Deleted thread IS the current thread
        Sidebar->>Sidebar: createNewChat()
        Note over Sidebar: Resets to fresh state with new UUID
    else Deleted thread is NOT current
        Note over Sidebar: No additional action needed
    end
```

**Important detail:** `e.stopPropagation()` prevents the click from bubbling up to the `<li>` which would trigger `changeThread()`.

---

## Complete File Connection Map

```mermaid
graph LR
    subgraph Frontend
        A[App.jsx] -->|imports| B[Sidebar.jsx]
        A -->|imports| C[ChatWindow.jsx]
        C -->|imports| D[Chat.jsx]
        A -->|imports| E[MyContext.jsx]
        B -->|imports| E
        C -->|imports| E
        D -->|imports| E
    end

    subgraph Backend
        F[server.js] -->|mounts| G[routes/chat.js]
        G -->|imports| H[models/Thread.js]
        G -->|imports| I[utils/openai.js]
        F -->|connects| J[(MongoDB)]
    end

    B -.->|GET /api/thread| G
    B -.->|GET /api/thread/:id| G
    B -.->|DELETE /api/thread/:id| G
    C -.->|POST /api/chat| G
    I -.->|API call| K[OpenAI GPT-5.5]
```

---

## API Endpoints Summary

| Method | Endpoint | Triggered By | Purpose |
|---|---|---|---|
| `GET` | `/api/thread` | `Sidebar.jsx` on mount + when `currThreadId` changes | Fetch all threads (sorted by `updatedAt` desc) |
| `GET` | `/api/thread/:threadId` | `Sidebar.jsx` → `changeThread()` | Fetch messages of a specific thread |
| `POST` | `/api/chat` | `ChatWindow.jsx` → `getReply()` | Send message, get AI reply (creates or updates thread) |
| `DELETE` | `/api/thread/:threadId` | `Sidebar.jsx` → `deleteThread()` | Delete a thread from DB |

---

## TL;DR — How Threads Work

1. **Threads are lazy-created** — a new UUID is generated on the frontend when you click "New Chat", but the thread only appears in the database when you send the first message.
2. **The backend decides** whether to create or update — `POST /api/chat` checks if the `threadId` already exists in MongoDB. If not → new thread. If yes → append message.
3. **The sidebar refreshes** every time `currThreadId` changes (via `useEffect`), keeping the thread list up-to-date.
4. **The typing animation** only plays for new replies (`reply !== null`). When switching threads, `reply` is set to `null`, so old messages render instantly.
