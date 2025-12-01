from django.http import HttpResponse
from reportlab.lib.pagesizes import letter, A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch, cm
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
