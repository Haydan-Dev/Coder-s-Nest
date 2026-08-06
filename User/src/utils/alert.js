import Swal from 'sweetalert2';

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: 'var(--bg-panel, #1e1e28)',
    color: 'var(--text-primary, #ffffff)',
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    }
});

export const alertService = {
    // 1. Success wrapper
    success: (message) => {
        return Toast.fire({
            icon: 'success',
            title: message,
        });
    },

    // 2. Error wrapper
    error: (message, title = 'Error') => {
        return Toast.fire({
            icon: 'error',
            title: message,
        });
    },

    // 3. Info wrapper
    info: (message, title = 'Info') => {
        return Toast.fire({
            icon: 'info',
            title: message,
        });
    },

    // 4. Warning wrapper
    warning: (message, title = 'Warning') => {
        return Toast.fire({
            icon: 'warning',
            title: message,
        });
    },

    // 3. Form validation wrapper
    validationError: (message) => {
        return Swal.fire({
            title: 'Validation Error!',
            text: message,
            icon: 'error',
            confirmButtonText: 'OK',
            background: 'var(--bg-panel, #1e1e28)',
            color: 'var(--text-primary, #ffffff)',
        });
    }
};
