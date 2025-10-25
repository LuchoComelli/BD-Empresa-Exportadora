from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.core.models import RolUsuario
from apps.auditoria.models import AuditoriaLog

User = get_user_model()

class AuditoriaLogModelTest(TestCase):
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
        
        self.log = AuditoriaLog.objects.create(
            usuario=self.usuario,
            accion='CREATE',
            modelo_afectado='TestModel',
            objeto_id=1,
            nombre_objeto='Test Object',
            descripcion='Test description',
            categoria='COMPANY_MANAGEMENT',
            nivel_criticidad='INFO'
        )
    
    def test_log_creation(self):
        self.assertEqual(self.log.usuario, self.usuario)
        self.assertEqual(self.log.accion, 'CREATE')
        self.assertEqual(self.log.modelo_afectado, 'TestModel')
        self.assertEqual(self.log.objeto_id, 1)
        self.assertEqual(self.log.nombre_objeto, 'Test Object')
        self.assertEqual(self.log.descripcion, 'Test description')
        self.assertEqual(self.log.categoria, 'COMPANY_MANAGEMENT')
        self.assertEqual(self.log.nivel_criticidad, 'INFO')
        self.assertTrue(self.log.exito)
    
    def test_log_str(self):
        expected = f"{self.log.timestamp} - {self.log.usuario} - {self.log.accion} - {self.log.modelo_afectado}"
        self.assertEqual(str(self.log), expected)
