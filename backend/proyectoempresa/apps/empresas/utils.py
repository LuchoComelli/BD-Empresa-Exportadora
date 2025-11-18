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
        spaceAfter=12
    )
    
    # Estilo para el título
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=COLOR_AZUL_PRINCIPAL,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER,
        spaceAfter=20
    )
    
    # Estilo para subtítulos
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=COLOR_GRIS_NEUTRO,
        fontName='Helvetica',
        alignment=TA_CENTER,
        spaceAfter=15
    )
    
    # Header institucional
    header_text = Paragraph(
        "Dirección de Intercambio Comercial Internacional y Regional<br/>"
        "Provincia de Catamarca",
        header_style
    )
    story.append(header_text)
    
    # Línea decorativa (usando tabla como workaround)
    line_data = [['']]
    line_table = Table(line_data, colWidths=[7*inch])
    line_table.setStyle(TableStyle([
        ('LINEBELOW', (0, 0), (-1, -1), 2, COLOR_VERDE_INSTITUCIONAL),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
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
        # Encabezado
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_AZUL_PRINCIPAL),
        ('TEXTCOLOR', (0, 0), (-1, 0), COLOR_BLANCO),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 0), (-1, 0), 12),
        # Filas alternadas
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [COLOR_BLANCO, COLOR_GRIS_CLARO]),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 1, COLOR_GRIS_NEUTRO),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
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


def generate_empresas_aprobadas_pdf(empresas_producto, empresas_servicio, empresas_mixta, campos_seleccionados):
    """
    Generar PDF con empresas aprobadas (producto, servicio, mixta) usando identidad visual institucional
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
        alignment='CENTER',
        spaceAfter=12
    )
    
    # Estilo para el título
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=COLOR_AZUL_PRINCIPAL,
        fontName='Helvetica-Bold',
        alignment='CENTER',
        spaceAfter=20
    )
    
    # Estilo para subtítulos
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=COLOR_GRIS_NEUTRO,
        fontName='Helvetica',
        alignment='CENTER',
        spaceAfter=15
    )
    
    # Header institucional
    header_text = Paragraph(
        "Dirección de Intercambio Comercial Internacional y Regional<br/>"
        "Provincia de Catamarca",
        header_style
    )
    story.append(header_text)
    
    # Línea decorativa (usando tabla como workaround)
    line_data = [['']]
    line_table = Table(line_data, colWidths=[7*inch])
    line_table.setStyle(TableStyle([
        ('LINEBELOW', (0, 0), (-1, -1), 2, COLOR_VERDE_INSTITUCIONAL),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
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
    
    # Combinar todas las empresas
    todas_empresas = []
    for empresa in empresas_producto:
        todas_empresas.append(('Producto', empresa))
    for empresa in empresas_servicio:
        todas_empresas.append(('Servicio', empresa))
    for empresa in empresas_mixta:
        todas_empresas.append(('Mixta', empresa))
    
    # Datos de la tabla
    data = []
    
    # Encabezados
    headers = ['Tipo', 'Razón Social', 'CUIT', 'Departamento', 'Teléfono', 'Email']
    if 'exporta' in campos_seleccionados:
        headers.append('Exporta')
    if 'importa' in campos_seleccionados:
        headers.append('Importa')
    if 'certificadopyme' in campos_seleccionados:
        headers.append('Certificado MiPYME')
    
    data.append(headers)
    
    # Datos de las empresas
    for tipo, empresa in todas_empresas:
        row = [
            tipo,
            empresa.razon_social,
            empresa.cuit_cuil,
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
    
    # Crear tabla con estilos institucionales
    table = Table(data, repeatRows=1)  # Repetir encabezado en cada página
    
    # Estilos de la tabla
    table_style = [
        # Encabezado
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_AZUL_PRINCIPAL),
        ('TEXTCOLOR', (0, 0), (-1, 0), COLOR_BLANCO),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 0), (-1, 0), 12),
        # Filas alternadas
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [COLOR_BLANCO, COLOR_GRIS_CLARO]),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 1, COLOR_GRIS_NEUTRO),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
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
        alignment='CENTER',
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


def calcular_puntajes_matriz(empresa):
    """
    Calcular automáticamente los puntajes de la matriz de clasificación
    basándose en los datos de la empresa.
    
    Criterios según especificación:
    1. Experiencia exportadora: Sí = 3, No = 0
    2. Volumen de producción: Alta = 3, Media = 2, Baja = 1, Desconocida = 0
    3. Presencia digital: Sí = 2, No = 0
    4. Posición arancelaria: Sí = 1, No = 0
    5. Participación en internacionalización: Sí = 2, No = 0
    6. Estructura interna: Alta = 2, Media = 1, No = 0
    7. Interés exportador: Sí = 1, No = 0
    8. Certificaciones nacionales: ≥2 = 2, 1 = 1, Ninguna = 0
    9. Certificaciones internacionales: ≥1 = 2, Ninguna = 0
    
    Retorna un diccionario con puntajes y opciones seleccionadas.
    """
    from .models import Empresa
    
    puntajes = {
        'experiencia_exportadora': 0,
        'volumen_produccion': 0,
        'presencia_digital': 0,
        'posicion_arancelaria': 0,
        'participacion_internacionalizacion': 0,
        'estructura_interna': 0,
        'interes_exportador': 0,
        'certificaciones_nacionales': 0,
        'certificaciones_internacionales': 0,
    }
    
    opciones = {
        'experiencia_exportadora': 'No',
        'volumen_produccion': 'Desconocida',
        'presencia_digital': 'No',
        'posicion_arancelaria': 'No',
        'participacion_internacionalizacion': 'No',
        'estructura_interna': 'No',
        'interes_exportador': 'No',
        'certificaciones_nacionales': 'Ninguna',
        'certificaciones_internacionales': 'Ninguna',
    }
    
    # 1. Experiencia exportadora: Sí = 3, No = 0
    if empresa.exporta == 'Sí':
        puntajes['experiencia_exportadora'] = 3
        opciones['experiencia_exportadora'] = 'Sí'
    else:
        puntajes['experiencia_exportadora'] = 0
        opciones['experiencia_exportadora'] = 'No'
    
    # 2. Volumen de producción: Alta = 3, Media = 2, Baja = 1, Desconocida = 0
    # Basado en capacidadproductiva y tiempocapacidad
    if empresa.capacidadproductiva:
        capacidad = float(empresa.capacidadproductiva)
        periodo = empresa.tiempocapacidad or 'Anual'
        
        # Normalizar a capacidad anual para comparar
        if periodo == 'Mensual':
            capacidad_anual = capacidad * 12
        elif periodo == 'Semanal':
            capacidad_anual = capacidad * 52
        else:  # Anual
            capacidad_anual = capacidad
        
        # Clasificar según capacidad (ajustar umbrales según necesidad)
        if capacidad_anual >= 1000:  # Alta
            puntajes['volumen_produccion'] = 3
            opciones['volumen_produccion'] = 'Alta'
        elif capacidad_anual >= 100:  # Media
            puntajes['volumen_produccion'] = 2
            opciones['volumen_produccion'] = 'Media'
        elif capacidad_anual > 0:  # Baja
            puntajes['volumen_produccion'] = 1
            opciones['volumen_produccion'] = 'Baja'
        else:
            puntajes['volumen_produccion'] = 0
            opciones['volumen_produccion'] = 'Desconocida'
    else:
        puntajes['volumen_produccion'] = 0
        opciones['volumen_produccion'] = 'Desconocida'
    
    # 3. Presencia digital: Sí = 2, No = 0
    # Tiene sitio web o redes sociales
    if empresa.sitioweb or empresa.redes_sociales:
        puntajes['presencia_digital'] = 2
        opciones['presencia_digital'] = 'Sí'
    else:
        puntajes['presencia_digital'] = 0
        opciones['presencia_digital'] = 'No'
    
    # 4. Posición arancelaria: Sí = 1, No = 0
    # Verificar si tiene productos con posición arancelaria
    tiene_posicion = False
    tipo_empresa = empresa.tipo_empresa_valor
    
    if tipo_empresa == 'producto':
        # Para empresas de producto, usar productos_empresa
        tiene_posicion = empresa.productos_empresa.filter(
            posicion_arancelaria__isnull=False
        ).exists()
    elif tipo_empresa == 'mixta':
        # Para empresas mixtas, usar productos_mixta
        tiene_posicion = empresa.productos_mixta.filter(
            posiciones_arancelarias__isnull=False
        ).exists()
    # Para empresas de servicio no aplica posición arancelaria
    
    if tiene_posicion:
        puntajes['posicion_arancelaria'] = 1
        opciones['posicion_arancelaria'] = 'Sí'
    else:
        puntajes['posicion_arancelaria'] = 0
        opciones['posicion_arancelaria'] = 'No'
    
    # 5. Participación en internacionalización: Sí = 2, No = 0
    # Participó en ferias nacionales o internacionales
    if empresa.participoferianacional or empresa.participoferiainternacional:
        puntajes['participacion_internacionalizacion'] = 2
        opciones['participacion_internacionalizacion'] = 'Sí'
    else:
        puntajes['participacion_internacionalizacion'] = 0
        opciones['participacion_internacionalizacion'] = 'No'
    
    # 6. Estructura interna: Alta = 2, Media = 1, No = 0
    # Basado en si tiene material en múltiples idiomas (indica estructura)
    # O si tiene contacto secundario (indica organización)
    if empresa.promo2idiomas and empresa.contacto_secundario_nombre:
        puntajes['estructura_interna'] = 2  # Alta
        opciones['estructura_interna'] = 'Alta'
    elif empresa.promo2idiomas or empresa.contacto_secundario_nombre:
        puntajes['estructura_interna'] = 1  # Media
        opciones['estructura_interna'] = 'Media'
    else:
        puntajes['estructura_interna'] = 0  # No
        opciones['estructura_interna'] = 'No'
    
    # 7. Interés exportador: Sí = 1, No = 0
    if empresa.interes_exportar:
        puntajes['interes_exportador'] = 1
        opciones['interes_exportador'] = 'Sí'
    else:
        puntajes['interes_exportador'] = 0
        opciones['interes_exportador'] = 'No'
    
    # 8. Certificaciones nacionales: ≥2 = 2, 1 = 1, Ninguna = 0
    # Contar certificadopyme y otras certificaciones nacionales
    certificaciones_nacionales_count = 0
    if empresa.certificadopyme:
        certificaciones_nacionales_count += 1
    
    # Si tiene certificaciones en el campo certificaciones, contar
    if empresa.certificaciones:
        # Contar certificaciones separadas por comas (aproximación)
        certs = [c.strip() for c in empresa.certificaciones.split(',') if c.strip()]
        # Filtrar certificaciones nacionales comunes
        certs_nacionales = ['SENASA', 'INV', 'RPE', 'RNPA', 'INAL', 'INTI', 'INTA']
        for cert in certs:
            if any(nacional in cert.upper() for nacional in certs_nacionales):
                certificaciones_nacionales_count += 1
    
    if certificaciones_nacionales_count >= 2:
        puntajes['certificaciones_nacionales'] = 2
        opciones['certificaciones_nacionales'] = '≥2'
    elif certificaciones_nacionales_count == 1:
        puntajes['certificaciones_nacionales'] = 1
        opciones['certificaciones_nacionales'] = '1'
    else:
        puntajes['certificaciones_nacionales'] = 0
        opciones['certificaciones_nacionales'] = 'Ninguna'
    
    # 9. Certificaciones internacionales: ≥1 = 2, Ninguna = 0
    if empresa.certificacionesbool:
        # Verificar si tiene certificaciones internacionales específicas
        tiene_cert_internacional = False
        if empresa.certificaciones:
            certs = [c.strip() for c in empresa.certificaciones.split(',') if c.strip()]
            certs_internacionales = ['ISO', 'HACCP', 'ORGÁNICO', 'ORGANIC', 'KOSHER', 'HALAL', 'FAIR TRADE', 'BRC', 'IFS']
            for cert in certs:
                if any(internacional in cert.upper() for internacional in certs_internacionales):
                    tiene_cert_internacional = True
                    break
        
        if tiene_cert_internacional or empresa.certificacionesbool:
            puntajes['certificaciones_internacionales'] = 2
            opciones['certificaciones_internacionales'] = '≥1'
        else:
            puntajes['certificaciones_internacionales'] = 0
            opciones['certificaciones_internacionales'] = 'Ninguna'
    else:
        puntajes['certificaciones_internacionales'] = 0
        opciones['certificaciones_internacionales'] = 'Ninguna'
    
    return {
        'puntajes': puntajes,
        'opciones': opciones,
    }
