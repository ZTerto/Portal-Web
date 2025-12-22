export type RegisterForm = {
  name: string;
  dni: string;
  phone: string;
  email: string;
  password: string;
};

//20251222
// Valida el registro
export function validateRegisterForm(form: RegisterForm): string | null {
  // Nombre
  if (!form.name.trim()) {
    return "El nombre no puede estar vacío";
  }

  // DNI
  if (form.dni) {
    const hasDigit = /\d/.test(form.dni);
    const startsOrEndsWithLetter =
      /^[A-Za-z]/.test(form.dni) || /[A-Za-z]$/.test(form.dni);

    if (!hasDigit || !startsOrEndsWithLetter) {
      return "El DNI debe contener números y empezar o terminar con una letra";
    }
  }

  // Teléfono
  if (form.phone) {
    if (!/^\d{9}$/.test(form.phone)) {
      return "El teléfono debe tener exactamente 9 dígitos";
    }
  }

  // Email
  if (!/^\S+@\S+\.\S+$/.test(form.email)) {
    return "El correo electrónico no es válido";
  }

  // Contraseña
  if (!form.password) {
    return "La contraseña no puede estar vacía";
  }

  return null;
}
