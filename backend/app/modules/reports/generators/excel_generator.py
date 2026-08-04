import pandas as pd
import io
from typing import List, Dict, Any

def generate_excel(data: List[Dict[str, Any]], sheet_name: str = "Report") -> bytes:
    if not data:
        df = pd.DataFrame()
    else:
        df = pd.DataFrame(data)
        
    excel_buffer = io.BytesIO()
    with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name=sheet_name)
    return excel_buffer.getvalue()
