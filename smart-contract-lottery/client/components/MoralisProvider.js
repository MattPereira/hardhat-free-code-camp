"use client"

import { MoralisProvider as MyMoralisProvider } from "react-moralis"

export function MoralisProvider({ children }) {
    return <MyMoralisProvider initializeOnMount={false}>{children}</MyMoralisProvider>
}
