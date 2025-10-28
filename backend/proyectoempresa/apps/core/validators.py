from django.core.exceptions import ValidationError
import re

def validate_cuit(value):
    """Validar CUIT/CUIL argentino"""
    if not re.match(r'^\d{11}$', value):
        raise ValidationError('CUIT debe tener exactamente 11 dígitos')
    
    # Validar dígito verificador
    # ... lógica de validación CUIT ...

def validate_telefono_argentino(value):
    """Validar teléfono argentino"""
    if not re.match(r'^\+?54\d{10}$', value):
        raise ValidationError('Formato de teléfono argentino inválido')
