"use client"

import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SendIcon } from "lucide-react"
import { Message, MessageAvatar, MessageContent, MessageFooter, MessageHeader } from "@/components/ui/message"

type ChatMessage = {
    role: "user" | "assistant"
    content: string
}

export default function Home() {
    const threadId = useRef<string | null>(null)
    const sending = useRef(false)
    const transcript = useRef<HTMLDivElement>(null)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const element = transcript.current
        if (element) element.scrollTop = element.scrollHeight
    }, [messages, loading])

    async function sendMessage() {
        const message = input.trim()

        if (!message || sending.current) return
        sending.current = true

        setMessages((prev) => [...prev, { role: "user", content: message }])
        setInput("")
        setLoading(true)

        try {
            threadId.current ??= crypto.randomUUID()
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message,
                    thread_id: threadId.current,
                }),
            })

            if (!response.ok) {
                throw new Error("API request failed")
            }

            const data: unknown = await response.json()
            if (
                typeof data !== "object" ||
                data === null ||
                !("response" in data) ||
                typeof data.response !== "string" ||
                !data.response.trim()
            ) {
                throw new Error("Invalid chat response")
            }
            const reply = data.response

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
    const time = new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
    });


    return (
        <main className="mx-auto flex h-dvh max-w-4xl flex-col gap-6 p-4 sm:p-6">
            <h1 className="text-4xl font-black">PaperLab.</h1>

            <Card className="flex min-h-0 flex-1 flex-col">
                <CardHeader>
                    <CardTitle>Research Assistant</CardTitle>
                </CardHeader>

                <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
                    <div
                        ref={transcript}
                        role="log"
                        aria-label="Conversation"
                        aria-live="polite"
                        aria-relevant="additions"
                        tabIndex={0}
                        className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-2"
                    >
                        {messages.length === 0 && (
                            <p className="py-8 text-center text-sm text-foreground/60">
                                Ask a question to start exploring research papers.
                            </p>
                        )}
                        {messages.map((msg, index) => (
                            <Message
                                key={index}
                                align={msg.role === "user" ? "end" : "start"}
                            >
                                <MessageAvatar>
                                    <Avatar>
                                        <AvatarFallback>
                                            <span
                                                aria-label={msg.role === "user" ? "You" : "Assistant"}
                                            >
                                                {msg.role === "user" ? "You" : "AI"}
                                            </span>
                                        </AvatarFallback>
                                    </Avatar>
                                </MessageAvatar>
                                <MessageContent>
                                    <MessageHeader>{msg.role}</MessageHeader>
                                    <Bubble
                                        variant={msg.role === "user" ? "default" : "secondary"}
                                    >
                                        <BubbleContent className="whitespace-pre-wrap">
                                            {msg.content}
                                        </BubbleContent>
                                    </Bubble>
                                    <MessageFooter>{time}</MessageFooter>
                                </MessageContent>
                            </Message>
                        ))}

                        {loading && <p role="status">Searching papers...</p>}
                    </div>

                    <form
                        onSubmit={(event) => {
                            event.preventDefault()
                            void sendMessage()
                        }}
                        className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end"
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
    )
}
