"use client"

import { useRef, useState } from "react"

import { SendIcon } from "lucide-react"

import { ChatTranscript, type ChatMessage } from "@/components/chat-transcript"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { sendChatMessage } from "@/lib/chat-api"

export default function Home() {
    const threadId = useRef<string | null>(null)
    const sending = useRef(false)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)

    async function sendMessage() {
        const message = input.trim()

        if (!message || sending.current) return
        sending.current = true

        setMessages((prev) => [...prev, { role: "user", content: message }])
        setInput("")
        setLoading(true)

        try {
            threadId.current ??= crypto.randomUUID()
            const reply = await sendChatMessage(message, threadId.current)

            setMessages((prev) => [...prev, { role: "assistant", content: reply }])
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Could not connect to the research assistant.",
                },
            ])
        } finally {
            sending.current = false
            setLoading(false)
        }
    }

    return (
        <div className="bg-cyan-200 min-h-dvh">
            <main className="mx-auto flex h-dvh max-w-7xl flex-col gap-6 p-4 sm:p-6">
                <h1 className="text-4xl font-black">PaperLab.</h1>

                <Card className="flex min-h-0 flex-1 flex-col">
                    <CardHeader>
                        <CardTitle>Research Assistant</CardTitle>
                    </CardHeader>

                    <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
                        <ChatTranscript messages={messages} loading={loading} />

                        <form
                            onSubmit={(event) => {
                                event.preventDefault()
                                void sendMessage()
                            }}
                            className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start"
                        >
                            <div className="min-w-0 flex-1">
                                <label htmlFor="chat-input" className="sr-only">
                                    Message
                                </label>
                                <Textarea
                                    id="chat-input"
                                    value={input}
                                    onChange={(event) => setInput(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (
                                            event.key === "Enter" &&
                                            !event.shiftKey &&
                                            !event.nativeEvent.isComposing
                                        ) {
                                            event.preventDefault()
                                            void sendMessage()
                                        }
                                    }}
                                    aria-describedby="chat-input-help"
                                    placeholder="Ask about research papers..."
                                    className="max-h-40 resize-none"
                                />

                                <p
                                    id="chat-input-help"
                                    className="mt-2 text-xs text-foreground/60"
                                >
                                    Enter to send. Shift + Enter for a new line.
                                </p>
                            </div>
                            <Button type="submit" disabled={loading || !input.trim()}>
                                <SendIcon aria-hidden="true" /> Send
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
