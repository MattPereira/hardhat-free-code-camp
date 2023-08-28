"use client"

import { ConnectButton } from "web3uikit"

export default function Header() {
    return (
        <div className="flex justify-end p-5 justify-between items-center font-semibold text-xl">
            Decentralized Lottery
            <ConnectButton moralisAuth={false} />
        </div>
    )
}
