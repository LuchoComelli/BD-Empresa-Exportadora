from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.core.models import RolUsuario, Dpto, Municipio, Localidades

User = get_user_model()

class RolUsuarioModelTest(TestCase):
    def setUp(self):
        self.rol = RolUsuario.objects.create(
            nombre='Test Rol',
            descripcion='Rol de prueba',
            nivel_acceso=1
        )
    
    def test_rol_creation(self):
        self.assertEqual(self.rol.nombre, 'Test Rol')
        self.assertEqual(self.rol.nivel_acceso, 1)
        self.assertTrue(self.rol.activo)
    
    def test_rol_str(self):
        self.assertEqual(str(self.rol), 'Test Rol (Nivel 1)')

class UsuarioModelTest(TestCase):
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
    
    def test_usuario_creation(self):
        self.assertEqual(self.usuario.email, 'test@example.com')
        self.assertEqual(self.usuario.nombre, 'Test')
        self.assertEqual(self.usuario.apellido, 'User')
        self.assertEqual(self.usuario.rol, self.rol)
    
    def test_usuario_str(self):
        expected = f"{self.usuario.nombre} {self.usuario.apellido} ({self.usuario.email}) - {self.usuario.rol.nombre}"
        self.assertEqual(str(self.usuario), expected)
    
    def test_get_full_name(self):
        self.assertEqual(self.usuario.get_full_name(), 'Test User')
    
    def test_get_short_name(self):
        self.assertEqual(self.usuario.get_short_name(), 'Test')

class DptoModelTest(TestCase):
    def setUp(self):
        self.dpto = Dpto.objects.create(
            nomdpto='Test Departamento',
            coddpto='TEST'
        )
    
    def test_dpto_creation(self):
        self.assertEqual(self.dpto.nomdpto, 'Test Departamento')
        self.assertEqual(self.dpto.coddpto, 'TEST')
        self.assertTrue(self.dpto.activo)
    
    def test_dpto_str(self):
        self.assertEqual(str(self.dpto), 'Test Departamento')

class MunicipioModelTest(TestCase):
    def setUp(self):
        self.dpto = Dpto.objects.create(
            nomdpto='Test Departamento',
            coddpto='TEST'
        )
        
        self.municipio = Municipio.objects.create(
            nommun='Test Municipio',
            dpto=self.dpto
        )
    
    def test_municipio_creation(self):
        self.assertEqual(self.municipio.nommun, 'Test Municipio')
        self.assertEqual(self.municipio.dpto, self.dpto)
        self.assertTrue(self.municipio.activo)
    
    def test_municipio_str(self):
        self.assertEqual(str(self.municipio), 'Test Municipio - Test Departamento')

class LocalidadesModelTest(TestCase):
    def setUp(self):
        self.dpto = Dpto.objects.create(
            nomdpto='Test Departamento',
            coddpto='TEST'
        )
        
        self.municipio = Municipio.objects.create(
            nommun='Test Municipio',
            dpto=self.dpto
        )
        
        self.localidad = Localidades.objects.create(
            nomloc='Test Localidad',
            municipio=self.municipio,
            latitud=-34.6037,
            longitud=-58.3816
        )
    
    def test_localidad_creation(self):
        self.assertEqual(self.localidad.nomloc, 'Test Localidad')
        self.assertEqual(self.localidad.municipio, self.municipio)
        self.assertTrue(self.localidad.activo)
    
    def test_localidad_str(self):
        self.assertEqual(str(self.localidad), 'Test Localidad - Test Municipio')
