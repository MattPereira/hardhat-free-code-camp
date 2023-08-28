import Image from "next/image"
import LotteryEntrance from "@/components/LotteryEntrance"

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <LotteryEntrance />
        </main>
    )
}
