"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, Clock, DollarSign, LogOut } from "lucide-react"

interface MapInterfaceProps {
  user: { name: string; email: string }
  onLogout: () => void
}

interface RouteResult {
  path: number[]
  totalTime: number
  cost: number
}

const TARIFF_PER_SECOND = 0.5 // $0.50 por segundo

export function MapInterface({ user, onLogout }: MapInterfaceProps) {
  const [origin, setOrigin] = useState<number | null>(null)
  const [destination, setDestination] = useState<number | null>(null)
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationProgress, setAnimationProgress] = useState(0)
  const [currentNode, setCurrentNode] = useState<number | null>(null)

  const nodes = [1, 2, 3, 4, 5, 6]

  const calculateRoute = async () => {
    if (origin === null || destination === null) return

    try {
      const response = await fetch("/api/calculate-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination }),
      })

      const data = await response.json()

      if (response.ok) {
        setRouteResult(data)
        startAnimation(data.path, data.totalTime)
      }
    } catch (error) {
      console.error("Error calculating route:", error)
    }
  }

  const startAnimation = (path: number[], totalTime: number) => {
    setIsAnimating(true)
    setAnimationProgress(0)
    setCurrentNode(path[0])

    let currentStep = 0
    const totalSteps = 100
    const stepDuration = (totalTime * 1000) / totalSteps

    const interval = setInterval(() => {
      currentStep++
      const progress = (currentStep / totalSteps) * 100
      setAnimationProgress(progress)

      // Update current node based on progress
      const nodeIndex = Math.floor((progress / 100) * (path.length - 1))
      setCurrentNode(path[nodeIndex])

      if (currentStep >= totalSteps) {
        clearInterval(interval)
        setTimeout(() => {
          resetInterface()
        }, 1000)
      }
    }, stepDuration)
  }

  const resetInterface = () => {
    setOrigin(null)
    setDestination(null)
    setRouteResult(null)
    setIsAnimating(false)
    setAnimationProgress(0)
    setCurrentNode(null)
  }

  const getNodeColor = (nodeId: number) => {
    if (currentNode === nodeId && isAnimating) return "bg-yellow-500"
    if (nodeId === origin) return "bg-green-500"
    if (nodeId === destination) return "bg-red-500"
    if (routeResult?.path.includes(nodeId)) return "bg-blue-400"
    return "bg-gray-300"
  }

  // Definir posiciones exactas de los nodos
  const nodePositions = {
    1: { x: 50, y: 10 }, // Top center
    2: { x: 15, y: 35 }, // Left middle
    3: { x: 85, y: 35 }, // Right middle
    4: { x: 15, y: 65 }, // Left bottom
    5: { x: 85, y: 65 }, // Right bottom
    6: { x: 50, y: 90 }, // Bottom center
  }

  function RouteEdge({ from, to }: { from: number; to: number }) {
    const fromPos = nodePositions[from as keyof typeof nodePositions]
    const toPos = nodePositions[to as keyof typeof nodePositions]

    return (
      <line
        x1={`${fromPos.x}%`}
        y1={`${fromPos.y}%`}
        x2={`${toPos.x}%`}
        y2={`${toPos.y}%`}
        stroke="#3b82f6"
        strokeWidth="4"
        strokeDasharray="8,4"
        className="animate-pulse"
        markerEnd="url(#arrowhead)"
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-indigo-900">Bienvenido, {user.name}</h2>
          <p className="text-indigo-700">Selecciona tu ruta de viaje</p>
        </div>
        <Button variant="outline" onClick={onLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Mapa de MoviSimple
            </CardTitle>
            <CardDescription>6 nodos conectados - Selecciona origen y destino</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative bg-gray-50 rounded-lg p-8 h-80">
              {/* Node positions using defined coordinates */}
              <div className="absolute" style={{ top: "10%", left: "50%", transform: "translate(-50%, -50%)" }}>
                <NodeComponent id={1} color={getNodeColor(1)} />
              </div>
              <div className="absolute" style={{ top: "35%", left: "15%", transform: "translate(-50%, -50%)" }}>
                <NodeComponent id={2} color={getNodeColor(2)} />
              </div>
              <div className="absolute" style={{ top: "35%", left: "85%", transform: "translate(-50%, -50%)" }}>
                <NodeComponent id={3} color={getNodeColor(3)} />
              </div>
              <div className="absolute" style={{ top: "65%", left: "15%", transform: "translate(-50%, -50%)" }}>
                <NodeComponent id={4} color={getNodeColor(4)} />
              </div>
              <div className="absolute" style={{ top: "65%", left: "85%", transform: "translate(-50%, -50%)" }}>
                <NodeComponent id={5} color={getNodeColor(5)} />
              </div>
              <div className="absolute" style={{ top: "90%", left: "50%", transform: "translate(-50%, -50%)" }}>
                <NodeComponent id={6} color={getNodeColor(6)} />
              </div>

              {/* Route visualization with proper SVG */}
              {routeResult && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                    </marker>
                  </defs>
                  {routeResult.path.slice(0, -1).map((nodeId, index) => {
                    const nextNodeId = routeResult.path[index + 1]
                    return <RouteEdge key={`${nodeId}-${nextNodeId}`} from={nodeId} to={nextNodeId} />
                  })}
                </svg>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Controls Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Navigation className="w-5 h-5 mr-2" />
              Control de Viaje
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Origen</label>
                <Select
                  value={origin?.toString() || ""}
                  onValueChange={(value) => setOrigin(Number.parseInt(value))}
                  disabled={isAnimating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar origen" />
                  </SelectTrigger>
                  <SelectContent>
                    {nodes.map((node) => (
                      <SelectItem key={node} value={node.toString()}>
                        Nodo {node}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Destino</label>
                <Select
                  value={destination?.toString() || ""}
                  onValueChange={(value) => setDestination(Number.parseInt(value))}
                  disabled={isAnimating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {nodes
                      .filter((node) => node !== origin)
                      .map((node) => (
                        <SelectItem key={node} value={node.toString()}>
                          Nodo {node}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={calculateRoute}
              disabled={origin === null || destination === null || isAnimating}
              className="w-full"
            >
              Calcular Ruta
            </Button>

            {isAnimating && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progreso del viaje</span>
                  <span>{Math.round(animationProgress)}%</span>
                </div>
                <Progress value={animationProgress} className="w-full" />
              </div>
            )}

            {routeResult && (
              <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900">Información del Viaje</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Tiempo Total</p>
                      <p className="font-semibold">{routeResult.totalTime} segundos</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Costo</p>
                      <p className="font-semibold">${routeResult.cost.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Ruta:</p>
                  <div className="flex gap-1">
                    {routeResult.path.map((node, index) => (
                      <Badge key={index} variant="secondary">
                        {node}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function NodeComponent({ id, color }: { id: number; color: string }) {
  return (
    <div
      className={`w-12 h-12 rounded-full ${color} flex items-center justify-center text-white font-bold shadow-lg border-2 border-white`}
    >
      {id}
    </div>
  )
}
