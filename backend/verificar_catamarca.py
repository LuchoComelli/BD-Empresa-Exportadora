import requests
import sys

API_BASE_URL = "https://apis.datos.gob.ar/georef/api"

# Verificar municipios
print("Verificando municipios de Catamarca...")
response = requests.get(f"{API_BASE_URL}/municipios", params={
    'provincia': '10',
    'campos': 'completo',
    'max': 5000
})
data = response.json()
total_municipios = data.get('total', 0)
municipios = data.get('municipios', [])
print(f"Total municipios en API: {total_municipios}")
print(f"Municipios obtenidos: {len(municipios)}")

# Verificar localidades
print("\nVerificando localidades de Catamarca...")
all_localidades = []
offset = 0
while True:
    response = requests.get(f"{API_BASE_URL}/asentamientos", params={
        'provincia': '10',
        'campos': 'completo',
        'max': 1000,
        'inicio': offset
    })
    if response.status_code == 400:
        break
    data = response.json()
    localidades = data.get('asentamientos', [])
    if not localidades:
        break
    all_localidades.extend(localidades)
    total = data.get('total', 0)
    print(f"  Obtenidas {len(all_localidades)}/{total} localidades...")
    if len(all_localidades) >= total or len(localidades) < 1000:
        break
    offset += 1000

print(f"\nTotal localidades en API: {len(all_localidades)}")
print(f"Total localidades únicas: {len(set(l['id'] for l in all_localidades))}")

