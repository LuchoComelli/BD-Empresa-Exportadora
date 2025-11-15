from django.http import HttpResponse
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime
from io import BytesIO

# Colores institucionales (convertidos de HEX a RGB 0-1)
COLOR_AZUL_PRINCIPAL = colors.HexColor('#222A59')  # Azul institucional
COLOR_AZUL_SECUNDARIO = colors.HexColor('#3259B5')  # Azul medio
COLOR_AZUL_CLARO = colors.HexColor('#629BD2')  # Azul claro
COLOR_VERDE_INSTITUCIONAL = colors.HexColor('#C3C840')  # Verde institucional
COLOR_VERDE_AGUA = colors.HexColor('#66A29C')  # Verde agua
COLOR_PURPURA = colors.HexColor('#807DA1')  # Púrpura
COLOR_ROSA = colors.HexColor('#C0217E')  # Rosa
COLOR_ROSA_CLARO = colors.HexColor('#EB7DBF')  # Rosa claro
COLOR_GRIS_NEUTRO = colors.HexColor('#6B7280')  # Gris neutro
COLOR_GRIS_CLARO = colors.HexColor('#F3F4F6')  # Gris claro
COLOR_BLANCO = colors.white
COLOR_NEGRO = colors.black

def generate_empresas_pdf(empresas, campos_seleccionados, tipo_empresa):
    """
    Generar PDF con empresas filtradas usando la identidad visual institucional
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=1*inch,
        bottomMargin=0.75*inch
    )
    story = []
    
    # Estilos personalizados
    styles = getSampleStyleSheet()
    
    # Estilo para el header institucional
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Normal'],
        fontSize=14,
        textColor=COLOR_AZUL_PRINCIPAL,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER,
        spaceAfter=6
    )
    
    # Estilo para subtítulo
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=COLOR_GRIS_NEUTRO,
        fontName='Helvetica',
        alignment=TA_CENTER,
        spaceAfter=20
    )
    
    # Estilo para el título principal
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=COLOR_AZUL_PRINCIPAL,
        fontName='Helvetica-Bold',
        spaceAfter=10,
        spaceBefore=10,
        alignment=TA_CENTER
    )
    
    # Header institucional
    header_text = Paragraph(
        "Dirección de Intercambio Comercial Internacional y Regional<br/>"
        "Provincia de Catamarca",
        header_style
    )
    story.append(header_text)
    
    # Línea decorativa (usando tabla para compatibilidad)
    line_table = Table([['']], colWidths=[doc.width], rowHeights=[2])
    line_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_AZUL_PRINCIPAL),
        ('LINEBELOW', (0, 0), (-1, -1), 0, COLOR_AZUL_PRINCIPAL),
    ]))
    story.append(line_table)
    story.append(Spacer(1, 0.2*inch))
    
    # Título del reporte
    title = Paragraph(f"Reporte de Empresas - {tipo_empresa.title()}", title_style)
    story.append(title)
    
    # Fecha de generación
    fecha = datetime.now().strftime("%d/%m/%Y %H:%M")
    fecha_text = Paragraph(f"Generado el: {fecha}", subtitle_style)
    story.append(fecha_text)
    
    story.append(Spacer(1, 0.3*inch))
    
    # Datos de la tabla
    data = []
    
    # Encabezados
    headers = ['Razón Social', 'CUIT', 'Departamento', 'Teléfono', 'Email']
    if 'exporta' in campos_seleccionados:
        headers.append('Exporta')
    if 'importa' in campos_seleccionados:
        headers.append('Importa')
    if 'certificadopyme' in campos_seleccionados:
        headers.append('Certificado MiPYME')
    
    data.append(headers)
    
    # Datos de las empresas
    for empresa in empresas:
        row = [
            empresa.razon_social,
            empresa.cuit_cuil,
            empresa.departamento.nomdpto if empresa.departamento else '',
            empresa.telefono or '',
            empresa.correo or '',
        ]
        
        if 'exporta' in campos_seleccionados:
            row.append('Sí' if empresa.exporta else 'No')
        if 'importa' in campos_seleccionados:
            row.append('Sí' if empresa.importa else 'No')
        if 'certificadopyme' in campos_seleccionados:
            row.append('Sí' if empresa.certificadopyme else 'No')
        
        data.append(row)
    
    # Crear tabla con estilos institucionales
    table = Table(data, repeatRows=1)  # Repetir encabezado en cada página
    
    # Estilos de la tabla
    table_style = [
        # Encabezado - Fondo azul principal
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_AZUL_PRINCIPAL),
        ('TEXTCOLOR', (0, 0), (-1, 0), COLOR_BLANCO),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 0), (-1, 0), 12),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('VALIGN', (0, 0), (-1, 0), 'MIDDLE'),
        
        # Filas de datos - Alternar colores
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TEXTCOLOR', (0, 1), (-1, -1), COLOR_NEGRO),
        ('ALIGN', (0, 1), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 1), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [COLOR_BLANCO, COLOR_GRIS_CLARO]),
        ('ROWBACKGROUNDS', (0, 0), (-1, 0), [COLOR_AZUL_PRINCIPAL]),
        
        # Bordes
        ('GRID', (0, 0), (-1, -1), 0.5, COLOR_GRIS_NEUTRO),
        ('LINEBELOW', (0, 0), (-1, 0), 2, COLOR_AZUL_PRINCIPAL),
        
        # Padding de celdas
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
    ]
    
    table.setStyle(TableStyle(table_style))
    
    story.append(table)
    
    # Footer con información institucional
    story.append(Spacer(1, 0.3*inch))
    footer_style = ParagraphStyle(
        'FooterStyle',
        parent=styles['Normal'],
        fontSize=8,
        textColor=COLOR_GRIS_NEUTRO,
        fontName='Helvetica',
        alignment=TA_CENTER,
        spaceBefore=10
    )
    footer_text = Paragraph(
        "Dirección de Intercambio Comercial Internacional y Regional - "
        "San Martín 320, San Fernando del Valle de Catamarca - "
        "Tel: (0383) 4437390",
        footer_style
    )
    story.append(footer_text)
    
    # Construir PDF
    doc.build(story)
    
    # Obtener PDF
    pdf = buffer.getvalue()
    buffer.close()
    
    # Crear respuesta HTTP
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="empresas_{tipo_empresa}.pdf"'
    response.write(pdf)
    
    return response


def generate_empresas_aprobadas_pdf(empresas_producto, empresas_servicio, empresas_mixta, campos_seleccionados):
    """
    Generar PDF con empresas aprobadas de múltiples tipos usando la identidad visual institucional
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=1*inch,
        bottomMargin=0.75*inch
    )
    story = []
    
    # Estilos personalizados
    styles = getSampleStyleSheet()
    
    # Estilo para el header institucional
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Normal'],
        fontSize=14,
        textColor=COLOR_AZUL_PRINCIPAL,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER,
        spaceAfter=6
    )
    
    # Estilo para subtítulo
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=COLOR_GRIS_NEUTRO,
        fontName='Helvetica',
        alignment=TA_CENTER,
        spaceAfter=20
    )
    
    # Estilo para el título principal
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=COLOR_AZUL_PRINCIPAL,
        fontName='Helvetica-Bold',
        spaceAfter=10,
        spaceBefore=10,
        alignment=TA_CENTER
    )
    
    # Header institucional
    header_text = Paragraph(
        "Dirección de Intercambio Comercial Internacional y Regional<br/>"
        "Provincia de Catamarca",
        header_style
    )
    story.append(header_text)
    
    # Línea decorativa (usando tabla para compatibilidad)
    line_table = Table([['']], colWidths=[doc.width], rowHeights=[2])
    line_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_AZUL_PRINCIPAL),
        ('LINEBELOW', (0, 0), (-1, -1), 0, COLOR_AZUL_PRINCIPAL),
    ]))
    story.append(line_table)
    story.append(Spacer(1, 0.2*inch))
    
    # Título del reporte
    title = Paragraph("Reporte de Empresas Aprobadas", title_style)
    story.append(title)
    
    # Fecha de generación
    fecha = datetime.now().strftime("%d/%m/%Y %H:%M")
    fecha_text = Paragraph(f"Generado el: {fecha}", subtitle_style)
    story.append(fecha_text)
    
    story.append(Spacer(1, 0.3*inch))
    
    # Datos de la tabla
    data = []
    
    # Encabezados
    headers = ['Razón Social', 'CUIT', 'Tipo', 'Departamento', 'Teléfono', 'Email']
    if 'exporta' in campos_seleccionados:
        headers.append('Exporta')
    if 'importa' in campos_seleccionados:
        headers.append('Importa')
    if 'certificadopyme' in campos_seleccionados:
        headers.append('Certificado MiPYME')
    
    data.append(headers)
    
    # Datos de las empresas de producto
    for empresa in empresas_producto:
        row = [
            empresa.razon_social,
            empresa.cuit_cuil,
            'Producto',
            empresa.departamento.nomdpto if empresa.departamento else '',
            empresa.telefono or '',
            empresa.correo or '',
        ]
        
        if 'exporta' in campos_seleccionados:
            row.append('Sí' if empresa.exporta == 'Sí' else 'No')
        if 'importa' in campos_seleccionados:
            row.append('Sí' if empresa.importa else 'No')
        if 'certificadopyme' in campos_seleccionados:
            row.append('Sí' if empresa.certificadopyme else 'No')
        
        data.append(row)
    
    # Datos de las empresas de servicio
    for empresa in empresas_servicio:
        row = [
            empresa.razon_social,
            empresa.cuit_cuil,
            'Servicio',
            empresa.departamento.nomdpto if empresa.departamento else '',
            empresa.telefono or '',
            empresa.correo or '',
        ]
        
        if 'exporta' in campos_seleccionados:
            row.append('Sí' if empresa.exporta == 'Sí' else 'No')
        if 'importa' in campos_seleccionados:
            row.append('Sí' if empresa.importa else 'No')
        if 'certificadopyme' in campos_seleccionados:
            row.append('Sí' if empresa.certificadopyme else 'No')
        
        data.append(row)
    
    # Datos de las empresas mixtas
    for empresa in empresas_mixta:
        row = [
            empresa.razon_social,
            empresa.cuit_cuil,
            'Mixta',
            empresa.departamento.nomdpto if empresa.departamento else '',
            empresa.telefono or '',
            empresa.correo or '',
        ]
        
        if 'exporta' in campos_seleccionados:
            row.append('Sí' if empresa.exporta == 'Sí' else 'No')
        if 'importa' in campos_seleccionados:
            row.append('Sí' if empresa.importa else 'No')
        if 'certificadopyme' in campos_seleccionados:
            row.append('Sí' if empresa.certificadopyme else 'No')
        
        data.append(row)
    
    # Si no hay datos, agregar mensaje
    if len(data) == 1:
        data.append(['No hay empresas para mostrar', '', '', '', '', ''])
    
    # Crear tabla con estilos institucionales
    table = Table(data, repeatRows=1)  # Repetir encabezado en cada página
    
    # Estilos de la tabla
    table_style = [
        # Encabezado - Fondo azul principal
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_AZUL_PRINCIPAL),
        ('TEXTCOLOR', (0, 0), (-1, 0), COLOR_BLANCO),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 0), (-1, 0), 12),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('VALIGN', (0, 0), (-1, 0), 'MIDDLE'),
        
        # Filas de datos - Alternar colores
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TEXTCOLOR', (0, 1), (-1, -1), COLOR_NEGRO),
        ('ALIGN', (0, 1), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 1), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [COLOR_BLANCO, COLOR_GRIS_CLARO]),
        ('ROWBACKGROUNDS', (0, 0), (-1, 0), [COLOR_AZUL_PRINCIPAL]),
        
        # Bordes
        ('GRID', (0, 0), (-1, -1), 0.5, COLOR_GRIS_NEUTRO),
        ('LINEBELOW', (0, 0), (-1, 0), 2, COLOR_AZUL_PRINCIPAL),
        
        # Padding de celdas
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
    ]
    
    table.setStyle(TableStyle(table_style))
    
    story.append(table)
    
    # Footer con información institucional
    story.append(Spacer(1, 0.3*inch))
    footer_style = ParagraphStyle(
        'FooterStyle',
        parent=styles['Normal'],
        fontSize=8,
        textColor=COLOR_GRIS_NEUTRO,
        fontName='Helvetica',
        alignment=TA_CENTER,
        spaceBefore=10
    )
    footer_text = Paragraph(
        "Dirección de Intercambio Comercial Internacional y Regional - "
        "San Martín 320, San Fernando del Valle de Catamarca - "
        "Tel: (0383) 4437390",
        footer_style
    )
    story.append(footer_text)
    
    # Construir PDF
    doc.build(story)
    
    # Obtener PDF
    pdf = buffer.getvalue()
    buffer.close()
    
    # Crear respuesta HTTP
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="empresas_aprobadas_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
    response.write(pdf)
    
    return response
