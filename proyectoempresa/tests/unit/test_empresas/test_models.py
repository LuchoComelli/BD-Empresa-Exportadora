from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.core.models import RolUsuario, Dpto
from apps.empresas.models import TipoEmpresa, Rubro, Empresaproducto, ProductoEmpresa

User = get_user_model()

class RubroModelTest(TestCase):
    def setUp(self):
        self.rubro = Rubro.objects.create(
            nombre='Test Rubro',
            descripcion='Rubro de prueba',
            tipo='producto'
        )
    
    def test_rubro_creation(self):
        self.assertEqual(self.rubro.nombre, 'Test Rubro')
        self.assertEqual(self.rubro.tipo, 'producto')
        self.assertTrue(self.rubro.activo)
    
    def test_rubro_str(self):
        self.assertEqual(str(self.rubro), 'Test Rubro (Producto)')

class EmpresaproductoModelTest(TestCase):
    def setUp(self):
        self.rol = RolUsuario.objects.create(
            nombre='Test Rol',
            descripcion='Rol de prueba',
            nivel_acceso=1
        )
        
        self.usuario = User.objects.create_user(
            email='test@example.com',
            nombre='Test',
            apellido='User',
            rol=self.rol
        )
        
        self.dpto = Dpto.objects.create(
            nomdpto='Test Departamento',
            coddpto='TEST'
        )
        
        self.rubro = Rubro.objects.create(
            nombre='Test Rubro',
            descripcion='Rubro de prueba',
            tipo='producto'
        )
        
        self.tipo_empresa = TipoEmpresa.objects.create(
            nombre='Test Tipo',
            descripcion='Tipo de prueba'
        )
        
        self.empresa = Empresaproducto.objects.create(
            razon_social='Test Empresa',
            cuit_cuil='12345678901',
            direccion='Test Dirección',
            departamento=self.dpto,
            id_rubro=self.rubro,
            tipo_empresa=self.tipo_empresa,
            id_usuario=self.usuario
        )
    
    def test_empresa_creation(self):
        self.assertEqual(self.empresa.razon_social, 'Test Empresa')
        self.assertEqual(self.empresa.cuit_cuil, '12345678901')
        self.assertEqual(self.empresa.departamento, self.dpto)
        self.assertEqual(self.empresa.id_rubro, self.rubro)
        self.assertEqual(self.empresa.tipo_empresa, self.tipo_empresa)
        self.assertEqual(self.empresa.id_usuario, self.usuario)
    
    def test_empresa_str(self):
        self.assertEqual(str(self.empresa), 'Test Empresa')

class ProductoEmpresaModelTest(TestCase):
    def setUp(self):
        self.rol = RolUsuario.objects.create(
            nombre='Test Rol',
            descripcion='Rol de prueba',
            nivel_acceso=1
        )
        
        self.usuario = User.objects.create_user(
            email='test@example.com',
            nombre='Test',
            apellido='User',
            rol=self.rol
        )
        
        self.dpto = Dpto.objects.create(
            nomdpto='Test Departamento',
            coddpto='TEST'
        )
        
        self.rubro = Rubro.objects.create(
            nombre='Test Rubro',
            descripcion='Rubro de prueba',
            tipo='producto'
        )
        
        self.tipo_empresa = TipoEmpresa.objects.create(
            nombre='Test Tipo',
            descripcion='Tipo de prueba'
        )
        
        self.empresa = Empresaproducto.objects.create(
            razon_social='Test Empresa',
            cuit_cuil='12345678901',
            direccion='Test Dirección',
            departamento=self.dpto,
            id_rubro=self.rubro,
            tipo_empresa=self.tipo_empresa,
            id_usuario=self.usuario
        )
        
        self.producto = ProductoEmpresa.objects.create(
            empresa=self.empresa,
            nombre_producto='Test Producto',
            descripcion='Producto de prueba',
            capacidad_productiva=100.50,
            unidad_medida='kg',
            periodo_capacidad='mensual'
        )
    
    def test_producto_creation(self):
        self.assertEqual(self.producto.empresa, self.empresa)
        self.assertEqual(self.producto.nombre_producto, 'Test Producto')
        self.assertEqual(self.producto.capacidad_productiva, 100.50)
        self.assertEqual(self.producto.unidad_medida, 'kg')
        self.assertEqual(self.producto.periodo_capacidad, 'mensual')
        self.assertFalse(self.producto.es_principal)
    
    def test_producto_str(self):
        self.assertEqual(str(self.producto), 'Test Producto - Test Empresa')
