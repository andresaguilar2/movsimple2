import sys
import os

# Ensure the current directory is in the Python path
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import hashlib
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configuración
USERS_FILE = "users.txt"
TARIFF_PER_SECOND = 0.5

class GraphSimple:
    def __init__(self, vertices):
        self.vertices = vertices
        self.adj_list = {i: [] for i in range(1, vertices + 1)}
    
    def add_edge(self, u, v, weight):
        self.adj_list[u].append({'node': v, 'weight': weight})
        self.adj_list[v].append({'node': u, 'weight': weight})
    
    def dijkstra_simple(self, source):
        distances = {i: float('inf') for i in range(1, self.vertices + 1)}
        predecessors = {i: None for i in range(1, self.vertices + 1)}
        visited = set()
        
        distances[source] = 0
        
        for _ in range(self.vertices):
            # Encontrar vértice no visitado con distancia mínima
            min_distance = float('inf')
            min_vertex = -1
            
            for v in range(1, self.vertices + 1):
                if v not in visited and distances[v] < min_distance:
                    min_distance = distances[v]
                    min_vertex = v
            
            if min_vertex == -1:
                break
                
            visited.add(min_vertex)
            
            # Actualizar distancias a vecinos
            for neighbor in self.adj_list[min_vertex]:
                if neighbor['node'] not in visited:
                    new_distance = distances[min_vertex] + neighbor['weight']
                    if new_distance < distances[neighbor['node']]:
                        distances[neighbor['node']] = new_distance
                        predecessors[neighbor['node']] = min_vertex
        
        return distances, predecessors
    
    def get_path(self, source, destination, predecessors):
        path = []
        current = destination
        
        while current is not None:
            path.insert(0, current)
            current = predecessors[current]
            if current == source:
                path.insert(0, source)
                break
        
        return path

def create_movisimple_graph():
    graph = GraphSimple(6)
    
    # 9 aristas bidireccionales con pesos en segundos
    edges = [
        [1, 2, 10], [1, 3, 15], [2, 3, 12], [2, 4, 8],
        [3, 5, 20], [4, 5, 18], [4, 6, 14], [5, 6, 16], [1, 6, 25]
    ]
    
    for u, v, w in edges:
        graph.add_edge(u, v, w)
    
    return graph

def read_users():
    try:
        with open(USERS_FILE, 'r') as f:
            users = []
            for line in f:
                line = line.strip()
                if line:
                    parts = line.split('|')
                    if len(parts) == 3:
                        users.append({
                            'name': parts[0],
                            'email': parts[1],
                            'password_hash': parts[2]
                        })
            return users
    except FileNotFoundError:
        return []

def write_user(name, email, password_hash):
    with open(USERS_FILE, 'a') as f:
        f.write(f"{name}|{email}|{password_hash}\n")

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        
        if not all([name, email, password]):
            return jsonify({'error': 'Todos los campos son requeridos'}), 400
        
        users = read_users()
        if any(user['email'] == email for user in users):
            return jsonify({'error': 'El usuario ya existe'}), 400
        
        password_hash = hash_password(password)
        write_user(name, email, password_hash)
        
        return jsonify({
            'user': {'name': name, 'email': email},
            'message': 'Usuario registrado exitosamente'
        })
    
    except Exception as e:
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not all([email, password]):
            return jsonify({'error': 'Email y contraseña son requeridos'}), 400
        
        users = read_users()
        user = next((u for u in users if u['email'] == email), None)
        
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 401
        
        password_hash = hash_password(password)
        if password_hash != user['password_hash']:
            return jsonify({'error': 'Contraseña incorrecta'}), 401
        
        return jsonify({
            'user': {'name': user['name'], 'email': user['email']},
            'message': 'Login exitoso'
        })
    
    except Exception as e:
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/calculate-route', methods=['POST'])
def calculate_route():
    try:
        data = request.get_json()
        origin = data.get('origin')
        destination = data.get('destination')
        
        if not origin or not destination or origin == destination:
            return jsonify({'error': 'Origen y destino válidos son requeridos'}), 400
        
        graph = create_movisimple_graph()
        distances, predecessors = graph.dijkstra_simple(origin)
        
        total_time = distances[destination]
        if total_time == float('inf'):
            return jsonify({'error': 'No hay ruta disponible'}), 400
        
        path = graph.get_path(origin, destination, predecessors)
        cost = total_time * TARIFF_PER_SECOND
        
        return jsonify({
            'path': path,
            'totalTime': total_time,
            'cost': cost
        })
    
    except Exception as e:
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'OK', 'message': 'MoviSimple API funcionando'})

if __name__ == '__main__':
    app.run(debug=True, port=5328)
