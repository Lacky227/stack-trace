import time
import random
import requests
import os

API_URL = os.getenv("API_URL", "http://localhost:8080")
USERNAME = os.getenv("API_USERNAME", "admin")
PASSWORD = os.getenv("API_PASSWORD", "admin123")


def get_token():
    response = requests.post(
        f"{API_URL}/auth/login", json={"username": USERNAME, "password": PASSWORD}
    )
    response.raise_for_status()
    return response.json()["access_token"]


def get_devices(token):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_URL}/devices", headers=headers)
    response.raise_for_status()
    return response.json()


def send_metrics(device):
    cpu = random.uniform(10.0, 70.0)
    ram = random.uniform(20.0, 85.0)
    disk = random.uniform(30.0, 90.0)

    device_type = device.get("type", "").lower()

    if device_type == "database":
        ram = random.uniform(70.0, 98.0)
    elif device_type == "router":
        cpu = random.uniform(5.0, 30.0)

    if random.random() < 0.05:
        cpu = random.uniform(92.0, 99.9)

    payload = {
        "device_id": device["id"],
        "cpu_usage": round(cpu, 1),
        "ram_usage": round(ram, 1),
        "disk_usage": round(disk, 1),
    }

    try:
        requests.post(f"{API_URL}/metrics", json=payload)
        print(
            f"[{time.strftime('%H:%M:%S')}] Pushed metrics for {device['name']} | CPU: {payload['cpu_usage']}%"
        )
    except Exception as e:
        print(f"Error for {device['name']}: {e}")


def main():
    print(f"Starting simulator. Targeting: {API_URL}")
    token = None

    while True:
        try:
            if not token:
                token = get_token()
                print("Successfully authenticated.")

            devices = get_devices(token)

            for device in devices:
                send_metrics(device)

            time.sleep(5)

        except requests.exceptions.RequestException as e:
            print(f"Connection error: {e}. Retrying in 5s...")
            token = None
            time.sleep(5)


if __name__ == "__main__":
    main()
