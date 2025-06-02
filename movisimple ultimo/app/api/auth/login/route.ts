import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import bcrypt from "bcryptjs"

const USERS_FILE = path.join(process.cwd(), "data", "users.txt")

async function readUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, "utf-8")
    return data
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const [name, email, hashedPassword] = line.split("|")
        return { name, email, hashedPassword }
      })
  } catch {
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 })
    }

    const users = await readUsers()
    const user = users.find((u) => u.email === email)

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 })
    }

    const isValidPassword = await bcrypt.compare(password, user.hashedPassword)

    if (!isValidPassword) {
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 })
    }

    return NextResponse.json({
      user: { name: user.name, email: user.email },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
