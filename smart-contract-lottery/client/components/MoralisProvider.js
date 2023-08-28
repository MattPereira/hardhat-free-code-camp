"use client"

import { MoralisProvider as Provider } from "react-moralis"

export default function MoralisProvider({ children }) {
    return <Provider initializeOnMount={false}>{children}</Provider>
}
