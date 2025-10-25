from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import get_user_model
from .models import SolicitudRegistro, DocumentoSolicitud
from apps.core.models import RolUsuario
import re

User = get_user_model()

class SolicitudRegistroForm(forms.ModelForm):
    """
    Formulario para solicitud de registro de empresa
    """
    # Campos adicionales para validación
    confirmar_email = forms.EmailField(
        label="Confirmar Email",
        help_text="Repita el email para confirmar"
    )
    aceptar_terminos = forms.BooleanField(
        label="Acepto los términos y condiciones",
        required=True
    )
    
    class Meta:
        model = SolicitudRegistro
        fields = [
            'razon_social', 'cuit_cuil', 'direccion', 'departamento', 'municipio', 'localidad',
            'telefono', 'correo', 'sitioweb', 'tipo_empresa', 'rubro_principal', 'descripcion_actividad',
            'exporta', 'destino_exportacion', 'importa', 'tipo_importacion',
            'certificado_pyme', 'certificaciones', 'material_promocional_idiomas', 'idiomas_trabajo',
            'nombre_contacto', 'cargo_contacto', 'telefono_contacto', 'email_contacto'
        ]
        widgets = {
            'razon_social': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Ingrese la razón social de la empresa'
            }),
            'cuit_cuil': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '12345678901',
                'maxlength': '11'
            }),
            'direccion': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Dirección completa'
            }),
            'departamento': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Departamento o Provincia'
            }),
            'municipio': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Municipio (opcional)'
            }),
            'localidad': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Localidad (opcional)'
            }),
            'telefono': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '+54 9 11 1234-5678'
            }),
            'correo': forms.EmailInput(attrs={
                'class': 'form-control',
                'placeholder': 'empresa@ejemplo.com'
            }),
            'sitioweb': forms.URLInput(attrs={
                'class': 'form-control',
                'placeholder': 'https://www.empresa.com'
            }),
            'tipo_empresa': forms.Select(attrs={
                'class': 'form-control'
            }),
            'rubro_principal': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Ej: Agroindustria, Tecnología, etc.'
            }),
            'descripcion_actividad': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Describa brevemente las actividades de la empresa'
            }),
            'destino_exportacion': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Países o regiones de destino'
            }),
            'tipo_importacion': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Tipo de productos/servicios que importa'
            }),
            'certificaciones': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'ISO 9001, ISO 14001, etc.'
            }),
            'idiomas_trabajo': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Inglés, Portugués, etc.'
            }),
            'nombre_contacto': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Nombre completo del contacto'
            }),
            'cargo_contacto': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Gerente, Director, etc.'
            }),
            'telefono_contacto': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '+54 9 11 1234-5678'
            }),
            'email_contacto': forms.EmailInput(attrs={
                'class': 'form-control',
                'placeholder': 'contacto@empresa.com'
            }),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Hacer campos opcionales según el tipo de empresa
        self.fields['destino_exportacion'].required = False
        self.fields['tipo_importacion'].required = False
        self.fields['certificaciones'].required = False
        self.fields['idiomas_trabajo'].required = False
        self.fields['municipio'].required = False
        self.fields['localidad'].required = False
        self.fields['sitioweb'].required = False
    
    def clean_cuit_cuil(self):
        cuit = self.cleaned_data.get('cuit_cuil')
        if cuit:
            # Validar formato CUIT
            if not re.match(r'^\d{11}$', cuit):
                raise forms.ValidationError('El CUIT debe tener exactamente 11 dígitos')
            
            # Verificar que no exista otra solicitud con el mismo CUIT
            if SolicitudRegistro.objects.filter(cuit_cuil=cuit).exists():
                raise forms.ValidationError('Ya existe una solicitud con este CUIT')
        
        return cuit
    
    def clean_telefono(self):
        telefono = self.cleaned_data.get('telefono')
        if telefono:
            # Limpiar formato de teléfono
            telefono = re.sub(r'[^\d+]', '', telefono)
            if not re.match(r'^\+?54\d{10}$', telefono):
                raise forms.ValidationError('Formato de teléfono argentino inválido')
        return telefono
    
    def clean_telefono_contacto(self):
        telefono = self.cleaned_data.get('telefono_contacto')
        if telefono:
            # Limpiar formato de teléfono
            telefono = re.sub(r'[^\d+]', '', telefono)
            if not re.match(r'^\+?54\d{10}$', telefono):
                raise forms.ValidationError('Formato de teléfono argentino inválido')
        return telefono
    
    def clean(self):
        cleaned_data = super().clean()
        correo = cleaned_data.get('correo')
        confirmar_email = cleaned_data.get('confirmar_email')
        
        if correo and confirmar_email:
            if correo != confirmar_email:
                raise forms.ValidationError('Los emails no coinciden')
        
        return cleaned_data

class DocumentoSolicitudForm(forms.ModelForm):
    """
    Formulario para subir documentos
    """
    class Meta:
        model = DocumentoSolicitud
        fields = ['tipo_documento', 'archivo', 'descripcion']
        widgets = {
            'tipo_documento': forms.Select(attrs={'class': 'form-control'}),
            'archivo': forms.FileInput(attrs={'class': 'form-control'}),
            'descripcion': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Descripción del documento (opcional)'
            }),
        }
    
    def clean_archivo(self):
        archivo = self.cleaned_data.get('archivo')
        if archivo:
            # Validar tamaño (máximo 5MB)
            if archivo.size > 5 * 1024 * 1024:
                raise forms.ValidationError('El archivo no puede ser mayor a 5MB')
            
            # Validar tipo de archivo
            extensiones_permitidas = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']
            if not any(archivo.name.lower().endswith(ext) for ext in extensiones_permitidas):
                raise forms.ValidationError('Solo se permiten archivos PDF, JPG, PNG, DOC, DOCX')
        
        return archivo

class RegistroUsuarioForm(UserCreationForm):
    """
    Formulario para registro de usuarios del sistema (privado)
    """
    email = forms.EmailField(required=True)
    nombre = forms.CharField(max_length=50, required=True)
    apellido = forms.CharField(max_length=50, required=True)
    rol = forms.ModelChoiceField(
        queryset=RolUsuario.objects.filter(activo=True),
        required=True,
        empty_label="Seleccione un rol"
    )
    
    class Meta:
        model = User
        fields = ('email', 'nombre', 'apellido', 'rol', 'password1', 'password2')
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs.update({'class': 'form-control'})
    
    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        user.nombre = self.cleaned_data['nombre']
        user.apellido = self.cleaned_data['apellido']
        user.rol = self.cleaned_data['rol']
        if commit:
            user.save()
        return user
