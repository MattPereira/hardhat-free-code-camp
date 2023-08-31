"use client"
import { NotificationProvider as MyNotificationsProvider } from "web3uikit"

export function NotificationsProvider({ children }) {
    return <MyNotificationsProvider>{children}</MyNotificationsProvider>
}
