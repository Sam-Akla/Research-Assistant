export async function sendChatMessage(message: string, threadId: string): Promise<string> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            message,
            thread_id: threadId,
        }),
    })

    if (!response.ok) {
        throw new Error("API request failed")
    }
    const data: unknown = await response.json()

    if (
        typeof data !== "object" ||
        data === null ||
        !("title" in data) ||
        typeof data.title !== "string" ||
        !("author" in data) ||
        typeof data.author !== "string" ||
        !("id" in data) ||
        typeof data.id !== "number" ||
        !("category" in data) ||
        typeof data.category !== "string" ||
        !("link" in data) ||
        typeof data.link !== "string" ||
        !("summary" in data) ||
        typeof data.summary !== "string" ||
        !("published" in data) ||
        (data.published !== null && typeof data.published !== "string") ||
        !("updated" in data) ||
        (data.updated !== null && typeof data.updated !== "string")
    ) {
        throw new Error("Invalid paper response")
    }

    const details = [
        data.title,
        `Author: ${data.author}`,
        `Paper ID: ${data.id}`,
        `Category: ${data.category}`,
    ]

    if (data.published !== null) details.push(`Published: ${data.published}`)
    if (data.updated !== null) details.push(`Updated: ${data.updated}`)

    details.push(`Link: ${data.link}`, "", `Summary: ${data.summary}`)
    return details.join("\n")
}
