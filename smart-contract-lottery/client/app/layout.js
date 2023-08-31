import "./globals.css"
import { Inter } from "next/font/google"
const inter = Inter({ subsets: ["latin"] })

// import ManualHeader from "../components/ManualHeader"
import Header from "../components/Header"
import { MoralisProvider } from "../components/MoralisProvider"
import { NotificationsProvider } from "../components/NotificationsProvider"

export const metadata = {
    title: "Smart Contract Lottery",
    description: "A smart contract lottery built with Hardhat and Next.js",
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <MoralisProvider>
                    <NotificationsProvider>
                        <Header />
                        {children}
                    </NotificationsProvider>
                </MoralisProvider>
            </body>
        </html>
    )
}
