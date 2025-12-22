from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import (
    TipoEmpresa,
    Rubro,
    SubRubro,
    UnidadMedida,
    Otrorubro,
    Empresa,  # ✅ Modelo principal unificado
    Empresaproducto,
    Empresaservicio,
    EmpresaMixta,  # ⚠️ OBSOLETO: Mantener solo para compatibilidad temporal
    ProductoEmpresa,
    ServicioEmpresa,
    ProductoEmpresaMixta,
    ServicioEmpresaMixta,
    PosicionArancelaria,
    PosicionArancelariaMixta,
    MatrizClasificacionExportador,
)
from .serializers import (
    TipoEmpresaSerializer,
    RubroSerializer,
    SubRubroSerializer,
    UnidadMedidaSerializer,
    OtrorubroSerializer,
    EmpresaproductoSerializer,
    EmpresaproductoListSerializer,
    EmpresaservicioSerializer,
    EmpresaservicioListSerializer,
    EmpresaMixtaSerializer,
    EmpresaMixtaListSerializer,
    EmpresaSerializer,  # ✅ Nuevo serializer unificado
    EmpresaListSerializer,  # ✅ Nuevo serializer unificado
    ProductoEmpresaSerializer,
    ServicioEmpresaSerializer,
    ProductoEmpresaMixtaSerializer,
    ServicioEmpresaMixtaSerializer,
    PosicionArancelariaSerializer,
    PosicionArancelariaMixtaSerializer,
    MatrizClasificacionExportadorSerializer,
)
from apps.core.permissions import CanManageEmpresas, IsOwnerOrAdmin, CanManageOwnEmpresaProducts


class TipoEmpresaViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para tipos de empresa (solo lectura)"""

    queryset = TipoEmpresa.objects.filter(activo=True)
    serializer_class = TipoEmpresaSerializer
    permission_classes = [permissions.AllowAny]


class RubroViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para rubros (solo lectura)"""

    queryset = Rubro.objects.filter(activo=True).prefetch_related("subrubros")
    serializer_class = RubroSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ["tipo", "activo"]
    search_fields = ["nombre", "descripcion"]
    ordering_fields = ["orden", "nombre"]
    ordering = ["orden", "nombre"]
    pagination_class = None  # Desactivar paginación para rubros


class SubRubroViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para sub-rubros (solo lectura)"""

    queryset = SubRubro.objects.filter(activo=True).select_related("rubro")
    serializer_class = SubRubroSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ["rubro", "activo"]
    search_fields = ["nombre", "descripcion"]
    ordering_fields = ["orden", "nombre"]
    ordering = ["rubro__orden", "rubro__nombre", "orden", "nombre"]


class UnidadMedidaViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para unidades de medida (solo lectura)"""

    queryset = UnidadMedida.objects.filter(activo=True)
    serializer_class = UnidadMedidaSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ["tipo", "activo"]
    ordering = ["tipo", "nombre"]


class OtrorubroViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para otros rubros (solo lectura)"""

    queryset = Otrorubro.objects.filter(activo=True)
    serializer_class = OtrorubroSerializer
    permission_classes = [permissions.AllowAny]


class EmpresaproductoViewSet(viewsets.ModelViewSet):
    """ViewSet para empresas de producto"""

    queryset = Empresaproducto.objects.select_related(
        "tipo_empresa",
        "id_rubro",
        "departamento",
        "municipio",
        "localidad",
        "id_usuario",
    ).prefetch_related(
        "productos_empresa__posicion_arancelaria"  # ✅ AGREGAR ESTO
    )
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, CanManageEmpresas]
    filterset_fields = [
        "exporta",
        "importa",
        "certificadopyme",
        "tipo_empresa",
        "id_rubro",
        "promo2idiomas",
    ]
    search_fields = [
        "razon_social",
        "cuit_cuil",
        "correo",
        "nombre_fantasia",
        "telefono",
        "direccion",
        "departamento__nomdpto",
        "municipio__nommun",
        "localidad__nomloc",
        "id_rubro__nombre",
    ]
    ordering_fields = ["razon_social", "fecha_creacion"]
    ordering = ["-fecha_creacion"]

    def get_serializer_class(self):
        if self.action == "list":
            return EmpresaproductoListSerializer
        return EmpresaproductoSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filtrar por usuario si no es admin/staff y no tiene rol de dashboard
        # Los usuarios con roles de Administrador, Consultor o Analista pueden ver todas las empresas
        if self.request.user.is_authenticated:
            user = self.request.user
            # Verificar si el usuario puede ver todas las empresas
            can_view_all = (
                user.is_superuser or 
                user.is_staff or
                (user.rol and user.rol.nombre in ['Administrador', 'Consultor', 'Analista'])
            )
            
            # Si no puede ver todas, solo mostrar sus propias empresas
            if not can_view_all:
                queryset = queryset.filter(id_usuario=user)

        # Filtrar por categoría de matriz si se proporciona
        categoria_matriz = self.request.query_params.get("categoria_matriz")
        if categoria_matriz:
            queryset = queryset.filter(
                clasificaciones_exportador__categoria=categoria_matriz
            ).distinct()

        # Filtrar por sub_rubro si se proporciona (filtrar por rubro que tenga ese subrubro)
        sub_rubro = self.request.query_params.get('sub_rubro')
        if sub_rubro:
            # Filtrar empresas que tengan el subrubro especificado
            queryset = queryset.filter(
                models.Q(id_subrubro_id=sub_rubro) |
                models.Q(id_subrubro_producto_id=sub_rubro) |
                models.Q(id_subrubro_servicio_id=sub_rubro)
        ).distinct()

        # Filtrar por campos booleanos
        importa_param = self.request.query_params.get("importa")
        if importa_param:
            importa_bool = importa_param.lower() == "true"
            queryset = queryset.filter(importa=importa_bool)

        promo2idiomas_param = self.request.query_params.get("promo2idiomas")
        if promo2idiomas_param:
            promo2idiomas_bool = promo2idiomas_param.lower() == "true"
            queryset = queryset.filter(promo2idiomas=promo2idiomas_bool)

        certificadopyme_param = self.request.query_params.get("certificadopyme")
        if certificadopyme_param:
            certificadopyme_bool = certificadopyme_param.lower() == "true"
            queryset = queryset.filter(certificadopyme=certificadopyme_bool)

        return queryset

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

    def perform_update(self, serializer):
        serializer.save(actualizado_por=self.request.user)

    @action(detail=False, methods=["get"])
    def exportadoras(self, request):
        """Obtener solo empresas exportadoras"""
        empresas = self.get_queryset().filter(exporta="Sí")
        serializer = self.get_serializer(empresas, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def estadisticas(self, request):
        """Obtener estadísticas de empresas de producto"""
        queryset = self.get_queryset()
        return Response(
            {
                "total": queryset.count(),
                "exportadoras": queryset.filter(exporta="Sí").count(),
                "importadoras": queryset.filter(importa=True).count(),
                "con_certificado_pyme": queryset.filter(certificadopyme=True).count(),
                "con_certificaciones": queryset.filter(
                    certificacionesbool=True
                ).count(),
            }
        )


class EmpresaservicioViewSet(viewsets.ModelViewSet):
    """ViewSet para empresas de servicio"""

    queryset = Empresaservicio.objects.select_related(
        "tipo_empresa",
        "id_rubro",
        "departamento",
        "municipio",
        "localidad",
        "id_usuario",
    ).prefetch_related("servicios_empresa")
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, CanManageEmpresas]
    filterset_fields = [
        "exporta",
        "importa",
        "certificadopyme",
        "tipo_empresa",
        "id_rubro",
        "promo2idiomas",
    ]
    search_fields = [
        "razon_social",
        "cuit_cuil",
        "correo",
        "nombre_fantasia",
        "telefono",
        "direccion",
        "departamento__nomdpto",
        "municipio__nommun",
        "localidad__nomloc",
        "id_rubro__nombre",
    ]
    ordering_fields = ["razon_social", "fecha_creacion"]
    ordering = ["-fecha_creacion"]

    def get_serializer_class(self):
        if self.action == "list":
            return EmpresaservicioListSerializer
        return EmpresaservicioSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filtrar por usuario si no es admin/staff y no tiene rol de dashboard
        # Los usuarios con roles de Administrador, Consultor o Analista pueden ver todas las empresas
        if self.request.user.is_authenticated:
            user = self.request.user
            # Verificar si el usuario puede ver todas las empresas
            can_view_all = (
                user.is_superuser or 
                user.is_staff or
                (user.rol and user.rol.nombre in ['Administrador', 'Consultor', 'Analista'])
            )
            
            # Si no puede ver todas, solo mostrar sus propias empresas
            if not can_view_all:
                queryset = queryset.filter(id_usuario=user)

        # Filtrar por categoría de matriz si se proporciona
        categoria_matriz = self.request.query_params.get("categoria_matriz")
        if categoria_matriz:
            queryset = queryset.filter(
                clasificaciones_exportador__categoria=categoria_matriz
            ).distinct()

        # Filtrar por sub_rubro si se proporciona (filtrar por rubro que tenga ese subrubro)
        sub_rubro = self.request.query_params.get('sub_rubro')
        if sub_rubro:
            # Filtrar empresas que tengan el subrubro especificado
            queryset = queryset.filter(
                models.Q(id_subrubro_id=sub_rubro) |
                models.Q(id_subrubro_producto_id=sub_rubro) |
                models.Q(id_subrubro_servicio_id=sub_rubro)
            ).distinct()

        # Filtrar por campos booleanos
        importa_param = self.request.query_params.get("importa")
        if importa_param:
            importa_bool = importa_param.lower() == "true"
            queryset = queryset.filter(importa=importa_bool)

        promo2idiomas_param = self.request.query_params.get("promo2idiomas")
        if promo2idiomas_param:
            promo2idiomas_bool = promo2idiomas_param.lower() == "true"
            queryset = queryset.filter(promo2idiomas=promo2idiomas_bool)

        certificadopyme_param = self.request.query_params.get("certificadopyme")
        if certificadopyme_param:
            certificadopyme_bool = certificadopyme_param.lower() == "true"
            queryset = queryset.filter(certificadopyme=certificadopyme_bool)

        return queryset

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

    def perform_update(self, serializer):
        serializer.save(actualizado_por=self.request.user)


class EmpresaMixtaViewSet(viewsets.ModelViewSet):
    """ViewSet para empresas mixtas"""

    queryset = EmpresaMixta.objects.select_related(
        "tipo_empresa",
        "id_rubro",
        "id_subrubro_producto",
        "id_subrubro_producto__rubro",
        "id_subrubro_servicio",
        "id_subrubro_servicio__rubro",
        "departamento",
        "municipio",
        "localidad",
        "id_usuario",
    ).prefetch_related("productos_mixta", "servicios_mixta", "productos_mixta__posiciones_arancelarias")
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, CanManageEmpresas]
    filterset_fields = [
        "exporta",
        "importa",
        "certificadopyme",
        "tipo_empresa",
        "id_rubro",
        "promo2idiomas",
    ]
    search_fields = [
        "razon_social",
        "cuit_cuil",
        "correo",
        "nombre_fantasia",
        "telefono",
        "direccion",
        "departamento__nomdpto",
        "municipio__nommun",
        "localidad__nomloc",
        "id_rubro__nombre",
    ]
    ordering_fields = ["razon_social", "fecha_creacion"]
    ordering = ["-fecha_creacion"]

    def get_serializer_class(self):
        if self.action == "list":
            return EmpresaMixtaListSerializer
        return EmpresaMixtaSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filtrar por usuario si no es admin/staff y no tiene rol de dashboard
        # Los usuarios con roles de Administrador, Consultor o Analista pueden ver todas las empresas
        if self.request.user.is_authenticated:
            user = self.request.user
            # Verificar si el usuario puede ver todas las empresas
            can_view_all = (
                user.is_superuser or 
                user.is_staff or
                (user.rol and user.rol.nombre in ['Administrador', 'Consultor', 'Analista'])
            )
            
            # Si no puede ver todas, solo mostrar sus propias empresas
            if not can_view_all:
                queryset = queryset.filter(id_usuario=user)

        # Filtrar por categoría de matriz si se proporciona
        categoria_matriz = self.request.query_params.get("categoria_matriz")
        if categoria_matriz:
            queryset = queryset.filter(
                clasificaciones_exportador__categoria=categoria_matriz
            ).distinct()

        # Filtrar por sub_rubro si se proporciona (filtrar por rubro que tenga ese subrubro)
        sub_rubro = self.request.query_params.get('sub_rubro')
        if sub_rubro:
        # Filtrar empresas que tengan el subrubro especificado
            queryset = queryset.filter(
            models.Q(id_subrubro_id=sub_rubro) |
            models.Q(id_subrubro_producto_id=sub_rubro) |
            models.Q(id_subrubro_servicio_id=sub_rubro)
            ).distinct()

        # Filtrar por campos booleanos
        importa_param = self.request.query_params.get("importa")
        if importa_param:
            importa_bool = importa_param.lower() == "true"
            queryset = queryset.filter(importa=importa_bool)

        promo2idiomas_param = self.request.query_params.get("promo2idiomas")
        if promo2idiomas_param:
            promo2idiomas_bool = promo2idiomas_param.lower() == "true"
            queryset = queryset.filter(promo2idiomas=promo2idiomas_bool)

        certificadopyme_param = self.request.query_params.get("certificadopyme")
        if certificadopyme_param:
            certificadopyme_bool = certificadopyme_param.lower() == "true"
            queryset = queryset.filter(certificadopyme=certificadopyme_bool)

        return queryset

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

    def perform_update(self, serializer):
        serializer.save(actualizado_por=self.request.user)


class ProductoEmpresaViewSet(viewsets.ModelViewSet):
    """ViewSet para productos de empresa"""

    queryset = ProductoEmpresa.objects.select_related("empresa", "empresa__id_usuario").all()
    serializer_class = ProductoEmpresaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["empresa", "es_principal"]
    search_fields = ["nombre_producto", "descripcion"]
    ordering = ["-es_principal", "nombre_producto"]
    
    def get_permissions(self):
        """Permisos personalizados: permitir a usuarios gestionar productos de su propia empresa"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), CanManageOwnEmpresaProducts()]
        elif self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticatedOrReadOnly()]
        return [permissions.IsAuthenticated()]
    
    def perform_create(self, serializer):
        """Verificar que el usuario puede crear productos para la empresa especificada"""
        empresa = serializer.validated_data.get('empresa')
        if empresa:
            # Verificar permisos usando el permiso personalizado
            # Si el usuario es admin, ya fue verificado en has_permission
            # Si no es admin, verificar que la empresa pertenece al usuario
            user = self.request.user
            if not (user.is_superuser or user.is_staff):
                can_manage = CanManageEmpresas()
                if not can_manage.has_permission(self.request, self):
                    # No es admin, verificar propiedad
                    if empresa.id_usuario != user:
                        from rest_framework.exceptions import PermissionDenied
                        raise PermissionDenied("No tiene permiso para crear productos para esta empresa.")
        serializer.save()


class ServicioEmpresaViewSet(viewsets.ModelViewSet):
    """ViewSet para servicios de empresa"""

    queryset = ServicioEmpresa.objects.select_related("empresa", "empresa__id_usuario").all()
    serializer_class = ServicioEmpresaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["empresa", "es_principal", "tipo_servicio", "alcance_servicio"]
    search_fields = ["nombre_servicio", "descripcion"]
    ordering = ["-es_principal", "nombre_servicio"]
    
    def get_permissions(self):
        """Permisos personalizados: permitir a usuarios gestionar servicios de su propia empresa"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), CanManageOwnEmpresaProducts()]
        elif self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticatedOrReadOnly()]
        return [permissions.IsAuthenticated()]
    
    def perform_create(self, serializer):
        """Verificar que el usuario puede crear servicios para la empresa especificada"""
        empresa = serializer.validated_data.get('empresa')
        if empresa:
            # Verificar permisos usando el permiso personalizado
            user = self.request.user
            if not (user.is_superuser or user.is_staff):
                can_manage = CanManageEmpresas()
                if not can_manage.has_permission(self.request, self):
                    # No es admin, verificar propiedad
                    if empresa.id_usuario != user:
                        from rest_framework.exceptions import PermissionDenied
                        raise PermissionDenied("No tiene permiso para crear servicios para esta empresa.")
        serializer.save()


class ProductoEmpresaMixtaViewSet(viewsets.ModelViewSet):
    """ViewSet para productos de empresa mixta"""

    queryset = ProductoEmpresaMixta.objects.select_related("empresa", "empresa__id_usuario").all()
    serializer_class = ProductoEmpresaMixtaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["empresa", "es_principal"]
    search_fields = ["nombre_producto", "descripcion"]
    ordering = ["-es_principal", "nombre_producto"]
    
    def get_permissions(self):
        """Permisos personalizados: permitir a usuarios gestionar productos mixta de su propia empresa"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), CanManageOwnEmpresaProducts()]
        elif self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticatedOrReadOnly()]
        return [permissions.IsAuthenticated()]
    
    def perform_create(self, serializer):
        """Verificar que el usuario puede crear productos mixta para la empresa especificada"""
        empresa = serializer.validated_data.get('empresa')
        if empresa:
            # Verificar permisos usando el permiso personalizado
            user = self.request.user
            if not (user.is_superuser or user.is_staff):
                can_manage = CanManageEmpresas()
                if not can_manage.has_permission(self.request, self):
                    # No es admin, verificar propiedad
                    if empresa.id_usuario != user:
                        from rest_framework.exceptions import PermissionDenied
                        raise PermissionDenied("No tiene permiso para crear productos para esta empresa.")
        serializer.save()


class ServicioEmpresaMixtaViewSet(viewsets.ModelViewSet):
    """ViewSet para servicios de empresa mixta"""

    queryset = ServicioEmpresaMixta.objects.select_related("empresa", "empresa__id_usuario").all()
    serializer_class = ServicioEmpresaMixtaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["empresa", "es_principal", "tipo_servicio", "alcance_servicio"]
    search_fields = ["nombre_servicio", "descripcion"]
    ordering = ["-es_principal", "nombre_servicio"]
    
    def get_permissions(self):
        """Permisos personalizados: permitir a usuarios gestionar servicios mixta de su propia empresa"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), CanManageOwnEmpresaProducts()]
        elif self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticatedOrReadOnly()]
        return [permissions.IsAuthenticated()]
    
    def perform_create(self, serializer):
        """Verificar que el usuario puede crear servicios mixta para la empresa especificada"""
        empresa = serializer.validated_data.get('empresa')
        if empresa:
            # Verificar permisos usando el permiso personalizado
            user = self.request.user
            if not (user.is_superuser or user.is_staff):
                can_manage = CanManageEmpresas()
                if not can_manage.has_permission(self.request, self):
                    # No es admin, verificar propiedad
                    if empresa.id_usuario != user:
                        from rest_framework.exceptions import PermissionDenied
                        raise PermissionDenied("No tiene permiso para crear servicios para esta empresa.")
        serializer.save()


class PosicionArancelariaViewSet(viewsets.ModelViewSet):
    """ViewSet para posiciones arancelarias"""

    queryset = PosicionArancelaria.objects.select_related(
        "producto", "producto__empresa"
    ).all()
    serializer_class = PosicionArancelariaSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ["producto", "codigo_arancelario"]
    search_fields = [
        "codigo_arancelario",
        "descripcion_arancelaria",
        "producto__nombre_producto",
    ]
    ordering_fields = ["codigo_arancelario"]
    ordering = ["codigo_arancelario"]


class PosicionArancelariaMixtaViewSet(viewsets.ModelViewSet):
    """ViewSet para posiciones arancelarias de productos mixtos"""

    queryset = PosicionArancelariaMixta.objects.select_related(
        "producto", "producto__empresa"
    ).all()
    serializer_class = PosicionArancelariaMixtaSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ["producto", "codigo_arancelario", "es_principal"]
    search_fields = [
        "codigo_arancelario",
        "descripcion_arancelaria",
        "producto__nombre_producto",
    ]
    ordering_fields = ["codigo_arancelario", "es_principal"]
    ordering = ["-es_principal", "codigo_arancelario"]


class MatrizClasificacionExportadorViewSet(viewsets.ModelViewSet):
    """ViewSet para matriz de clasificación de exportador"""

    queryset = MatrizClasificacionExportador.objects.select_related(
        "empresa", "evaluado_por"
    ).all()
    serializer_class = MatrizClasificacionExportadorSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageEmpresas]
    filterset_fields = ["categoria", "empresa"]
    ordering = ["-fecha_evaluacion"]

    def get_queryset(self):
        """Filtrar por empresa si se proporciona"""
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get("empresa_id")

        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        return queryset

    def create(self, request, *args, **kwargs):
        """
        Crear o actualizar matriz de clasificación.
        Si ya existe una matriz para la empresa, la actualiza.
        Si no existe, crea una nueva.
        """
        from .models import MatrizClasificacionExportador
        import logging

        logger = logging.getLogger(__name__)
        logger.info(f"[Matriz] Recibiendo datos para guardar: {request.data}")

        # Obtener el ID de la empresa unificada
        empresa_id = request.data.get("empresa")

        logger.info(f"[Matriz] ID de empresa recibido: {empresa_id}")

        if not empresa_id:
            logger.warning("[Matriz] No se proporcionó ID de empresa")
            return Response(
                {"error": "Debe proporcionar el ID de la empresa"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Buscar si ya existe una matriz para esta empresa
        matriz_existente = MatrizClasificacionExportador.objects.filter(
            empresa_id=empresa_id
        ).first()

        logger.info(
            f"[Matriz] Buscando matriz para empresa_id={empresa_id}, encontrada: {matriz_existente is not None}"
        )

        if matriz_existente:
            # Actualizar matriz existente
            logger.info(
                f"[Matriz] Actualizando matriz existente ID={matriz_existente.id}"
            )
            serializer = self.get_serializer(
                matriz_existente, data=request.data, partial=False
            )
            if not serializer.is_valid():
                logger.error(
                    f"[Matriz] Errores de validación al actualizar: {serializer.errors}"
                )
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            # Guardar y forzar recalculo
            serializer.save(evaluado_por=request.user)

            # Refrescar desde la base de datos para asegurar que tenemos los valores actualizados
            matriz_existente.refresh_from_db()

            # Serializar nuevamente con los datos actualizados
            response_serializer = self.get_serializer(matriz_existente)

            logger.info(
                f"[Matriz] ✅ Matriz actualizada exitosamente, ID={matriz_existente.id}, puntaje_total={matriz_existente.puntaje_total}, categoria={matriz_existente.categoria}"
            )

            return Response(response_serializer.data, status=status.HTTP_200_OK)
        else:
            # Crear nueva matriz
            logger.info(
                f"[Matriz] Creando nueva matriz de clasificación para empresa_id={empresa_id}"
            )
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                logger.error(
                    f"[Matriz] Errores de validación al crear: {serializer.errors}"
                )
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            # Guardar
            self.perform_create(serializer)

            # Refrescar para obtener campos calculados
            serializer.instance.refresh_from_db()

            # Serializar con los datos completos
            response_serializer = self.get_serializer(serializer.instance)

            logger.info(
                f"[Matriz] ✅ Matriz creada exitosamente, ID={serializer.instance.id}, puntaje_total={serializer.instance.puntaje_total}, categoria={serializer.instance.categoria}"
            )

            headers = self.get_success_headers(response_serializer.data)
            return Response(
                response_serializer.data,
                status=status.HTTP_201_CREATED,
                headers=headers,
            )

    def perform_create(self, serializer):
        serializer.save(evaluado_por=self.request.user)

    def perform_update(self, serializer):
        serializer.save(evaluado_por=self.request.user)

    @action(detail=False, methods=["get"], url_path="empresa/(?P<empresa_id>[0-9]+)")
    def obtener_matriz_empresa(self, request, empresa_id=None):
        """
        Obtener la matriz de clasificación de una empresa específica
        """
        from rest_framework.response import Response
        from rest_framework import status

        try:
            empresa_id_int = int(empresa_id)
        except ValueError:
            return Response(
                {"error": "ID de empresa inválido"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Buscar matriz usando el campo empresa unificado
        try:
            matriz = MatrizClasificacionExportador.objects.filter(
                empresa_id=empresa_id_int
            ).first()
            if matriz:
                serializer = self.get_serializer(matriz)
                return Response(serializer.data)
            else:
                return Response(
                    {
                        "error": "No se encontró matriz de clasificación para esta empresa"
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )
        except Exception as e:
            return Response(
                {"error": f"Error al buscar matriz: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(
        detail=False,
        methods=["get"],
        url_path="calcular-puntajes/(?P<empresa_id>[0-9]+)",
    )
    def calcular_puntajes(self, request, empresa_id=None):
        """
        Calcular automáticamente los puntajes de matriz para una empresa
        """
        from .utils import calcular_puntajes_matriz
        from rest_framework.response import Response
        from rest_framework import status

        try:
            empresa_id_int = int(empresa_id)
        except ValueError:
            return Response(
                {"error": "ID de empresa inválido"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Buscar la empresa usando el modelo unificado
        try:
            empresa = (
                Empresa.objects.select_related(
                    "tipo_empresa",
                    "id_rubro",
                    "departamento",
                    "municipio",
                    "localidad",
                    "id_usuario",
                )
                .prefetch_related(
                    "productos_empresa__posicion_arancelaria",
                    "productos_mixta__posiciones_arancelarias",
                )
                .get(id=empresa_id_int)
            )

            tipo_empresa = empresa.tipo_empresa_valor
        except Empresa.DoesNotExist:
            import logging

            logger = logging.getLogger(__name__)
            logger.warning(f"Empresa con ID {empresa_id_int} no encontrada")
            return Response(
                {"error": f"Empresa con ID {empresa_id_int} no encontrada"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Calcular puntajes
        resultado = calcular_puntajes_matriz(empresa)
        puntajes = resultado.get("puntajes", {})
        opciones = resultado.get("opciones", {})

        # Calcular puntaje total y categoría
        puntaje_total = sum(puntajes.values())
        if puntaje_total >= 12:
            categoria = "exportadora"
        elif puntaje_total >= 6:
            categoria = "potencial_exportadora"
        else:
            categoria = "etapa_inicial"

        return Response(
            {
                "empresa_id": empresa_id_int,
                "tipo_empresa": tipo_empresa,
                "razon_social": empresa.razon_social,
                "puntajes": puntajes,
                "opciones": opciones,
                "puntaje_total": puntaje_total,
                "puntaje_maximo": 18,
                "categoria": categoria,
            }
        )


# ============================================================================
# PAGINACIÓN PERSONALIZADA PARA EMPRESAS
# ============================================================================

class EmpresaPagination(PageNumberPagination):
    """
    Paginación personalizada que permite valores grandes de page_size
    cuando se solicita desde el frontend
    """
    page_size = 20  # Valor por defecto
    page_size_query_param = 'page_size'
    max_page_size = 10000  # Permitir hasta 10000 resultados por página
    
    def get_page_size(self, request):
        """
        Permite que el frontend especifique un page_size grande
        para obtener todas las empresas. Respeta el parámetro page_size de la query.
        """
        if self.page_size_query_param:
            page_size = request.query_params.get(self.page_size_query_param)
            if page_size is not None:
                try:
                    page_size = int(page_size)
                    # Limitar al máximo permitido
                    return min(page_size, self.max_page_size)
                except (KeyError, ValueError):
                    pass
        return self.page_size

# ============================================================================
# VIEWSET UNIFICADO PARA EMPRESA (REEMPLAZA LOS PROXY MODELS)
# ============================================================================

class EmpresaViewSet(viewsets.ModelViewSet):
    """ViewSet unificado para todas las empresas (reemplaza EmpresaproductoViewSet, EmpresaservicioViewSet, EmpresaMixtaViewSet)"""
    
    queryset = Empresa.objects.select_related(
        "tipo_empresa",
        "id_rubro",
        "id_subrubro",
        "id_subrubro__rubro",
        "id_subrubro_producto",
        "id_subrubro_producto__rubro",
        "id_subrubro_servicio",
        "id_subrubro_servicio__rubro",
        "departamento",
        "municipio",
        "localidad",
        "id_usuario",
    ).prefetch_related(
        "productos_empresa__posicion_arancelaria",
        "productos_mixta__posiciones_arancelarias",
        "servicios_empresa",
        "servicios_mixta"
    )
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, CanManageEmpresas, IsOwnerOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        "exporta",
        "importa",
        "certificadopyme",
        "tipo_empresa",
        "id_rubro",
        "promo2idiomas",
        "tipo_empresa_valor",  # Filtrar por tipo de empresa
    ]
    search_fields = [
        "razon_social",
        "cuit_cuil",
        "correo",
        "nombre_fantasia",
        "telefono",
        "direccion",
        "departamento__nombre",
        "municipio__nombre",
        "localidad__nombre",
        "id_rubro__nombre",
    ]
    ordering_fields = ["razon_social", "fecha_creacion"]
    ordering = ["-fecha_creacion"]
    pagination_class = EmpresaPagination  # Usar paginación personalizada

    def get_serializer_class(self):
        if self.action == "list":
            return EmpresaListSerializer
        return EmpresaSerializer

    def get_queryset(self):
        # Verificar si se solicita ver empresas eliminadas
        eliminado_param = self.request.query_params.get("eliminado", "").lower()
        mostrar_eliminadas = eliminado_param == "true"
        mostrar_todas = eliminado_param == "all"
        
        # Si se solicitan eliminadas o todas, usar all_objects para incluir todas las empresas
        if mostrar_eliminadas or mostrar_todas:
            queryset = Empresa.all_objects.select_related(
                "tipo_empresa",
                "id_rubro",
                "id_subrubro",
                "id_subrubro__rubro",
                "id_subrubro_producto",
                "id_subrubro_producto__rubro",
                "id_subrubro_servicio",
                "id_subrubro_servicio__rubro",
                "departamento",
                "municipio",
                "localidad",
                "id_usuario",
            ).prefetch_related(
                "productos_empresa__posicion_arancelaria",
                "productos_mixta__posiciones_arancelarias",
                "servicios_empresa",
                "servicios_mixta"
            )
        else:
            queryset = super().get_queryset()

        # Filtrar por usuario si no es admin/staff y no tiene rol de dashboard
        # Los usuarios con roles de Administrador, Consultor o Analista pueden ver todas las empresas
        if self.request.user.is_authenticated:
            user = self.request.user
            # Verificar si el usuario puede ver todas las empresas
            can_view_all = (
                user.is_superuser or 
                user.is_staff or
                (user.rol and user.rol.nombre in ['Administrador', 'Consultor', 'Analista'])
            )
            
            # Si no puede ver todas, solo mostrar sus propias empresas
            if not can_view_all:
                queryset = queryset.filter(id_usuario=user)

        # Filtrar por tipo de empresa si se proporciona
        tipo_empresa_valor = self.request.query_params.get("tipo_empresa_valor")
        if tipo_empresa_valor and tipo_empresa_valor != 'all':
            queryset = queryset.filter(tipo_empresa_valor=tipo_empresa_valor)

        # Filtrar por categoría de matriz si se proporciona
        categoria_matriz = self.request.query_params.get("categoria_matriz")
        if categoria_matriz:
            # Mapear los valores del frontend a los valores de la base de datos
            categoria_map = {
                'Exportadora': 'exportadora',
                'Potencial': 'potencial_exportadora',
                'Potencial Exportadora': 'potencial_exportadora',
                'Etapa Inicial': 'etapa_inicial',
                # También aceptar los valores directos de la BD por si acaso
                'exportadora': 'exportadora',
                'potencial_exportadora': 'potencial_exportadora',
                'etapa_inicial': 'etapa_inicial',
            }
            categoria_db = categoria_map.get(categoria_matriz, categoria_matriz.lower())
            queryset = queryset.filter(
                clasificaciones_exportador__categoria=categoria_db
            ).distinct()

        # Filtrar por departamento si se proporciona (puede ser ID o nombre)
        departamento_param = self.request.query_params.get("departamento")
        if departamento_param:
            # Intentar primero como ID (número)
            try:
                departamento_id = int(departamento_param)
                queryset = queryset.filter(departamento_id=departamento_id)
            except ValueError:
                # Si no es un número, buscar por nombre
                queryset = queryset.filter(departamento__nombre__icontains=departamento_param)

        # Filtrar por sub_rubro si se proporciona
        sub_rubro = self.request.query_params.get('sub_rubro')
        if sub_rubro:
            queryset = queryset.filter(
                Q(id_subrubro_id=sub_rubro) |
                Q(id_subrubro_producto_id=sub_rubro) |
                Q(id_subrubro_servicio_id=sub_rubro)
            ).distinct()

        # Filtrar por campos booleanos
        importa_param = self.request.query_params.get("importa")
        if importa_param:
            importa_bool = importa_param.lower() == "true"
            queryset = queryset.filter(importa=importa_bool)

        promo2idiomas_param = self.request.query_params.get("promo2idiomas")
        if promo2idiomas_param:
            promo2idiomas_bool = promo2idiomas_param.lower() == "true"
            queryset = queryset.filter(promo2idiomas=promo2idiomas_bool)

        certificadopyme_param = self.request.query_params.get("certificadopyme")
        if certificadopyme_param:
            certificadopyme_bool = certificadopyme_param.lower() == "true"
            queryset = queryset.filter(certificadopyme=certificadopyme_bool)

        # Filtrar por estado de eliminación
        if mostrar_eliminadas:
            # Solo mostrar eliminadas
            queryset = queryset.filter(eliminado=True)
        elif not mostrar_todas:
            # Por defecto, solo mostrar activas (no eliminadas)
            queryset = queryset.filter(eliminado=False)
        # Si mostrar_todas es True, no aplicar filtro (mostrar todas)

        return queryset

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

    def perform_update(self, serializer):
        serializer.save(actualizado_por=self.request.user)

    def perform_destroy(self, instance):
        """
        Realizar soft delete en lugar de eliminación permanente.
        Marca la empresa como eliminada y guarda quién la eliminó.
        También desactiva el usuario asociado para impedir el login.
        """
        from django.utils import timezone
        from apps.core.models import Usuario
        
        instance.eliminado = True
        instance.fecha_eliminacion = timezone.now()
        instance.eliminado_por = self.request.user
        instance.save()
        
        # Desactivar el usuario asociado si existe
        if instance.id_usuario:
            usuario = instance.id_usuario
            usuario.is_active = False
            usuario.save(update_fields=['is_active'])

    def get_object(self):
        """
        Sobrescribir get_object para usar all_objects cuando se necesita acceder a empresas eliminadas.
        Esto es necesario para acciones como 'restore', 'retrieve' y 'update' que necesitan encontrar empresas eliminadas.
        """
        # Acciones que necesitan acceder a empresas eliminadas
        acciones_con_eliminadas = ['restore', 'retrieve', 'update', 'partial_update']
        
        if self.action in acciones_con_eliminadas:
            lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
            lookup_value = self.kwargs[lookup_url_kwarg]
            filter_kwargs = {self.lookup_field: lookup_value}
            
            # Usar all_objects para incluir empresas eliminadas
            queryset = Empresa.all_objects.select_related(
                "tipo_empresa",
                "id_rubro",
                "id_subrubro",
                "id_subrubro__rubro",
                "id_subrubro_producto",
                "id_subrubro_producto__rubro",
                "id_subrubro_servicio",
                "id_subrubro_servicio__rubro",
                "departamento",
                "municipio",
                "localidad",
                "id_usuario",
            ).prefetch_related(
                "productos_empresa__posicion_arancelaria",
                "productos_mixta__posiciones_arancelarias",
                "servicios_empresa",
                "servicios_mixta"
            )
            
            # Aplicar filtros de permisos si es necesario
            if self.request.user.is_authenticated:
                user = self.request.user
                can_view_all = (
                    user.is_superuser or 
                    user.is_staff or
                    (user.rol and user.rol.nombre in ['Administrador', 'Consultor', 'Analista'])
                )
                
                if not can_view_all:
                    queryset = queryset.filter(id_usuario=user)
            
            obj = queryset.get(**filter_kwargs)
            self.check_object_permissions(self.request, obj)
            return obj
        
        # Para otras acciones, usar el comportamiento por defecto
        return super().get_object()

    @action(detail=True, methods=['post'], url_path='restore')
    def restore(self, request, pk=None):
        """
        Restaurar una empresa eliminada (soft delete).
        Marca la empresa como no eliminada y reactiva el usuario asociado.
        """
        empresa = self.get_object()
        if not empresa.eliminado:
            return Response(
                {'error': 'La empresa no está eliminada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        empresa.eliminado = False
        empresa.fecha_eliminacion = None
        empresa.eliminado_por = None
        empresa.save()
        
        # Reactivar el usuario asociado si existe
        if empresa.id_usuario:
            usuario = empresa.id_usuario
            usuario.is_active = True
            usuario.save(update_fields=['is_active'])
        
        # Refrescar el objeto desde la base de datos para asegurar que todos los campos estén actualizados
        empresa.refresh_from_db()
        
        serializer = self.get_serializer(empresa)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"])
    def exportadoras(self, request):
        """Obtener solo empresas exportadoras"""
        empresas = self.get_queryset().filter(exporta="Sí")
        serializer = self.get_serializer(empresas, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def estadisticas(self, request):
        """Obtener estadísticas de empresas"""
        queryset = self.get_queryset()
        return Response(
            {
                "total": queryset.count(),
                "exportadoras": queryset.filter(exporta="Sí").count(),
                "importadoras": queryset.filter(importa=True).count(),
                "con_certificado_pyme": queryset.filter(certificadopyme=True).count(),
                "con_certificaciones": queryset.filter(
                    certificacionesbool=True
                ).count(),
            }
        )
