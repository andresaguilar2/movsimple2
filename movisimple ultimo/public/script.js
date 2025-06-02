// Variables globales
let currentUser = null
let currentOrigin = null
let currentDestination = null
let routeResult = null
let isAnimating = false

// API Base URL
const API_BASE = "/api"

// Posiciones de los nodos (porcentajes)
const nodePositions = {
  1: { x: 50, y: 10 },
  2: { x: 15, y: 35 },
  3: { x: 85, y: 35 },
  4: { x: 15, y: 65 },
  5: { x: 85, y: 65 },
  6: { x: 50, y: 90 },
}

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  // Verificar si hay usuario logueado
  const savedUser = localStorage.getItem("movisimple_user")
  if (savedUser) {
    currentUser = JSON.parse(savedUser)
    showMapScreen()
  }

  // Event listeners para formularios
  document.getElementById("loginForm").addEventListener("submit", handleLogin)
  document.getElementById("registerForm").addEventListener("submit", handleRegister)

  // Event listeners para selects
  document.getElementById("originSelect").addEventListener("change", handleOriginChange)
  document.getElementById("destinationSelect").addEventListener("change", handleDestinationChange)
})

// Funciones de navegación entre pantallas
function showLogin() {
  hideAllScreens()
  document.getElementById("loginScreen").classList.add("active")
  clearErrors()
}

function showRegister() {
  hideAllScreens()
  document.getElementById("registerScreen").classList.add("active")
  clearErrors()
}

function showMapScreen() {
  hideAllScreens()
  document.getElementById("mapScreen").classList.add("active")
  if (currentUser) {
    document.getElementById("userName").textContent = currentUser.name
  }
  resetMapInterface()
}

function hideAllScreens() {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active")
  })
}

function clearErrors() {
  document.querySelectorAll(".error-message").forEach((error) => {
    error.classList.remove("show")
    error.textContent = ""
  })
}

// Funciones de autenticación
async function handleLogin(e) {
  e.preventDefault()

  const email = document.getElementById("loginEmail").value
  const password = document.getElementById("loginPassword").value
  const errorDiv = document.getElementById("loginError")

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (response.ok) {
      currentUser = data.user
      localStorage.setItem("movisimple_user", JSON.stringify(currentUser))
      showMapScreen()
    } else {
      showError(errorDiv, data.error)
    }
  } catch (error) {
    showError(errorDiv, "Error de conexión")
  }
}

async function handleRegister(e) {
  e.preventDefault()

  const name = document.getElementById("registerName").value
  const email = document.getElementById("registerEmail").value
  const password = document.getElementById("registerPassword").value
  const errorDiv = document.getElementById("registerError")

  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    })

    const data = await response.json()

    if (response.ok) {
      currentUser = data.user
      localStorage.setItem("movisimple_user", JSON.stringify(currentUser))
      showMapScreen()
    } else {
      showError(errorDiv, data.error)
    }
  } catch (error) {
    showError(errorDiv, "Error de conexión")
  }
}

function logout() {
  currentUser = null
  localStorage.removeItem("movisimple_user")
  showLogin()
}

function showError(errorDiv, message) {
  errorDiv.textContent = message
  errorDiv.classList.add("show")
}

// Funciones del mapa
function handleOriginChange(e) {
  const value = e.target.value
  currentOrigin = value ? Number.parseInt(value) : null

  updateDestinationOptions()
  updateNodeColors()
  updateCalculateButton()
  clearRoute()
}

function handleDestinationChange(e) {
  const value = e.target.value
  currentDestination = value ? Number.parseInt(value) : null

  updateNodeColors()
  updateCalculateButton()
  clearRoute()
}

function updateDestinationOptions() {
  const destinationSelect = document.getElementById("destinationSelect")
  destinationSelect.innerHTML = '<option value="">Seleccionar destino</option>'

  for (let i = 1; i <= 6; i++) {
    if (i !== currentOrigin) {
      const option = document.createElement("option")
      option.value = i
      option.textContent = `Nodo ${i}`
      destinationSelect.appendChild(option)
    }
  }

  currentDestination = null
}

function updateNodeColors() {
  // Resetear todos los nodos
  document.querySelectorAll(".node").forEach((node) => {
    node.className = "node"
  })

  // Aplicar colores según estado
  if (currentOrigin) {
    document.getElementById(`node${currentOrigin}`).classList.add("origin")
  }

  if (currentDestination) {
    document.getElementById(`node${currentDestination}`).classList.add("destination")
  }

  // Si hay una ruta calculada, colorear nodos de la ruta
  if (routeResult) {
    routeResult.path.forEach((nodeId) => {
      const node = document.getElementById(`node${nodeId}`)
      if (!node.classList.contains("origin") && !node.classList.contains("destination")) {
        node.classList.add("route")
      }
    })
  }
}

function updateCalculateButton() {
  const btn = document.getElementById("calculateBtn")
  btn.disabled = !currentOrigin || !currentDestination || isAnimating
}

function clearRoute() {
  routeResult = null
  document.getElementById("routeSvg").innerHTML = `
        <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#4299e1" />
            </marker>
        </defs>
    `
  document.getElementById("tripInfo").style.display = "none"
}

function resetMapInterface() {
  currentOrigin = null
  currentDestination = null
  routeResult = null
  isAnimating = false

  document.getElementById("originSelect").value = ""
  document.getElementById("destinationSelect").value = ""
  updateDestinationOptions()
  updateNodeColors()
  updateCalculateButton()
  clearRoute()

  document.getElementById("progressContainer").style.display = "none"
  document.getElementById("tripInfo").style.display = "none"
}

// Función principal para calcular ruta
async function calculateRoute() {
  if (!currentOrigin || !currentDestination || isAnimating) return

  try {
    const response = await fetch(`${API_BASE}/calculate-route`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        origin: currentOrigin,
        destination: currentDestination,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      routeResult = data
      displayRoute()
      displayTripInfo()
      startAnimation()
    } else {
      alert(data.error)
    }
  } catch (error) {
    alert("Error de conexión")
  }
}

function displayRoute() {
  const svg = document.getElementById("routeSvg")
  const mapRect = document.getElementById("mapCanvas").getBoundingClientRect()

  // Limpiar rutas anteriores
  const existingLines = svg.querySelectorAll(".route-line")
  existingLines.forEach((line) => line.remove())

  // Dibujar líneas de la ruta
  for (let i = 0; i < routeResult.path.length - 1; i++) {
    const fromNode = routeResult.path[i]
    const toNode = routeResult.path[i + 1]

    const fromPos = nodePositions[fromNode]
    const toPos = nodePositions[toNode]

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line")
    line.setAttribute("x1", `${fromPos.x}%`)
    line.setAttribute("y1", `${fromPos.y}%`)
    line.setAttribute("x2", `${toPos.x}%`)
    line.setAttribute("y2", `${toPos.y}%`)
    line.setAttribute("class", "route-line")
    line.setAttribute("marker-end", "url(#arrowhead)")

    svg.appendChild(line)
  }

  updateNodeColors()
}

function displayTripInfo() {
  document.getElementById("totalTime").textContent = `${routeResult.totalTime} segundos`
  document.getElementById("totalCost").textContent = `$${routeResult.cost.toFixed(2)}`

  const routePathDiv = document.getElementById("routePath")
  routePathDiv.innerHTML = ""

  routeResult.path.forEach((node, index) => {
    const badge = document.createElement("span")
    badge.className = "route-badge"
    badge.textContent = node
    routePathDiv.appendChild(badge)
  })

  document.getElementById("tripInfo").style.display = "block"
}

function startAnimation() {
  isAnimating = true
  updateCalculateButton()

  const progressContainer = document.getElementById("progressContainer")
  const progressFill = document.getElementById("progressFill")
  const progressPercent = document.getElementById("progressPercent")

  progressContainer.style.display = "block"

  let progress = 0
  const totalTime = routeResult.totalTime * 1000 // Convertir a milisegundos
  const updateInterval = 50 // Actualizar cada 50ms
  const increment = (updateInterval / totalTime) * 100

  const interval = setInterval(() => {
    progress += increment

    if (progress >= 100) {
      progress = 100
      clearInterval(interval)

      setTimeout(() => {
        finishAnimation()
      }, 1000)
    }

    progressFill.style.width = `${progress}%`
    progressPercent.textContent = `${Math.round(progress)}%`

    // Actualizar nodo actual
    updateCurrentNode(progress)
  }, updateInterval)
}

function updateCurrentNode(progress) {
  // Remover clase current de todos los nodos
  document.querySelectorAll(".node").forEach((node) => {
    node.classList.remove("current")
  })

  // Calcular nodo actual basado en progreso
  const pathIndex = Math.floor((progress / 100) * (routeResult.path.length - 1))
  const currentNodeId = routeResult.path[Math.min(pathIndex, routeResult.path.length - 1)]

  document.getElementById(`node${currentNodeId}`).classList.add("current")
}

function finishAnimation() {
  isAnimating = false

  setTimeout(() => {
    resetMapInterface()
  }, 2000)
}
