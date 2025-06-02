// Variables globales
let currentUser = null
let currentOrigin = null
let currentDestination = null
let routeResult = null
let isAnimating = false

// Tarifa por segundo
const TARIFF_PER_SECOND = 0.5

// Posiciones de los nodos (porcentajes)
const nodePositions = {
  1: { x: 50, y: 10 },
  2: { x: 15, y: 35 },
  3: { x: 85, y: 35 },
  4: { x: 15, y: 65 },
  5: { x: 85, y: 65 },
  6: { x: 50, y: 90 },
}

// Definición del grafo (9 aristas bidireccionales)
const graph = {
  vertices: 6,
  edges: [
    [1, 2, 10], // Nodo 1 a Nodo 2: 10 segundos
    [1, 3, 15], // Nodo 1 a Nodo 3: 15 segundos
    [2, 3, 12], // Nodo 2 a Nodo 3: 12 segundos
    [2, 4, 8], // Nodo 2 a Nodo 4: 8 segundos
    [3, 5, 20], // Nodo 3 a Nodo 5: 20 segundos
    [4, 5, 18], // Nodo 4 a Nodo 5: 18 segundos
    [4, 6, 14], // Nodo 4 a Nodo 6: 14 segundos
    [5, 6, 16], // Nodo 5 a Nodo 6: 16 segundos
    [1, 6, 25], // Nodo 1 a Nodo 6: 25 segundos
  ],
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

// Funciones de autenticación (implementadas en el cliente)
function handleLogin(e) {
  e.preventDefault()

  const email = document.getElementById("loginEmail").value
  const password = document.getElementById("loginPassword").value
  const errorDiv = document.getElementById("loginError")

  // Obtener usuarios del localStorage
  const users = JSON.parse(localStorage.getItem("movisimple_users") || "[]")

  // Buscar usuario
  const user = users.find((u) => u.email === email)

  if (!user) {
    showError(errorDiv, "Usuario no encontrado")
    return
  }

  // Verificar contraseña (en un caso real usaríamos hash)
  if (user.password !== password) {
    showError(errorDiv, "Contraseña incorrecta")
    return
  }

  // Login exitoso
  currentUser = { name: user.name, email: user.email }
  localStorage.setItem("movisimple_user", JSON.stringify(currentUser))
  showMapScreen()
}

function handleRegister(e) {
  e.preventDefault()

  const name = document.getElementById("registerName").value
  const email = document.getElementById("registerEmail").value
  const password = document.getElementById("registerPassword").value
  const errorDiv = document.getElementById("registerError")

  // Obtener usuarios existentes
  const users = JSON.parse(localStorage.getItem("movisimple_users") || "[]")

  // Verificar si el usuario ya existe
  if (users.some((u) => u.email === email)) {
    showError(errorDiv, "El usuario ya existe")
    return
  }

  // Agregar nuevo usuario
  users.push({ name, email, password })
  localStorage.setItem("movisimple_users", JSON.stringify(users))

  // Login automático
  currentUser = { name, email }
  localStorage.setItem("movisimple_user", JSON.stringify(currentUser))
  showMapScreen()
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

// Implementación del algoritmo de Dijkstra en JavaScript
function createAdjList() {
  const adjList = {}

  // Inicializar lista de adyacencia
  for (let i = 1; i <= graph.vertices; i++) {
    adjList[i] = []
  }

  // Agregar aristas (bidireccionales)
  graph.edges.forEach(([u, v, weight]) => {
    adjList[u].push({ node: v, weight })
    adjList[v].push({ node: u, weight })
  })

  return adjList
}

function dijkstraSimple(source) {
  const adjList = createAdjList()
  const distances = {}
  const predecessors = {}
  const visited = new Set()

  // Inicializar distancias
  for (let i = 1; i <= graph.vertices; i++) {
    distances[i] = i === source ? 0 : Number.POSITIVE_INFINITY
    predecessors[i] = null
  }

  for (let i = 0; i < graph.vertices; i++) {
    // Encontrar vértice no visitado con distancia mínima
    let minDistance = Number.POSITIVE_INFINITY
    let minVertex = -1

    for (let v = 1; v <= graph.vertices; v++) {
      if (!visited.has(v) && distances[v] < minDistance) {
        minDistance = distances[v]
        minVertex = v
      }
    }

    if (minVertex === -1) break

    visited.add(minVertex)

    // Actualizar distancias a vecinos
    adjList[minVertex].forEach((neighbor) => {
      if (!visited.has(neighbor.node)) {
        const newDistance = distances[minVertex] + neighbor.weight
        if (newDistance < distances[neighbor.node]) {
          distances[neighbor.node] = newDistance
          predecessors[neighbor.node] = minVertex
        }
      }
    })
  }

  return { distances, predecessors }
}

function getPath(source, destination, predecessors) {
  const path = []
  let current = destination

  while (current !== null) {
    path.unshift(current)
    current = predecessors[current]
    if (current === source) {
      path.unshift(source)
      break
    }
  }

  return path
}

// Función principal para calcular ruta
function calculateRoute() {
  if (!currentOrigin || !currentDestination || isAnimating) return

  // Ejecutar Dijkstra
  const { distances, predecessors } = dijkstraSimple(currentOrigin)
  const totalTime = distances[currentDestination]

  if (totalTime === Number.POSITIVE_INFINITY) {
    alert("No hay ruta disponible entre los nodos seleccionados")
    return
  }

  const path = getPath(currentOrigin, currentDestination, predecessors)
  const cost = totalTime * TARIFF_PER_SECOND

  // Guardar resultado
  routeResult = {
    path,
    totalTime,
    cost,
  }

  // Mostrar resultado
  displayRoute()
  displayTripInfo()
  startAnimation()
}

function displayRoute() {
  const svg = document.getElementById("routeSvg")

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

  routeResult.path.forEach((node) => {
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
