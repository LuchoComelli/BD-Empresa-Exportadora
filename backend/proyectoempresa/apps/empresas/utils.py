from django.http import HttpResponse
from reportlab.lib.pagesizes import letter, A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch, cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime
from io import BytesIO
import os
from django.conf import settings

def extraer_actividades_promocion(empresa):
    """
    Extraer ferias, rondas y misiones del campo actividades_promocion_internacional
    Retorna un diccionario con las tres categorías
    """
    actividades = {
        'ferias': [],
        'rondas': [],
        'misiones': []
    }
    
    # Obtener el campo JSON
    promo_data = empresa.actividades_promocion_internacional
    
    if not promo_data:
        return actividades
    
    # Si es un diccionario, extraer las actividades
    if isinstance(promo_data, dict):
        # Ferias
        ferias = promo_data.get('ferias', [])
        if isinstance(ferias, list):
            actividades['ferias'] = [f.get('nombre', '') for f in ferias if isinstance(f, dict) and f.get('nombre')]
        
        # Rondas
        rondas = promo_data.get('rondas', [])
        if isinstance(rondas, list):
            actividades['rondas'] = [r.get('nombre', '') for r in rondas if isinstance(r, dict) and r.get('nombre')]
        
        # Misiones
        misiones = promo_data.get('misiones', [])
        if isinstance(misiones, list):
            actividades['misiones'] = [m.get('nombre', '') for m in misiones if isinstance(m, dict) and m.get('nombre')]
    
    return actividades

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

def normalize_text(text):
    """
    Normaliza texto a formato Title Case (solo iniciales en mayúscula)
    """
    if not text or text == '-':
        return '-'
    
    # Palabras que deben permanecer en minúsculas
    lowercase_words = ['de', 'del', 'la', 'el', 'los', 'las', 'y', 'e', 'o', 'u']
    
    # Siglas que deben permanecer en mayúsculas
    siglas = ['SA', 'SRL', 'SH', 'CUIT', 'CUIL', 'CEO', 'CFO', 'CTO']
    
    words = text.lower().split()
    normalized_words = []
    
    for i, word in enumerate(words):
        if word.upper() in siglas:
            normalized_words.append(word.upper())
        elif i == 0:
            normalized_words.append(word.capitalize())
        elif word in lowercase_words:
            normalized_words.append(word)
        else:
            normalized_words.append(word.capitalize())
    
    return ' '.join(normalized_words)

def format_geolocalizacion_as_link(geolocalizacion_value):
    """
    Convierte coordenadas de geolocalización en un enlace clickeable de Google Maps
    """
    if not geolocalizacion_value or geolocalizacion_value == '-':
        return '-'
    
    # Intentar parsear las coordenadas
    try:
        # Si es un string, intentar parsearlo
        if isinstance(geolocalizacion_value, str):
            # Formato esperado: "lat, lng" o "lat,lng"
            parts = geolocalizacion_value.replace(' ', '').split(',')
            if len(parts) == 2:
                lat = float(parts[0])
                lng = float(parts[1])
            else:
                return str(geolocalizacion_value)
        elif isinstance(geolocalizacion_value, (dict, list)):
            # Si es un diccionario o lista, extraer lat y lng
            if isinstance(geolocalizacion_value, dict):
                lat = float(geolocalizacion_value.get('lat', geolocalizacion_value.get('latitude', 0)))
                lng = float(geolocalizacion_value.get('lng', geolocalizacion_value.get('longitude', 0)))
            else:
                if len(geolocalizacion_value) >= 2:
                    lat = float(geolocalizacion_value[0])
                    lng = float(geolocalizacion_value[1])
                else:
                    return str(geolocalizacion_value)
        else:
            return str(geolocalizacion_value)
        
        # Crear el enlace de Google Maps
        google_maps_url = f"https://www.google.com/maps?q={lat},{lng}"
        # Crear un Paragraph con enlace clickeable
        # En ReportLab, usamos el tag <link> dentro del texto HTML
        link_text = f'<link href="{google_maps_url}" color="blue"><u>{lat}, {lng}</u></link>'
        return link_text
    except (ValueError, TypeError, AttributeError, IndexError):
        # Si no se puede parsear, devolver el valor original
        return str(geolocalizacion_value)

def generate_empresas_pdf(empresas, campos_seleccionados, tipo_empresa):
    """
    Generar PDF con empresas filtradas usando la identidad visual institucional
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=landscape(A4),
        rightMargin=1*cm,
        leftMargin=1*cm,
        topMargin=1.5*cm,
        bottomMargin=1*cm
    )
    story = []
    
    # Estilos personalizados
    styles = getSampleStyleSheet()
    
   # Estilo para título
    title_style = ParagraphStyle(
    'TitleStyle',
    parent=styles['Heading1'],
    fontSize=10,  # Mismo tamaño
    textColor=colors.HexColor('#222A59'),
    spaceAfter=12,
    alignment=TA_CENTER,
    fontName='Helvetica-Bold'
)

# Estilo para subtítulos
    subtitle_style = ParagraphStyle(
    'SubtitleStyle',
    parent=styles['Normal'],
    fontSize=10,  # Mismo tamaño
    textColor=colors.HexColor('#6B7280'),
    spaceAfter=12,
    alignment=TA_CENTER,
    fontName='Helvetica'
)

# Estilo para encabezado
    header_style = ParagraphStyle(
    'HeaderStyle',
    parent=styles['Normal'],
    fontSize=10,  # Mismo tamaño
    textColor=colors.HexColor('#222A59'),
    alignment=TA_CENTER,
    fontName='Helvetica-Bold',
    spaceAfter=6
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
    line_table = Table(line_data, colWidths=[27*cm])
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
    headers = [
    'Razón Social', 'Nombre Fantasía', 'CUIT', 'Tipo Sociedad',
    'Dirección', 'Departamento', 
    'Teléfono', 'Email', 'Sitio Web',
    'Contacto Principal', 'Cargo',
    'Rubro', 'Tipo Empresa'
]
    if 'exporta' in campos_seleccionados or True:  # Mostrar siempre
        headers.extend(['Exporta', 'Destino Export.', 'Tipo Export.'])
    if 'importa' in campos_seleccionados or True:  # Mostrar siempre
        headers.extend(['Importa', 'Frecuencia Import.'])
    if 'certificadopyme' in campos_seleccionados or True:  # Mostrar siempre
        headers.extend(['Certif. MiPYME', 'Certif. Internac.', 'Detalle Certif.'])

        headers.extend([
            'Capacidad Prod.', 'Material 2+ Idiomas', 'Idiomas',
            'Ferias Nac.', 'Ferias Intern.', 'Categoría Matriz'
])
    
    data.append(headers)
    
    # Datos de las empresas
    # Datos de las empresas
    for empresa in empresas:
        # Obtener la matriz de clasificación si existe
        try:
            matriz = empresa.clasificaciones_exportador.first()
        except:
            matriz = None
    
        row = [
            # Datos básicos
            Paragraph(empresa.razon_social or '', styles['Normal']),
            Paragraph(empresa.nombre_fantasia or '', styles['Normal']),
            empresa.cuit_cuil or '',
            empresa.tipo_sociedad or '',
            Paragraph(empresa.direccion or '', styles['Normal']),
            empresa.departamento.nombre if empresa.departamento else '',
            empresa.telefono or '',
            empresa.correo or '',
            Paragraph(empresa.sitioweb or '', styles['Normal']),
            
            # Contacto principal
            Paragraph(empresa.contacto_principal_nombre or '', styles['Normal']),
            empresa.contacto_principal_cargo or '',
            empresa.contacto_principal_email or '',
            
            # Rubro y tipo
            empresa.id_rubro.nombre if empresa.id_rubro else '',
            empresa.tipo_empresa.nombre if empresa.tipo_empresa else '',
        ]
        
        # Exportación (IMPORTANTE: Debe estar INDENTADO dentro del for)
        if 'exporta' in campos_seleccionados or True:
            row.extend([
                empresa.exporta or 'No',
                Paragraph(empresa.destinoexporta or '', styles['Normal']),
                empresa.tipoexporta or '',
            ])
        
        # Importación (IMPORTANTE: Debe estar INDENTADO dentro del for)
        if 'importa' in campos_seleccionados or True:
            row.extend([
                'Sí' if empresa.importa else 'No',
                empresa.frecuenciaimporta or '',
            ])
        
        # Certificaciones (IMPORTANTE: Debe estar INDENTADO dentro del for)
        if 'certificadopyme' in campos_seleccionados or True:
            row.extend([
                'Sí' if empresa.certificadopyme else 'No',
                'Sí' if empresa.certificacionesbool else 'No',
                Paragraph(empresa.certificaciones or '', styles['Normal']),
            ])
        
        # Capacidad, idiomas, ferias (IMPORTANTE: Debe estar INDENTADO dentro del for)
        capacidad_str = f"{empresa.capacidadproductiva} {empresa.tiempocapacidad}" if empresa.capacidadproductiva else ''
        row.extend([
            capacidad_str,
            'Sí' if empresa.promo2idiomas else 'No',
            Paragraph(empresa.idiomas_trabaja or '', styles['Normal']),
            'Sí' if empresa.participoferianacional else 'No',
            'Sí' if empresa.participoferiainternacional else 'No',
            matriz.get_categoria_display() if matriz else '',
            str(matriz.puntaje_total) if matriz else '',
        ])
        
        data.append(row)  # ← Esta línea DEBE estar dentro del for

        # Calcular anchos de columna según campos seleccionados
    num_columnas = len(headers)
    ancho_disponible = 27*cm  # Ancho disponible en landscape A4
    
    # Distribuir anchos inteligentemente
    if num_columnas >= 25:  # Ahora tenemos ~30 columnas
        col_widths = [
        # Básicos
        3*cm,  # Razón Social
        2*cm,  # Nombre Fantasía
        2*cm,  # CUIT
        1.5*cm,  # Tipo Sociedad
        2.5*cm,  # Dirección
        1.8*cm,  # Departamento
        1.5*cm,  # Teléfono
        2*cm,  # Email
        2*cm,  # Sitio Web
        # Contacto
        2*cm,  # Contacto Principal
        1.5*cm,  # Cargo
        # Rubro
        1.8*cm,  # Rubro
        1.5*cm,  # Tipo Empresa
        # Exportación
        1.5*cm,  # Exporta
        2*cm,  # Destino
        # Importación
        1.2*cm,  # Importa
        1.5*cm,  # Frecuencia
        # Certificaciones
        1.2*cm,  # Certif MiPYME
        1.2*cm,  # Certif Internac
        2*cm,  # Detalle Certif
        # Otros
        1.8*cm,  # Capacidad
        1.2*cm,  # Material 2+ idiomas
        1.5*cm,  # Idiomas
        1*cm,  # Ferias Nac
        1*cm,  # Ferias Intern
        1.5*cm,  # Categoría
    ]
    # Ajustar si no suma exactamente 27cm
    total_ancho = sum(col_widths)
    if total_ancho != ancho_disponible:
        factor = ancho_disponible / total_ancho
        col_widths = [w * factor for w in col_widths]
    else:
        # Fallback: distribuir equitativamente
        col_widths = [ancho_disponible/num_columnas] * num_columnas
    
    # Crear tabla con estilos institucionales
    table = Table(data, colWidths=col_widths, repeatRows=1)
    
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
        ('FONTSIZE', (0, 1), (-1, -1), 10),
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


def generate_empresas_aprobadas_pdf(empresas_producto, empresas_servicio, empresas_mixta, campos_seleccionados=None):
    """
    Genera un PDF con todas las empresas aprobadas, optimizado para orientación landscape
    """
    from django.http import HttpResponse
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
    from reportlab.lib.enums import TA_CENTER, TA_LEFT
    from io import BytesIO
    from datetime import datetime
    
    # Buffer para el PDF
    buffer = BytesIO()
    
    # CAMBIO CRÍTICO: Usar orientación LANDSCAPE (horizontal) para más espacio
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),  # Orientación horizontal
        rightMargin=1*cm,
        leftMargin=1*cm,
        topMargin=1.5*cm,
        bottomMargin=1.5*cm,
        title='Reporte de Empresas Aprobadas'
    )
    
    # Estilos
    styles = getSampleStyleSheet()
    
    # Estilo para título
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#222A59'),
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    # Estilo para subtítulos
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#6B7280'),
        spaceAfter=12,
        alignment=TA_CENTER
    )
    
    # Estilo para encabezado
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Normal'],
        fontSize=14,
        textColor=colors.HexColor('#222A59'),
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        spaceAfter=6
    )
    
    # Estilo para footer
    footer_style = ParagraphStyle(
        'FooterStyle',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#6B7280'),
        alignment=TA_CENTER
    )
    
    # Story
    story = []
    
    # Encabezado institucional
    header_text = Paragraph(
        "Dirección de Intercambio Comercial Internacional y Regional<br/>Provincia de Catamarca",
        header_style
    )
    story.append(header_text)
    story.append(Spacer(1, 0.3*cm))
    
    # Título
    title = Paragraph("Reporte de Empresas Aprobadas", title_style)
    story.append(title)
    
    # Fecha de generación
    fecha = datetime.now().strftime('%d/%m/%Y %H:%M')
    fecha_text = Paragraph(f"Generado el: {fecha}", subtitle_style)
    story.append(fecha_text)
    story.append(Spacer(1, 0.5*cm))
    
    # SECCIÓN 1: INFORMACIÓN BÁSICA
    story.append(Paragraph("Información Básica de Empresas", title_style))
    story.append(Spacer(1, 0.3*cm))
    
    headers_basico = [
        'Tipo',
        'Razón Social',
        'Nombre Fantasía',
        'CUIT',
        'Tipo Sociedad',
        'Dirección',
        'Departamento',
    ]
    
    # Combinar todas las empresas
    todas_empresas = []
    for empresa in empresas_producto:
        todas_empresas.append(('Producto', empresa))
    for empresa in empresas_servicio:
        todas_empresas.append(('Servicio', empresa))
    for empresa in empresas_mixta:
        todas_empresas.append(('Mixta', empresa))
    
    todas_empresas.sort(key=lambda x: (x[0], x[1].razon_social))
    
    # Tabla 1: Datos Básicos
    data_basico = [headers_basico]
    for tipo, empresa in todas_empresas:
        row = [
            tipo,
            Paragraph(normalize_text(empresa.razon_social), styles['Normal']),
            Paragraph(normalize_text(empresa.nombre_fantasia), styles['Normal']),
            empresa.cuit_cuil or '-',
            empresa.tipo_sociedad if empresa.tipo_sociedad else '-',
            Paragraph(normalize_text(empresa.direccion), styles['Normal']),
            normalize_text(empresa.departamento.nombre) if empresa.departamento else '-',
        ]
        data_basico.append(row)
    
    ancho_disponible = landscape(A4)[0] - 2*cm
    col_widths_basico = [
        ancho_disponible * 0.07,  # Tipo
        ancho_disponible * 0.18,  # Razón Social
        ancho_disponible * 0.15,  # Nombre Fantasía
        ancho_disponible * 0.10,  # CUIT
        ancho_disponible * 0.10,  # Tipo Sociedad
        ancho_disponible * 0.15,  # Dirección
        ancho_disponible * 0.10,  # Departamento
    ]
    
    table_basico = Table(data_basico, colWidths=col_widths_basico, repeatRows=1)
    table_basico.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#222A59')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F3F4F6')]),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#6B7280')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(table_basico)
    
    # NUEVA PÁGINA - SECCIÓN 2: CONTACTO
    story.append(PageBreak())
    story.append(Paragraph("Información de Contacto", title_style))
    story.append(Spacer(1, 0.3*cm))
    
    headers_contacto = [
        'Razón Social',
        'Teléfono',
        'Email',
        'Sitio Web',
        'Contacto Principal',
        'Cargo'
    ]
    
    data_contacto = [headers_contacto]
    for tipo, empresa in todas_empresas:
        row = [
            Paragraph(normalize_text(empresa.razon_social), styles['Normal']),
            empresa.telefono or '-',
            Paragraph((empresa.correo or '-').lower(), styles['Normal']),  # emails en minúscula
            Paragraph((empresa.sitioweb or '-').lower(), styles['Normal']),  # URLs en minúscula
            Paragraph(normalize_text(empresa.contacto_principal_nombre), styles['Normal']),
            normalize_text(empresa.contacto_principal_cargo) if empresa.contacto_principal_cargo else '-',
            ]
        data_contacto.append(row)
    
    col_widths_contacto = [
        ancho_disponible * 0.20,  # Razón Social
        ancho_disponible * 0.10,  # Teléfono
        ancho_disponible * 0.15,  # Email
        ancho_disponible * 0.15,  # Sitio Web
        ancho_disponible * 0.15,  # Contacto
        ancho_disponible * 0.10,  # Cargo
    ]
    
    table_contacto = Table(data_contacto, colWidths=col_widths_contacto, repeatRows=1)
    table_contacto.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#222A59')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F3F4F6')]),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#6B7280')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(table_contacto)
    
    # NUEVA PÁGINA - SECCIÓN 3: COMERCIAL
    story.append(PageBreak())
    story.append(Paragraph("Información Comercial y Clasificación", title_style))
    story.append(Spacer(1, 0.3*cm))
    
    headers_comercial = [
    'Razón Social',
    'Rubro',
    'Tipo Empresa',
    'Exporta',
    'Destino Export.',
    'Importa',
    'Certif. MiPYME',
    'Categoría',
]
    
    data_comercial = [headers_comercial]
    for tipo, empresa in todas_empresas:
        try:
            matriz = empresa.clasificaciones_exportador.first()
            categoria = matriz.get_categoria_display() if matriz else 'N/A'
        except:
            categoria = 'N/A'
        
        row = [
    Paragraph(normalize_text(empresa.razon_social), styles['Normal']),
    Paragraph(normalize_text(empresa.id_rubro.nombre) if empresa.id_rubro else '-', styles['Normal']),
    normalize_text(empresa.tipo_empresa.nombre) if empresa.tipo_empresa else '-',
    'Sí' if empresa.exporta == 'Sí' else 'No',
    Paragraph(normalize_text(empresa.destinoexporta) if empresa.destinoexporta else '-', styles['Normal']),
    'Sí' if empresa.importa else 'No',
    'Sí' if empresa.certificadopyme else 'No',
    categoria,
]
        data_comercial.append(row)
    
    col_widths_comercial = [
    ancho_disponible * 0.20,  # Razón Social
    ancho_disponible * 0.15,  # Rubro
    ancho_disponible * 0.08,  # Tipo Empresa
    ancho_disponible * 0.06,  # Exporta
    ancho_disponible * 0.15,  # Destino
    ancho_disponible * 0.06,  # Importa
    ancho_disponible * 0.06,  # Certif
    ancho_disponible * 0.10,  # Categoría
]
    
    table_comercial = Table(data_comercial, colWidths=col_widths_comercial, repeatRows=1)
    table_comercial.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#222A59')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F3F4F6')]),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#6B7280')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(table_comercial)
    
    # Footer
    story.append(Spacer(1, 0.3*cm))
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
    response['Content-Disposition'] = f'attachment; filename="empresas_aprobadas_{datetime.now().strftime("%Y%m%d_%H%M")}.pdf"'
    response.write(pdf)
    
    return response


def generate_empresas_seleccionadas_pdf(empresas_ids, campos_seleccionados):
    """
    Genera un PDF con empresas específicas y campos seleccionados, manteniendo la estética institucional
    y organizando los campos en secciones
    """
    from apps.empresas.models import Empresa
    from django.http import HttpResponse
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
    from reportlab.lib.enums import TA_CENTER, TA_LEFT
    from io import BytesIO
    from datetime import datetime
    
    # Obtener las empresas por sus IDs
    empresas = Empresa.objects.filter(id__in=empresas_ids).select_related(
        'tipo_empresa', 'id_rubro', 'departamento', 'municipio', 'localidad', 'id_usuario'
    ).prefetch_related('productos_empresa', 'servicios_empresa', 'productos_mixta', 'servicios_mixta', 'clasificaciones_exportador')
    
    if not empresas.exists():
        raise ValueError("No se encontraron empresas con los IDs proporcionados")
    
    # Separar empresas por tipo
    empresas_producto = empresas.filter(tipo_empresa_valor='producto')
    empresas_servicio = empresas.filter(tipo_empresa_valor='servicio')
    empresas_mixta = empresas.filter(tipo_empresa_valor='mixta')
    
    # Combinar todas las empresas
    todas_empresas = []
    for empresa in empresas_producto:
        todas_empresas.append(('Producto', empresa))
    for empresa in empresas_servicio:
        todas_empresas.append(('Servicio', empresa))
    for empresa in empresas_mixta:
        todas_empresas.append(('Mixta', empresa))
    
    todas_empresas.sort(key=lambda x: (x[0], x[1].razon_social))
    
    # Mapeo de campos del frontend a campos de la base de datos y secciones
    campos_map = {
        # Información Básica
        'razon_social': {'field': 'razon_social', 'section': 'basica', 'label': 'Razón Social'},
        'nombre_fantasia': {'field': 'nombre_fantasia', 'section': 'basica', 'label': 'Nombre de Fantasía'},
        'cuit_cuil': {'field': 'cuit_cuil', 'section': 'basica', 'label': 'CUIT/CUIL'},
        'tipo_sociedad': {'field': 'tipo_sociedad', 'section': 'basica', 'label': 'Tipo de Sociedad'},
        'tipo_empresa': {'field': 'tipo_empresa', 'section': 'basica', 'label': 'Tipo de Empresa'},
        'fecha_creacion': {'field': 'fecha_creacion', 'section': 'basica', 'label': 'Fecha de Registro'},
        
        # Rubro y Categorización
        'rubro_principal': {'field': 'rubro_nombre', 'section': 'basica', 'label': 'Rubro Principal'},
        'categoria_matriz': {'field': 'categoria_matriz', 'section': 'basica', 'label': 'Categoría Matriz'},
        
        # Ubicación
        'departamento': {'field': 'departamento_nombre', 'section': 'basica', 'label': 'Departamento'},
        'municipio': {'field': 'municipio_nombre', 'section': 'basica', 'label': 'Municipio'},
        'localidad': {'field': 'localidad_nombre', 'section': 'basica', 'label': 'Localidad'},
        'direccion': {'field': 'direccion', 'section': 'basica', 'label': 'Dirección'},
        'codigo_postal': {'field': 'codigo_postal', 'section': 'basica', 'label': 'Código Postal'},
        'provincia': {'field': 'provincia', 'section': 'basica', 'label': 'Provincia'},
        'geolocalizacion': {'field': 'geolocalizacion', 'section': 'basica', 'label': 'Geolocalización'},
        
        # Contacto
        'telefono': {'field': 'telefono', 'section': 'contacto', 'label': 'Teléfono'},
        'correo': {'field': 'correo', 'section': 'contacto', 'label': 'Email'},
        'sitioweb': {'field': 'sitioweb', 'section': 'contacto', 'label': 'Sitio Web'},
        'email_secundario': {'field': 'email_secundario', 'section': 'contacto', 'label': 'Email Secundario'},
        'email_terciario': {'field': 'email_terciario', 'section': 'contacto', 'label': 'Email Terciario'},
        
        # Contacto Principal
        'contacto_principal_nombre': {'field': 'contacto_principal_nombre', 'section': 'contacto', 'label': 'Contacto Principal - Nombre'},
        'contacto_principal_cargo': {'field': 'contacto_principal_cargo', 'section': 'contacto', 'label': 'Contacto Principal - Cargo'},
        'contacto_principal_telefono': {'field': 'contacto_principal_telefono', 'section': 'contacto', 'label': 'Contacto Principal - Teléfono'},
        'contacto_principal_email': {'field': 'contacto_principal_email', 'section': 'contacto', 'label': 'Contacto Principal - Email'},
        
        # Contacto Secundario
        'contacto_secundario_nombre': {'field': 'contacto_secundario_nombre', 'section': 'contacto', 'label': 'Contacto Secundario - Nombre'},
        'contacto_secundario_cargo': {'field': 'contacto_secundario_cargo', 'section': 'contacto', 'label': 'Contacto Secundario - Cargo'},
        'contacto_secundario_telefono': {'field': 'contacto_secundario_telefono', 'section': 'contacto', 'label': 'Contacto Secundario - Teléfono'},
        'contacto_secundario_email': {'field': 'contacto_secundario_email', 'section': 'contacto', 'label': 'Contacto Secundario - Email'},
        
        # Actividad Comercial
        'exporta': {'field': 'exporta', 'section': 'comercial', 'label': '¿Exporta?'},
        'destinoexporta': {'field': 'destinoexporta', 'section': 'comercial', 'label': 'Destino de Exportación'},
        'importa': {'field': 'importa', 'section': 'comercial', 'label': '¿Importa?'},
        'interes_exportar': {'field': 'interes_exportar', 'section': 'comercial', 'label': 'Interés en Exportar'},
        
        # Certificaciones
        'certificadopyme': {'field': 'certificadopyme', 'section': 'comercial', 'label': 'Certificado MiPYME'},
        'certificaciones': {'field': 'certificaciones', 'section': 'comercial', 'label': 'Certificaciones'},
        
        # Promoción
        'promo2idiomas': {'field': 'promo2idiomas', 'section': 'comercial', 'label': 'Material en Múltiples Idiomas'},
        'idiomas_trabaja': {'field': 'idiomas_trabaja', 'section': 'comercial', 'label': 'Idiomas de Trabajo'},
        
        
        'ferias': {'field': 'ferias', 'section': 'comercial', 'label': 'Ferias'},
        'rondas': {'field': 'rondas', 'section': 'comercial', 'label': 'Rondas'},
        'misiones': {'field': 'misiones', 'section': 'comercial', 'label': 'Misiones'},
        
        # Otros
        'observaciones': {'field': 'observaciones', 'section': 'comercial', 'label': 'Observaciones'},
    }
    
    # Expandir campos disponibles basándose en los campos seleccionados
    # Si viene un campo que no está en el mapeo, intentar obtenerlo directamente
    campos_expandidos = []
    for campo_id in campos_seleccionados:
        if campo_id in campos_map:
            campos_expandidos.append(campos_map[campo_id])
        else:
            # Intentar inferir la sección basándose en el nombre del campo
            section = 'basica'
            if campo_id in ['correo', 'telefono', 'sitioweb', 'contacto_principal_nombre', 'contacto_principal_email']:
                section = 'contacto'
            elif campo_id in ['exporta', 'importa', 'destinoexporta', 'certificadopyme', 'certificaciones']:
                section = 'comercial'
            
            campos_expandidos.append({
                'field': campo_id,
                'section': section,
                'label': campo_id.replace('_', ' ').title()
            })
    
    # Reorganizar campos por sección
    secciones = {
        'basica': [],
        'contacto': [],
        'comercial': []
    }
    
    for campo_info in campos_expandidos:
        secciones[campo_info['section']].append(campo_info)
    
    # Función helper para obtener el valor de un campo
    def get_field_value(empresa, field_name):
        """Obtiene el valor de un campo de la empresa, manejando relaciones"""
        # ✅ MANEJAR FERIAS, RONDAS Y MISIONES
        if field_name in ['ferias', 'rondas', 'misiones']:
            actividades = extraer_actividades_promocion(empresa)
            items = actividades.get(field_name, [])
            if items:
                return ', '.join(items)
            return '-'
        # Campos que requieren acceso a relaciones
        if field_name == 'rubro_nombre':
            if empresa.id_rubro:
                return empresa.id_rubro.nombre if hasattr(empresa.id_rubro, 'nombre') else str(empresa.id_rubro)
            return '-'
        elif field_name == 'departamento_nombre':
            if empresa.departamento:
                return empresa.departamento.nombre if hasattr(empresa.departamento, 'nombre') else str(empresa.departamento)
            return '-'
        elif field_name == 'municipio_nombre':
            if empresa.municipio:
                return empresa.municipio.nombre if hasattr(empresa.municipio, 'nombre') else str(empresa.municipio)
            return '-'
        elif field_name == 'localidad_nombre':
            if empresa.localidad:
                return empresa.localidad.nombre if hasattr(empresa.localidad, 'nombre') else str(empresa.localidad)
            return '-'
        elif field_name == 'tipo_empresa':
            if empresa.tipo_empresa:
                return empresa.tipo_empresa.nombre if hasattr(empresa.tipo_empresa, 'nombre') else str(empresa.tipo_empresa)
            elif empresa.tipo_empresa_valor:
                return empresa.tipo_empresa_valor
            return '-'
        elif field_name == 'provincia':
            # La provincia generalmente viene del departamento
            if empresa.departamento and hasattr(empresa.departamento, 'provincia'):
                return empresa.departamento.provincia.nombre if hasattr(empresa.departamento.provincia, 'nombre') else 'Catamarca'
            return 'Catamarca'  # Valor por defecto
        elif field_name == 'categoria_matriz':
            try:
                matriz = empresa.clasificaciones_exportador.first()
                if matriz:
                    return matriz.get_categoria_display() if hasattr(matriz, 'get_categoria_display') else str(matriz.categoria) if hasattr(matriz, 'categoria') else 'N/A'
            except:
                pass
            return 'N/A'
        # Campos directos del modelo
        elif hasattr(empresa, field_name):
            value = getattr(empresa, field_name)
            # Formatear fechas
            if hasattr(value, 'strftime'):
                return value.strftime('%d/%m/%Y')
            # Formatear booleanos
            if isinstance(value, bool):
                return 'Sí' if value else 'No'
            # Formatear Decimal
            if hasattr(value, '__class__') and 'Decimal' in str(value.__class__):
                return str(value)
            return value
        return '-'
    
    
    # Buffer para el PDF
    buffer = BytesIO()
    
    # Obtener rutas de las imágenes - buscar en múltiples ubicaciones
    possible_paths = [
        os.path.join(settings.BASE_DIR, 'static', 'images'),
        os.path.join(settings.BASE_DIR.parent.parent, 'backend', 'proyectoempresa', 'static', 'images'),
        os.path.join(settings.BASE_DIR.parent.parent),  # Raíz del proyecto
    ]
    
    header_footer_path = None
    watermark_path = None
    
    for path_base in possible_paths:
        hf_path = os.path.join(path_base, 'header_y_footer.png')
        wm_path = os.path.join(path_base, 'marca_de_agua.png')
        
        if header_footer_path is None and os.path.exists(hf_path):
            header_footer_path = hf_path
        if watermark_path is None and os.path.exists(wm_path):
            watermark_path = wm_path
        
        if header_footer_path and watermark_path:
            break
    
    # Verificar que las imágenes existan
    header_footer_exists = header_footer_path and os.path.exists(header_footer_path)
    watermark_exists = watermark_path and os.path.exists(watermark_path)
    
    # Función para agregar marca de agua (se usa en todas las páginas)
    def add_watermark(canvas):
        """Agrega marca de agua en el centro de la página"""
        if not watermark_exists:
            return
        
        try:
            page_width, page_height = landscape(A4)
            # Calcular posición centrada
            watermark_width = 15 * cm
            watermark_height = 15 * cm
            x = (page_width - watermark_width) / 2
            y = (page_height - watermark_height) / 2
            
            # Agregar imagen con opacidad (marca de agua)
            # Usar PIL para ajustar la opacidad si está disponible
            try:
                from PIL import Image as PILImage
                from PIL import ImageEnhance
                
                # Cargar imagen y ajustar opacidad
                img = PILImage.open(watermark_path)
                # Convertir a RGBA si no lo es
                if img.mode != 'RGBA':
                    img = img.convert('RGBA')
                
                # Crear una nueva imagen con opacidad reducida
                alpha = img.split()[3] if len(img.split()) == 4 else None
                if alpha:
                    # Reducir opacidad al 15%
                    alpha = alpha.point(lambda p: int(p * 0.15))
                    img.putalpha(alpha)
                
                # Guardar temporalmente
                import tempfile
                temp_path = os.path.join(tempfile.gettempdir(), f'watermark_temp_{os.getpid()}.png')
                img.save(temp_path, 'PNG')
                
                canvas.drawImage(
                    temp_path,
                    x, y,
                    width=watermark_width,
                    height=watermark_height,
                    preserveAspectRatio=True,
                    mask='auto'
                )
                
                # Limpiar archivo temporal
                try:
                    os.remove(temp_path)
                except:
                    pass
            except ImportError:
                # Si PIL no está disponible, usar método alternativo
                canvas.saveState()
                # Dibujar rectángulo semitransparente primero
                canvas.setFillColor(colors.white)
                canvas.setFillAlpha(0.85)
                canvas.rect(x, y, watermark_width, watermark_height, fill=1, stroke=0)
                canvas.restoreState()
                
                # Dibujar imagen encima (con opacidad reducida visualmente)
                canvas.drawImage(
                    watermark_path,
                    x, y,
                    width=watermark_width,
                    height=watermark_height,
                    preserveAspectRatio=True,
                    mask='auto'
                )
        except Exception as e:
            print(f"Error agregando marca de agua: {e}")
    
    # Función para primera página: header + marca de agua
    def on_first_page(canvas, doc):
        """Agrega header y marca de agua solo en la primera página"""
        page_width, page_height = landscape(A4)
        
        # Agregar marca de agua
        add_watermark(canvas)
        
        # Agregar header en la parte superior (más pequeño)
        if header_footer_exists:
            try:
                header_height = 2.0 * cm  # Reducido de 2.5cm a 2.0cm
                header_width = page_width
                canvas.drawImage(
                    header_footer_path,
                    0, page_height - header_height,
                    width=header_width,
                    height=header_height,
                    preserveAspectRatio=True,
                    mask='auto'
                )
            except Exception as e:
                print(f"Error agregando header: {e}")
    
    # Variable para rastrear el número máximo de página visto
    max_page_seen = {'value': 0}
    footer_added = {'value': False}
    total_pages_info = {'value': None}
    
    # Función auxiliar para agregar footer y contacto
    def _add_footer_and_contact(canvas, page_width, footer_height):
        """Agrega información de contacto y footer"""
        try:
            # Agregar información de contacto arriba del footer (centrado)
            contacto_text = [
                "Contacto: Dirección de promoción de Intercambio comercial internacional y regional",
                "Mail: intercambiocomercial@catamarca.gov.ar",
                "Dirección: Sarmiento 589 - 6to. piso"
            ]
            
            # Calcular posición para el texto de contacto (arriba del footer)
            contacto_y_start = footer_height + 1.5 * cm
            line_height = 0.5 * cm
            
            # Dibujar cada línea de contacto centrada
            canvas.saveState()
            canvas.setFont("Helvetica", 9)
            canvas.setFillColor(colors.HexColor('#222A59'))
            
            for i, line in enumerate(contacto_text):
                text_width = canvas.stringWidth(line, "Helvetica", 9)
                x_centered = (page_width - text_width) / 2
                y_position = contacto_y_start - (i * line_height)
                canvas.drawString(x_centered, y_position, line)
            
            canvas.restoreState()
            
            # Agregar footer centrado
            footer_width = page_width * 0.8  # 80% del ancho para centrarlo
            footer_x = (page_width - footer_width) / 2  # Centrar horizontalmente
            
            canvas.drawImage(
                header_footer_path,
                footer_x, 0,
                width=footer_width,
                height=footer_height,
                preserveAspectRatio=True,
                mask='auto'
            )
        except Exception as e:
            print(f"Error agregando footer y contacto: {e}")
    
    # Función para páginas intermedias: marca de agua + footer si es última página
    def on_later_pages(canvas, doc):
        """Agrega marca de agua y footer si es la última página"""
        add_watermark(canvas)
        
        # Detectar si es la última página y agregar footer (solo una vez)
        if header_footer_exists and not footer_added['value']:
            try:
                page_width, page_height = landscape(A4)
                footer_height = 2.0 * cm
                current_page = canvas.getPageNumber()
                
                # Actualizar el número máximo de página visto
                max_page_seen['value'] = max(max_page_seen['value'], current_page)
                
                # Intentar obtener el número total de páginas
                is_last_page = False
                try:
                    # Intentar obtener el total de páginas
                    total_pages = canvas.getPageCount()
                    if total_pages and total_pages > 0:
                        is_last_page = (current_page == total_pages)
                        total_pages_info['value'] = total_pages
                    elif total_pages_info['value']:
                        # Usar el valor almacenado si getPageCount() no funciona
                        is_last_page = (current_page == total_pages_info['value'])
                except (AttributeError, TypeError, Exception):
                    # Si no podemos obtener el total, intentar otra estrategia
                    if total_pages_info['value']:
                        # Usar el valor almacenado
                        is_last_page = (current_page == total_pages_info['value'])
                    else:
                        # Intentar usar atributos internos de ReportLab
                        try:
                            if hasattr(canvas, '_pageNumber') and hasattr(canvas, '_pageCount'):
                                total_pages = canvas._pageCount
                                if total_pages:
                                    is_last_page = (current_page == total_pages)
                                    total_pages_info['value'] = total_pages
                        except:
                            pass
                
                # Si es la última página, agregar footer y contacto
                if is_last_page:
                    footer_added['value'] = True
                    _add_footer_and_contact(canvas, page_width, footer_height)
            except Exception as e:
                print(f"Error en on_later_pages: {e}")
    
    # Clase personalizada (simple, sin override de build)
    class CustomDocTemplate(SimpleDocTemplate):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
    
    doc = CustomDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=1*cm,
        leftMargin=1*cm,
        topMargin=2.5*cm,  # Reducido para header más pequeño (2.0cm)
        bottomMargin=4.5*cm,  # Aumentado para footer + texto de contacto
        title='Exportación de Empresas'
    )
    
    # Estilos
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#222A59'),
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#6B7280'),
        spaceAfter=12,
        alignment=TA_CENTER
    )
    
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Normal'],
        fontSize=14,
        textColor=colors.HexColor('#222A59'),
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        spaceAfter=6
    )
    
    footer_style = ParagraphStyle(
        'FooterStyle',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#6B7280'),
        alignment=TA_CENTER
    )
    
    story = []
    
    # Encabezado institucional
    header_text = Paragraph(
        "Dirección de Intercambio Comercial Internacional y Regional<br/>Provincia de Catamarca",
        header_style
    )
    story.append(header_text)
    story.append(Spacer(1, 0.3*cm))
    
    # Título
    title = Paragraph("Exportación de Empresas", title_style)
    story.append(title)
    
    # Fecha de generación
    fecha = datetime.now().strftime('%d/%m/%Y %H:%M')
    fecha_text = Paragraph(f"Generado el: {fecha}", subtitle_style)
    story.append(fecha_text)
    story.append(Spacer(1, 0.5*cm))
    
    ancho_disponible = landscape(A4)[0] - 2*cm
    num_empresas = len(todas_empresas)
    
    # Determinar si usar formato compacto (muchas empresas) o detallado (pocas empresas)
    usar_formato_compacto = num_empresas >= 5
    
    # SECCIÓN 1: INFORMACIÓN BÁSICA
    if secciones['basica']:
        story.append(Paragraph("Datos Generales", title_style))
        story.append(Spacer(1, 0.3*cm))
        
        campos_basicos = secciones['basica']
        
        if usar_formato_compacto:
            # Formato compacto: todas las columnas en una tabla, dividida en grupos si es necesario
            max_cols = 8  # Máximo de columnas por tabla (incluyendo "Tipo")
            
            for i in range(0, len(campos_basicos), max_cols - 1):
                grupo_campos = campos_basicos[i:i + max_cols - 1]
                headers_basico = ['Tipo', 'Razón Social'] + [campo['label'] for campo in grupo_campos]
                data_basico = [headers_basico]
                
                for tipo, empresa in todas_empresas:
                    row = [tipo, Paragraph(normalize_text(empresa.razon_social), styles['Normal'])]
                    for campo in grupo_campos:
                        value = get_field_value(empresa, campo['field'])
                        
                        # Manejar geolocalización como enlace de Google Maps
                        if campo['field'] == 'geolocalizacion':
                            link_text = format_geolocalizacion_as_link(value)
                            if link_text != '-':
                                row.append(Paragraph(link_text, styles['Normal']))
                            else:
                                row.append(Paragraph('-', styles['Normal']))
                            continue
                        
                        if isinstance(value, bool):
                            value = 'Sí' if value else 'No'
                        elif value is None:
                            value = '-'
                        else:
                            value = str(value)
                        
                        # Truncar valores muy largos para formato compacto
                        if len(value) > 30:
                            value = value[:27] + '...'
                        
                        row.append(Paragraph(normalize_text(value), styles['Normal']))
                    data_basico.append(row)
                
                num_cols = len(headers_basico)
                # Calcular anchos: Tipo pequeño, Razón Social más grande, resto igual
                if num_cols == 2:
                    col_widths_basico = [ancho_disponible * 0.15, ancho_disponible * 0.85]
                else:
                    col_widths_basico = [
                        ancho_disponible * 0.08,  # Tipo
                        ancho_disponible * 0.20,  # Razón Social
                    ] + [ancho_disponible * 0.72 / (num_cols - 2)] * (num_cols - 2)
                
                table_basico = Table(data_basico, colWidths=col_widths_basico, repeatRows=1)
                table_basico.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#222A59')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 8),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
                    ('TOPPADDING', (0, 0), (-1, 0), 6),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F3F4F6')]),
                    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 1), (-1, -1), 7),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#6B7280')),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('TOPPADDING', (0, 1), (-1, -1), 4),
                    ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
                ]))
                story.append(table_basico)
                
                # Agregar espacio entre tablas si hay más grupos
                if i + max_cols - 1 < len(campos_basicos):
                    story.append(Spacer(1, 0.2*cm))
        else:
            # Formato detallado: menos columnas, más espacio
            max_cols = 6  # Incluyendo la columna "Tipo"
            
            for i in range(0, len(campos_basicos), max_cols - 1):
                grupo_campos = campos_basicos[i:i + max_cols - 1]
                headers_basico = ['Tipo'] + [campo['label'] for campo in grupo_campos]
                data_basico = [headers_basico]
                
                for tipo, empresa in todas_empresas:
                    row = [tipo]
                    for campo in grupo_campos:
                        value = get_field_value(empresa, campo['field'])
                        
                        # Manejar geolocalización como enlace de Google Maps
                        if campo['field'] == 'geolocalizacion':
                            link_text = format_geolocalizacion_as_link(value)
                            if link_text != '-':
                                row.append(Paragraph(link_text, styles['Normal']))
                            else:
                                row.append(Paragraph('-', styles['Normal']))
                            continue
                        
                        if isinstance(value, bool):
                            value = 'Sí' if value else 'No'
                        elif value is None:
                            value = '-'
                        else:
                            value = str(value)
                        
                        row.append(Paragraph(normalize_text(value), styles['Normal']))
                    data_basico.append(row)
                
                num_cols = len(headers_basico)
                if num_cols <= 4:
                    col_widths_basico = [ancho_disponible * 0.15] + [ancho_disponible * 0.85 / (num_cols - 1)] * (num_cols - 1)
                else:
                    col_width = ancho_disponible / num_cols
                    col_widths_basico = [col_width] * num_cols
                
                table_basico = Table(data_basico, colWidths=col_widths_basico, repeatRows=1)
                table_basico.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#222A59')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                    ('TOPPADDING', (0, 0), (-1, 0), 8),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F3F4F6')]),
                    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 1), (-1, -1), 8),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#6B7280')),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('TOPPADDING', (0, 1), (-1, -1), 6),
                    ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
                ]))
                story.append(table_basico)
                
                if i + max_cols - 1 < len(campos_basicos):
                    story.append(Spacer(1, 0.3*cm))
        
        story.append(Spacer(1, 0.5*cm))
    
    # SECCIÓN 2: CONTACTO
    if secciones['contacto']:
        # Nueva página para la sección de contacto
        story.append(PageBreak())
        story.append(Paragraph("Información de Contacto", title_style))
        story.append(Spacer(1, 0.3*cm))
        
        campos_contacto = secciones['contacto']
        
        if usar_formato_compacto:
            # Formato compacto
            max_cols = 8  # Máximo de columnas por tabla (incluyendo "Razón Social")
            
            for i in range(0, len(campos_contacto), max_cols - 1):
                grupo_campos = campos_contacto[i:i + max_cols - 1]
                headers_contacto = ['Razón Social'] + [campo['label'] for campo in grupo_campos]
                data_contacto = [headers_contacto]
                
                for tipo, empresa in todas_empresas:
                    row = [Paragraph(normalize_text(empresa.razon_social), styles['Normal'])]
                    for campo in grupo_campos:
                        value = get_field_value(empresa, campo['field'])
                        
                        # Manejar geolocalización como enlace de Google Maps
                        if campo['field'] == 'geolocalizacion':
                            link_text = format_geolocalizacion_as_link(value)
                            if link_text != '-':
                                row.append(Paragraph(link_text, styles['Normal']))
                            else:
                                row.append(Paragraph('-', styles['Normal']))
                            continue
                        
                        if isinstance(value, bool):
                            value = 'Sí' if value else 'No'
                        elif value is None or value == '-':
                            value = '-'
                        else:
                            value = str(value).lower() if campo['field'] in ['correo', 'sitioweb', 'email_secundario', 'email_terciario', 'contacto_principal_email', 'contacto_secundario_email'] else str(value)
                        
                        # Truncar valores muy largos
                        if len(value) > 30:
                            value = value[:27] + '...'
                        
                        row.append(Paragraph(normalize_text(value), styles['Normal']))
                    data_contacto.append(row)
                
                num_cols = len(headers_contacto)
                col_widths_contacto = [ancho_disponible * 0.20] + [ancho_disponible * 0.80 / (num_cols - 1)] * (num_cols - 1)
                
                table_contacto = Table(data_contacto, colWidths=col_widths_contacto, repeatRows=1)
                table_contacto.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#222A59')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 8),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
                    ('TOPPADDING', (0, 0), (-1, 0), 6),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F3F4F6')]),
                    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 1), (-1, -1), 7),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#6B7280')),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('TOPPADDING', (0, 1), (-1, -1), 4),
                    ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
                ]))
                story.append(table_contacto)
                
                if i + max_cols - 1 < len(campos_contacto):
                    story.append(Spacer(1, 0.2*cm))
        else:
            # Formato detallado
            max_cols = 6  # Incluyendo la columna "Razón Social"
            
            for i in range(0, len(campos_contacto), max_cols - 1):
                grupo_campos = campos_contacto[i:i + max_cols - 1]
                headers_contacto = ['Razón Social'] + [campo['label'] for campo in grupo_campos]
                data_contacto = [headers_contacto]
                
                for tipo, empresa in todas_empresas:
                    row = [Paragraph(normalize_text(empresa.razon_social), styles['Normal'])]
                    for campo in grupo_campos:
                        value = get_field_value(empresa, campo['field'])
                        
                        # Manejar geolocalización como enlace de Google Maps
                        if campo['field'] == 'geolocalizacion':
                            link_text = format_geolocalizacion_as_link(value)
                            if link_text != '-':
                                row.append(Paragraph(link_text, styles['Normal']))
                            else:
                                row.append(Paragraph('-', styles['Normal']))
                            continue
                        
                        if isinstance(value, bool):
                            value = 'Sí' if value else 'No'
                        elif value is None or value == '-':
                            value = '-'
                        else:
                            value = str(value).lower() if campo['field'] in ['correo', 'sitioweb', 'email_secundario', 'email_terciario', 'contacto_principal_email', 'contacto_secundario_email'] else str(value)
                        
                        row.append(Paragraph(normalize_text(value), styles['Normal']))
                    data_contacto.append(row)
                
                num_cols = len(headers_contacto)
                if num_cols <= 4:
                    col_widths_contacto = [ancho_disponible * 0.20] + [ancho_disponible * 0.80 / (num_cols - 1)] * (num_cols - 1)
                else:
                    col_width = ancho_disponible / num_cols
                    col_widths_contacto = [col_width] * num_cols
                
                table_contacto = Table(data_contacto, colWidths=col_widths_contacto, repeatRows=1)
                table_contacto.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#222A59')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                    ('TOPPADDING', (0, 0), (-1, 0), 8),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F3F4F6')]),
                    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 1), (-1, -1), 8),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#6B7280')),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('TOPPADDING', (0, 1), (-1, -1), 6),
                    ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
                ]))
                story.append(table_contacto)
                
                if i + max_cols - 1 < len(campos_contacto):
                    story.append(Spacer(1, 0.3*cm))
        
        story.append(Spacer(1, 0.5*cm))
    
    # SECCIÓN 3: COMERCIAL
    if secciones['comercial']:
        # Nueva página para la sección comercial
        story.append(PageBreak())
        story.append(Paragraph("Información Comercial y Clasificación", title_style))
        story.append(Spacer(1, 0.3*cm))
        
        campos_comercial = secciones['comercial']
        
        if usar_formato_compacto:
            # Formato compacto
            max_cols = 8  # Máximo de columnas por tabla (incluyendo "Razón Social")
            
            for i in range(0, len(campos_comercial), max_cols - 1):
                grupo_campos = campos_comercial[i:i + max_cols - 1]
                headers_comercial = ['Razón Social'] + [campo['label'] for campo in grupo_campos]
                data_comercial = [headers_comercial]
                
                for tipo, empresa in todas_empresas:
                    row = [Paragraph(normalize_text(empresa.razon_social), styles['Normal'])]
                    for campo in grupo_campos:
                        value = get_field_value(empresa, campo['field'])
                        
                        # Manejar geolocalización como enlace de Google Maps
                        if campo['field'] == 'geolocalizacion':
                            link_text = format_geolocalizacion_as_link(value)
                            if link_text != '-':
                                row.append(Paragraph(link_text, styles['Normal']))
                            else:
                                row.append(Paragraph('-', styles['Normal']))
                            continue
                        
                        if isinstance(value, bool):
                            value = 'Sí' if value else 'No'
                        elif value is None or value == '-':
                            value = '-'
                        elif campo['field'] == 'exporta':
                            value = 'Sí' if value == 'Sí' else 'No'
                        else:
                            value = str(value)
                        
                        # Truncar valores muy largos
                        if len(value) > 30:
                            value = value[:27] + '...'
                        
                        row.append(Paragraph(normalize_text(value), styles['Normal']))
                    data_comercial.append(row)
                
                num_cols = len(headers_comercial)
                col_widths_comercial = [ancho_disponible * 0.20] + [ancho_disponible * 0.80 / (num_cols - 1)] * (num_cols - 1)
                
                table_comercial = Table(data_comercial, colWidths=col_widths_comercial, repeatRows=1)
                table_comercial.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#222A59')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 8),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
                    ('TOPPADDING', (0, 0), (-1, 0), 6),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F3F4F6')]),
                    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 1), (-1, -1), 7),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#6B7280')),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('TOPPADDING', (0, 1), (-1, -1), 4),
                    ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
                ]))
                story.append(table_comercial)
                
                if i + max_cols - 1 < len(campos_comercial):
                    story.append(Spacer(1, 0.2*cm))
        else:
            # Formato detallado
            max_cols = 6  # Incluyendo la columna "Razón Social"
            
            for i in range(0, len(campos_comercial), max_cols - 1):
                grupo_campos = campos_comercial[i:i + max_cols - 1]
                headers_comercial = ['Razón Social'] + [campo['label'] for campo in grupo_campos]
                data_comercial = [headers_comercial]
                
                for tipo, empresa in todas_empresas:
                    row = [Paragraph(normalize_text(empresa.razon_social), styles['Normal'])]
                    for campo in grupo_campos:
                        value = get_field_value(empresa, campo['field'])
                        
                        # Manejar geolocalización como enlace de Google Maps
                        if campo['field'] == 'geolocalizacion':
                            link_text = format_geolocalizacion_as_link(value)
                            if link_text != '-':
                                row.append(Paragraph(link_text, styles['Normal']))
                            else:
                                row.append(Paragraph('-', styles['Normal']))
                            continue
                        
                        if isinstance(value, bool):
                            value = 'Sí' if value else 'No'
                        elif value is None or value == '-':
                            value = '-'
                        elif campo['field'] == 'exporta':
                            value = 'Sí' if value == 'Sí' else 'No'
                        else:
                            value = str(value)
                        
                        row.append(Paragraph(normalize_text(value), styles['Normal']))
                    data_comercial.append(row)
                
                num_cols = len(headers_comercial)
                if num_cols <= 4:
                    col_widths_comercial = [ancho_disponible * 0.20] + [ancho_disponible * 0.80 / (num_cols - 1)] * (num_cols - 1)
                else:
                    col_width = ancho_disponible / num_cols
                    col_widths_comercial = [col_width] * num_cols
                
                table_comercial = Table(data_comercial, colWidths=col_widths_comercial, repeatRows=1)
                table_comercial.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#222A59')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                    ('TOPPADDING', (0, 0), (-1, 0), 8),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F3F4F6')]),
                    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 1), (-1, -1), 8),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#6B7280')),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('TOPPADDING', (0, 1), (-1, -1), 6),
                    ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
                ]))
                story.append(table_comercial)
                
                if i + max_cols - 1 < len(campos_comercial):
                    story.append(Spacer(1, 0.3*cm))
    
    # Footer (el footer visual se agrega en la función callback)
    # Mantener el footer de texto solo si no hay imagen de footer
    if not header_footer_exists:
        story.append(Spacer(1, 0.3*cm))
        footer_text = Paragraph(
            "Dirección de Intercambio Comercial Internacional y Regional - "
            "San Martín 320, San Fernando del Valle de Catamarca - "
            "Tel: (0383) 4437390",
            footer_style
        )
        story.append(footer_text)
    
    # Resetear contadores antes de construir
    max_page_seen['value'] = 0
    footer_added['value'] = False
    total_pages_info['value'] = None
    
    # Construir PDF con header solo en primera página, marca de agua en todas, footer solo en última
    doc.build(story, onFirstPage=on_first_page, onLaterPages=on_later_pages)
    
    # Obtener PDF
    pdf = buffer.getvalue()
    buffer.close()
    
    # Crear respuesta HTTP
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="empresas_exportacion_{datetime.now().strftime("%Y%m%d_%H%M")}.pdf"'
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
    9. certificaciones: ≥1 = 2, Ninguna = 0
    
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
