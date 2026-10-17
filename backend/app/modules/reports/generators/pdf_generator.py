import io
from typing import List, Dict, Any
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from datetime import datetime, timezone

def generate_pdf(data: List[Dict[str, Any]], title: str) -> bytes:
    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        pdf_buffer, 
        pagesize=landscape(letter), 
        leftMargin=20, 
        rightMargin=20, 
        topMargin=20, 
        bottomMargin=20
    )
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = styles['Heading1']
    normal_style = styles['Normal']
    
    cell_style = ParagraphStyle(
        'CellStyle',
        parent=normal_style,
        fontSize=8,
        leading=10,
        wordWrap='CJK'
    )
    
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=normal_style,
        fontSize=9,
        leading=11,
        fontName='Helvetica-Bold',
        textColor=colors.whitesmoke
    )
    
    # Title
    elements.append(Paragraph(title, title_style))
    elements.append(Paragraph(f"Generated at: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}", normal_style))
    elements.append(Spacer(1, 15))
    
    if not data:
        elements.append(Paragraph("No data available for this report.", normal_style))
    else:
        headers = list(data[0].keys())
        table_data = [[Paragraph(h, header_style) for h in headers]]
        
        for row in data[:1000]:
            table_data.append([Paragraph(str(row.get(h, "")), cell_style) for h in headers])
            
        table = Table(table_data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1'))
        ]))
        elements.append(table)
        
    doc.build(elements)
    return pdf_buffer.getvalue()
