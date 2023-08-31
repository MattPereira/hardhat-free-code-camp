"use client"

import { ConnectButton } from "web3uikit"

export default function Header() {
    return (
        <div className="flex justify-end p-5 justify-between items-center border-b-2">
            <h1 className="font-semibold text-2xl ">Decentralized Lottery</h1>
            <ConnectButton moralisAuth={false} />
        </div>
    )
}
