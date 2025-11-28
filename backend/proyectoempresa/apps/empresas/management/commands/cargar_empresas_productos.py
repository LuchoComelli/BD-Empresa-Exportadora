"""
Management command para cargar empresas de productos con todos los campos completos
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.empresas.models import (
    Empresa, TipoEmpresa, Rubro, SubRubro, ProductoEmpresa, PosicionArancelaria
)
from apps.core.models import Usuario, RolUsuario
from apps.geografia.models import Departamento, Municipio, Localidad
import random
from decimal import Decimal

# Datos de empresas reales argentinas que venden productos
EMPRESAS_PRODUCTOS = [
    {
        'razon_social': 'MOLINOS RIO DE LA PLATA S.A.',
        'nombre_fantasia': 'Molinos',
        'tipo_sociedad': 'Sociedad Anónima',
        'cuit': '30500018341',
        'direccion': 'Av. Corrientes 1854',
        'codigo_postal': 'C1045',
        'direccion_comercial': 'Av. Corrientes 1854, CABA',
        'codigo_postal_comercial': 'C1045',
        'telefono': '+541143212345',
        'correo': 'contacto@molinos.com.ar',
        'sitioweb': 'https://www.molinos.com.ar',
        'instagram': '@molinosarg',
        'facebook': 'MolinosArgentina',
        'linkedin': 'molinos-rio-de-la-plata',
        'geolocalizacion': '-34.603722,-58.381592',  # Buenos Aires
        'descripcion': 'Empresa líder en la industria alimentaria argentina, especializada en productos de consumo masivo.',
        'observaciones': 'Empresa con amplia trayectoria en exportación de productos alimenticios.',
        'exporta': 'Sí',
        'destinoexporta': 'Brasil, Chile, Uruguay, Paraguay, Estados Unidos, España',
        'tipoexporta': 'Directa',
        'importa': True,
        'certificadopyme': False,
        'certificaciones': 'ISO 9001, ISO 14001, HACCP, BRC',
        'idiomas_trabaja': 'Español, Inglés, Portugués',
        'promo2idiomas': True,
        'participoferianacional': True,
        'feriasnacionales': 'Expoagro 2023, La Rural 2023',
        'participoferiainternacional': True,
        'feriasinternacionales': 'Anuga 2023 (Alemania), SIAL 2023 (Francia)',
        'contacto_principal_nombre': 'Juan Carlos Pérez',
        'contacto_principal_cargo': 'Gerente de Exportaciones',
        'contacto_principal_telefono': '+541143212345',
        'contacto_principal_email': 'jperez@molinos.com.ar',
        'contacto_secundario_nombre': 'María González',
        'contacto_secundario_cargo': 'Coordinadora Comercial',
        'contacto_secundario_telefono': '+541143212346',
        'contacto_secundario_email': 'mgonzalez@molinos.com.ar',
        'productos': [
            {'nombre': 'Harina 000', 'posicion_arancelaria': '1101.00.00', 'descripcion': 'Harina de trigo tipo 000 para panificación', 'capacidad': 50000, 'unidad': 'tn'},
            {'nombre': 'Aceite de Girasol', 'posicion_arancelaria': '1512.11.00', 'descripcion': 'Aceite de girasol refinado en botellas de 1L', 'capacidad': 30000, 'unidad': 'lt'},
            {'nombre': 'Fideos Largos', 'posicion_arancelaria': '1902.19.00', 'descripcion': 'Fideos largos tipo spaghetti', 'capacidad': 25000, 'unidad': 'kg'},
            {'nombre': 'Arroz Largo Fino', 'posicion_arancelaria': '1006.30.00', 'descripcion': 'Arroz largo fino tipo doble carolina', 'capacidad': 40000, 'unidad': 'kg'},
            {'nombre': 'Aceite de Oliva Extra Virgen', 'posicion_arancelaria': '1509.10.00', 'descripcion': 'Aceite de oliva extra virgen primera prensada', 'capacidad': 10000, 'unidad': 'lt'},
        ],
        'actividades_promocion': [
            {'tipo': 'feria', 'lugar': 'Anuga, Colonia, Alemania', 'anio': '2023', 'observaciones': 'Stand principal, 200m²'},
            {'tipo': 'feria', 'lugar': 'SIAL, París, Francia', 'anio': '2022', 'observaciones': 'Participación con productos premium'},
            {'tipo': 'mision', 'lugar': 'São Paulo, Brasil', 'anio': '2023', 'observaciones': 'Misión comercial con 15 empresas'},
            {'tipo': 'mision', 'lugar': 'Santiago, Chile', 'anio': '2022', 'observaciones': 'Ronda de negocios con importadores'},
            {'tipo': 'ronda', 'lugar': 'Buenos Aires, Argentina', 'anio': '2023', 'observaciones': 'Ronda de negocios ProCórdoba'},
            {'tipo': 'ronda', 'lugar': 'Rosario, Argentina', 'anio': '2022', 'observaciones': 'Ronda de negocios con compradores internacionales'},
        ],
        'departamento_nombre': 'Capital',
        'provincia_nombre': 'Buenos Aires',
    },
    {
        'razon_social': 'ARCOR S.A.I.C.',
        'nombre_fantasia': 'Arcor',
        'tipo_sociedad': 'Sociedad Anónima Industrial y Comercial',
        'cuit': '30500018342',
        'direccion': 'Ruta Nacional 9 Km 170',
        'codigo_postal': 'X5152',
        'direccion_comercial': 'Ruta Nacional 9 Km 170, Arroyito, Córdoba',
        'codigo_postal_comercial': 'X5152',
        'telefono': '+543543456789',
        'correo': 'contacto@arcor.com.ar',
        'sitioweb': 'https://www.arcor.com',
        'instagram': '@arcoroficial',
        'facebook': 'ArcorOficial',
        'linkedin': 'arcor',
        'geolocalizacion': '-31.420083,-63.049619',  # Arroyito, Córdoba
        'descripcion': 'Empresa líder en la producción de golosinas, chocolates y alimentos en Argentina y Latinoamérica.',
        'observaciones': 'Exporta a más de 120 países, con presencia en 5 continentes.',
        'exporta': 'Sí',
        'destinoexporta': 'Brasil, México, Chile, Estados Unidos, España, Alemania, Reino Unido, China',
        'tipoexporta': 'Directa',
        'importa': True,
        'certificadopyme': False,
        'certificaciones': 'ISO 9001, ISO 14001, ISO 22000, BRC, IFS, Kosher, Halal',
        'idiomas_trabaja': 'Español, Inglés, Portugués, Francés',
        'promo2idiomas': True,
        'material_promocional_idiomas': 'si',
        'participoferianacional': True,
        'feriasnacionales': 'Expoagro 2023, La Rural 2023, Expo Alimentaria 2023',
        'participoferiainternacional': True,
        'feriasinternacionales': 'ISM 2023 (Alemania), Sweets & Snacks Expo 2023 (EEUU), Fancy Food Show 2023 (EEUU)',
        'contacto_principal_nombre': 'Roberto Martínez',
        'contacto_principal_cargo': 'Director de Exportaciones',
        'contacto_principal_telefono': '+543543456789',
        'contacto_principal_email': 'rmartinez@arcor.com.ar',
        'contacto_secundario_nombre': 'Ana Fernández',
        'contacto_secundario_cargo': 'Gerente de Comercio Exterior',
        'contacto_secundario_telefono': '+543543456790',
        'contacto_secundario_email': 'afernandez@arcor.com.ar',
        'productos': [
            {'nombre': 'Chocolates Bon o Bon', 'posicion_arancelaria': '1806.31.00', 'descripcion': 'Chocolates rellenos con maní', 'capacidad': 20000, 'unidad': 'kg'},
            {'nombre': 'Alfajores Havanna', 'posicion_arancelaria': '1905.90.00', 'descripcion': 'Alfajores de dulce de leche', 'capacidad': 15000, 'unidad': 'kg'},
            {'nombre': 'Galletas Terrabusi', 'posicion_arancelaria': '1905.31.00', 'descripcion': 'Galletas surtidas', 'capacidad': 30000, 'unidad': 'kg'},
            {'nombre': 'Caramelos Sugus', 'posicion_arancelaria': '1704.10.00', 'descripcion': 'Caramelos masticables saborizados', 'capacidad': 25000, 'unidad': 'kg'},
            {'nombre': 'Chicles Beldent', 'posicion_arancelaria': '1704.10.00', 'descripcion': 'Chicles sin azúcar', 'capacidad': 18000, 'unidad': 'kg'},
        ],
        'actividades_promocion': [
            {'tipo': 'feria', 'lugar': 'ISM, Colonia, Alemania', 'anio': '2023', 'observaciones': 'Stand de 300m², productos premium'},
            {'tipo': 'feria', 'lugar': 'Sweets & Snacks Expo, Chicago, EEUU', 'anio': '2023', 'observaciones': 'Lanzamiento de nuevos productos'},
            {'tipo': 'mision', 'lugar': 'São Paulo, Brasil', 'anio': '2023', 'observaciones': 'Misión comercial con distribuidores'},
            {'tipo': 'mision', 'lugar': 'Madrid, España', 'anio': '2022', 'observaciones': 'Expansión en mercado europeo'},
            {'tipo': 'ronda', 'lugar': 'Buenos Aires, Argentina', 'anio': '2023', 'observaciones': 'Ronda de negocios con compradores asiáticos'},
            {'tipo': 'ronda', 'lugar': 'Córdoba, Argentina', 'anio': '2022', 'observaciones': 'Ronda de negocios ProCórdoba'},
        ],
        'departamento_nombre': 'San Justo',
        'provincia_nombre': 'Córdoba',
    },
    {
        'razon_social': 'BAGLEY S.A.',
        'nombre_fantasia': 'Bagley',
        'tipo_sociedad': 'Sociedad Anónima',
        'cuit': '30500018343',
        'direccion': 'Av. del Libertador 4980',
        'codigo_postal': 'C1425',
        'direccion_comercial': 'Av. del Libertador 4980, CABA',
        'codigo_postal_comercial': 'C1425',
        'telefono': '+541147892345',
        'correo': 'contacto@bagley.com.ar',
        'sitioweb': 'https://www.bagley.com.ar',
        'instagram': '@bagleyoficial',
        'facebook': 'BagleyOficial',
        'linkedin': 'bagley-argentina',
        'geolocalizacion': '-34.571389,-58.437778',  # Buenos Aires
        'descripcion': 'Empresa líder en la producción de galletas y snacks en Argentina.',
        'observaciones': 'Exporta productos de alta calidad a diversos mercados internacionales.',
        'exporta': 'Sí',
        'destinoexporta': 'Brasil, Chile, Uruguay, Paraguay, Estados Unidos',
        'tipoexporta': 'Mixta',
        'importa': False,
        'certificadopyme': False,
        'certificaciones': 'ISO 9001, ISO 14001, HACCP',
        'idiomas_trabaja': 'Español, Inglés, Portugués',
        'promo2idiomas': True,
        'participoferianacional': True,
        'feriasnacionales': 'Expo Alimentaria 2023, La Rural 2023',
        'participoferiainternacional': True,
        'feriasinternacionales': 'Fancy Food Show 2023 (EEUU), SIAL 2022 (Francia)',
        'contacto_principal_nombre': 'Carlos Rodríguez',
        'contacto_principal_cargo': 'Gerente de Ventas Internacionales',
        'contacto_principal_telefono': '+541147892345',
        'contacto_principal_email': 'crodriguez@bagley.com.ar',
        'contacto_secundario_nombre': 'Laura Sánchez',
        'contacto_secundario_cargo': 'Coordinadora de Exportaciones',
        'contacto_secundario_telefono': '+541147892346',
        'contacto_secundario_email': 'lsanchez@bagley.com.ar',
        'productos': [
            {'nombre': 'Galletas Rellenas', 'posicion_arancelaria': '1905.32.00', 'descripcion': 'Galletas rellenas de dulce de leche', 'capacidad': 20000, 'unidad': 'kg'},
            {'nombre': 'Snacks de Trigo', 'posicion_arancelaria': '1904.10.00', 'descripcion': 'Snacks de trigo inflado', 'capacidad': 15000, 'unidad': 'kg'},
            {'nombre': 'Galletas de Agua', 'posicion_arancelaria': '1905.19.00', 'descripcion': 'Galletas de agua sin sal', 'capacidad': 18000, 'unidad': 'kg'},
            {'nombre': 'Crackers', 'posicion_arancelaria': '1905.19.00', 'descripcion': 'Crackers salados', 'capacidad': 22000, 'unidad': 'kg'},
            {'nombre': 'Galletas Dulces', 'posicion_arancelaria': '1905.31.00', 'descripcion': 'Galletas dulces surtidas', 'capacidad': 25000, 'unidad': 'kg'},
        ],
        'actividades_promocion': [
            {'tipo': 'feria', 'lugar': 'Fancy Food Show, Nueva York, EEUU', 'anio': '2023', 'observaciones': 'Stand de 150m²'},
            {'tipo': 'feria', 'lugar': 'SIAL, París, Francia', 'anio': '2022', 'observaciones': 'Participación con productos premium'},
            {'tipo': 'mision', 'lugar': 'Montevideo, Uruguay', 'anio': '2023', 'observaciones': 'Misión comercial con supermercados'},
            {'tipo': 'mision', 'lugar': 'Santiago, Chile', 'anio': '2022', 'observaciones': 'Expansión en mercado chileno'},
            {'tipo': 'ronda', 'lugar': 'Buenos Aires, Argentina', 'anio': '2023', 'observaciones': 'Ronda de negocios con compradores internacionales'},
            {'tipo': 'ronda', 'lugar': 'Rosario, Argentina', 'anio': '2022', 'observaciones': 'Ronda de negocios ProCórdoba'},
        ],
        'departamento_nombre': 'Capital',
        'provincia_nombre': 'Buenos Aires',
    },
    {
        'razon_social': 'LA SERENISIMA S.A.',
        'nombre_fantasia': 'La Serenísima',
        'tipo_sociedad': 'Sociedad Anónima',
        'cuit': '30500018344',
        'direccion': 'Ruta Nacional 5 Km 305',
        'codigo_postal': 'B6740',
        'direccion_comercial': 'Ruta Nacional 5 Km 305, General Rodríguez, Buenos Aires',
        'codigo_postal_comercial': 'B6740',
        'telefono': '+542374567890',
        'correo': 'contacto@laserenisima.com.ar',
        'sitioweb': 'https://www.laserenisima.com.ar',
        'instagram': '@laserenisima',
        'facebook': 'LaSerenisima',
        'linkedin': 'la-serenisima',
        'geolocalizacion': '-34.608333,-58.973333',  # General Rodríguez, Buenos Aires
        'descripcion': 'Empresa líder en la producción de lácteos en Argentina.',
        'observaciones': 'Exporta productos lácteos de alta calidad a diversos mercados.',
        'exporta': 'Sí',
        'destinoexporta': 'Brasil, Chile, Uruguay, Paraguay, Estados Unidos, España',
        'tipoexporta': 'Directa',
        'importa': False,
        'certificadopyme': False,
        'certificaciones': 'ISO 9001, ISO 14001, HACCP, BRC, IFS',
        'idiomas_trabaja': 'Español, Inglés, Portugués',
        'promo2idiomas': True,
        'participoferianacional': True,
        'feriasnacionales': 'Expoagro 2023, La Rural 2023',
        'participoferiainternacional': True,
        'feriasinternacionales': 'Anuga 2023 (Alemania), SIAL 2023 (Francia)',
        'contacto_principal_nombre': 'Fernando López',
        'contacto_principal_cargo': 'Director de Exportaciones',
        'contacto_principal_telefono': '+542374567890',
        'contacto_principal_email': 'flopez@laserenisima.com.ar',
        'contacto_secundario_nombre': 'Patricia Gómez',
        'contacto_secundario_cargo': 'Gerente de Comercio Exterior',
        'contacto_secundario_telefono': '+542374567891',
        'contacto_secundario_email': 'pgomez@laserenisima.com.ar',
        'productos': [
            {'nombre': 'Leche Entera UHT', 'posicion_arancelaria': '0401.10.00', 'descripcion': 'Leche entera ultra pasteurizada', 'capacidad': 500000, 'unidad': 'lt'},
            {'nombre': 'Queso Cremoso', 'posicion_arancelaria': '0406.10.00', 'descripcion': 'Queso cremoso tipo Philadelphia', 'capacidad': 50000, 'unidad': 'kg'},
            {'nombre': 'Yogur Natural', 'posicion_arancelaria': '0403.10.00', 'descripcion': 'Yogur natural sin azúcar', 'capacidad': 300000, 'unidad': 'lt'},
            {'nombre': 'Manteca', 'posicion_arancelaria': '0405.10.00', 'descripcion': 'Manteca sin sal', 'capacidad': 40000, 'unidad': 'kg'},
            {'nombre': 'Dulce de Leche', 'posicion_arancelaria': '0402.10.00', 'descripcion': 'Dulce de leche repostero', 'capacidad': 60000, 'unidad': 'kg'},
        ],
        'actividades_promocion': [
            {'tipo': 'feria', 'lugar': 'Anuga, Colonia, Alemania', 'anio': '2023', 'observaciones': 'Stand de 200m², productos premium'},
            {'tipo': 'feria', 'lugar': 'SIAL, París, Francia', 'anio': '2023', 'observaciones': 'Lanzamiento de nuevos productos'},
            {'tipo': 'mision', 'lugar': 'São Paulo, Brasil', 'anio': '2023', 'observaciones': 'Misión comercial con distribuidores'},
            {'tipo': 'mision', 'lugar': 'Santiago, Chile', 'anio': '2022', 'observaciones': 'Expansión en mercado chileno'},
            {'tipo': 'ronda', 'lugar': 'Buenos Aires, Argentina', 'anio': '2023', 'observaciones': 'Ronda de negocios con compradores internacionales'},
            {'tipo': 'ronda', 'lugar': 'Rosario, Argentina', 'anio': '2022', 'observaciones': 'Ronda de negocios ProCórdoba'},
        ],
        'departamento_nombre': 'General Rodríguez',
        'provincia_nombre': 'Buenos Aires',
    },
    {
        'razon_social': 'QUILMES INDUSTRIAL S.A.',
        'nombre_fantasia': 'Cervecería Quilmes',
        'tipo_sociedad': 'Sociedad Anónima',
        'cuit': '30500018345',
        'direccion': 'Av. Don Bosco 400',
        'codigo_postal': 'B1878',
        'direccion_comercial': 'Av. Don Bosco 400, Quilmes, Buenos Aires',
        'codigo_postal_comercial': 'B1878',
        'telefono': '+541142345678',
        'correo': 'contacto@quilmes.com.ar',
        'sitioweb': 'https://www.quilmes.com.ar',
        'instagram': '@cerveceriaquilmes',
        'facebook': 'CerveceriaQuilmes',
        'linkedin': 'cerveceria-quilmes',
        'geolocalizacion': '-34.720556,-58.254167',  # Quilmes, Buenos Aires
        'descripcion': 'Empresa líder en la producción de cerveza en Argentina.',
        'observaciones': 'Exporta cerveza a diversos mercados internacionales.',
        'exporta': 'Sí',
        'destinoexporta': 'Brasil, Chile, Uruguay, Paraguay, Estados Unidos, España, Reino Unido',
        'tipoexporta': 'Directa',
        'importa': True,
        'certificadopyme': False,
        'certificaciones': 'ISO 9001, ISO 14001, HACCP, BRC',
        'idiomas_trabaja': 'Español, Inglés, Portugués',
        'promo2idiomas': True,
        'participoferianacional': True,
        'feriasnacionales': 'Expo Cervecera 2023, La Rural 2023',
        'participoferiainternacional': True,
        'feriasinternacionales': 'BrauBeviale 2023 (Alemania), Craft Brewers Conference 2023 (EEUU)',
        'contacto_principal_nombre': 'Diego Herrera',
        'contacto_principal_cargo': 'Gerente de Exportaciones',
        'contacto_principal_telefono': '+541142345678',
        'contacto_principal_email': 'dherrera@quilmes.com.ar',
        'contacto_secundario_nombre': 'Sofía Martínez',
        'contacto_secundario_cargo': 'Coordinadora de Comercio Exterior',
        'contacto_secundario_telefono': '+541142345679',
        'contacto_secundario_email': 'smartinez@quilmes.com.ar',
        'productos': [
            {'nombre': 'Cerveza Quilmes Clásica', 'posicion_arancelaria': '2203.00.00', 'descripcion': 'Cerveza rubia tipo lager', 'capacidad': 2000000, 'unidad': 'lt'},
            {'nombre': 'Cerveza Quilmes Bock', 'posicion_arancelaria': '2203.00.00', 'descripcion': 'Cerveza tipo bock', 'capacidad': 500000, 'unidad': 'lt'},
            {'nombre': 'Cerveza Quilmes Stout', 'posicion_arancelaria': '2203.00.00', 'descripcion': 'Cerveza tipo stout', 'capacidad': 300000, 'unidad': 'lt'},
            {'nombre': 'Cerveza Quilmes IPA', 'posicion_arancelaria': '2203.00.00', 'descripcion': 'Cerveza tipo IPA', 'capacidad': 400000, 'unidad': 'lt'},
            {'nombre': 'Cerveza Quilmes Light', 'posicion_arancelaria': '2203.00.00', 'descripcion': 'Cerveza light baja en calorías', 'capacidad': 600000, 'unidad': 'lt'},
        ],
        'actividades_promocion': [
            {'tipo': 'feria', 'lugar': 'BrauBeviale, Nuremberg, Alemania', 'anio': '2023', 'observaciones': 'Stand de 250m²'},
            {'tipo': 'feria', 'lugar': 'Craft Brewers Conference, Denver, EEUU', 'anio': '2023', 'observaciones': 'Participación con productos premium'},
            {'tipo': 'mision', 'lugar': 'São Paulo, Brasil', 'anio': '2023', 'observaciones': 'Misión comercial con distribuidores'},
            {'tipo': 'mision', 'lugar': 'Santiago, Chile', 'anio': '2022', 'observaciones': 'Expansión en mercado chileno'},
            {'tipo': 'ronda', 'lugar': 'Buenos Aires, Argentina', 'anio': '2023', 'observaciones': 'Ronda de negocios con compradores internacionales'},
            {'tipo': 'ronda', 'lugar': 'Quilmes, Argentina', 'anio': '2022', 'observaciones': 'Ronda de negocios ProCórdoba'},
        ],
        'departamento_nombre': 'Quilmes',
        'provincia_nombre': 'Buenos Aires',
    },
]


class Command(BaseCommand):
    help = 'Carga empresas de productos con todos los campos completos'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Iniciando carga de empresas de productos...'))
        
        # Obtener o crear rol de empresa
        rol_empresa, _ = RolUsuario.objects.get_or_create(
            nombre='Empresa',
            defaults={'descripcion': 'Rol para empresas registradas', 'nivel_acceso': 1}
        )
        
        # Obtener tipo de empresa "producto"
        tipo_empresa = TipoEmpresa.objects.filter(nombre__icontains='producto').first()
        if not tipo_empresa:
            tipo_empresa = TipoEmpresa.objects.first()
        
        empresas_creadas = 0
        
        with transaction.atomic():
            for empresa_data in EMPRESAS_PRODUCTOS:
                try:
                    # Obtener departamento
                    departamento = Departamento.objects.filter(
                        nombre__icontains=empresa_data['departamento_nombre']
                    ).first()
                    if not departamento:
                        # Si no se encuentra, usar el primero disponible
                        departamento = Departamento.objects.first()
                    
                    # Obtener municipio y localidad si es posible
                    municipio = None
                    localidad = None
                    if departamento:
                        municipio = Municipio.objects.filter(departamento=departamento).first()
                        if municipio:
                            localidad = Localidad.objects.filter(municipio=municipio).first()
                    
                    # Obtener rubro y subrubro (usar los primeros disponibles)
                    rubro = Rubro.objects.first()
                    subrubro = SubRubro.objects.filter(rubro=rubro).first() if rubro else None
                    
                    # Parsear geolocalización
                    geoloc = empresa_data.get('geolocalizacion', '').split(',')
                    latitud = Decimal(geoloc[0]) if len(geoloc) > 0 and geoloc[0] else None
                    longitud = Decimal(geoloc[1]) if len(geoloc) > 1 and geoloc[1] else None
                    
                    # Crear usuario para la empresa
                    usuario, created = Usuario.objects.get_or_create(
                        email=empresa_data['contacto_principal_email'],
                        defaults={
                            'password': empresa_data['cuit'],
                            'rol': rol_empresa,
                            'nombre': empresa_data['contacto_principal_nombre'].split()[0],
                            'apellido': ' '.join(empresa_data['contacto_principal_nombre'].split()[1:]) if len(empresa_data['contacto_principal_nombre'].split()) > 1 else '',
                            'telefono': empresa_data['contacto_principal_telefono'],
                            'is_active': True,
                        }
                    )
                    if not created:
                        usuario.set_password(empresa_data['cuit'])
                        usuario.save()
                    
                    # Preparar redes sociales como JSON
                    import json
                    redes_sociales = {}
                    if empresa_data.get('instagram'):
                        redes_sociales['instagram'] = empresa_data['instagram']
                    if empresa_data.get('facebook'):
                        redes_sociales['facebook'] = empresa_data['facebook']
                    if empresa_data.get('linkedin'):
                        redes_sociales['linkedin'] = empresa_data['linkedin']
                    
                    # Crear empresa
                    empresa = Empresa.objects.create(
                        razon_social=empresa_data['razon_social'],
                        nombre_fantasia=empresa_data.get('nombre_fantasia'),
                        tipo_sociedad=empresa_data.get('tipo_sociedad'),
                        cuit_cuil=empresa_data['cuit'],
                        direccion=empresa_data['direccion'],
                        codigo_postal=empresa_data.get('codigo_postal'),
                        direccion_comercial=empresa_data.get('direccion_comercial'),
                        codigo_postal_comercial=empresa_data.get('codigo_postal_comercial'),
                        departamento=departamento,
                        municipio=municipio,
                        localidad=localidad,
                        geolocalizacion=empresa_data.get('geolocalizacion'),
                        latitud=latitud,
                        longitud=longitud,
                        telefono=empresa_data.get('telefono'),
                        correo=empresa_data.get('correo'),
                        sitioweb=empresa_data.get('sitioweb'),
                        redes_sociales=json.dumps(redes_sociales) if redes_sociales else None,
                        descripcion=empresa_data.get('descripcion'),
                        observaciones=empresa_data.get('observaciones'),
                        exporta=empresa_data.get('exporta'),
                        destinoexporta=empresa_data.get('destinoexporta'),
                        tipoexporta=empresa_data.get('tipoexporta'),
                        importa=empresa_data.get('importa', False),
                        certificadopyme=empresa_data.get('certificadopyme', False),
                        certificaciones=empresa_data.get('certificaciones'),
                        idiomas_trabaja=empresa_data.get('idiomas_trabaja'),
                        promo2idiomas=empresa_data.get('promo2idiomas', False),
                        participoferianacional=empresa_data.get('participoferianacional', False),
                        feriasnacionales=empresa_data.get('feriasnacionales'),
                        participoferiainternacional=empresa_data.get('participoferiainternacional', False),
                        feriasinternacionales=empresa_data.get('feriasinternacionales'),
                        contacto_principal_nombre=empresa_data['contacto_principal_nombre'],
                        contacto_principal_cargo=empresa_data['contacto_principal_cargo'],
                        contacto_principal_telefono=empresa_data['contacto_principal_telefono'],
                        contacto_principal_email=empresa_data['contacto_principal_email'],
                        contacto_secundario_nombre=empresa_data.get('contacto_secundario_nombre'),
                        contacto_secundario_cargo=empresa_data.get('contacto_secundario_cargo'),
                        contacto_secundario_telefono=empresa_data.get('contacto_secundario_telefono'),
                        contacto_secundario_email=empresa_data.get('contacto_secundario_email'),
                        id_usuario=usuario,
                        id_rubro=rubro,
                        tipo_empresa=tipo_empresa,
                        tipo_empresa_valor='producto',
                        actividades_promocion_internacional=empresa_data.get('actividades_promocion', []),
                    )
                    
                    # Crear productos
                    for producto_data in empresa_data.get('productos', []):
                        producto = ProductoEmpresa.objects.create(
                            empresa=empresa,
                            nombre_producto=producto_data['nombre'],
                            descripcion=producto_data['descripcion'],
                            capacidad_productiva=Decimal(producto_data['capacidad']),
                            unidad_medida=producto_data['unidad'],
                            periodo_capacidad='mensual',
                            es_principal=(producto_data == empresa_data['productos'][0]),
                        )
                        
                        # Crear posición arancelaria
                        PosicionArancelaria.objects.create(
                            producto=producto,
                            codigo_arancelario=producto_data['posicion_arancelaria'],
                            descripcion_arancelaria=producto_data['descripcion'],
                        )
                    
                    empresas_creadas += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'✓ Empresa creada: {empresa.razon_social} (ID: {empresa.id})')
                    )
                    
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'✗ Error al crear empresa {empresa_data.get("razon_social", "desconocida")}: {str(e)}')
                    )
                    import traceback
                    traceback.print_exc()
        
        self.stdout.write(
            self.style.SUCCESS(f'\n✓ Proceso completado. Empresas creadas: {empresas_creadas}/{len(EMPRESAS_PRODUCTOS)}')
        )

