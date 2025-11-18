from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import SolicitudRegistro, DocumentoSolicitud, NotificacionRegistro
from .serializers import (
    SolicitudRegistroSerializer, SolicitudRegistroListSerializer,
    SolicitudRegistroCreateSerializer, DocumentoSolicitudSerializer,
    NotificacionRegistroSerializer, SolicitudRegistroUpdateSerializer
)
from apps.core.permissions import IsPublicRegistration, CanManageUsers
import uuid


class SolicitudRegistroViewSet(viewsets.ModelViewSet):
    """ViewSet para solicitudes de registro"""
    queryset = SolicitudRegistro.objects.prefetch_related('documentos', 'notificaciones').all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado', 'tipo_empresa', 'email_confirmado']
    search_fields = ['razon_social', 'cuit_cuil', 'correo']
    ordering_fields = ['fecha_creacion', 'razon_social']
    ordering = ['-fecha_creacion']
    parser_classes = [MultiPartParser, FormParser, JSONParser]  # Para aceptar archivos
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SolicitudRegistroCreateSerializer
        elif self.action == 'list':
            return SolicitudRegistroListSerializer
        elif self.action == 'update' or self.action == 'partial_update':
            return SolicitudRegistroUpdateSerializer
        return SolicitudRegistroSerializer
    
    def get_permissions(self):
        """
        POST (crear) es público
        UPDATE (actualizar) permite al usuario actualizar su propia solicitud
        estadisticas_publicas es público
        Todo lo demás requiere autenticación y permisos de admin
        """
        if self.action == 'create':
            return [IsPublicRegistration()]
        elif self.action == 'estadisticas_publicas':
            return [permissions.AllowAny()]
        elif self.action in ['update', 'partial_update', 'mi_perfil']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), CanManageUsers()]
    
    def get_queryset(self):
        """Permitir que usuarios vean su propia solicitud"""
        queryset = super().get_queryset()
        if self.action in ['mi_perfil', 'update', 'partial_update']:
            # Filtrar para mostrar solo la solicitud del usuario actual
            return queryset.filter(usuario_creado=self.request.user)
        return queryset
    
    def perform_create(self, serializer):
        """Crear solicitud con token de confirmación"""
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            logger.info("Iniciando creación de solicitud de registro")
            solicitud = serializer.save(
                token_confirmacion=str(uuid.uuid4()),
                estado='pendiente'  # Estado pendiente hasta que admin apruebe
            )
            logger.info(f"Solicitud creada exitosamente: ID={solicitud.id}, Razón Social={solicitud.razon_social}, Usuario={solicitud.usuario_creado.email if solicitud.usuario_creado else 'No creado'}")
            # El usuario ya fue creado en el serializer.create()
            # TODO: Enviar email de confirmación con credenciales
            # enviar_email_confirmacion(solicitud)
        except Exception as e:
            logger.error(f"Error al crear solicitud de registro: {str(e)}", exc_info=True)
            raise
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, CanManageUsers])
    def aprobar(self, request, pk=None):
        """Aprobar solicitud y crear empresa"""
        solicitud = self.get_object()
        
        if solicitud.estado != 'pendiente':
            return Response(
                {'error': 'Solo se pueden aprobar solicitudes pendientes'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        observaciones = request.data.get('observaciones', '')
        
        try:
            # Importar función de creación de empresa
            from .views import crear_empresa_desde_solicitud, enviar_email_aprobacion
            import logging
            logger = logging.getLogger(__name__)
            
            # Primero crear la empresa (antes de marcar como aprobada)
            # Si falla, no se marca como aprobada
            logger.info(f"Creando empresa desde solicitud ID={solicitud.id}")
            empresa = crear_empresa_desde_solicitud(solicitud)
            logger.info(f"Empresa creada exitosamente: ID={empresa.id}, Tipo={type(empresa).__name__}")
            
            # Solo después de crear la empresa exitosamente, marcar como aprobada
            solicitud.estado = 'aprobada'
            solicitud.fecha_aprobacion = timezone.now()
            solicitud.aprobado_por = request.user
            solicitud.observaciones_admin = observaciones
            solicitud.empresa_creada = empresa
            solicitud.save()
            logger.info(f"Solicitud marcada como aprobada: ID={solicitud.id}")
            
            # Enviar email
            try:
                enviar_email_aprobacion(solicitud)
            except Exception as email_error:
                logger.warning(f"Error al enviar email de aprobación: {str(email_error)}")
                # No fallar si el email falla
            
            return Response({
                'status': 'success',
                'message': 'Solicitud aprobada correctamente',
                'empresa_id': empresa.id
            })
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error al aprobar solicitud ID={solicitud.id}: {str(e)}", exc_info=True)
            
            # Revertir el estado si se había marcado como aprobada
            if solicitud.estado == 'aprobada' and not solicitud.empresa_creada:
                solicitud.estado = 'pendiente'
                solicitud.fecha_aprobacion = None
                solicitud.aprobado_por = None
                solicitud.save()
                logger.warning(f"Estado de solicitud revertido a pendiente debido a error")
            
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, CanManageUsers])
    def rechazar(self, request, pk=None):
        """Rechazar solicitud"""
        solicitud = self.get_object()
        
        if solicitud.estado != 'pendiente':
            return Response(
                {'error': 'Solo se pueden rechazar solicitudes pendientes'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        observaciones = request.data.get('observaciones', '')
        
        try:
            from .views import enviar_email_rechazo
            
            solicitud.estado = 'rechazada'
            solicitud.observaciones_admin = observaciones
            solicitud.save()
            
            # Enviar email
            enviar_email_rechazo(solicitud)
            
            return Response({
                'status': 'success',
                'message': 'Solicitud rechazada correctamente'
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.AllowAny])
    def confirmar_email(self, request, pk=None):
        """Confirmar email con token"""
        solicitud = self.get_object()
        token = request.data.get('token')
        
        if not token or solicitud.token_confirmacion != token:
            return Response(
                {'error': 'Token inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if solicitud.email_confirmado:
            return Response(
                {'message': 'Email ya confirmado anteriormente'},
                status=status.HTTP_200_OK
            )
        
        solicitud.email_confirmado = True
        solicitud.fecha_confirmacion = timezone.now()
        solicitud.save()
        
        # Crear notificación
        NotificacionRegistro.objects.create(
            solicitud=solicitud,
            tipo='confirmacion',
            asunto='Email confirmado',
            mensaje='Su email ha sido confirmado correctamente.'
        )
        
        return Response({
            'status': 'success',
            'message': 'Email confirmado correctamente'
        })
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def empresas_aprobadas(self, request):
        """Obtener todas las empresas aprobadas (desde el modelo unificado Empresa)"""
        from apps.empresas.models import Empresa
        from apps.empresas.serializers import (
            EmpresaproductoListSerializer, EmpresaservicioListSerializer, EmpresaMixtaListSerializer
        )
        from django.db.models import Q
        import logging
        
        logger = logging.getLogger(__name__)
        
        # Obtener parámetros de filtro y búsqueda
        search = request.query_params.get('search', '')
        tipo_empresa = request.query_params.get('tipo_empresa', '')
        exporta = request.query_params.get('exporta', '')
        departamento = request.query_params.get('departamento', '')
        rubro = request.query_params.get('rubro', '')
        
        # Obtener todas las empresas aprobadas usando el modelo unificado
        empresas = Empresa.objects.select_related(
            'tipo_empresa', 'id_rubro', 'departamento', 'municipio', 'localidad', 'id_usuario'
        ).prefetch_related('productos_empresa', 'servicios_empresa', 'productos_mixta', 'servicios_mixta')
        
        # Aplicar filtros
        if search:
            empresas = empresas.filter(
                Q(razon_social__icontains=search) |
                Q(cuit_cuil__icontains=search) |
                Q(correo__icontains=search)
            )
        
        if tipo_empresa:
            empresas = empresas.filter(tipo_empresa_valor=tipo_empresa)
        
        if exporta:
            if exporta == 'si':
                empresas = empresas.filter(exporta='Sí')
            elif exporta == 'no':
                empresas = empresas.filter(exporta='No, solo ventas nacionales')
        
        if departamento:
            empresas = empresas.filter(departamento__nomdpto__icontains=departamento)
        
        if rubro:
            empresas = empresas.filter(id_rubro__nombre__icontains=rubro)
        
        # Separar por tipo para usar los serializers apropiados
        empresas_producto = empresas.filter(tipo_empresa_valor='producto')
        empresas_servicio = empresas.filter(tipo_empresa_valor='servicio')
        empresas_mixta = empresas.filter(tipo_empresa_valor='mixta')
        
        # Serializar todas las empresas
        empresas_producto_data = EmpresaproductoListSerializer(empresas_producto, many=True).data
        empresas_servicio_data = EmpresaservicioListSerializer(empresas_servicio, many=True).data
        empresas_mixta_data = EmpresaMixtaListSerializer(empresas_mixta, many=True).data
        
        # Agregar tipo a cada empresa para identificarlas
        for empresa in empresas_producto_data:
            empresa['tipo_empresa'] = 'producto'
            empresa['estado'] = 'aprobada'
        
        for empresa in empresas_servicio_data:
            empresa['tipo_empresa'] = 'servicio'
            empresa['estado'] = 'aprobada'
        
        for empresa in empresas_mixta_data:
            empresa['tipo_empresa'] = 'mixta'
            empresa['estado'] = 'aprobada'
        
        # Combinar todas las empresas y eliminar duplicados por ID
        todas_empresas = empresas_producto_data + empresas_servicio_data + empresas_mixta_data
        
        # Eliminar duplicados basándose en el ID (por si acaso)
        empresas_unicas = {}
        for empresa in todas_empresas:
            empresa_id = empresa.get('id')
            if empresa_id and empresa_id not in empresas_unicas:
                empresas_unicas[empresa_id] = empresa
        
        todas_empresas = list(empresas_unicas.values())
        
        # Ordenar por fecha de creación (más recientes primero)
        todas_empresas.sort(key=lambda x: x.get('fecha_creacion', ''), reverse=True)
        
        # Paginación manual
        from rest_framework.pagination import PageNumberPagination
        paginator = PageNumberPagination()
        paginator.page_size = int(request.query_params.get('page_size', 20))
        page = int(request.query_params.get('page', 1))
        
        start = (page - 1) * paginator.page_size
        end = start + paginator.page_size
        
        resultados = todas_empresas[start:end]
        
        return Response({
            'count': len(todas_empresas),
            'results': resultados,
            'next': f'?page={page + 1}' if end < len(todas_empresas) else None,
            'previous': f'?page={page - 1}' if page > 1 else None,
        })
    
    @action(detail=False, methods=['get'], url_path='empresas_aprobadas/(?P<empresa_id>[0-9]+)', permission_classes=[permissions.IsAuthenticated])
    def empresa_por_id(self, request, empresa_id=None):
        """Obtener una empresa aprobada por ID (sin importar tipo)"""
        from apps.empresas.models import Empresa
        from apps.empresas.serializers import (
            EmpresaproductoSerializer, EmpresaservicioSerializer, EmpresaMixtaSerializer
        )
        import logging
        
        logger = logging.getLogger(__name__)
        
        try:
            empresa_id_int = int(empresa_id)
        except ValueError:
            return Response(
                {'error': 'ID de empresa inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Buscar empresa usando el modelo unificado
        try:
            empresa = Empresa.objects.select_related(
                'tipo_empresa', 'id_rubro', 'departamento', 'municipio', 'localidad', 'id_usuario'
            ).prefetch_related('productos_empresa', 'servicios_empresa', 'productos_mixta', 'servicios_mixta').get(id=empresa_id_int)
            tipo_empresa = empresa.tipo_empresa_valor
            
            # Usar el serializer apropiado según el tipo
            if tipo_empresa == 'producto':
                serializer = EmpresaproductoSerializer(empresa)
            elif tipo_empresa == 'servicio':
                serializer = EmpresaservicioSerializer(empresa)
            else:  # mixta
                serializer = EmpresaMixtaSerializer(empresa)
        except Empresa.DoesNotExist:
            empresa = None
        
        if empresa is None:
            return Response(
                {'error': 'Empresa no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        data = serializer.data
        data['tipo_empresa'] = tipo_empresa
        data['estado'] = 'aprobada'
        
        return Response(data)
    
    @action(detail=False, methods=['patch', 'put'], url_path='empresas_aprobadas/(?P<empresa_id>[0-9]+)/actualizar', permission_classes=[permissions.IsAuthenticated])
    def actualizar_empresa_por_id(self, request, empresa_id=None):
        """Actualizar una empresa aprobada por ID (sin importar tipo)"""
        from apps.empresas.models import Empresa
        from apps.empresas.serializers import (
            EmpresaproductoSerializer, EmpresaservicioSerializer, EmpresaMixtaSerializer
        )
        import logging
        
        logger = logging.getLogger(__name__)
        
        try:
            empresa_id_int = int(empresa_id)
        except ValueError:
            return Response(
                {'error': 'ID de empresa inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Buscar empresa usando el modelo unificado
        try:
            empresa = Empresa.objects.get(id=empresa_id_int)
            tipo_empresa = empresa.tipo_empresa_valor
            
            # Usar el serializer apropiado según el tipo
            if tipo_empresa == 'producto':
                serializer_class = EmpresaproductoSerializer
            elif tipo_empresa == 'servicio':
                serializer_class = EmpresaservicioSerializer
            else:  # mixta
                serializer_class = EmpresaMixtaSerializer
        except Empresa.DoesNotExist:
            empresa = None
        
        if empresa is None:
            return Response(
                {'error': 'Empresa no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = serializer_class(empresa, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(actualizado_por=request.user)
            data = serializer.data
            data['tipo_empresa'] = tipo_empresa
            data['estado'] = 'aprobada'
            return Response(data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['delete'], url_path='empresas_aprobadas/(?P<empresa_id>[0-9]+)/eliminar', permission_classes=[permissions.IsAuthenticated])
    def eliminar_empresa_por_id(self, request, empresa_id=None):
        """Eliminar una empresa aprobada por ID (sin importar tipo)"""
        from apps.empresas.models import Empresaproducto, Empresaservicio, EmpresaMixta
        import logging
        
        logger = logging.getLogger(__name__)
        
        try:
            empresa_id_int = int(empresa_id)
        except ValueError:
            return Response(
                {'error': 'ID de empresa inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Buscar empresa usando el modelo unificado
        from apps.empresas.models import Empresa
        empresa = None
        tipo_empresa = None
        
        try:
            empresa = Empresa.objects.get(id=empresa_id_int)
            tipo_empresa = empresa.tipo_empresa_valor
        except Empresa.DoesNotExist:
            pass
        
        if empresa is None:
            return Response(
                {'error': 'Empresa no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Guardar información antes de eliminar para el log
        razon_social = empresa.razon_social
        
        try:
            # Eliminar la empresa (soft delete si tiene el método, sino hard delete)
            if hasattr(empresa, 'delete'):
                empresa.delete()
            else:
                empresa.delete()
            
            logger.info(f"Empresa eliminada: ID={empresa_id_int}, Tipo={tipo_empresa}, Razón Social={razon_social}")
            
            return Response({
                'status': 'success',
                'message': f'Empresa {razon_social} eliminada correctamente',
                'tipo_empresa': tipo_empresa
            })
        except Exception as e:
            logger.error(f"Error al eliminar empresa ID={empresa_id_int}: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Error al eliminar la empresa: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def estadisticas(self, request):
        """Obtener estadísticas de solicitudes para el dashboard"""
        from django.utils import timezone
        from datetime import timedelta
        from apps.empresas.models import Empresa, MatrizClasificacionExportador
        
        queryset = self.get_queryset()
        total = queryset.count()
        
        # Estadísticas por estado
        pendientes = queryset.filter(estado='pendiente').count()
        aprobadas = queryset.filter(estado='aprobada').count()
        rechazadas = queryset.filter(estado='rechazada').count()
        en_revision = queryset.filter(estado='en_revision').count()
        
        # Obtener todas las empresas aprobadas usando el modelo unificado
        from apps.empresas.models import Empresa
        empresas_aprobadas = Empresa.objects.all()
        
        # Estadísticas de categoría basadas en matriz de clasificación
        exportadoras = 0
        potencial_exportadora = 0
        etapa_inicial = 0
        
        # Contar por categoría usando la matriz de clasificación (usando el campo empresa unificado)
        matrices = MatrizClasificacionExportador.objects.filter(empresa__isnull=False).select_related('empresa')
        
        for matriz in matrices:
            if matriz.categoria == 'exportadora':
                exportadoras += 1
            elif matriz.categoria == 'potencial_exportadora':
                potencial_exportadora += 1
            else:
                etapa_inicial += 1
        
        # Si una empresa no tiene matriz, se cuenta como "Etapa Inicial"
        total_empresas_con_matriz = matrices.count()
        total_empresas_aprobadas = empresas_aprobadas.count()
        etapa_inicial += (total_empresas_aprobadas - total_empresas_con_matriz)
        
        # Estadísticas recientes (último mes)
        fecha_limite = timezone.now() - timedelta(days=30)
        recientes_30_dias = queryset.filter(fecha_creacion__gte=fecha_limite).count()
        
        # Estadísticas por tipo de empresa
        tipo_producto = queryset.filter(tipo_empresa='producto').count()
        tipo_servicio = queryset.filter(tipo_empresa='servicio').count()
        tipo_mixta = queryset.filter(tipo_empresa='mixta').count()
        
        # Estadísticas de certificación
        con_certificado_pyme = queryset.filter(certificado_pyme='si').count()
        
        # Empresas recientes (últimas 5) - usar empresas aprobadas del modelo unificado
        empresas_recientes_data = []
        
        # Obtener empresas recientes de todos los tipos usando el modelo unificado
        empresas_recientes = empresas_aprobadas.order_by('-fecha_creacion')[:5]
        
        for empresa in empresas_recientes:
            # Obtener categoría de la matriz
            categoria = "Etapa Inicial"
            try:
                # Usar el campo empresa unificado
                matriz = MatrizClasificacionExportador.objects.filter(empresa=empresa).first()
                
                if matriz:
                    categoria_map = {
                        'exportadora': 'Exportadora',
                        'potencial_exportadora': 'Potencial Exportadora',
                        'etapa_inicial': 'Etapa Inicial'
                    }
                    categoria = categoria_map.get(matriz.categoria, 'Etapa Inicial')
            except Exception:
                pass
            
            empresas_recientes_data.append({
                'id': empresa.id,
                'nombre': empresa.razon_social,
                'categoria': categoria,
                'ubicacion': (empresa.departamento.nomdpto if empresa.departamento else 'N/A') or 'N/A',
                'fecha': empresa.fecha_creacion.isoformat(),
                'estado': 'aprobada',
                'tipo_empresa': empresa.tipo_empresa_valor,  # Usar tipo_empresa_valor del modelo unificado
            })
        
        return Response({
            'total_empresas': total_empresas_aprobadas,
            'exportadoras': exportadoras,
            'potencial_exportadora': potencial_exportadora,
            'etapa_inicial': etapa_inicial,
            'pendientes': pendientes,
            'aprobadas': aprobadas,
            'rechazadas': rechazadas,
            'en_revision': en_revision,
            'recientes_30_dias': recientes_30_dias,
            'tipo_producto': tipo_producto,
            'tipo_servicio': tipo_servicio,
            'tipo_mixta': tipo_mixta,
            'con_certificado_pyme': con_certificado_pyme,
            'empresas_recientes': empresas_recientes_data,
        })
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def estadisticas_publicas(self, request):
        """Obtener estadísticas públicas de empresas aprobadas"""
        from apps.empresas.models import Empresa
        
        # Contar empresas aprobadas (estado='aprobada')
        solicitudes_aprobadas = self.get_queryset().filter(estado='aprobada')
        total_empresas_registradas = solicitudes_aprobadas.count()
        
        # Contar empresas exportadoras usando el modelo unificado
        total_empresas_exportadoras = Empresa.objects.filter(exporta='Sí').count()
        
        # Si no hay empresas aprobadas como empresas, usar datos de solicitudes
        if total_empresas_exportadoras == 0:
            empresas_exportadoras_solicitudes = solicitudes_aprobadas.filter(exporta='si').count()
            total_empresas_exportadoras = empresas_exportadoras_solicitudes
        
        return Response({
            'total_empresas_registradas': total_empresas_registradas,
            'total_empresas_exportadoras': total_empresas_exportadoras,
        })
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated], url_path='empresas_aprobadas/exportar_pdf')
    def exportar_empresas_aprobadas_pdf(self, request):
        """Exportar empresas aprobadas a PDF con identidad visual institucional"""
        from apps.empresas.models import Empresaproducto, Empresaservicio, EmpresaMixta
        from apps.empresas.utils import generate_empresas_aprobadas_pdf
        from django.db.models import Q
        
        # Obtener parámetros de filtro
        search = request.query_params.get('search', '')
        tipo_empresa = request.query_params.get('tipo_empresa', '')
        exporta = request.query_params.get('exporta', '')
        departamento = request.query_params.get('departamento', '')
        rubro = request.query_params.get('rubro', '')
        
        # Obtener campos seleccionados (si vienen en los parámetros)
        campos_seleccionados = request.query_params.getlist('campos', [])
        # Si no se especifican campos, usar los predeterminados
        if not campos_seleccionados:
            campos_seleccionados = ['exporta', 'importa', 'certificadopyme']
        
        # Obtener todas las empresas aprobadas
        empresas_producto = Empresaproducto.objects.select_related(
            'tipo_empresa', 'id_rubro', 'departamento', 'municipio', 'localidad', 'id_usuario'
        ).prefetch_related('productos')
        
        empresas_servicio = Empresaservicio.objects.select_related(
            'tipo_empresa', 'id_rubro', 'departamento', 'municipio', 'localidad', 'id_usuario'
        ).prefetch_related('servicios')
        
        empresas_mixta = EmpresaMixta.objects.select_related(
            'tipo_empresa', 'id_rubro', 'departamento', 'municipio', 'localidad', 'id_usuario'
        ).prefetch_related('productos', 'servicios')
        
        # Aplicar filtros (similar a empresas_aprobadas)
        if search:
            empresas_producto = empresas_producto.filter(
                Q(razon_social__icontains=search) |
                Q(cuit_cuil__icontains=search) |
                Q(correo__icontains=search)
            )
            empresas_servicio = empresas_servicio.filter(
                Q(razon_social__icontains=search) |
                Q(cuit_cuil__icontains=search) |
                Q(correo__icontains=search)
            )
            empresas_mixta = empresas_mixta.filter(
                Q(razon_social__icontains=search) |
                Q(cuit_cuil__icontains=search) |
                Q(correo__icontains=search)
            )
        
        if tipo_empresa:
            if tipo_empresa == 'producto':
                empresas_servicio = empresas_servicio.none()
                empresas_mixta = empresas_mixta.none()
            elif tipo_empresa == 'servicio':
                empresas_producto = empresas_producto.none()
                empresas_mixta = empresas_mixta.none()
            elif tipo_empresa == 'mixta':
                empresas_producto = empresas_producto.none()
                empresas_servicio = empresas_servicio.none()
        
        if exporta:
            if exporta == 'si':
                empresas_producto = empresas_producto.filter(exporta='Sí')
                empresas_servicio = empresas_servicio.filter(exporta='Sí')
                empresas_mixta = empresas_mixta.filter(exporta='Sí')
            elif exporta == 'no':
                empresas_producto = empresas_producto.filter(exporta='No, solo ventas nacionales')
                empresas_servicio = empresas_servicio.filter(exporta='No, solo ventas nacionales')
                empresas_mixta = empresas_mixta.filter(exporta='No, solo ventas nacionales')
        
        if departamento:
            empresas_producto = empresas_producto.filter(departamento__nomdpto__icontains=departamento)
            empresas_servicio = empresas_servicio.filter(departamento__nomdpto__icontains=departamento)
            empresas_mixta = empresas_mixta.filter(departamento__nomdpto__icontains=departamento)
        
        if rubro:
            empresas_producto = empresas_producto.filter(id_rubro__nombre__icontains=rubro)
            empresas_servicio = empresas_servicio.filter(id_rubro__nombre__icontains=rubro)
            empresas_mixta = empresas_mixta.filter(id_rubro__nombre__icontains=rubro)
        
        # Generar PDF
        pdf_response = generate_empresas_aprobadas_pdf(
            empresas_producto,
            empresas_servicio,
            empresas_mixta,
            campos_seleccionados
        )
        return pdf_response
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def mi_perfil(self, request):
        """Obtener la solicitud del usuario actual"""
        solicitud = self.get_queryset().filter(usuario_creado=request.user).first()
        if not solicitud:
            return Response(
                {'error': 'No se encontró una solicitud asociada a tu cuenta'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = SolicitudRegistroSerializer(solicitud)
        return Response(serializer.data)
    
    def update(self, request, *args, **kwargs):
        """Actualizar solicitud - solo el usuario puede actualizar su propia solicitud"""
        instance = self.get_object()
        
        # Verificar que el usuario es el dueño de la solicitud
        if instance.usuario_creado != request.user:
            return Response(
                {'error': 'No tienes permiso para actualizar esta solicitud'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)


class DocumentoSolicitudViewSet(viewsets.ModelViewSet):
    """ViewSet para documentos de solicitud"""
    queryset = DocumentoSolicitud.objects.select_related('solicitud').all()
    serializer_class = DocumentoSolicitudSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['solicitud', 'tipo_documento']
    ordering = ['-fecha_subida']


class NotificacionRegistroViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para notificaciones de registro (solo lectura)"""
    queryset = NotificacionRegistro.objects.select_related('solicitud').all()
    serializer_class = NotificacionRegistroSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageUsers]
    filterset_fields = ['solicitud', 'tipo', 'email_enviado']
    ordering = ['-fecha_creacion']

