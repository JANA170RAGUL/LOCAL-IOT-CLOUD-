import pandas as pd
import io
from typing import List, Dict, Any

def generate_csv(data: List[Dict[str, Any]]) -> bytes:
    if not data:
        return b""
    df = pd.DataFrame(data)
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    return csv_buffer.getvalue().encode('utf-8')
