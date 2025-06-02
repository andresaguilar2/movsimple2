"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/login-form"
import { RegisterForm } from "@/components/register-form"
import { MapInterface } from "@/components/map-interface"

export default function Home() {
  const [currentView, setCurrentView] = useState<"login" | "register" | "map">("login")
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem("movisimple_user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
      setCurrentView("map")
    }
  }, [])

  const handleLogin = (userData: { name: string; email: string }) => {
    setUser(userData)
    localStorage.setItem("movisimple_user", JSON.stringify(userData))
    setCurrentView("map")
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem("movisimple_user")
    setCurrentView("login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-900 mb-2">MoviSimple</h1>
          <p className="text-lg text-indigo-700">La odisea de los seis puntos</p>
        </header>

        {currentView === "login" && (
          <LoginForm onLogin={handleLogin} onSwitchToRegister={() => setCurrentView("register")} />
        )}

        {currentView === "register" && (
          <RegisterForm onRegister={handleLogin} onSwitchToLogin={() => setCurrentView("login")} />
        )}

        {currentView === "map" && user && <MapInterface user={user} onLogout={handleLogout} />}
      </div>
    </div>
  )
}
