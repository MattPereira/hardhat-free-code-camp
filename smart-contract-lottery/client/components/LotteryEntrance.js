"use client" // remember react hooks always client side!

import { abi, contractAddresses } from "../constants"
import { useMoralis, useWeb3Contract } from "react-moralis"
import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { useNotification } from "web3uikit"
import classNames from "classnames"

export default function LotteryEntrance() {
    // useMoralis hook has access to chainId because of the MoralisProvider
    // which is passed the chain id when the user connects their wallet

    const { chainId: chainIdHex, isWeb3Enabled } = useMoralis()
    const chainId = parseInt(chainIdHex)
    console.log("chainId", chainId)

    const raffleAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null
    const [entranceFee, setEntranceFee] = useState("0")
    const [numPlayers, setNumPlayers] = useState("0")
    const [recentWinner, setRecentWinner] = useState("0")

    const dispatch = useNotification()

    const {
        runContractFunction: enterRaffle,
        isLoading,
        isFetching,
    } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "enterRaffle",
        msgValue: entranceFee,
        params: {},
    })

    const { runContractFunction: getEntranceFee } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getEntranceFee",
        params: {},
    })

    const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getNumberOfPlayers",
        params: {},
    })

    const { runContractFunction: getRecentWinner } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getRecentWinner",
        params: {},
    })

    async function updateUI() {
        const entranceFeeRes = (await getEntranceFee()).toString()
        const numPlayersRes = (await getNumberOfPlayers()).toString()
        const recentWinnerRes = (await getRecentWinner()).toString()
        setEntranceFee(entranceFeeRes)
        setNumPlayers(numPlayersRes)
        setRecentWinner(recentWinnerRes)
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI()
        }
    }, [isWeb3Enabled])

    const handleSuccess = async function (tx) {
        // this is where we wait to see if the transaction was mined/successfully executed
        await tx.wait(1)
        handleNewNotification(tx)
        updateUI()
    }

    const handleNewNotification = function () {
        dispatch({
            type: "info",
            message: "Transaction Complete!",
            title: "Tx Notification",
            position: "topR",
            icon: "bell",
        })
    }

    return (
        <div>
            {raffleAddress ? (
                <div>
                    <button
                        className={classNames(` text-white font-bold py-2 px-4 rounded ml-auto`, {
                            "opacity-50 cursor-not-allowed bg-neutral-400": isLoading,
                            "bg-green-600 hover:bg-green-700": !isLoading,
                        })}
                        onClick={async function () {
                            await enterRaffle({
                                // onSuccess triggers if a transaction was successfully sent to metamask (not if it was mined)
                                onSuccess: handleSuccess,
                                onError: (err) => console.log(err),
                            })
                        }}
                        disabled={isLoading || isFetching}
                    >
                        {isLoading || isFetching ? (
                            <div className="animate-spin spinner-boarder h-8 w-8 border-b-2 rounded-full"></div>
                        ) : (
                            <div>Enter Raffle</div>
                        )}
                    </button>
                    <div>Entrance Fee: {ethers.utils.formatEther(entranceFee)} ETH</div>
                    <div>Players: {numPlayers} </div>
                    <div>Recent Winner: {recentWinner} </div>
                </div>
            ) : (
                <div>No raffle address Detected</div>
            )}
        </div>
    )
}
