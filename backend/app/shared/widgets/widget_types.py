"""
app/shared/widgets/widget_types.py

Standardized Widget Type categories.
"""

from enum import Enum


class WidgetType(str, Enum):
    LINE_CHART = "LINE_CHART"
    AREA_CHART = "AREA_CHART"
    BAR_CHART = "BAR_CHART"
    GAUGE = "GAUGE"
    CARD = "CARD"
    TABLE = "TABLE"
    MAP = "MAP"
    STATUS = "STATUS"
    PIE = "PIE"
    DONUT = "DONUT"
    HEATMAP = "HEATMAP"
    CUSTOM = "CUSTOM"
