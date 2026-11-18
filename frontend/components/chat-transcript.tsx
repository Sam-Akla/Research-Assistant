import { useEffect, useRef } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Message, MessageAvatar, MessageContent, MessageFooter, MessageHeader } from "@/components/ui/message"

export type ChatMessage = {
    role: "user" | "assistant"
    content: string
}

type ChatTranscriptProps = {
    messages: ChatMessage[]
    loading: boolean
}

export function ChatTranscript({ messages, loading }: ChatTranscriptProps) {
    const transcript = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const element = transcript.current
        if (element) element.scrollTop = element.scrollHeight
    }, [messages, loading])

    const time = new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
    })

    return (
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
                            <AvatarImage
                                src={msg.role === "user" ? "/avatars/user.png" : "/avatars/assistant.png"}
                                alt="@shadcn"
                                onLoadingStatusChange={(status) => {
                                    console.log(msg.role, status)
                                }}
                            />
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
    )
}
