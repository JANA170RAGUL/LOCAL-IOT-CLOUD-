import platform
import subprocess
import uuid
import hashlib

def _run_cmd(cmd: str) -> str:
    """Helper to run a shell command and return the stdout as a string. Suppresses errors."""
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=2)
        if result.returncode == 0:
            # Taking the second line usually, as WMIC outputs a header, then the value
            lines = [line.strip() for line in result.stdout.strip().split('\n') if line.strip()]
            if len(lines) > 1:
                return lines[1]
            elif len(lines) == 1:
                return lines[0]
    except Exception:
        pass
    return "UNKNOWN"

def get_cpu_id() -> str:
    if platform.system() == "Windows":
        return _run_cmd("wmic cpu get processorid")
    else:
        # Simplistic approach for Linux
        try:
            with open("/proc/cpuinfo", "r") as f:
                for line in f:
                    if "Serial" in line or "Hardware" in line or "model name" in line:
                        return line.split(":")[1].strip()
        except Exception:
            pass
    return "UNKNOWN"

def get_motherboard_serial() -> str:
    if platform.system() == "Windows":
        return _run_cmd("wmic baseboard get serialnumber")
    else:
        try:
            with open("/sys/class/dmi/id/board_serial", "r") as f:
                return f.read().strip()
        except Exception:
            pass
    return "UNKNOWN"

def get_disk_serial() -> str:
    if platform.system() == "Windows":
        return _run_cmd("wmic diskdrive get serialnumber")
    # For linux, requires root usually, so fallback to UNKNOWN
    return "UNKNOWN"

def get_mac_address() -> str:
    # Gets the MAC address of the primary network interface
    mac_num = uuid.getnode()
    mac = ':'.join(['{:02x}'.format((mac_num >> elements) & 0xff) for elements in range(0,2*6,2)][::-1])
    return mac.upper()

def get_os_uuid() -> str:
    if platform.system() == "Windows":
        return _run_cmd("wmic csproduct get uuid")
    else:
        try:
            with open("/sys/class/dmi/id/product_uuid", "r") as f:
                return f.read().strip()
        except Exception:
            pass
        # Fallback to /etc/machine-id
        try:
            with open("/etc/machine-id", "r") as f:
                return f.read().strip()
        except Exception:
            pass
    return "UNKNOWN"

def generate_fingerprint() -> dict:
    """
    Returns a dictionary containing raw hardware attributes and the final SHA256 hash.
    """
    raw_data = {
        "cpu_id": get_cpu_id(),
        "motherboard_serial": get_motherboard_serial(),
        "disk_serial": get_disk_serial(),
        "mac_address": get_mac_address(),
        "os_uuid": get_os_uuid()
    }
    
    # Hash everything to produce the fingerprint hash
    # Sort keys to ensure deterministic ordering
    hash_str = ""
    for key in sorted(raw_data.keys()):
        hash_str += f"{key}:{raw_data[key]}|"
        
    fingerprint_hash = hashlib.sha256(hash_str.encode("utf-8")).hexdigest().upper()
    
    raw_data["fingerprint_hash"] = fingerprint_hash
    return raw_data
