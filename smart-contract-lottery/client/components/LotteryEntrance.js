import { useWeb3Contract } from "react-moralis"

export default function LotteryEntrance() {
    const { runContractFunction: enterRaffle } = useWeb3Contract({
        abi: "", //
        address: "", //
        functionName: "", //
        params: {},
        msgValue: "",
    })

    return <div>Hi from lottery entrance!</div>
}
