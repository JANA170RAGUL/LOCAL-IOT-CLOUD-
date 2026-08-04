import sys
import os
from pathlib import Path
from datetime import datetime
import json

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database.session import engine
from sqlalchemy import MetaData

def dump_db_to_markdown():
    metadata = MetaData()
    metadata.reflect(bind=engine)
    
    output_path = r"C:\Users\Raghal\.gemini\antigravity-ide\brain\53c10297-f886-417f-9e0c-60517e17ccb7\database_data.md"
    
    with engine.connect() as conn:
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("# Database Data Dump\n\n")
            
            if not metadata.tables:
                f.write("No tables found in the database.\n")
                return

            for table_name in metadata.tables:
                table = metadata.tables[table_name]
                result = conn.execute(table.select())
                rows = [dict(row._mapping) for row in result]
                
                f.write(f"## Table: `{table_name}`\n\n")
                if not rows:
                    f.write("*Table is empty.*\n\n")
                    continue
                
                # Get column names from the first row
                columns = list(rows[0].keys())
                
                # Write table header
                header = "| " + " | ".join([str(c) for c in columns]) + " |"
                separator = "| " + " | ".join(["---" for _ in columns]) + " |"
                
                f.write(header + "\n")
                f.write(separator + "\n")
                
                # Write rows
                for row in rows:
                    row_data = []
                    for col in columns:
                        val = row.get(col)
                        if isinstance(val, datetime):
                            val_str = val.isoformat()
                        elif val is None:
                            val_str = "NULL"
                        else:
                            val_str = str(val).replace("\n", " ").replace("|", "\\|")
                        
                        # Truncate very long strings (like password hashes or keys) for readability
                        if len(val_str) > 100:
                            val_str = val_str[:97] + "..."
                            
                        row_data.append(val_str)
                    
                    f.write("| " + " | ".join(row_data) + " |\n")
                
                f.write("\n---\n\n")
                
    print(f"Dumped database data to {output_path}")

if __name__ == "__main__":
    dump_db_to_markdown()
