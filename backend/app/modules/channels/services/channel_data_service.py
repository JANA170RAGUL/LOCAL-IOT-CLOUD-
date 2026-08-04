import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from influxdb_client import Point
from fastapi import HTTPException

from app.config.settings import settings
from app.database.influx import write_api, query_api
from app.modules.channels.models.channel import Channel

logger = logging.getLogger(__name__)

class ChannelDataService:
    @staticmethod
    def _create_point(channel: Channel, data: Dict[str, Any]) -> Point:
        point = Point("channel_data").tag("channel_id", channel.id)
        
        # Use provided created_at or default to now
        timestamp = data.get("created_at") or data.get("timestamp")
        if timestamp:
            if isinstance(timestamp, str):
                try:
                    timestamp = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                except ValueError:
                    timestamp = datetime.now(timezone.utc)
        else:
            timestamp = datetime.now(timezone.utc)
        
        point.time(timestamp)

        provided_keys = set(k for k in data.keys() if k not in ["api_key", "channel_id", "timestamp", "created_at"])
        known_keys = set(f.field_key for f in channel.fields)
        
        unknown_keys = provided_keys - known_keys
        if unknown_keys:
            raise ValueError(f"Unknown fields provided: {', '.join(unknown_keys)}")

        has_fields = False
        for field in channel.fields:
            if field.field_key in data:
                val = data[field.field_key]
                if val is not None:
                    # Attempt to cast
                    try:
                        if field.data_type == "float":
                            point.field(field.field_key, float(val))
                        elif field.data_type == "int":
                            point.field(field.field_key, int(val))
                        elif field.data_type == "boolean":
                            point.field(field.field_key, str(val).lower() in ["true", "1", "yes"])
                        else:
                            point.field(field.field_key, str(val))
                        has_fields = True
                    except ValueError:
                        raise ValueError(f"Invalid data type for field '{field.field_key}'. Expected {field.data_type}")
        
        if not has_fields:
            raise ValueError("No valid fields provided matching channel configuration")
            
        return point

    @staticmethod
    def write_data(channel: Channel, data: Dict[str, Any]) -> None:
        """Write channel data to InfluxDB."""
        try:
            point = ChannelDataService._create_point(channel, data)
            write_api.write(bucket=settings.influx_bucket, record=point)
        except ValueError as e:
            raise e
        except Exception as e:
            logger.error(f"Failed to write channel data to InfluxDB: {e}", exc_info=True)
            raise RuntimeError("Database write failed") from e

    @staticmethod
    def write_data_bulk(channel: Channel, data_list: List[Dict[str, Any]]) -> None:
        """Write bulk channel data to InfluxDB."""
        if not data_list:
            raise ValueError("Empty data list provided for bulk write")
            
        try:
            points = [ChannelDataService._create_point(channel, data) for data in data_list]
            write_api.write(bucket=settings.influx_bucket, record=points)
        except ValueError as e:
            raise e
        except Exception as e:
            logger.error(f"Failed to write bulk channel data to InfluxDB: {e}", exc_info=True)
            raise RuntimeError("Database bulk write failed") from e

    @staticmethod
    def get_feeds(channel_id: str, results: int = 100) -> List[Dict[str, Any]]:
        """Retrieve recent feeds for a channel."""
        # Note: Pivot is required to reconstruct the rows if multiple fields were written in one point.
        flux_query = f'''
            from(bucket: "{settings.influx_bucket}")
            |> range(start: -30d)
            |> filter(fn: (r) => r._measurement == "channel_data" and r.channel_id == "{channel_id}")
            |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
            |> sort(columns: ["_time"], desc: true)
            |> limit(n: {results})
        '''
        try:
            tables = query_api.query(flux_query)
            records = []
            for table in tables:
                for row in table.records:
                    rec = {"created_at": row.get_time().isoformat()}
                    # In a pivoted table, values are in row.values
                    for k, v in row.values.items():
                        if k not in ["result", "table", "_start", "_stop", "_time", "_measurement", "channel_id"]:
                            rec[k] = v
                    records.append(rec)
            # Sort again in Python just in case we have multiple tables
            records.sort(key=lambda x: x["created_at"], reverse=True)
            return records[:results]
        except Exception as e:
            logger.error(f"Failed to query feeds: {e}")
            return []

    @staticmethod
    def get_last_feed(channel_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve the single most recent feed for a channel."""
        feeds = ChannelDataService.get_feeds(channel_id, results=1)
        return feeds[0] if feeds else None

    @staticmethod
    def get_field_feed(channel_id: str, field_key: str, results: int = 100) -> List[Dict[str, Any]]:
        """Retrieve recent data for a single specific field."""
        flux_query = f'''
            from(bucket: "{settings.influx_bucket}")
            |> range(start: -30d)
            |> filter(fn: (r) => r._measurement == "channel_data" and r.channel_id == "{channel_id}" and r._field == "{field_key}")
            |> sort(columns: ["_time"], desc: true)
            |> limit(n: {results})
        '''
        try:
            tables = query_api.query(flux_query)
            records = []
            for table in tables:
                for row in table.records:
                    records.append({
                        "created_at": row.get_time().isoformat(),
                        field_key: row.get_value()
                    })
            records.sort(key=lambda x: x["created_at"], reverse=True)
            return records[:results]
        except Exception as e:
            logger.error(f"Failed to query field feeds: {e}")
            return []

    @staticmethod
    def get_channel_metrics(channel: Channel) -> Dict[str, Any]:
        """Retrieve aggregated metrics for a channel dashboard."""
        channel_id = channel.id
        num_fields = len(channel.fields) or 1

        flux_total = f'''
            from(bucket: "{settings.influx_bucket}")
            |> range(start: 0)
            |> filter(fn: (r) => r._measurement == "channel_data" and r.channel_id == "{channel_id}")
            |> group()
            |> count(column: "_value")
        '''
        
        flux_today = f'''
            from(bucket: "{settings.influx_bucket}")
            |> range(start: -24h)
            |> filter(fn: (r) => r._measurement == "channel_data" and r.channel_id == "{channel_id}")
            |> group()
            |> count(column: "_value")
        '''

        total_points = 0
        try:
            for table in query_api.query(flux_total):
                for row in table.records:
                    total_points += row.get_value()
        except Exception as e:
            logger.error(f"Failed to query total messages: {e}")

        points_today = 0
        try:
            for table in query_api.query(flux_today):
                for row in table.records:
                    points_today += row.get_value()
        except Exception as e:
            logger.error(f"Failed to query messages today: {e}")

        total_messages = total_points // num_fields
        messages_today = points_today // num_fields
            
        last_feed = ChannelDataService.get_last_feed(channel_id)
        
        health_status = "Offline"
        if last_feed:
            last_dt = datetime.fromisoformat(last_feed["created_at"].replace("Z", "+00:00"))
            delta = (datetime.now(timezone.utc) - last_dt).total_seconds()
            if delta < 3600:
                health_status = "Healthy"
            elif delta < 86400:
                health_status = "Idle"

        return {
            "total_messages": total_messages,
            "messages_today": messages_today,
            "health_status": health_status,
            "last_write": last_feed["created_at"] if last_feed else None,
            "average_rate_sec": round(messages_today / 86400.0, 4),
            "storage_used_bytes": total_messages * 150
        }

    @staticmethod
    def export_channel_data(channel: Channel, export_format: str, start: Optional[str] = None, end: Optional[str] = None, fields: Optional[List[str]] = None) -> bytes:
        """Export channel data to CSV, Excel, or JSON."""
        import pandas as pd
        import io
        
        # Build flux query
        time_range = ""
        if start and end:
            time_range = f'|> range(start: {start}, stop: {end})'
        elif start:
            time_range = f'|> range(start: {start})'
        else:
            time_range = '|> range(start: 0)' # all time
            
        flux_query = f'''
            from(bucket: "{settings.influx_bucket}")
            {time_range}
            |> filter(fn: (r) => r._measurement == "channel_data" and r.channel_id == "{channel.id}")
            |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
            |> sort(columns: ["_time"], desc: false)
        '''
        
        try:
            tables = query_api.query(flux_query)
            records = []
            for table in tables:
                for row in table.records:
                    rec = {"created_at": row.get_time().isoformat()}
                    for k, v in row.values.items():
                        if k not in ["result", "table", "_start", "_stop", "_time", "_measurement", "channel_id"]:
                            rec[k] = v
                    records.append(rec)
                    
            df = pd.DataFrame(records)
            
            if df.empty:
                df = pd.DataFrame(columns=["created_at"] + [f.field_key for f in channel.fields])
            else:
                if fields:
                    cols = ["created_at"] + [f for f in fields if f in df.columns]
                    df = df[cols]

            if export_format == "csv":
                return df.to_csv(index=False).encode('utf-8')
            elif export_format == "excel":
                output = io.BytesIO()
                with pd.ExcelWriter(output, engine='openpyxl') as writer:
                    df.to_excel(writer, index=False)
                return output.getvalue()
            elif export_format == "json":
                return df.to_json(orient='records').encode('utf-8')
            else:
                raise ValueError(f"Unsupported format: {export_format}")
        except Exception as e:
            logger.error(f"Failed to export channel data: {e}")
            raise RuntimeError("Export failed") from e

    @staticmethod
    def import_channel_data(channel: Channel, file_content: bytes, import_format: str) -> Dict[str, Any]:
        """Import channel data from CSV, Excel, or JSON."""
        import pandas as pd
        import io
        
        try:
            if import_format == "csv":
                df = pd.read_csv(io.BytesIO(file_content))
            elif import_format == "excel":
                df = pd.read_excel(io.BytesIO(file_content), engine='openpyxl')
            elif import_format == "json":
                df = pd.read_json(io.BytesIO(file_content))
            else:
                raise ValueError(f"Unsupported format: {import_format}")
        except Exception as e:
            raise ValueError(f"Failed to parse file: {e}")
            
        if df.empty:
            return {"total": 0, "imported": 0, "skipped": 0, "errors": 0}
            
        # We expect a 'created_at' or 'timestamp' column
        time_col = None
        if "created_at" in df.columns:
            time_col = "created_at"
        elif "timestamp" in df.columns:
            time_col = "timestamp"
            
        data_list = []
        errors = 0
        
        for _, row in df.iterrows():
            row_dict = row.dropna().to_dict()
            if time_col and time_col in row_dict:
                if isinstance(row_dict[time_col], pd.Timestamp):
                    row_dict["created_at"] = row_dict[time_col].isoformat()
                else:
                    row_dict["created_at"] = str(row_dict[time_col])
                if time_col == "timestamp":
                    del row_dict["timestamp"]
            
            try:
                pt = ChannelDataService._create_point(channel, row_dict)
                data_list.append(pt)
            except Exception:
                errors += 1
                
        imported = 0
        if data_list:
            try:
                write_api.write(bucket=settings.influx_bucket, record=data_list)
                imported = len(data_list)
            except Exception as e:
                logger.error(f"Bulk write failed during import: {e}")
                raise RuntimeError("Failed to write to database")
                
        return {
            "total": len(df),
            "imported": imported,
            "skipped": 0,
            "errors": errors
        }
