import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import bcrypt from "bcryptjs"

const USERS_FILE = path.join(process.cwd(), "data", "users.txt")

async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), "data")
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

async function readUsers() {
  try {
    await ensureDataDirectory()
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

async function writeUser(name: string, email: string, hashedPassword: string) {
  await ensureDataDirectory()
  const userLine = `${name}|${email}|${hashedPassword}\n`
  await fs.appendFile(USERS_FILE, userLine)
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    const users = await readUsers()
    const existingUser = users.find((user) => user.email === email)

    if (existingUser) {
      return NextResponse.json({ error: "El usuario ya existe" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    await writeUser(name, email, hashedPassword)

    return NextResponse.json({
      user: { name, email },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
