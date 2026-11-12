import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const fontSans = IBM_Plex_Sans({
    subsets: ["latin"],
    variable: "--font-sans",
})

const fontMono = IBM_Plex_Mono({
    subsets: ["latin"],
    weight: "500",
    variable: "--font-mono",
})

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
            className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
        >
            <body>
                <ThemeProvider>{children}</ThemeProvider>
            </body>
        </html>
    )
}
