from django.http import HttpResponse
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from io import BytesIO

def generate_empresas_pdf(empresas, campos_seleccionados, tipo_empresa):
    """
    Generar PDF con empresas filtradas
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    story = []
    
    # Estilos
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=30,
        alignment=1
    )
    
    # Título
    title = Paragraph(f"Reporte de Empresas - {tipo_empresa.title()}", title_style)
    story.append(title)
    story.append(Spacer(1, 20))
    
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
    
    # Crear tabla
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 14),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(table)
    
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
