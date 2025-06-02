import { type NextRequest, NextResponse } from "next/server"

class GraphSimple {
  private vertices: number
  private adjList: Map<number, Array<{ node: number; weight: number }>>

  constructor(vertices: number) {
    this.vertices = vertices
    this.adjList = new Map()

    for (let i = 1; i <= vertices; i++) {
      this.adjList.set(i, [])
    }
  }

  addEdge(u: number, v: number, weight: number) {
    this.adjList.get(u)?.push({ node: v, weight })
    this.adjList.get(v)?.push({ node: u, weight })
  }

  dijkstraSimple(source: number) {
    const distances: Map<number, number> = new Map()
    const predecessors: Map<number, number | null> = new Map()
    const visited: Set<number> = new Set()

    // Initialize distances
    for (let i = 1; i <= this.vertices; i++) {
      distances.set(i, i === source ? 0 : Number.POSITIVE_INFINITY)
      predecessors.set(i, null)
    }

    for (let i = 0; i < this.vertices; i++) {
      // Find unvisited vertex with minimum distance
      let minDistance = Number.POSITIVE_INFINITY
      let minVertex = -1

      for (let v = 1; v <= this.vertices; v++) {
        if (!visited.has(v) && distances.get(v)! < minDistance) {
          minDistance = distances.get(v)!
          minVertex = v
        }
      }

      if (minVertex === -1) break

      visited.add(minVertex)

      // Update distances to neighbors
      const neighbors = this.adjList.get(minVertex) || []
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.node)) {
          const newDistance = distances.get(minVertex)! + neighbor.weight
          if (newDistance < distances.get(neighbor.node)!) {
            distances.set(neighbor.node, newDistance)
            predecessors.set(neighbor.node, minVertex)
          }
        }
      }
    }

    return { distances, predecessors }
  }

  getPath(source: number, destination: number, predecessors: Map<number, number | null>): number[] {
    const path: number[] = []
    let current: number | null = destination

    while (current !== null) {
      path.unshift(current)
      current = predecessors.get(current) || null
      if (current === source) {
        path.unshift(source)
        break
      }
    }

    return path
  }
}

// Define the graph with 6 vertices and 9 edges
function createMoviSimpleGraph(): GraphSimple {
  const graph = new GraphSimple(6)

  // 9 bidirectional edges with weights in seconds
  const edges = [
    [1, 2, 10], // Node 1 to Node 2: 10 seconds
    [1, 3, 15], // Node 1 to Node 3: 15 seconds
    [2, 3, 12], // Node 2 to Node 3: 12 seconds
    [2, 4, 8], // Node 2 to Node 4: 8 seconds
    [3, 5, 20], // Node 3 to Node 5: 20 seconds
    [4, 5, 18], // Node 4 to Node 5: 18 seconds
    [4, 6, 14], // Node 4 to Node 6: 14 seconds
    [5, 6, 16], // Node 5 to Node 6: 16 seconds
    [1, 6, 25], // Node 1 to Node 6: 25 seconds
  ]

  edges.forEach(([u, v, w]) => {
    graph.addEdge(u, v, w)
  })

  return graph
}

const TARIFF_PER_SECOND = 0.5 // $0.50 per second

export async function POST(request: NextRequest) {
  try {
    const { origin, destination } = await request.json()

    if (!origin || !destination || origin === destination) {
      return NextResponse.json({ error: "Origen y destino válidos son requeridos" }, { status: 400 })
    }

    const graph = createMoviSimpleGraph()
    const { distances, predecessors } = graph.dijkstraSimple(origin)

    const totalTime = distances.get(destination)
    if (totalTime === Number.POSITIVE_INFINITY) {
      return NextResponse.json({ error: "No hay ruta disponible entre los nodos seleccionados" }, { status: 400 })
    }

    const path = graph.getPath(origin, destination, predecessors)
    const cost = totalTime! * TARIFF_PER_SECOND

    return NextResponse.json({
      path,
      totalTime,
      cost,
    })
  } catch (error) {
    console.error("Route calculation error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
